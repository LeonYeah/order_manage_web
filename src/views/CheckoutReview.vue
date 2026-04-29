<template>
  <div class="checkout-review">
    <el-form inline class="filters">
      <el-form-item label="客户名称">
        <el-input v-model.trim="filters.customer_name" placeholder="请输入客户名称" clearable />
      </el-form-item>
      <el-form-item label="订单编号">
        <el-input v-model.trim="filters.order_number" placeholder="请输入订单编号" clearable />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="制单员">
        <el-select v-model="filters.clerk_id" placeholder="请选择制单员" clearable>
          <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="单据类型">
        <el-select v-model="filters.record_type" placeholder="全部类型" clearable>
          <el-option label="未结账审核" value="review" />
          <el-option label="反结账申请" value="reverse" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="filters.status" placeholder="全部状态" clearable>
          <el-option label="未审核" value="未审核" />
          <el-option label="待审核" value="待审核" />
          <el-option label="已驳回" value="已驳回" />
          <el-option label="已通过" value="已通过" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getOrders">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="pagedOrders"
      style="width: 100%"
      :row-class-name="tableRowClassName"
      @row-dblclick="viewOrder"
    >
      <el-table-column label="类型" width="110">
        <template slot-scope="scope">
          <el-tag :type="scope.row.record_type === 'reverse' ? 'danger' : 'warning'" size="mini">
            {{ scope.row.record_type_label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="order_number" label="订单编号" min-width="150" />
      <el-table-column prop="customer_name" label="客户名称" min-width="120" />
      <el-table-column prop="clerk_name" label="制单员" width="100" />
      <el-table-column label="下单日期" width="110">
        <template slot-scope="scope">
          {{ formatCompactDate(scope.row.order_date) }}
        </template>
      </el-table-column>
      <el-table-column label="审核状态" width="100">
        <template slot-scope="scope">
          <el-tag :type="statusTagType(scope.row.display_status)" size="mini">
            {{ scope.row.display_status || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请人/时间" min-width="190">
        <template slot-scope="scope">
          <span v-if="scope.row.record_type === 'reverse'">
            {{ scope.row.reverse_checkout_requested_by_name || '-' }} /
            {{ formatDateTime(scope.row.reverse_checkout_requested_at) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" min-width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          {{ scope.row.display_reject_reason || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="驳回人/时间" min-width="190">
        <template slot-scope="scope">
          <span v-if="scope.row.record_type === 'reverse' && (scope.row.reverse_checkout_rejected_by_name || scope.row.reverse_checkout_rejected_at)">
            {{ scope.row.reverse_checkout_rejected_by_name || '-' }} /
            {{ formatDateTime(scope.row.reverse_checkout_rejected_at) }}
          </span>
          <span v-else-if="scope.row.record_type === 'review' && (scope.row.rejected_by_name || scope.row.rejected_at)">
            {{ scope.row.rejected_by_name || '-' }} /
            {{ formatDateTime(scope.row.rejected_at) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额(元)" width="110">
        <template slot-scope="scope">
          {{ Number(scope.row.total_amount || 0).toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin" label="操作" width="170" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="canApprove(scope.row)"
            type="text"
            @click="approveOrder(scope.row)"
          >
            通过
          </el-button>
          <el-button
            v-if="canReject(scope.row)"
            type="text"
            class="danger-btn"
            @click="openRejectDialog(scope.row)"
          >
            驳回
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <div class="page-tip">第 {{ currentPage }} / {{ totalOrderPages }} 页</div>
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalOrders"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog title="订单详情" :visible.sync="showOrderDialog" width="80%" @close="getOrders">
      <orders-view :order-id="currentOrderId" />
    </el-dialog>

    <el-dialog :title="rejectDialogTitle" :visible.sync="rejectDialogVisible" width="480px">
      <el-form label-width="95px">
        <el-form-item label="订单编号">
          <div>{{ rejectForm.order_number || '-' }}</div>
        </el-form-item>
        <el-form-item label="驳回原因" required>
          <el-input
            v-model.trim="rejectForm.reason"
            type="textarea"
            :rows="4"
            maxlength="500"
            show-word-limit
            placeholder="请输入驳回原因"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="rejecting" @click="submitReject">确认驳回</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import OrdersView from '../components/OrdersView.vue'

function createDefaultFilters() {
  return {
    customer_name: '',
    order_number: '',
    clerk_id: null,
    record_type: '',
    status: ''
  }
}

export default {
  name: 'CheckoutReview',
  components: { OrdersView },
  data() {
    const currentUser = JSON.parse(sessionStorage.getItem('user')) || {}
    return {
      currentUser,
      orders: [],
      users: [],
      loading: false,
      showOrderDialog: false,
      currentOrderId: null,
      rejectDialogVisible: false,
      rejecting: false,
      currentPage: 1,
      pageSize: 10,
      rejectForm: {
        order_id: null,
        order_number: '',
        reason: '',
        record_type: 'review'
      },
      filters: createDefaultFilters()
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    },
    totalOrders() {
      return this.orders.length
    },
    totalOrderPages() {
      return Math.max(1, Math.ceil(this.totalOrders / this.pageSize))
    },
    pagedOrders() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.orders.slice(start, start + this.pageSize)
    },
    rejectDialogTitle() {
      return this.rejectForm.record_type === 'reverse' ? '驳回反结账申请' : '驳回未结账订单'
    }
  },
  mounted() {
    if (this.isAdmin) {
      this.getUsers()
    }
    this.getOrders()
  },
  methods: {
    toCompactDate(value) {
      if (!value) return '-'
      const text = String(value).trim()
      const isoMatched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
      if (isoMatched) return `${isoMatched[1]}${isoMatched[2]}${isoMatched[3]}`
      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return text
      const yyyy = date.getFullYear()
      const mm = `${date.getMonth() + 1}`.padStart(2, '0')
      const dd = `${date.getDate()}`.padStart(2, '0')
      return `${yyyy}${mm}${dd}`
    },
    formatCompactDate(value) {
      return this.toCompactDate(value)
    },
    formatDateTime(value) {
      return this.toCompactDate(value)
    },
    statusTagType(status) {
      if (status === '已驳回') return 'danger'
      if (status === '已通过') return 'success'
      return 'warning'
    },
    tableRowClassName({ row }) {
      return row.record_type === 'reverse' ? 'reverse-checkout-row' : ''
    },
    canApprove(row) {
      if (row.record_type === 'reverse') return row.reverse_checkout_status === '待审核'
      return row.review_status !== '已通过'
    },
    canReject(row) {
      if (row.record_type === 'reverse') return row.reverse_checkout_status === '待审核'
      return true
    },
    normalizeReviewOrders(list) {
      return (list || []).map(item => ({
        ...item,
        record_type: 'review',
        record_type_label: '未结账审核',
        display_status: item.review_status || '未审核',
        display_reject_reason: item.reject_reason || ''
      }))
    },
    normalizeReverseOrders(list) {
      return (list || []).map(item => ({
        ...item,
        record_type: 'reverse',
        record_type_label: '反结账申请',
        display_status: item.reverse_checkout_status || '待审核',
        display_reject_reason: item.reverse_checkout_reason || ''
      }))
    },
    filterMergedOrders(list) {
      return list.filter(item => {
        if (this.filters.record_type && item.record_type !== this.filters.record_type) return false
        if (this.filters.status && item.display_status !== this.filters.status) return false
        return true
      })
    },
    getUsers() {
      axios.get('/users').then(res => {
        this.users = res.data || []
      }).catch(() => {
        this.$message.error('制单员列表加载失败')
      })
    },
    resetFilters() {
      this.filters = createDefaultFilters()
      this.getOrders()
    },
    buildReviewParams() {
      return {
        customer_name: this.filters.customer_name || undefined,
        order_number: this.filters.order_number || undefined,
        clerk_id: this.isAdmin ? this.filters.clerk_id : undefined,
        review_status: ['', '未审核', '已驳回', '已通过'].includes(this.filters.status) ? (this.filters.status || undefined) : undefined
      }
    },
    buildReverseParams() {
      return {
        customer_name: this.filters.customer_name || undefined,
        order_number: this.filters.order_number || undefined,
        clerk_id: this.isAdmin ? this.filters.clerk_id : undefined,
        reverse_status: ['', '待审核', '已驳回'].includes(this.filters.status) ? (this.filters.status || undefined) : undefined
      }
    },
    getOrders() {
      this.loading = true
      if (this.isAdmin) {
        axios.get('/orders/reverse-checkout', { params: this.buildReverseParams() })
          .then(reverseRes => {
            const reverseOrders = this.normalizeReverseOrders(reverseRes.data || [])
            this.orders = this.filterMergedOrders(reverseOrders)
            this.currentPage = 1
          })
          .catch(() => {
            this.$message.error('审核单据加载失败')
          })
          .finally(() => {
            this.loading = false
          })
        return
      }
      Promise.all([
        axios.get('/orders/review', { params: this.buildReviewParams() }),
        axios.get('/orders/reverse-checkout', { params: this.buildReverseParams() })
      ]).then(([reviewRes, reverseRes]) => {
        const merged = [
          ...this.normalizeReviewOrders(reviewRes.data || []),
          ...this.normalizeReverseOrders(reverseRes.data || [])
        ]
        merged.sort((a, b) => {
          const aTime = new Date(a.reverse_checkout_requested_at || a.resubmitted_at || a.rejected_at || a.order_date || 0).getTime()
          const bTime = new Date(b.reverse_checkout_requested_at || b.resubmitted_at || b.rejected_at || b.order_date || 0).getTime()
          return bTime - aTime
        })
        this.orders = this.filterMergedOrders(merged)
        this.currentPage = 1
      }).catch(() => {
        this.$message.error('审核单据加载失败')
      }).finally(() => {
        this.loading = false
      })
    },
    viewOrder(row) {
      this.currentOrderId = row.id
      this.showOrderDialog = true
    },
    openRejectDialog(row) {
      this.rejectForm = {
        order_id: row.id,
        order_number: row.order_number,
        reason: row.display_reject_reason || '',
        record_type: row.record_type
      }
      this.rejectDialogVisible = true
    },
    submitReject() {
      if (!this.rejectForm.reason) {
        this.$message.error('请输入驳回原因')
        return
      }
      this.rejecting = true
      const url = this.rejectForm.record_type === 'reverse'
        ? `/orders/${this.rejectForm.order_id}/reverse-checkout/reject`
        : `/orders/${this.rejectForm.order_id}/reject`
      axios.post(url, {
        reason: this.rejectForm.reason
      }).then(() => {
        this.$message.success(this.rejectForm.record_type === 'reverse' ? '反结账申请已驳回' : '订单已驳回')
        this.rejectDialogVisible = false
        this.getOrders()
      }).catch(error => {
        const serverMessage = error && error.response && error.response.data && error.response.data.msg
        this.$message.error(serverMessage || '驳回失败')
      }).finally(() => {
        this.rejecting = false
      })
    },
    approveOrder(row) {
      const url = row.record_type === 'reverse'
        ? `/orders/${row.id}/reverse-checkout/approve`
        : `/orders/${row.id}/approve`
      axios.post(url)
        .then(() => {
          this.$message.success(row.record_type === 'reverse' ? '反结账申请已通过，订单已恢复为未结账' : '订单审核通过')
          this.getOrders()
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '审核通过失败')
        })
    },
    handlePageChange(page) {
      this.currentPage = page
    }
  }
}
</script>

<style scoped>
.checkout-review {
  padding: 8px 0;
}

.filters {
  margin-bottom: 16px;
}

.filters /deep/ .el-input,
.filters /deep/ .el-select {
  width: 150px;
}

.danger-btn {
  color: #f56c6c;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-tip {
  font-size: 13px;
  color: #606266;
}
</style>

<style>
.checkout-review .el-table .reverse-checkout-row {
  background: #fff1f0;
}
</style>
