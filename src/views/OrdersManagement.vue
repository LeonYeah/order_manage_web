<template>
  <div class="orders-management">
    <el-alert
      v-if="reminderOrders.length"
      :title="reminderTitle"
      type="warning"
      :closable="false"
      show-icon
      class="reminder-alert"
    >
      <div class="reminder-list">
        <div v-for="item in reminderOrders" :key="item.id" class="reminder-item" @click="viewOrder(item)">
          <span>{{ item.order_number }}</span>
          <span>{{ item.customer_name }}</span>
          <span v-if="isAdmin">{{ item.clerk_name || '-' }}</span>
          <span>剩余 {{ item.settlement_remind_days_left }} 天</span>
        </div>
      </div>
    </el-alert>

    <el-form inline class="filters">
      <el-form-item label="客户名称">
        <el-input v-model.trim="filters.customer_name" placeholder="输入客户名称" clearable />
      </el-form-item>
      <el-form-item label="下单日期">
        <el-date-picker
          v-model="filters.start_date"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="开始日期"
          clearable
        />
      </el-form-item>
      <el-form-item label="-">
        <el-date-picker
          v-model="filters.end_date"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="结束日期"
          clearable
        />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="制单员">
        <el-select v-model="filters.clerk_id" placeholder="选择制单员" clearable>
          <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务员">
        <el-input v-model.trim="filters.salesperson" placeholder="输入业务员" clearable />
      </el-form-item>
      <el-form-item label="发货状态">
        <el-select v-model="filters.shipping_status" placeholder="全部状态" clearable>
          <el-option label="未发货" value="未发货" />
          <el-option label="已发货" value="已发货" />
        </el-select>
      </el-form-item>
      <el-form-item label="结账状态">
        <el-select v-model="filters.settlement_status" placeholder="全部状态" clearable>
          <el-option label="已结账" value="已结账" />
          <el-option label="未结账" value="未结账" />
        </el-select>
      </el-form-item>
      <el-form-item label="结账方式">
        <el-select v-model="filters.payment_method" placeholder="全部方式" clearable>
          <el-option label="微信" value="微信" />
          <el-option label="支付宝" value="支付宝" />
          <el-option label="现金" value="现金" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="filters.reminder_only">仅看提醒中订单</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getOrders">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="pagedOrders"
      class="orders-table"
      style="width: 100%"
      @row-dblclick="viewOrder"
      @row-contextmenu="openRowContextMenu"
    >
      <el-table-column prop="order_number" label="订单编号" min-width="150" />
      <el-table-column prop="customer_name" label="客户名称" min-width="120" />
      <el-table-column prop="order_clerk" label="制单员" width="100">
        <template slot-scope="scope">
          {{ scope.row.order_clerk || scope.row.clerk_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="salesperson" label="业务员" width="100" />
      <el-table-column label="下单日期" width="96">
        <template slot-scope="scope">
          {{ formatCompactDate(scope.row.order_date) }}
        </template>
      </el-table-column>
      <el-table-column label="结账状态" width="140">
        <template slot-scope="scope">
          <el-tag :type="scope.row.settlement_status === '未结账' ? 'danger' : 'success'" size="mini">
            {{ scope.row.settlement_status || '已结账' }}
          </el-tag>
          <el-tag v-if="scope.row.need_settlement_remind" type="warning" size="mini" class="inline-tag">
            提醒中
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结账方式" min-width="110">
        <template slot-scope="scope">
          {{ scope.row.payment_method || (scope.row.settlement_status === '未结账' ? '未结账' : '-') }}
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="总金额(元)" width="100">
        <template slot-scope="scope">
          {{ formatAmount(scope.row.total_amount) }}
        </template>
      </el-table-column>
      <el-table-column label="发货状态" width="180" class-name="shipping-col">
        <template slot-scope="scope">
          <el-switch
            :value="scope.row.shipping_status === '已发货'"
            active-text="已发货"
            inactive-text="未发货"
            @change="toggleShipping(scope.row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="tracking_number" label="运单号" min-width="150">
        <template slot-scope="scope">
          <el-input
            v-model.trim="scope.row.tracking_number"
            :disabled="scope.row.shipping_status !== '已发货'"
            placeholder="发货后填写"
          />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180">
        <template slot-scope="scope">
          <el-input
            v-model.trim="scope.row.remark"
            type="textarea"
            :rows="2"
            placeholder="备注"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            :loading="scope.row.updating"
            @click="updateShipping(scope.row)"
          >
            提交
          </el-button>
          <el-button
            size="mini"
            type="danger"
            :disabled="scope.row.shipping_status === '已发货'"
            :loading="scope.row.deleting"
            @click="deleteOrder(scope.row)"
          >
            删除
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

    <div class="summary-bar">
      <span>总计订单数：{{ summaryTotal }}</span>
      <span>已付款订单数：{{ summaryPaidCount }}/{{ summaryTotal }}</span>
      <span>已付款总金额：{{ formatAmount(summaryPaidAmount) }}元</span>
    </div>

    <el-dialog title="订单详情" :visible.sync="showDialog" width="80%" @close="getOrders">
      <orders-view :order-id="currentOrderId" />
    </el-dialog>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="context-menu-item" @click="copyOrderByContext">复制订单</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import OrdersView from '../components/OrdersView.vue'

function createDefaultFilters() {
  return {
    customer_name: '',
    start_date: '',
    end_date: '',
    clerk_id: null,
    salesperson: '',
    shipping_status: '',
    settlement_status: '',
    payment_method: '',
    reminder_only: false
  }
}

export default {
  components: { OrdersView },
  data() {
    return {
      orders: [],
      reminderOrders: [],
      users: [],
      filters: createDefaultFilters(),
      loading: false,
      showDialog: false,
      currentOrderId: null,
      copying: false,
      currentUser: JSON.parse(sessionStorage.getItem('user')) || {},
      currentPage: 1,
      pageSize: 10,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        row: null
      }
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    },
    reminderTitle() {
      const prefix = this.isAdmin ? '全部未结账提醒' : '我的未结账提醒'
      return `${prefix}：${this.reminderOrders.length} 单`
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
    summaryTotal() {
      return this.orders.length
    },
    summaryPaidCount() {
      return this.orders.filter(item => item.settlement_status === '已结账').length
    },
    summaryPaidAmount() {
      return this.orders
        .filter(item => item.settlement_status === '已结账')
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    }
  },
  mounted() {
    document.addEventListener('click', this.closeContextMenu)
    if (this.isAdmin) {
      this.getUsers()
    }
    this.getOrders()
    this.getReminderOrders()
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    formatAmount(value) {
      return Number(value || 0).toFixed(2)
    },
    formatCompactDate(value) {
      if (!value) return '-'
      const text = String(value)
      const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
      if (matched) {
        return `${matched[1]}${matched[2]}${matched[3]}`
      }
      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return text
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}${month}${day}`
    },
    resetFilters() {
      this.filters = createDefaultFilters()
      this.getOrders()
    },
    getUsers() {
      axios.get('/users')
        .then(res => {
          this.users = res.data || []
        })
        .catch(() => {
          this.$message.error('制单员数据加载失败')
        })
    },
    buildParams(sourceFilters) {
      const params = { ...sourceFilters }
      if (!this.isAdmin) {
        params.clerk_id = this.currentUser.id
      }
      return params
    },
    normalizeOrders(list) {
      return (list || []).map(item => ({
        ...item,
        shipping_status: item.shipping_status || '未发货',
        settlement_status: item.settlement_status || '已结账',
        tracking_number: item.tracking_number || '',
        payment_method: item.payment_method || '',
        remark: item.remark || '',
        updating: false,
        deleting: false
      }))
    },
    getOrders() {
      const params = this.buildParams(this.filters)

      this.loading = true
      axios.get('/orders', { params })
        .then(res => {
          this.orders = this.normalizeOrders(res.data)
          this.currentPage = 1
        })
        .catch(() => {
          this.$message.error('订单列表加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    getReminderOrders() {
      const params = this.buildParams({
        reminder_only: true
      })

      axios.get('/orders', { params })
        .then(res => {
          this.reminderOrders = this.normalizeOrders(res.data)
        })
        .catch(() => {
          this.reminderOrders = []
        })
    },
    toggleShipping(row, value) {
      row.shipping_status = value ? '已发货' : '未发货'
      if (!value) {
        row.tracking_number = ''
        this.updateShipping(row)
      }
    },
    updateShipping(row) {
      if (row.updating) return
      row.updating = true
      axios.put(`/orders/${row.id}`, {
        shipping_status: row.shipping_status || '未发货',
        tracking_number: row.shipping_status === '已发货' ? row.tracking_number : '',
        remark: row.remark || ''
      }).then(() => {
        this.$message.success('订单状态已更新')
        this.getReminderOrders()
      }).catch(error => {
        const serverMessage = error && error.response && error.response.data && error.response.data.msg
        this.$message.error(serverMessage || '订单状态更新失败')
        this.getOrders()
      }).finally(() => {
        row.updating = false
      })
    },
    deleteOrder(row) {
      if (row.shipping_status === '已发货') return
      this.$confirm(`确认删除订单 ${row.order_number} 吗？`, '提示', { type: 'warning' }).then(() => {
        row.deleting = true
        axios.delete(`/orders/${row.id}`)
          .then(() => {
            this.$message.success('订单已删除')
            this.getOrders()
            this.getReminderOrders()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '删除订单失败')
          })
          .finally(() => {
            row.deleting = false
          })
      }).catch(() => {})
    },
    openRowContextMenu(row, column, event) {
      event.preventDefault()
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        row
      }
    },
    closeContextMenu() {
      if (!this.contextMenu.visible) return
      this.contextMenu.visible = false
      this.contextMenu.row = null
    },
    copyOrderByContext() {
      const row = this.contextMenu.row
      this.closeContextMenu()
      if (!row || this.copying) return
      this.copying = true
      axios.post(`/orders/${row.id}/copy`)
        .then(res => {
          const orderNumber = res && res.data && res.data.order_number
          this.$message.success(orderNumber ? `复制成功：${orderNumber}` : '复制成功')
          this.getOrders()
          this.getReminderOrders()
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '复制订单失败')
        })
        .finally(() => {
          this.copying = false
        })
    },
    viewOrder(row) {
      this.currentOrderId = row.id
      this.showDialog = true
    },
    handlePageChange(page) {
      this.currentPage = page
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 8px 0;
}

.reminder-alert {
  margin-bottom: 16px;
}

.reminder-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.reminder-item {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  background: #fff7e6;
  border: 1px solid #f5dab1;
  border-radius: 6px;
  cursor: pointer;
}

.filters {
  margin-bottom: 16px;
}

.filters /deep/ .el-input,
.filters /deep/ .el-select,
.filters /deep/ .el-date-editor {
  width: 150px;
}

.orders-table {
  font-size: 13px;
}

.inline-tag {
  margin-left: 6px;
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

.summary-bar {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  font-size: 15px;
  font-weight: 700;
  color: #f56c6c;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 112px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.context-menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
}

.context-menu-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
</style>

<style>
.orders-management .el-switch__label {
  font-size: 12px;
  white-space: nowrap;
}

.orders-management .shipping-col .cell {
  white-space: nowrap;
}
</style>

