<template>
  <div class="orders-management">
    <el-form inline class="filters">
      <el-form-item label="订单编号">
        <el-input v-model.trim="filters.order_number" placeholder="输入订单编号" clearable />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model.trim="filters.customer_name" placeholder="输入客户名称" clearable />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="业务员">
        <el-select v-model="filters.clerk_id" placeholder="选择业务员" clearable>
          <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="发货状态">
        <el-select v-model="filters.shipping_status" placeholder="全部状态" clearable>
          <el-option label="未发货" value="未发货" />
          <el-option label="已发货" value="已发货" />
        </el-select>
      </el-form-item>
      <el-form-item label="结账方式">
        <el-select v-model="filters.payment_method" placeholder="全部方式" clearable>
          <el-option label="微信" value="微信" />
          <el-option label="支付宝" value="支付宝" />
          <el-option label="百会彩" value="百会彩" />
          <el-option label="银城" value="银城" />
          <el-option label="艺彩" value="艺彩" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getOrders">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="orders" class="orders-table" style="width: 100%" @row-dblclick="viewOrder">
      <el-table-column prop="order_number" label="订单编号" min-width="150" />
      <el-table-column prop="customer_name" label="客户名称" min-width="120" />
      <el-table-column prop="clerk_name" label="业务员" width="100" />
      <el-table-column label="下单日期" width="110">
        <template slot-scope="scope">
          {{ formatCompactDate(scope.row.order_date) }}
        </template>
      </el-table-column>
      <el-table-column prop="payment_method" label="结账方式" min-width="110" />
      <el-table-column prop="total_amount" label="总金额" width="90">
        <template slot-scope="scope">
          {{ formatAmount(scope.row.total_amount) }}
        </template>
      </el-table-column>
      <el-table-column label="发货状态" width="130">
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
      <el-table-column label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            :loading="scope.row.updating"
            @click="updateShipping(scope.row)"
          >
            上传修改
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="订单详情" :visible.sync="showDialog" width="80%">
      <orders-view :order-id="currentOrderId" />
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import OrdersView from '../components/OrdersView.vue'

function createDefaultFilters() {
  return {
    order_number: '',
    customer_name: '',
    clerk_id: null,
    shipping_status: '',
    payment_method: ''
  }
}

export default {
  components: { OrdersView },
  data() {
    return {
      orders: [],
      users: [],
      filters: createDefaultFilters(),
      loading: false,
      showDialog: false,
      currentOrderId: null,
      currentUser: JSON.parse(localStorage.getItem('user')) || {}
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    }
  },
  mounted() {
    if (this.isAdmin) {
      this.getUsers()
    }
    this.getOrders()
  },
  methods: {
    formatAmount(value) {
      return Number(value || 0).toFixed(2)
    },
    formatCompactDate(value) {
      if (!value) return '-'
      const text = String(value)
      const matched = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
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
          this.$message.error('业务员数据加载失败')
        })
    },
    getOrders() {
      const params = { ...this.filters }
      if (!this.isAdmin) {
        params.clerk_id = this.currentUser.id
      }

      this.loading = true
      axios.get('/orders', { params })
        .then(res => {
          this.orders = (res.data || []).map(item => ({
            ...item,
            shipping_status: item.shipping_status || '未发货',
            tracking_number: item.tracking_number || '',
            remark: item.remark || '',
            updating: false
          }))
        })
        .catch(() => {
          this.$message.error('订单列表加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    toggleShipping(row, value) {
      row.shipping_status = value ? '已发货' : '未发货'
      if (!value) {
        row.tracking_number = ''
      }
    },
    updateShipping(row) {
      row.updating = true
      axios.put(`/orders/${row.id}`, {
        shipping_status: row.shipping_status || '未发货',
        tracking_number: row.shipping_status === '已发货' ? row.tracking_number : '',
        remark: row.remark || ''
      }).then(() => {
        this.$message.success('订单状态已更新')
      }).catch(error => {
        const serverMessage = error && error.response && error.response.data && error.response.data.msg
        this.$message.error(serverMessage || '订单状态更新失败')
        this.getOrders()
      }).finally(() => {
        row.updating = false
      })
    },
    viewOrder(row) {
      this.currentOrderId = row.id
      this.showDialog = true
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 8px 0;
}

.filters {
  margin-bottom: 16px;
}

.orders-table {
  font-size: 13px;
}
</style>

<style>
.orders-management .el-switch__label {
  font-size: 12px;
}
</style>
