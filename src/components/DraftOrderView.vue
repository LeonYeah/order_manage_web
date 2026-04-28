<template>
  <div class="draft-order-view">
    <div v-if="draft">
      <div class="order-header">
        <div class="order-meta">
          <div class="meta-item">
            客户名称：
            <el-input v-model.trim="draft.customer_name" size="small" style="width: 150px" />
          </div>
          <div class="meta-item">
            业务员：
            <el-select v-model="draft.salesperson" filterable clearable size="small" style="width: 160px" placeholder="选择业务员">
              <el-option v-for="item in salespersons" :key="item.id" :label="item.name" :value="item.name" />
            </el-select>
          </div>
          <div class="meta-item">
            收件人：
            <el-input v-model.trim="draft.recipient_name" size="small" style="width: 120px" />
          </div>
          <div class="meta-item">
            电话号码：
            <el-input v-model.trim="draft.customer_phone" size="small" style="width: 130px" />
          </div>
          <div class="meta-item address-item">
            收货地址：
            <el-input
              v-model.trim="draft.recipient_address"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 3 }"
              size="small"
              class="address-input"
            />
          </div>
          <div class="meta-item order-date-item">
            下单日期：
            <el-date-picker
              v-model="draft.order_date"
              type="date"
              size="small"
              format="yyyyMMdd"
              value-format="yyyy-MM-dd"
              class="order-date-picker"
              placeholder="选择日期"
            />
          </div>
          <div class="meta-item">
            结账状态：
            <el-select
              v-model="draft.settlement_status"
              size="small"
              style="width: 96px"
              @change="handleSettlementStatusChange"
            >
              <el-option label="已结账" value="已结账" />
              <el-option label="未结账" value="未结账" />
            </el-select>
          </div>
          <div v-if="draft.settlement_status === '已结账'" class="meta-item">
            结账方式：
            <el-select v-model="draft.payment_method" size="small" style="width: 160px">
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
              @input="setCodeColorValue(scope.row, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="商品名称" min-width="230">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.product_name" class="full-width" size="small" placeholder="手动输入商品名称" />
          </template>
        </el-table-column>
        <el-table-column label="容量" min-width="140">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.capacity" size="small" placeholder="容量" />
          </template>
        </el-table-column>
        <el-table-column label="数量" min-width="180">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.quantity"
              size="mini"
              :min="1"
              @change="updateAmountFromUnitPrice(scope.row)"
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
            />
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="210">
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
        <div class="footer-item no-wrap">
          优惠：
          <el-input-number
            v-model="draft.discount_amount"
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
            v-model="draft.shipping_fee"
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
          <el-input v-model.trim="draft.remark" size="small" style="width: 176px" placeholder="订单备注" />
        </div>
        <div class="footer-total">总金额：{{ Number(draft.total_amount || 0).toFixed(2) }}元</div>
      </div>

      <div class="footer-buttons">
        <el-button type="primary" :loading="saving" @click="saveDraft">保存草稿</el-button>
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
  props: ['draftId'],
  data() {
    return {
      draft: null,
      items: [],
      salespersons: [],
      saving: false
    }
  },
  watch: {
    draftId: {
      immediate: true,
      handler(val) {
        if (val) {
          this.getSalespersons()
          this.loadDraft()
        }
      }
    }
  },
  methods: {
    getSalespersons() {
      axios.get('/salespersons')
        .then(res => {
          this.salespersons = res.data || []
        })
        .catch(() => {
          this.salespersons = []
        })
    },
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
    loadDraft() {
      axios.get(`/order-drafts/${this.draftId}`)
        .then(res => {
          const items = (res.data.items || []).map(item => ({
            product_id: item.product_id,
            product_name: item.product_name || '',
            product_code: item.product_code || '',
            code_color: [item.product_code, item.color].filter(Boolean).join('/'),
            english_name: item.english_name || '',
            capacity: item.capacity || '',
            color: item.color || '',
            quantity: Number(item.quantity || 0),
            unit_price: Number(item.unit_price || 0),
            amount: Number(item.amount || 0),
            sample_date: this.normalizeDate(item.sample_date),
            remark: item.remark || ''
          }))
          this.draft = {
            ...res.data,
            order_date: this.normalizeDate(res.data.order_date),
            settlement_status: res.data.settlement_status || '未结账',
            payment_method: res.data.payment_method || '',
            shipping_fee: Number(res.data.shipping_fee || 0),
            discount_amount: Number(res.data.discount_amount || 0),
            total_amount: Number(res.data.total_amount || 0),
            salesperson: res.data.salesperson || '',
            customer_phone: res.data.customer_phone || '',
            recipient_name: res.data.recipient_name || res.data.customer_name || '',
            recipient_address: res.data.recipient_address || '',
            remark: res.data.remark || ''
          }
          this.items = items
        })
        .catch(() => {
          this.$message.error('草稿详情加载失败')
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
      if (!this.draft) return
      const itemsAmount = this.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      const rawTotal = itemsAmount + Number(this.draft.shipping_fee || 0) - Number(this.draft.discount_amount || 0)
      this.draft.total_amount = Number(Math.max(0, rawTotal).toFixed(2))
    },
    handleSettlementStatusChange(value) {
      if (value === '未结账') {
        this.draft.payment_method = ''
      } else if (!this.draft.payment_method) {
        this.draft.payment_method = '支付宝'
      }
    },
    validateDraft() {
      if (!this.draft.customer_name) {
        this.$message.error('请输入客户名称')
        return false
      }
      if (!this.items.length) {
        this.$message.error('请至少保留一条商品明细')
        return false
      }
      const invalidItem = this.items.find(item => !String(item.product_name || '').trim() || Number(item.quantity || 0) <= 0)
      if (invalidItem) {
        this.$message.error('请完善商品、数量等必填信息')
        return false
      }
      if (this.draft.settlement_status === '已结账' && !this.draft.payment_method) {
        this.$message.error('请选择结账方式')
        return false
      }
      return true
    },
    buildPayload() {
      this.updateTotal()
      return {
        customer_name: this.draft.customer_name,
        customer_phone: this.draft.customer_phone || '',
        salesperson: this.draft.salesperson || '',
        recipient_name: this.draft.recipient_name || this.draft.customer_name,
        recipient_address: this.draft.recipient_address || '',
        order_date: this.normalizeDate(this.draft.order_date),
        shipping_fee: Number(this.draft.shipping_fee || 0),
        discount_amount: Number(this.draft.discount_amount || 0),
        total_amount: Number(this.draft.total_amount || 0),
        settlement_status: this.draft.settlement_status,
        payment_method: this.draft.settlement_status === '已结账' ? this.draft.payment_method : '',
        remark: this.draft.remark || '',
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
    saveDraft() {
      if (!this.validateDraft()) return
      this.saving = true
      axios.put(`/order-drafts/${this.draftId}`, this.buildPayload())
        .then(() => {
          this.$message.success('草稿修改已保存')
          this.$emit('saved')
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '草稿修改保存失败')
        })
        .finally(() => {
          this.saving = false
        })
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

</style>

<style>
.draft-order-view .el-input-number {
  width: 100%;
}

.draft-order-view .el-date-editor.el-input,
.draft-order-view .el-date-editor.el-input__inner {
  width: 100%;
}
</style>
