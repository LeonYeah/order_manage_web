<template>
  <div>
    <!-- 筛选条件 -->
    <el-form inline>
      <el-form-item label="业务员">
        <el-select v-model="filters.clerk_id" placeholder="选择业务员" clearable>
          <el-option v-for="u in users" :key="u.id" :label="u.username" :value="u.id"/>
        </el-select>
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="filters.customer_name" placeholder="客户名"/>
      </el-form-item>
      <el-form-item label="付款状态">
        <el-select v-model="filters.payment_status" placeholder="选择付款状态" clearable>
          <el-option label="未付款" value="unpaid"/>
          <el-option label="已付款" value="paid"/>
        </el-select>
      </el-form-item>
      <el-button type="primary" @click="getOrders">查询</el-button>
    </el-form>

    <!-- 订单列表 -->
    <el-table :data="orders" style="width:100%" @row-dblclick="viewOrder">
      <el-table-column prop="order_number" label="订单编号" width="150"/>
      <el-table-column prop="customer_name" label="客户名称" width="150"/>
      <el-table-column prop="clerk_name" label="业务员" width="120"/>
      <el-table-column prop="total_amount" label="总金额" width="100"/>
      <el-table-column prop="shipping_status" label="发货状态" width="100">
        <template slot-scope="scope">
          <el-select v-model="scope.row.shipping_status" placeholder="发货状态" @change="updateShipping(scope.row)">
            <el-option label="未发货" value="未发货"/>
            <el-option label="已发货" value="已发货"/>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="tracking_number" label="运单号" width="150">
        <template slot-scope="scope">
          <el-input v-model="scope.row.tracking_number" @blur="updateShipping(scope.row)"/>
        </template>
      </el-table-column>
      <el-table-column prop="payment_method" label="结账方式" width="120"/>
      <el-table-column prop="remark" label="备注" width="200">
        <template slot-scope="scope">
          <el-input v-model="scope.row.remark" @blur="updateShipping(scope.row)"/>
        </template>
      </el-table-column>
    </el-table>

    <!-- 查看订单弹窗 -->
    <el-dialog title="订单详情" :visible.sync="showDialog" width="80%">
      <orders-view :order-id="currentOrderId"/>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import OrdersView from './OrdersView.vue' // 前面写的订单制单页面，可封装成组件

export default {
  components: { OrdersView },
  data() {
    return {
      orders: [],
      users: [],
      filters: { clerk_id:null, customer_name:'', payment_status:'' },
      showDialog: false,
      currentOrderId: null,
      currentUser: JSON.parse(localStorage.getItem('user')) || {}
    }
  },
  mounted() {
    this.getUsers()
    this.getOrders()
  },
  methods: {
    getUsers() {
      axios.get('/users').then(res => {
        this.users = res.data
      })
    },
    getOrders() {
      let params = {...this.filters}
      if(this.currentUser.role==='clerk'){
        params.clerk_id = this.currentUser.id
      }
      if(this.currentUser.role==='clerk'){
        // 制单员只能查看自己订单
        params.clerk_id = this.currentUser.id
      }
      axios.get('/orders', { params }).then(res => {
        this.orders = res.data.map(o=>{
          const matchedUser = this.users.find(u => u.id === o.clerk_id)
          o.clerk_name = (matchedUser && matchedUser.username) || ''
          // 隐藏敏感信息
          delete o.unit_price
          delete o.customer_phone
          return o
        })
      })
    },
    updateShipping(row){
      axios.put(`/orders/${row.id}`, {
        shipping_status: row.shipping_status,
        tracking_number: row.tracking_number,
        remark: row.remark
      }).then(()=>{ this.$message.success('更新成功') })
    },
    viewOrder(row){
      this.currentOrderId = row.id
      this.showDialog = true
    }
  }
}
</script>
