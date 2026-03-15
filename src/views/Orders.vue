<template>
  <div class="order-page">
    <!-- 顶部订单信息 -->
    <div class="order-header">
      <h2>****商品定制工业单</h2>
      <div>
        客户名称：<el-input v-model="order.customer_name" style="width:200px"/>
        订单编号：{{ order.order_number }}
        下单日期：<el-date-picker v-model="order.order_date" type="date" placeholder="选择日期"/>
      </div>
    </div>

    <!-- 订单商品表格 -->
    <el-table :data="order.items" style="width:100%" border>
      <el-table-column label="序号" type="index" width="50"/>
      <el-table-column prop="product_id" label="商品名称" width="150">
        <template slot-scope="scope">
          <el-select v-model="scope.row.product_id" placeholder="选择商品" @change="updateProduct(scope.row)">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id"/>
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="product_code" label="商品编号" width="100"/>
      <el-table-column prop="english_name" label="英文名称" width="120"/>
      <el-table-column prop="capacity" label="容量" width="80"/>
      <el-table-column prop="quantity" label="数量" width="80">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.quantity" :min="1" @change="updateAmount(scope.row)"/>
        </template>
      </el-table-column>
      <el-table-column prop="unit_price" label="单价" width="80"/>
      <el-table-column prop="amount" label="金额" width="100"/>
      <el-table-column prop="sample_date" label="来样日期" width="120">
        <template slot-scope="scope">
          <el-date-picker v-model="scope.row.sample_date" type="date" placeholder="选择日期"/>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注">
        <template slot-scope="scope">
          <el-input v-model="scope.row.remark" placeholder="备注" size="small"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="removeItem(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-button type="primary" @click="addItem" style="margin:10px 0">添加商品</el-button>

    <!-- 运费与总金额 -->
    <div class="order-footer">
      运费：<el-input-number v-model="order.shipping_fee" :min="0" @change="updateTotal"/>
      总金额：{{ order.total_amount.toFixed(2) }}
    </div>

    <!-- 打印按钮 -->
    <el-button type="success" @click="printOrder">打印订单</el-button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      order: {
        customer_name: '',
        order_number: '202603120001', // 可自动生成
        order_date: new Date(),
        shipping_fee: 0,
        total_amount: 0,
        items: []
      },
      products: []
    }
  },
  mounted() {
    this.getProducts()
  },
  methods: {
    getProducts() {
      axios.get('/products').then(res => {
        this.products = res.data
      })
    },
    addItem() {
      this.order.items.push({
        product_id: null,
        product_code: '',
        english_name: '',
        capacity: '',
        quantity: 1,
        unit_price: 0,
        amount: 0,
        sample_date: null,
        remark: ''
      })
    },
    removeItem(index) {
      this.order.items.splice(index, 1)
      this.updateTotal()
    },
    updateProduct(row) {
      const p = this.products.find(p => p.id === row.product_id)
      if (p) {
        row.product_code = p.product_code
        row.english_name = p.english_name
        row.capacity = p.capacity
        row.unit_price = 0 // 可手动填写单价
        row.amount = 0
      }
    },
    updateAmount(row) {
      row.amount = row.quantity * row.unit_price
      this.updateTotal()
    },
    updateTotal() {
      let sum = this.order.items.reduce((acc, item) => acc + Number(item.amount || 0), 0)
      this.order.total_amount = sum + Number(this.order.shipping_fee || 0)
    },
    printOrder() {
      const printContent = document.createElement('div')
      for(let i=0;i<4;i++){ // 一式四份
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
.order-header { margin-bottom:20px; }
.order-footer { margin-top:10px; font-size:16px; }
.el-table .cell { white-space: normal; }
</style>