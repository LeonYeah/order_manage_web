<template>
  <div class="order-page">
    <div class="order-header">
      <h2>商品定制工业单</h2>
      <div class="order-meta">
        <div class="meta-item">订单编号：{{ order.order_number || '自动生成中' }}</div>
        <div class="meta-item">
          客户名称：
          <el-input v-model.trim="order.customer_name" style="width: 150px" />
        </div>
        <div class="meta-item">
          收件人：
          <el-input v-model.trim="order.recipient_name" style="width: 120px" />
        </div>
        <div class="meta-item">
          收件地址：
          <el-input v-model.trim="order.recipient_address" style="width: 220px" />
        </div>
        <div class="meta-item order-date-item">
          下单日期：
          <el-date-picker
            v-model="order.order_date"
            type="date"
            format="yyyyMMdd"
            value-format="yyyy-MM-dd"
            class="order-date-picker"
            placeholder="选择日期"
            @change="refreshOrderNumber"
          />
        </div>
        <div class="meta-item">
          业务员：
          <el-input v-model.trim="order.salesperson" style="width: 120px" placeholder="可选" />
        </div>
        <div class="meta-item">
          结账状态：
          <el-select
            v-model="order.settlement_status"
            placeholder="选择结账状态"
            style="width: 96px"
            @change="handleSettlementStatusChange"
          >
            <el-option label="已结账" value="已结账" />
            <el-option label="未结账" value="未结账" />
          </el-select>
        </div>
        <div v-if="order.settlement_status === '已结账'" class="meta-item">
          结账方式：
          <el-select v-model="order.payment_method" placeholder="选择结账方式" style="width: 120px">
            <el-option label="微信" value="微信" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="现金" value="现金" />
          </el-select>
        </div>
      </div>
    </div>

    <el-table :data="order.items" class="order-table" style="width: 100%" border>
      <el-table-column label="序号" type="index" width="50" />
      <el-table-column prop="product_id" label="商品名称" min-width="160">
        <template slot-scope="scope">
          <el-select v-model="scope.row.product_id" class="full-width" placeholder="选择商品" @change="updateProduct(scope.row)">
            <el-option v-for="p in products" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column prop="product_code" label="商品编号" min-width="90" />
      <el-table-column prop="english_name" label="英文名称" min-width="100" />
      <el-table-column prop="capacity" label="容量" width="86" />
      <el-table-column prop="color" label="颜色" width="100">
        <template slot-scope="scope">
          <el-input v-model.trim="scope.row.color" size="small" placeholder="颜色" />
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="数量" width="118">
        <template slot-scope="scope">
          <el-input-number v-model="scope.row.quantity" size="mini" :min="1" @change="updateAmountFromUnitPrice(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column prop="unit_price" label="单价(元)" width="118">
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
      <el-table-column prop="amount" label="金额(元)" width="118">
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
      <el-table-column prop="sample_date" label="来样日期" width="152">
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
      <el-table-column prop="remark" label="备注" min-width="150">
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

    <el-button type="primary" @click="addItem" style="margin: 10px 0">增加商品</el-button>

    <div class="order-footer">
      <div class="footer-item no-wrap">
        优惠：
        <el-input-number
          v-model="order.discount_amount"
          :min="0"
          :precision="2"
          :step="0.1"
          controls-position="right"
          @change="updateTotal"
        />
        <span class="amount-unit">元</span>
      </div>
      <div class="footer-item no-wrap">
        运费：
        <el-input-number
          v-model="order.shipping_fee"
          :min="0"
          :precision="2"
          :step="0.1"
          controls-position="right"
          @change="updateTotal"
        />
        <span class="amount-unit">元</span>
      </div>
      <div class="footer-item">
        订单备注：
        <el-input v-model.trim="order.remark" placeholder="订单备注" style="width: 176px" />
      </div>
      <div class="footer-total">总金额：{{ order.total_amount.toFixed(2) }}元</div>
    </div>

    <div class="order-actions">
      <el-button type="primary" :loading="saving" @click="saveOrder">提交订单</el-button>
      <el-button :loading="savingDraft" @click="saveDraft">保存草稿</el-button>
      <el-button type="success" :loading="savingAndPrinting" @click="saveAndPrint">提交并打印</el-button>
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
    color: '',
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
        recipient_name: '',
        recipient_address: '',
        salesperson: '',
        order_number: '',
        order_date: '',
        shipping_fee: 0,
        discount_amount: 0,
        total_amount: 0,
        settlement_status: '未结账',
        payment_method: '',
        remark: '',
        items: []
      },
      products: [],
      saving: false,
      savingDraft: false,
      savingAndPrinting: false,
      currentUser: JSON.parse(sessionStorage.getItem('user')) || {}
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
      if (Number.isNaN(date.getTime())) return ''
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    compactDate(value) {
      const text = this.formatDate(value)
      return text ? text.replace(/-/g, '') : ''
    },
    getProducts() {
      axios.get('/products').then(res => {
        this.products = res.data || []
      }).catch(() => {
        this.$message.error('商品数据加载失败')
      })
    },
    getFallbackOrderNumber() {
      const compactDate = this.compactDate(this.order.order_date)
      return compactDate ? `${compactDate}0001` : ''
    },
    refreshOrderNumber() {
      const orderDate = this.formatDate(this.order.order_date)
      if (!orderDate) return

      axios.get('/orders/next-number', {
        params: { date: orderDate }
      }).then(res => {
        this.order.order_number = res.data.order_number || ''
      }).catch(() => {
        this.order.order_number = this.getFallbackOrderNumber()
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
      const rawTotal = itemsAmount + Number(this.order.shipping_fee || 0) - Number(this.order.discount_amount || 0)
      this.order.total_amount = Number(Math.max(0, rawTotal).toFixed(2))
    },
    handleSettlementStatusChange(value) {
      if (value === '未结账') {
        this.order.payment_method = ''
      } else if (!this.order.payment_method) {
        this.order.payment_method = '微信'
      }
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
        this.$message.error('请完善商品和数量等必填信息')
        return false
      }

      if (this.order.settlement_status === '已结账' && !this.order.payment_method) {
        this.$message.error('请选择结账方式')
        return false
      }

      return true
    },
    buildPayload() {
      this.updateTotal()

      return {
        customer_name: this.order.customer_name,
        recipient_name: this.order.recipient_name || this.order.customer_name,
        recipient_address: this.order.recipient_address || '',
        salesperson: this.order.salesperson || '',
        clerk_id: this.currentUser.id,
        order_date: this.formatDate(this.order.order_date),
        shipping_fee: Number(this.order.shipping_fee || 0),
        discount_amount: Number(this.order.discount_amount || 0),
        total_amount: Number(this.order.total_amount || 0),
        settlement_status: this.order.settlement_status,
        payment_method: this.order.settlement_status === '已结账' ? this.order.payment_method : '',
        remark: this.order.remark,
        items: this.order.items.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
          color: item.color || '',
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
          this.$message.success('订单已提交')
          return response.data
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '订单提交失败')
          return null
        })
    },
    saveOrder() {
      this.saving = true
      this.submitOrder().then(saved => {
        if (saved) {
          this.refreshOrderNumber()
        }
      }).finally(() => {
        this.saving = false
      })
    },
    saveDraft() {
      if (!this.validateOrder()) return
      this.savingDraft = true
      axios.post('/order-drafts', this.buildPayload())
        .then(() => {
          this.$message.success('草稿已保存')
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '保存草稿失败')
        })
        .finally(() => {
          this.savingDraft = false
        })
    },
    saveAndPrint() {
      this.savingAndPrinting = true
      this.submitOrder().then(saved => {
        if (!saved) return
        this.printOrder()
        this.refreshOrderNumber()
      }).finally(() => {
        this.savingAndPrinting = false
      })
    },
    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },
    printCell(value) {
      const text = value === null || value === undefined ? '' : String(value).trim()
      return this.escapeHtml(text || '/')
    },
    getProductNameById(productId) {
      const product = this.products.find(item => item.id === productId)
      return (product && product.name) || ''
    },
    buildPrintHtml() {
      const rows = (this.order.items || []).map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${this.printCell(this.getProductNameById(item.product_id))}</td>
          <td>${this.printCell(item.product_code)}</td>
          <td>${this.printCell(item.english_name)}</td>
          <td>${this.printCell(item.capacity)}</td>
          <td>${this.printCell(item.color)}</td>
          <td>${this.printCell(item.quantity)}</td>
          <td>${this.printCell(this.compactDate(item.sample_date))}</td>
          <td>${this.printCell(item.remark)}</td>
        </tr>
      `).join('')

      const copySection = `
        <section class="copy">
          <div class="title">商品定制工业单</div>
          <div class="meta">
            <div>订单编号：${this.printCell(this.order.order_number)}</div>
            <div>下单日期：${this.printCell(this.compactDate(this.order.order_date))}</div>
            <div>收件人：${this.printCell(this.order.recipient_name || this.order.customer_name)}</div>
            <div>订单备注：${this.printCell(this.order.remark)}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:4%">序号</th>
                <th style="width:12%">商品名称</th>
                <th style="width:10%">商品编号</th>
                <th style="width:12%">英文名称</th>
                <th style="width:9%">容量</th>
                <th style="width:9%">颜色</th>
                <th style="width:8%">数量</th>
                <th style="width:14%">来样日期</th>
                <th style="width:22%">备注</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="9">/</td></tr>'}</tbody>
          </table>
        </section>
      `

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8" />
          <title>订单打印</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { font-family: "Microsoft YaHei", sans-serif; margin: 0; color: #111; }
            .sheet { height: 280mm; display: flex; flex-direction: column; }
            .copy { flex: 1; min-height: 0; overflow: hidden; }
            .copy-sep { border-top: 1px dashed #666; margin: 2mm 0; }
            .title { text-align: center; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
            .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 6px; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #333; padding: 2px 2px; font-size: 9px; text-align: center; word-break: break-all; line-height: 1.2; }
            thead th { background: #f3f3f3; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
          </div>
        </body>
        </html>
      `
    },
    printOrder() {
      const printWindow = window.open('', '', 'width=800,height=600')
      if (!printWindow) return
      printWindow.document.write(this.buildPrintHtml())
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

.order-date-item {
  white-space: nowrap;
}

.order-date-picker {
  width: 110px;
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

.no-wrap {
  white-space: nowrap;
}

.amount-unit {
  margin-left: 6px;
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

