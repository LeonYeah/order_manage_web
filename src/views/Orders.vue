<template>
  <div class="order-page">
    <div class="order-header">
      <h2>商品定制工业单</h2>
      <div class="order-meta">
        <div class="meta-item">
          客户名称：
          <el-input v-model.trim="order.customer_name" style="width: 220px" />
        </div>
        <div class="meta-item">订单编号：{{ order.order_number || '自动生成中' }}</div>
        <div class="meta-item">
          下单日期：
          <el-date-picker
            v-model="order.order_date"
            type="date"
            format="yyyyMMdd"
            value-format="yyyy-MM-dd"
            placeholder="选择日期"
            @change="refreshOrderNumber"
          />
        </div>
        <div class="meta-item">
          结账方式：
          <el-select v-model="order.payment_method" placeholder="选择结账方式" style="width: 180px">
            <el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="百会彩" value="百会彩" />
            <el-option label="银城" value="银城" />
            <el-option label="艺彩" value="艺彩" />
          </el-select>
        </div>
      </div>
    </div>

    <el-table :data="order.items" class="order-table" style="width: 100%" border>
      <el-table-column label="序号" type="index" width="48" />
      <el-table-column prop="product_id" label="商品名称" min-width="160">
        <template slot-scope="scope">
          <el-select v-model="scope.row.product_id" class="full-width" placeholder="选择商品" @change="updateProduct(scope.row)">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="product_code" label="商品编号" min-width="110" />
      <el-table-column prop="english_name" label="英文名称" min-width="130" />
      <el-table-column prop="capacity" label="容量" width="86" />
      <el-table-column prop="quantity" label="数量" width="96">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.quantity" size="mini" :min="1" @change="updateAmountFromUnitPrice(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column prop="unit_price" label="单价" width="118">
        <template slot-scope="scope">
          <el-input-number
            v-model="scope.row.unit_price"
            size="mini"
            :min="0"
            :precision="2"
            :step="0.1"
            controls-position="right"
            @change="updateAmountFromUnitPrice(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="118">
        <template slot-scope="scope">
          <el-input-number
            v-model="scope.row.amount"
            size="mini"
            :min="0"
            :precision="2"
            :step="0.1"
            controls-position="right"
            @change="updateUnitPriceFromAmount(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sample_date" label="来样日期" width="136">
        <template slot-scope="scope">
          <el-date-picker
            v-model="scope.row.sample_date"
            type="date"
            format="yyyyMMdd"
            value-format="yyyy-MM-dd"
            class="full-width"
            placeholder="选择日期"
          />
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="160">
        <template slot-scope="scope">
          <el-input v-model.trim="scope.row.remark" placeholder="备注" size="small" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="removeItem(scope.$index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-button type="primary" @click="addItem" style="margin: 10px 0">添加商品</el-button>

    <div class="order-footer">
      <div class="footer-item">
        运费：
        <el-input-number
          v-model="order.shipping_fee"
          :min="0"
          :precision="2"
          :step="0.1"
          controls-position="right"
          @change="updateTotal"
        />
      </div>
      <div class="footer-item">
        订单备注：
        <el-input v-model.trim="order.remark" placeholder="订单备注" style="width: 260px" />
      </div>
      <div class="footer-total">总金额：{{ order.total_amount.toFixed(2) }}</div>
    </div>

    <div class="order-actions">
      <el-button type="primary" :loading="saving" @click="saveOrder">保存订单</el-button>
      <el-button type="success" :loading="savingAndPrinting" @click="saveAndPrint">保存并打印</el-button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

function createEmptyItem() {
  return {
    product_id: null,
    product_code: '',
    english_name: '',
    capacity: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    sample_date: '',
    remark: ''
  }
}

export default {
  data() {
    return {
      order: {
        customer_name: '',
        order_number: '',
        order_date: '',
        shipping_fee: 0,
        total_amount: 0,
        payment_method: '微信',
        remark: '',
        items: []
      },
      products: [],
      saving: false,
      savingAndPrinting: false,
      currentUser: JSON.parse(localStorage.getItem('user')) || {}
    }
  },
  mounted() {
    this.order.order_date = this.formatDate(new Date())
    this.getProducts()
    this.refreshOrderNumber()
    this.addItem()
  },
  methods: {
    formatDate(value) {
      if (!value) return ''
      const date = value instanceof Date ? value : new Date(value)
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    getProducts() {
      axios.get('/products').then(res => {
        this.products = res.data
      }).catch(() => {
        this.$message.error('商品数据加载失败')
      })
    },
    getFallbackOrderNumber() {
      const compactDate = this.formatDate(this.order.order_date).replace(/-/g, '')
      return compactDate ? `${compactDate}0001` : ''
    },
    refreshOrderNumber() {
      const orderDate = this.formatDate(this.order.order_date)
      if (!orderDate) return

      axios.get('/orders/next-number', {
        params: { date: orderDate }
      }).then(res => {
        this.order.order_number = res.data.order_number || ''
      }).catch(error => {
        this.order.order_number = this.getFallbackOrderNumber()
        if (error && error.response && error.response.status === 404) {
          this.$message.warning('订单编号接口未就绪，已使用本地预览编号')
          return
        }
        this.$message.warning('订单编号获取失败，已使用本地预览编号')
      })
    },
    addItem() {
      this.order.items.push(createEmptyItem())
    },
    removeItem(index) {
      this.order.items.splice(index, 1)
      this.updateTotal()
    },
    updateProduct(row) {
      const product = this.products.find(item => item.id === row.product_id)
      if (!product) return

      row.product_code = product.product_code
      row.english_name = product.english_name
      row.capacity = product.capacity
      this.updateAmountFromUnitPrice(row)
    },
    updateAmountFromUnitPrice(row) {
      row.amount = Number((Number(row.quantity || 0) * Number(row.unit_price || 0)).toFixed(2))
      this.updateTotal()
    },
    updateUnitPriceFromAmount(row) {
      const quantity = Number(row.quantity || 0)
      row.unit_price = quantity ? Number((Number(row.amount || 0) / quantity).toFixed(2)) : 0
      this.updateTotal()
    },
    updateTotal() {
      const itemsAmount = this.order.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      this.order.total_amount = Number((itemsAmount + Number(this.order.shipping_fee || 0)).toFixed(2))
    },
    validateOrder() {
      if (!this.order.customer_name) {
        this.$message.error('请输入客户名称')
        return false
      }
      if (!this.order.items.length) {
        this.$message.error('请至少添加一条商品明细')
        return false
      }

      const invalidItem = this.order.items.find(item => !item.product_id || Number(item.quantity || 0) <= 0)
      if (invalidItem) {
        this.$message.error('请完善商品、数量等必填信息')
        return false
      }

      return true
    },
    buildPayload() {
      this.updateTotal()

      return {
        customer_name: this.order.customer_name,
        clerk_id: this.currentUser.id,
        order_date: this.formatDate(this.order.order_date),
        shipping_fee: Number(this.order.shipping_fee || 0),
        total_amount: Number(this.order.total_amount || 0),
        payment_method: this.order.payment_method,
        remark: this.order.remark,
        items: this.order.items.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
          sample_date: item.sample_date || null,
          remark: item.remark || ''
        }))
      }
    },
    submitOrder() {
      if (!this.validateOrder()) return Promise.resolve(null)

      return axios.post('/orders', this.buildPayload())
        .then(response => {
          this.order.order_number = response.data.order_number || this.order.order_number
          this.$message.success('订单已保存')
          return response.data
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '订单保存失败')
          return null
        })
    },
    saveOrder() {
      this.saving = true
      this.submitOrder()
        .then(saved => {
          if (saved) {
            this.refreshOrderNumber()
          }
        })
        .finally(() => {
          this.saving = false
        })
    },
    saveAndPrint() {
      this.savingAndPrinting = true
      this.submitOrder()
        .then(saved => {
          if (!saved) return
          this.printOrder()
          this.refreshOrderNumber()
        })
        .finally(() => {
          this.savingAndPrinting = false
        })
    },
    printOrder() {
      const printContent = document.createElement('div')
      for (let i = 0; i < 4; i += 1) {
        const clone = this.$el.cloneNode(true)
        const hr = document.createElement('hr')
        hr.style.border = '1px dashed #000'
        hr.style.margin = '20px 0'
        printContent.appendChild(clone)
        if (i < 3) printContent.appendChild(hr)
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
.order-header {
  margin-bottom: 16px;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.order-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  margin-top: 10px;
  font-size: 14px;
}

.footer-item {
  display: flex;
  align-items: center;
}

.footer-total {
  font-weight: 600;
  color: #303133;
}

.order-actions {
  margin-top: 14px;
}

.el-table .cell {
  white-space: normal;
}

.order-table {
  font-size: 13px;
}

.full-width {
  width: 100%;
}
</style>

<style>
.order-page .el-input-number {
  width: 100%;
}

.order-page .el-date-editor.el-input,
.order-page .el-date-editor.el-input__inner {
  width: 100%;
}
</style>
