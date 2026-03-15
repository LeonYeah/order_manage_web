<template>
  <div>
    <div v-if="!orderId">
      <el-alert title="未选择订单" type="info" show-icon />
    </div>
    <div v-else>
      <div v-if="loading" style="padding: 10px 0;">加载中...</div>
      <div v-else-if="error" style="padding: 10px 0; color: #f56c6c;">{{ error }}</div>
      <div v-else-if="order">
        <div style="margin-bottom: 10px;">
          订单编号：{{ order.order_number || order.id }}
          <span style="margin-left: 15px;">客户名称：{{ order.customer_name || '' }}</span>
          <span style="margin-left: 15px;">下单日期：{{ order.order_date || '' }}</span>
        </div>
        <el-table v-if="order.items && order.items.length" :data="order.items" style="width:100%" border>
          <el-table-column label="序号" type="index" width="50"/>
          <el-table-column prop="product_name" label="商品名称" width="160"/>
          <el-table-column prop="product_code" label="商品编号" width="120"/>
          <el-table-column prop="capacity" label="容量" width="100"/>
          <el-table-column prop="quantity" label="数量" width="80"/>
          <el-table-column prop="unit_price" label="单价" width="90"/>
          <el-table-column prop="amount" label="金额" width="100"/>
          <el-table-column prop="remark" label="备注"/>
        </el-table>
        <div v-else>无商品明细</div>
        <div style="margin-top: 10px;">
          运费：{{ order.shipping_fee || 0 }}
          <span style="margin-left: 15px;">总金额：{{ order.total_amount || 0 }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: {
    orderId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      order: null,
      loading: false,
      error: ''
    }
  },
  watch: {
    orderId: {
      immediate: true,
      handler(val) {
        if (!val) {
          this.order = null
          this.error = ''
          return
        }
        this.fetchOrder(val)
      }
    }
  },
  methods: {
    fetchOrder(id) {
      this.loading = true
      this.error = ''
      axios.get('/orders/' + id).then(res => {
        this.order = res.data
      }).catch(() => {
        this.error = '订单详情加载失败'
      }).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>
