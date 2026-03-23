<template>
  <div class="orders-view">
    <div v-if="order">
      <div class="order-header">
        <h2>商品定制工业单</h2>
        <div class="order-meta">
          <div class="meta-item">订单编号：{{ order.order_number }}</div>
          <div class="meta-item">
            客户名称：
            <el-input v-model.trim="order.customer_name" size="small" style="width: 150px" />
          </div>
          <div class="meta-item">
            收件人：
            <el-input v-model.trim="order.recipient_name" size="small" style="width: 120px" />
          </div>
          <div class="meta-item">
            收件地址：
            <el-input v-model.trim="order.recipient_address" size="small" style="width: 220px" />
          </div>
          <div class="meta-item order-date-item">
            下单日期：
            <el-date-picker
              v-model="order.order_date"
              type="date"
              size="small"
              format="yyyyMMdd"
              value-format="yyyy-MM-dd"
              class="order-date-picker"
              placeholder="选择日期"
            />
          </div>
          <div class="meta-item">
            制单员：{{ order.order_clerk || order.clerk_name || '-' }}
          </div>
          <div class="meta-item">
            业务员：
            <el-input v-model.trim="order.salesperson" size="small" style="width: 120px" placeholder="可选" />
          </div>
          <div class="meta-item">
            结账状态：
            <el-select
              v-model="order.settlement_status"
              size="small"
              style="width: 96px"
              @change="handleSettlementStatusChange"
            >
              <el-option label="已结账" value="已结账" />
              <el-option label="未结账" value="未结账" />
            </el-select>
          </div>
          <div v-if="order.settlement_status === '已结账'" class="meta-item">
            结账方式：
            <el-select v-model="order.payment_method" size="small" style="width: 120px">
              <el-option label="微信" value="微信" />
              <el-option label="支付宝" value="支付宝" />
              <el-option label="现金" value="现金" />
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
        <el-table-column prop="product_code" label="商品编号" min-width="96" />
        <el-table-column prop="english_name" label="英文名称" min-width="108" />
        <el-table-column prop="capacity" label="容量" width="80" />
        <el-table-column label="颜色" width="100">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.color" size="small" placeholder="颜色" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="118">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              size="mini"
              :min="1"
              @change="updateAmountFromUnitPrice(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="单价(元)" width="110">
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
        <el-table-column label="金额(元)" width="110">
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
        <el-table-column label="来样日期" width="152">
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
        <el-button size="small" @click="addItem">增加商品</el-button>
      </div>

      <div class="order-footer">
        <div class="footer-item no-wrap">
          优惠：
          <el-input-number
            v-model="order.discount_amount"
            size="small"
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
            size="small"
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
          <el-input v-model.trim="order.remark" size="small" style="width: 176px" placeholder="订单备注" />
        </div>
        <div class="footer-total">总金额：{{ Number(order.total_amount || 0).toFixed(2) }}元</div>
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
    color: '',
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
    normalizeDate(value) {
      if (!value) return ''
      if (typeof value === 'string') {
        const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (matched) {
          return `${matched[1]}-${matched[2]}-${matched[3]}`
        }
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''

      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    compactDate(value) {
      const date = this.normalizeDate(value)
      return date ? date.replace(/-/g, '') : ''
    },
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
          const items = (res.data.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_code: item.product_code,
            english_name: item.english_name,
            capacity: item.capacity,
            color: item.color || '',
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            amount: Number(item.amount || 0),
            sample_date: this.normalizeDate(item.sample_date),
            remark: item.remark || ''
          }))
          this.order = {
            ...res.data,
            items,
            order_date: this.normalizeDate(res.data.order_date),
            settlement_status: res.data.settlement_status || '已结账',
            payment_method: res.data.payment_method || '',
            shipping_fee: Number(res.data.shipping_fee || 0),
            discount_amount: Number(res.data.discount_amount || 0),
            total_amount: Number(res.data.total_amount || 0),
            recipient_name: res.data.recipient_name || res.data.customer_name || '',
            recipient_address: res.data.recipient_address || '',
            salesperson: res.data.salesperson || '',
            remark: res.data.remark || ''
          }
          this.items = items
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
      if (!this.items.length) {
        this.$message.error('请至少保留一条商品明细')
        return false
      }
      const invalidItem = this.items.find(item => !item.product_id || Number(item.quantity || 0) <= 0)
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
        order_date: this.normalizeDate(this.order.order_date),
        shipping_status: this.order.shipping_status || '未发货',
        tracking_number: this.order.tracking_number || '',
        settlement_status: this.order.settlement_status,
        payment_method: this.order.settlement_status === '已结账' ? this.order.payment_method : '',
        shipping_fee: Number(this.order.shipping_fee || 0),
        discount_amount: Number(this.order.discount_amount || 0),
        total_amount: Number(this.order.total_amount || 0),
        remark: this.order.remark || '',
        items: this.items.map(item => ({
          product_id: item.product_id,
          quantity: Number(item.quantity || 0),
          unit_price: Number(item.unit_price || 0),
          amount: Number(item.amount || 0),
          color: item.color || '',
          sample_date: this.normalizeDate(item.sample_date) || null,
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
    getProductName(item) {
      if (item && item.product_name) return item.product_name
      const product = this.products.find(p => p.id === (item && item.product_id))
      return (product && product.name) || ''
    },
    buildPrintHtml() {
      const rows = (this.items || []).map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${this.printCell(this.getProductName(item))}</td>
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

.no-wrap {
  white-space: nowrap;
}

.amount-unit {
  margin-left: 6px;
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
