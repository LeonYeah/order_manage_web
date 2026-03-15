<template>
  <div class="orders-view">
    <div v-if="order">
      <!-- 顶部信息 -->
      <div class="order-header">
        <h2>****商品定制工业单</h2>
        <div>
          客户名称：{{ order.customer_name }}
          订单编号：{{ order.order_number }}
          下单日期：{{ order.order_date }}
          业务员：{{ clerk_name }}
        </div>
      </div>

      <!-- 订单明细表格 -->
      <el-table :data="items" style="width:100%" border>
        <el-table-column type="index" label="序号" width="50"/>
        <el-table-column prop="product_name" label="商品名称" width="150"/>
        <el-table-column prop="product_code" label="商品编号" width="100"/>
        <el-table-column prop="english_name" label="英文名称" width="120"/>
        <el-table-column prop="capacity" label="容量" width="80"/>
        <el-table-column prop="quantity" label="数量" width="80"/>
        <el-table-column prop="amount" label="金额" width="100"/>
        <el-table-column prop="sample_date" label="来样日期" width="120"/>
        <el-table-column prop="remark" label="备注"/>
      </el-table>

      <!-- 运费与总金额 -->
      <div class="order-footer">
        运费：{{ order.shipping_fee }}&nbsp;&nbsp;
        总金额：{{ order.total_amount.toFixed(2) }}
      </div>

      <!-- 打印按钮 -->
      <el-button type="success" @click="printOrder">打印订单</el-button>
    </div>
    <div v-else>加载中...</div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  props: ['orderId'],
  data() {
    return {
      order: null,
      items: [],
      clerk_name: ''
    }
  },
  watch: {
    orderId: {
      immediate: true,
      handler(val) {
        if(val) this.loadOrder()
      }
    }
  },
  methods: {
    async loadOrder() {
      // 获取订单信息
      const resOrder = await axios.get(`/orders/${this.orderId}`)
      this.order = resOrder.data
      this.items = this.order.items.map(i=>{
        return {
          product_name: i.product_name,
          product_code: i.product_code,
          english_name: i.english_name,
          capacity: i.capacity,
          quantity: i.quantity,
          amount: i.amount,
          sample_date: i.sample_date,
          remark: i.remark
        }
      })
      // 获取业务员姓名
      const resUser = await axios.get(`/users/${this.order.clerk_id}`)
      this.clerk_name = resUser.data.username
    },
    printOrder() {
      // 一式四份打印，带虚线
      const printContent = document.createElement('div')
      for(let i=0;i<4;i++){
        const clone = this.$el.cloneNode(true)
        const hr = document.createElement('hr')
        hr.style.border = '1px dashed #000'
        hr.style.margin = '20px 0'
        printContent.appendChild(clone)
        if(i<3) printContent.appendChild(hr)
      }
      const printWindow = window.open('', '', 'width=800,height=600')
      printWindow.document.write('<html><head><title>订单打印</title></head><body>')
      printWindow.document.body.appendChild(printContent)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }
}
</script>

<style scoped>
.order-header { margin-bottom: 20px; }
.order-footer { margin-top: 10px; font-size: 16px; }
.el-table .cell { white-space: normal; }
</style>