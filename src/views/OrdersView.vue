<template>
  <div>
    <div v-if="!orderId">
      <el-alert title="鏈€夋嫨璁㈠崟" type="info" show-icon />
    </div>
    <div v-else>
      <div v-if="loading" style="padding: 10px 0;">鍔犺浇涓?..</div>
      <div v-else-if="error" style="padding: 10px 0; color: #f56c6c;">{{ error }}</div>
      <div v-else-if="order">
        <div style="margin-bottom: 10px;">
          璁㈠崟缂栧彿锛歿{ order.order_number || order.id }}
          <span style="margin-left: 15px;">瀹㈡埛鍚嶇О锛歿{ order.customer_name || '' }}</span>
          <span style="margin-left: 15px;">涓嬪崟鏃ユ湡锛歿{ order.order_date || '' }}</span>
        </div>
        <el-table v-if="order.items && order.items.length" :data="order.items" style="width:100%" border>
          <el-table-column label="搴忓彿" type="index" width="50"/>
          <el-table-column label="商品编号/颜色" width="160">
            <template slot-scope="scope">
              {{ [scope.row.product_code, scope.row.color].filter(Boolean).join('/') }}
            </template>
          </el-table-column>
          <el-table-column prop="product_name" label="商品名称" width="160"/>
          <el-table-column prop="capacity" label="瀹归噺" width="100"/>
          <el-table-column prop="quantity" label="鏁伴噺" width="80"/>
          <el-table-column prop="unit_price" label="鍗曚环" width="90"/>
          <el-table-column prop="amount" label="閲戦" width="100"/>
          <el-table-column prop="remark" label="澶囨敞"/>
        </el-table>
        <div v-else>鏃犲晢鍝佹槑缁?/div>
        <div style="margin-top: 10px;">
          杩愯垂锛歿{ order.shipping_fee || 0 }}
          <span style="margin-left: 15px;">鎬婚噾棰濓細{{ order.total_amount || 0 }}</span>
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
        this.error = '璁㈠崟璇︽儏鍔犺浇澶辫触'
      }).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>

