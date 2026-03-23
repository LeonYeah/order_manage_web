<template>
  <div class="checkout-review">
    <el-form inline class="filters">
      <el-form-item label="客户名称">
        <el-input v-model.trim="filters.customer_name" placeholder="请输入客户名称" clearable />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="制单员">
        <el-select v-model="filters.clerk_id" placeholder="请选择制单员" clearable>
          <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="filters.review_status" placeholder="请选择审核状态" clearable>
          <el-option label="未审核" value="未审核" />
          <el-option label="驳回" value="驳回" />
          <el-option label="通过" value="通过" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!isAdmin">
        <el-checkbox v-model="filters.rejected_only">仅看被驳回单据</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getOrders">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="pagedOrders" style="width: 100%" @row-dblclick="viewOrder">
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
          <el-tag :type="reviewTagType(scope.row.review_status)" size="mini">
            {{ scope.row.review_status || '未审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reject_reason" label="驳回原因" min-width="180" show-overflow-tooltip />
      <el-table-column label="驳回人/驳回日期" min-width="190">
        <template slot-scope="scope">
          <span v-if="scope.row.rejected_by_name || scope.row.rejected_at">
            {{ scope.row.rejected_by_name || '-' }} / {{ formatDateTime(scope.row.rejected_at) }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="重新提交日期" min-width="130">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.resubmitted_at) }}
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
            v-if="scope.row.review_status !== '通过'"
            type="text"
            @click="approveOrder(scope.row)"
          >
            通过
          </el-button>
          <el-button
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

    <el-dialog title="驳回订单" :visible.sync="rejectDialogVisible" width="480px">
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

function createDefaultFilters(isAdmin) {
  return {
    customer_name: '',
    clerk_id: null,
    review_status: '',
    rejected_only: !isAdmin
  }
}

export default {
  name: 'CheckoutReview',
  components: { OrdersView },
  data() {
    const currentUser = JSON.parse(sessionStorage.getItem('user')) || {}
    const isAdmin = ['admin', 'ADMIN', '管理员'].includes(currentUser.role)
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
        reason: ''
      },
      filters: createDefaultFilters(isAdmin)
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

      const rfcMatched = text.match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
      if (rfcMatched) {
        const monthMap = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
        }
        const dd = `${Number(rfcMatched[1])}`.padStart(2, '0')
        const mm = monthMap[rfcMatched[2]]
        if (mm) return `${rfcMatched[3]}${mm}${dd}`
      }

      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return text
      const yyyy = date.getFullYear()
      const mm = `${date.getMonth() + 1}`.padStart(2, '0')
      const dd = `${date.getDate()}`.padStart(2, '0')
      return `${yyyy}${mm}${dd}`
    },
    reviewTagType(status) {
      if (status === '驳回') return 'danger'
      if (status === '未审核') return 'warning'
      return 'success'
    },
    formatCompactDate(value) {
      return this.toCompactDate(value)
    },
    formatDateTime(value) {
      return this.toCompactDate(value)
    },
    getUsers() {
      axios.get('/users').then(res => {
        this.users = res.data || []
      }).catch(() => {
        this.$message.error('制单员列表加载失败')
      })
    },
    resetFilters() {
      this.filters = createDefaultFilters(this.isAdmin)
      this.getOrders()
    },
    buildParams() {
      return {
        customer_name: this.filters.customer_name || undefined,
        clerk_id: this.isAdmin ? this.filters.clerk_id : undefined,
        review_status: this.filters.review_status || undefined,
        rejected_only: this.filters.rejected_only || undefined
      }
    },
    getOrders() {
      this.loading = true
      axios.get('/orders/review', { params: this.buildParams() })
        .then(res => {
          this.orders = res.data || []
          this.currentPage = 1
        })
        .catch(() => {
          this.$message.error('反结账订单加载失败')
        })
        .finally(() => {
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
        reason: row.reject_reason || ''
      }
      this.rejectDialogVisible = true
    },
    submitReject() {
      if (!this.rejectForm.reason) {
        this.$message.error('请输入驳回原因')
        return
      }
      this.rejecting = true
      axios.post(`/orders/${this.rejectForm.order_id}/reject`, {
        reason: this.rejectForm.reason
      }).then(() => {
        this.$message.success('订单已驳回')
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
      axios.post(`/orders/${row.id}/approve`)
        .then(() => {
          this.$message.success('订单审核通过')
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
