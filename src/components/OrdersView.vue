<template>
  <div class="orders-view">
    <div v-if="order">
      <div class="order-header">
        <h2>商品定制工业单</h2>
        <div class="order-meta">
          <div class="meta-item">
            客户名称：
            <el-input v-model.trim="order.customer_name" size="small" style="width: 180px" />
          </div>
          <div class="meta-item">订单编号：{{ order.order_number }}</div>
          <div class="meta-item">
            下单日期：
            <el-date-picker
              v-model="order.order_date"
              type="date"
              size="small"
              format="yyyyMMdd"
              value-format="yyyy-MM-dd"
              placeholder="选择日期"
            />
          </div>
          <div class="meta-item">业务员：{{ order.clerk_name || '-' }}</div>
          <div class="meta-item">
            结账方式：
            <el-select v-model="order.payment_method" size="small" style="width: 140px">
              <el-option label="微信" value="微信" />
              <el-option label="支付宝" value="支付宝" />
              <el-option label="百会彩" value="百会彩" />
              <el-option label="银城" value="银城" />
              <el-option label="艺彩" value="艺彩" />
            </el-select>
          </div>
        </div>
      </div>

      <el-table :data="items" class="detail-table" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="48" />
        <el-table-column label="商品名称" min-width="150">
          <template slot-scope="scope">
            <el-select v-model="scope.row.product_id" class="full-width" size="small" @change="updateProduct(scope.row)">
              <el-option v-for="product in products" :key="product.id" :label="product.name" :value="product.id" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="product_code" label="商品编号" min-width="100" />
        <el-table-column prop="english_name" label="英文名称" min-width="120" />
        <el-table-column prop="capacity" label="容量" width="80" />
        <el-table-column label="数量" width="96">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              size="mini"
              :min="1"
              @change="updateAmountFromUnitPrice(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="110">
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
        <el-table-column label="金额" width="110">
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
        <el-table-column label="来样日期" width="132">
          <template slot-scope="scope">
            <el-date-picker
              v-model="scope.row.sample_date"
              type="date"
              size="small"
              format="yyyyMMdd"
              value-format="yyyy-MM-dd"
              class="full-width"
              placeholder="选择日期"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.remark" size="small" placeholder="备注" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeItem(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="detail-actions">
        <el-button size="small" @click="addItem">添加商品</el-button>
      </div>

      <div class="order-footer">
        <div class="footer-item">
          运费：
          <el-input-number
            v-model="order.shipping_fee"
            size="small"
            :min="0"
            :precision="2"
            :step="0.1"
            controls-position="right"
            @change="updateTotal"
          />
        </div>
        <div class="footer-item">
          订单备注：
          <el-input v-model.trim="order.remark" size="small" style="width: 260px" placeholder="订单备注" />
        </div>
        <div class="footer-total">总金额：{{ Number(order.total_amount || 0).toFixed(2) }}</div>
      </div>

      <div class="footer-buttons">
        <el-button type="primary" :loading="saving" @click="saveOrder">上传修改</el-button>
        <el-button type="success" @click="printOrder">打印订单</el-button>
      </div>
    </div>
    <div v-else>加载中...</div>
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
  props: ['orderId'],
  data() {
    return {
      order: null,
      items: [],
      products: [],
      saving: false
    }
  },
  watch: {
    orderId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.getProducts()
          this.loadOrder()
        }
      }
    }
  },
  methods: {
    getProducts() {
      axios.get('/products')
        .then(res => {
          this.products = res.data || []
        })
        .catch(() => {
          this.$message.error('商品数据加载失败')
        })
    },
    loadOrder() {
      axios.get(`/orders/${this.orderId}`)
        .then(res => {
          this.order = {
            ...res.data,
            shipping_fee: Number(res.data.shipping_fee || 0),
            total_amount: Number(res.data.total_amount || 0),
            remark: res.data.remark || ''
          }
          this.items = (this.order.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            english_name: item.english_name,
            capacity: item.capacity,
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            amount: Number(item.amount || 0),
            sample_date: item.sample_date,
            remark: item.remark || ''
          }))
        })
        .catch(() => {
          this.$message.error('订单详情加载失败')
        })
    },
    addItem() {
      this.items.push(createEmptyItem())
      this.updateTotal()
    },
    removeItem(index) {
      this.items.splice(index, 1)
      this.updateTotal()
    },
    updateProduct(row) {
      const product = this.products.find(item => item.id === row.product_id)
      if (!product) return

      row.product_name = product.name
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
      if (!this.order) return
      const itemsAmount = this.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      this.order.total_amount = Number((itemsAmount + Number(this.order.shipping_fee || 0)).toFixed(2))
    },
    validateOrder() {
      if (!this.order.customer_name) {
        this.$message.error('请输入客户名称')
        return false
      }
      if (!this.items.length) {
        this.$message.error('请至少保留一条商品明细')
        return false
      }
      const invalidItem = this.items.find(item => !item.product_id || Number(item.quantity || 0) <= 0)
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
        order_date: this.order.order_date,
        shipping_status: this.order.shipping_status || '未发货',
        tracking_number: this.order.tracking_number || '',
        payment_method: this.order.payment_method,
        shipping_fee: Number(this.order.shipping_fee || 0),
        total_amount: Number(this.order.total_amount || 0),
        remark: this.order.remark || '',
        items: this.items.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
          sample_date: item.sample_date || null,
          remark: item.remark || ''
        }))
      }
    },
    saveOrder() {
      if (!this.validateOrder()) return

      this.saving = true
      axios.put(`/orders/${this.orderId}`, this.buildPayload())
        .then(() => {
          this.$message.success('订单修改已上传')
          this.loadOrder()
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '订单修改上传失败')
        })
        .finally(() => {
          this.saving = false
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

.detail-table {
  font-size: 13px;
}

.detail-actions {
  margin-top: 10px;
}

.order-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
}

.footer-item {
  display: flex;
  align-items: center;
}

.footer-total {
  font-weight: 600;
}

.footer-buttons {
  margin-top: 14px;
}

.full-width {
  width: 100%;
}

.el-table .cell {
  white-space: normal;
}
</style>

<style>
.orders-view .el-input-number {
  width: 100%;
}

.orders-view .el-date-editor.el-input,
.orders-view .el-date-editor.el-input__inner {
  width: 100%;
}
</style>
