<template>
  <div class="orders-view">
    <div v-if="order">
      <div class="order-header">
        <h2>商品定制工业单</h2>
        <div class="order-meta">
          <div class="meta-item">订单编号：{{ order.order_number }}</div>
          <div class="meta-item">
            客户名称：
            <el-input v-model.trim="order.customer_name" size="small" style="width: 150px" :disabled="isSettledLocked" />
          </div>
          <div class="meta-item">
            收件人：
            <el-input v-model.trim="order.recipient_name" size="small" style="width: 120px" :disabled="isSettledLocked" />
          </div>
          <div class="meta-item">
            电话号码：
            <el-input v-model.trim="order.customer_phone" size="small" style="width: 130px" :disabled="isSettledLocked" />
          </div>
          <div class="meta-item address-item">
            收件地址：
            <el-input
              v-model.trim="order.recipient_address"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 3 }"
              size="small"
              class="address-input"
              :disabled="isSettledLocked"
            />
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
              :disabled="isSettledLocked"
            />
          </div>
          <div class="meta-item">
            制单员：{{ order.order_clerk || order.clerk_name || '-' }}
          </div>
          <div class="meta-item">
            业务员：
            <el-select v-model="order.salesperson" filterable clearable size="small" style="width: 160px" placeholder="选择业务员" :disabled="isSettledLocked">
              <el-option v-for="item in salespersons" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
          </div>
          <div class="meta-item">
            结账状态：
            <el-select
              v-model="order.settlement_status"
              size="small"
              style="width: 96px"
              @change="handleSettlementStatusChange"
              :disabled="isSettledLocked"
            >
              <el-option label="已结账" value="已结账" />
              <el-option label="未结账" value="未结账" />
            </el-select>
          </div>
          <div v-if="order.settlement_status === '已结账'" class="meta-item">
            结账方式：
            <el-select v-model="order.payment_method" size="small" style="width: 160px" :disabled="isSettledLocked">
              <el-option label="支付宝" value="支付宝" />
              <el-option label="微信" value="微信" />
              <el-option label="银城漆行二维码" value="银城漆行二维码" />
              <el-option label="银城漆行对公" value="银城漆行对公" />
              <el-option label="艺彩对公" value="艺彩对公" />
              <el-option label="百绘彩对公" value="百绘彩对公" />
            </el-select>
          </div>
        </div>
      </div>

      <el-table :data="items" class="detail-table" style="width: 100%" border>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column label="商品编号/颜色" min-width="210">
          <template slot-scope="scope">
            <el-input
              :value="getCodeColorValue(scope.row)"
              size="small"
              placeholder="商品编号/颜色"
              :disabled="isSettledLocked"
              @input="setCodeColorValue(scope.row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="230">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.product_name" class="full-width" size="small" placeholder="手动输入商品名称" :disabled="isSettledLocked" />
          </template>
        </el-table-column>
        <el-table-column label="容量" min-width="140">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.capacity" size="small" placeholder="容量" :disabled="isSettledLocked" />
          </template>
        </el-table-column>
        <el-table-column label="数量" min-width="180">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              size="mini"
              :min="1"
              @change="updateAmountFromUnitPrice(scope.row)"
              :disabled="isSettledLocked"
            />
          </template>
        </el-table-column>
        <el-table-column label="单价(元)" min-width="190">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.unit_price"
              size="mini"
              :min="0"
              :precision="2"
              :step="0.1"
              controls-position="right"
              @change="updateAmountFromUnitPrice(scope.row)"
              :disabled="isSettledLocked"
            />
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" min-width="190">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.amount"
              size="mini"
              :min="0"
              :precision="2"
              :step="0.1"
              controls-position="right"
              @change="updateUnitPriceFromAmount(scope.row)"
              :disabled="isSettledLocked"
            />
          </template>
        </el-table-column>
        <el-table-column label="来样日期" min-width="230">
          <template slot-scope="scope">
            <el-date-picker
              v-model="scope.row.sample_date"
              type="date"
              size="small"
              format="yyyyMMdd"
              value-format="yyyy-MM-dd"
              class="full-width"
              placeholder="选择日期"
              :disabled="isSettledLocked"
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="210">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.remark" size="small" placeholder="备注" :disabled="isSettledLocked" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="removeItem(scope.$index)" :disabled="isSettledLocked">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="detail-actions">
        <el-button size="small" @click="addItem" :disabled="isSettledLocked">增加商品</el-button>
      </div>

      <div v-if="isSettledLocked" class="locked-tip">
        已结账订单不能直接修改价格或明细，需先提交反结账申请，待管理员审核通过后再修改。
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
            :disabled="isSettledLocked"
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
            :disabled="isSettledLocked"
          />
          <span class="amount-unit">元</span>
        </div>
        <div class="footer-item">
          订单备注：
          <el-input v-model.trim="order.remark" size="small" style="width: 176px" placeholder="订单备注" :disabled="isSettledLocked" />
        </div>
        <div class="footer-total">总金额：{{ Number(order.total_amount || 0).toFixed(2) }}元</div>
      </div>

      <div class="footer-buttons">
        <el-button v-if="!isSettledLocked" type="primary" :loading="saving" @click="saveOrder">上传修改</el-button>
        <el-button
          v-else
          type="warning"
          :loading="requestingReverseCheckout"
          :disabled="order.reverse_checkout_status === '待审核'"
          @click="requestReverseCheckout"
        >
          {{ reverseCheckoutActionText }}
        </el-button>
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
    product_name: '',
    product_code: '',
    code_color: '',
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
    const currentUser = JSON.parse(sessionStorage.getItem('user')) || {}
    return {
      currentUser,
      order: null,
      originalSettlementStatus: '',
      items: [],
      salespersons: [],
      saving: false,
      requestingReverseCheckout: false
    }
  },
  computed: {
    isSettledLocked() {
      return !!this.order && this.originalSettlementStatus === '已结账'
    },
    reverseCheckoutActionText() {
      if (!this.order) return '提交反结账审核'
      if (this.order.reverse_checkout_status === '待审核') return '反结账审核中'
      if (this.order.reverse_checkout_status === '已驳回') return '重新提交反结账审核'
      return '提交反结账审核'
    }
  },
  watch: {
    orderId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.getSalespersons()
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
    getSalespersons() {
      axios.get('/salespersons')
        .then(res => {
          this.salespersons = res.data || []
        })
        .catch(() => {
          this.salespersons = []
        })
    },
    loadOrder() {
      axios.get(`/orders/${this.orderId}`)
        .then(res => {
          const items = (res.data.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name || '',
            product_code: item.product_code,
            code_color: [item.product_code, item.color].filter(Boolean).join('/'),
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
            reverse_checkout_status: res.data.reverse_checkout_status || '无',
            reverse_checkout_reason: res.data.reverse_checkout_reason || '',
            shipping_fee: Number(res.data.shipping_fee || 0),
            discount_amount: Number(res.data.discount_amount || 0),
            total_amount: Number(res.data.total_amount || 0),
            customer_phone: res.data.customer_phone || '',
            recipient_name: res.data.recipient_name || res.data.customer_name || '',
            recipient_address: res.data.recipient_address || '',
            salesperson: res.data.salesperson || '',
            remark: res.data.remark || ''
          }
          this.originalSettlementStatus = this.order.settlement_status || ''
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
    getCodeColorValue(row) {
      if (row.code_color !== undefined) return row.code_color

      const productCode = String(row.product_code || '').trim()
      const color = String(row.color || '').trim()
      return [productCode, color].filter(Boolean).join('/')
    },
    setCodeColorValue(row, value) {
      const text = String(value || '')
      this.$set(row, 'code_color', text)
      const parsed = this.parseCodeColorValue(text)
      row.product_code = parsed.product_code
      row.color = parsed.color
    },
    parseCodeColorValue(value) {
      const text = String(value || '').trim()
      const separatorIndex = text.search(/[\/／]/)

      if (separatorIndex === -1) {
        return {
          product_code: text,
          color: ''
        }
      }

      return {
        product_code: text.slice(0, separatorIndex).trim(),
        color: text.slice(separatorIndex + 1).trim()
      }
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
        this.order.payment_method = '支付宝'
      }
    },
    validateOrder() {
      if (this.isSettledLocked) {
        this.$message.error('已结账订单需先提交反结账申请并经管理员审核后才能修改')
        return false
      }
      if (!this.order.customer_name) {
        this.$message.error('请输入客户名称')
        return false
      }
      if (!this.items.length) {
        this.$message.error('请至少保留一条商品明细')
        return false
      }
      const invalidItem = this.items.find(item => !String(item.product_name || '').trim() || Number(item.quantity || 0) <= 0)
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
        customer_phone: this.order.customer_phone || '',
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
        items: this.items.map(item => {
          const codeColor = this.parseCodeColorValue(this.getCodeColorValue(item))
          return {
            product_id: item.product_id || null,
            product_name: item.product_name || '',
            product_code: codeColor.product_code,
            english_name: item.english_name || '',
            capacity: item.capacity || '',
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            amount: Number(item.amount || 0),
            color: codeColor.color,
            sample_date: this.normalizeDate(item.sample_date) || null,
            remark: item.remark || ''
          }
        })
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
    requestReverseCheckout() {
      if (!this.order || this.order.settlement_status !== '已结账') return

      this.requestingReverseCheckout = true
      axios.post(`/orders/${this.orderId}/reverse-checkout`)
        .then(() => {
          this.$message.success('反结账申请已提交，请等待管理员审核')
          this.loadOrder()
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '反结账申请提交失败')
        })
        .finally(() => {
          this.requestingReverseCheckout = false
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
    maskPhoneForPrint(value) {
      const text = value === null || value === undefined ? '' : String(value)
      return text
        .replace(/(^|[^\d])1\d{10}(?=[^\d]|$)/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .replace(/[ ,，;；/]{2,}/g, ' ')
        .trim()
    },
    getProductName(item) {
      return (item && item.product_name) || ''
    },
    buildPrintHtml() {
      const items = this.items || []
      const useFourCopiesOnOnePage = items.length <= 4
      const rows = items.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${this.printCell([item.product_code, item.color].filter(Boolean).join('/'))}</td>
          <td>${this.printCell(this.getProductName(item))}</td>
          <td>${this.printCell(item.capacity)}</td>
          <td>${this.printCell(item.quantity)}</td>
          <td>${this.printCell(this.compactDate(item.sample_date))}</td>
          <td>${this.printCell(item.remark)}</td>
        </tr>
      `).join('')
      const orderRemarkRow = `
        <tr class="order-remark-row">
          <td class="order-remark-label" colspan="2">订单备注</td>
          <td class="order-remark-content" colspan="5">${this.printCell(this.order.remark)}</td>
        </tr>
      `

      const copySection = `
        <section class="copy">
          <div class="title">商品定制工业单</div>
          <div class="meta">
            <div>订单编号：${this.printCell(this.order.order_number)}</div>
            <div>下单日期：${this.printCell(this.compactDate(this.order.order_date))}</div>
            <div>收件人：${this.printCell(this.order.recipient_name || this.order.customer_name)}</div>
            <div class="address-line">收货地址：${this.printCell(this.maskPhoneForPrint(this.order.recipient_address))}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width:4%">序号</th>
                <th style="width:14%">商品编号/颜色</th>
                <th style="width:16%">商品名称</th>
                <th style="width:10%">容量</th>
                <th style="width:8%">数量</th>
                <th style="width:14%">来样日期</th>
                <th style="width:34%">备注</th>
              </tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="7">/</td></tr>'}${orderRemarkRow}</tbody>
          </table>
        </section>
      `
      const printBody = useFourCopiesOnOnePage
        ? `
          <div class="sheet">
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
            <div class="copy-sep"></div>
            ${copySection}
          </div>
        `
        : `
          <div class="single-sheet">
            ${copySection}
            ${copySection}
            ${copySection}
            ${copySection}
          </div>
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
            .single-sheet .copy { min-height: 280mm; overflow: visible; page-break-after: always; break-after: page; }
            .single-sheet .copy:last-child { page-break-after: auto; break-after: auto; }
            .copy-sep { border-top: 1px dashed #666; margin: 2mm 0; }
            .title { text-align: center; font-size: 14px; font-weight: 700; margin-bottom: 6px; }
            .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 6px; font-size: 14px; }
            .meta > div { max-width: 100%; }
            .address-line { flex-basis: 100%; white-space: normal; overflow-wrap: anywhere; word-break: break-all; line-height: 1.25; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            th, td { border: 1px solid #333; padding: 2px 2px; font-size: 14px; text-align: center; word-break: break-all; line-height: 1.2; }
            thead th { background: #f3f3f3; font-weight: 600; }
            .order-remark-row { min-height: 24px; }
            .order-remark-row td { height: 24px; line-height: 1.25; vertical-align: top; }
            .order-remark-label { font-weight: 600; background: #f3f3f3; text-align: left; padding-left: 4px; }
            .order-remark-content { text-align: left; padding-left: 4px; white-space: normal; overflow-wrap: anywhere; word-break: break-all; }
          </style>
        </head>
        <body>
          ${printBody}
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
  white-space: nowrap;
}

.address-item {
  flex: 1 1 420px;
  align-items: center;
}

.address-input {
  flex: 1;
  min-width: 260px;
  white-space: normal;
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

.locked-tip {
  margin-top: 10px;
  color: #e6a23c;
  font-size: 13px;
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



