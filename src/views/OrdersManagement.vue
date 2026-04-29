<template>
  <div class="orders-management">
    <el-alert
      v-if="reminderOrders.length"
      :title="reminderTitle"
      type="warning"
      :closable="false"
      show-icon
      class="reminder-alert"
    >
      <div class="reminder-list">
        <div v-for="item in reminderOrders" :key="item.id" class="reminder-item" @click="viewOrder(item)">
          <span>{{ item.order_number }}</span>
          <span>{{ item.customer_name }}</span>
          <span v-if="isAdmin">{{ item.clerk_name || '-' }}</span>
          <span>剩余 {{ item.settlement_remind_days_left }} 天</span>
        </div>
      </div>
    </el-alert>

    <el-form inline class="filters" :model="filters" @submit.native.prevent>
      <el-form-item label="客户名称">
        <el-input v-model.trim="filters.customer_name" placeholder="输入客户名称" clearable />
      </el-form-item>
      <el-form-item label="商品编号">
        <el-input v-model.trim="filters.product_code" placeholder="商品编号/颜色" clearable />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="商品名称">
        <el-select
          v-model="filters.product_name"
          filterable
          clearable
          allow-create
          default-first-option
          placeholder="输入或选择商品名称"
        >
          <el-option
            v-for="name in productNameOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="下单日期">
        <el-date-picker
          v-model="filters.start_date"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="开始日期"
          clearable
        />
      </el-form-item>
      <el-form-item label="-">
        <el-date-picker
          v-model="filters.end_date"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="结束日期"
          clearable
        />
      </el-form-item>
      <el-form-item v-if="isAdmin" label="制单员">
        <el-select v-model="filters.clerk_id" placeholder="选择制单员" clearable>
          <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务员">
        <el-select v-model="filters.salesperson" filterable clearable placeholder="选择业务员">
          <el-option v-for="item in salespersons" :key="item.id" :label="item.name" :value="item.name" />
        </el-select>
      </el-form-item>
      <el-form-item label="发货状态">
        <el-select v-model="filters.shipping_status" placeholder="全部状态" clearable>
          <el-option label="未发货" value="未发货" />
          <el-option label="已发货" value="已发货" />
        </el-select>
      </el-form-item>
      <el-form-item label="结账状态">
        <el-select v-model="filters.settlement_status" placeholder="全部状态" clearable>
          <el-option label="已结账" value="已结账" />
          <el-option label="未结账" value="未结账" />
        </el-select>
      </el-form-item>
      <el-form-item label="结账方式">
        <el-select v-model="filters.payment_method" placeholder="全部方式" clearable>
          <el-option label="支付宝" value="支付宝" />
          <el-option label="微信" value="微信" />
          <el-option label="银城漆行二维码" value="银城漆行二维码" />
          <el-option label="银城漆行对公" value="银城漆行对公" />
          <el-option label="艺彩对公" value="艺彩对公" />
          <el-option label="百绘彩对公" value="百绘彩对公" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="filters.reminder_only">仅看提醒中订单</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="searchOrders">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
        <el-button type="success" :loading="exporting" @click="exportOrders">导出Excel</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="pagedOrders"
      class="orders-table"
      style="width: 100%"
      @row-dblclick="viewOrder"
      @row-contextmenu="openRowContextMenu"
    >
      <el-table-column prop="order_number" label="订单编号" width="132" />
      <el-table-column prop="customer_name" label="客户名称" width="118" />
      <el-table-column prop="product_codes" label="商品编号/颜色" min-width="140" class-name="product-codes-col">
        <template slot-scope="scope">
          <div v-if="getProductCodeList(scope.row).length" class="product-code-list">
            <div
              v-for="code in getProductCodeList(scope.row).slice(0, 3)"
              :key="code"
              class="product-code-line"
            >
              {{ code }}
            </div>
            <div v-if="getProductCodeList(scope.row).length > 3" class="product-code-line">...</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="product_names" label="商品名称" min-width="130" class-name="product-names-col">
        <template slot-scope="scope">
          <div v-if="getProductNameList(scope.row).length" class="product-name-list">
            <div
              v-for="(name, index) in getProductNameList(scope.row).slice(0, 3)"
              :key="`${name}-${index}`"
              class="product-name-line"
            >
              {{ name }}
            </div>
            <div v-if="getProductNameList(scope.row).length > 3" class="product-name-line">...</div>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="order_clerk" label="制单员" width="110">
        <template slot-scope="scope">
          {{ scope.row.order_clerk || scope.row.clerk_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="salesperson" label="业务员" width="120" />
      <el-table-column label="下单日期" width="120">
        <template slot-scope="scope">
          {{ formatCompactDate(scope.row.order_date) }}
        </template>
      </el-table-column>
      <el-table-column label="结账状态" width="120">
        <template slot-scope="scope">
          <div class="settlement-status-cell">
            <el-tag :type="scope.row.settlement_status === '未结账' ? 'danger' : 'success'" size="mini">
              {{ scope.row.settlement_status || '已结账' }}
            </el-tag>
            <el-tag v-if="scope.row.need_settlement_remind" type="warning" size="mini" class="reminder-tag">
              提醒中
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="结账方式" width="150">
        <template slot-scope="scope">
          {{ scope.row.payment_method || (scope.row.settlement_status === '未结账' ? '未结账' : '-') }}
        </template>
      </el-table-column>
      <el-table-column prop="total_amount" label="总金额(元)" width="130">
        <template slot-scope="scope">
          {{ formatAmount(scope.row.total_amount) }}
        </template>
      </el-table-column>
      <el-table-column label="发货状态" width="200" class-name="shipping-col">
        <template slot-scope="scope">
          <el-switch
            :value="scope.row.shipping_status === '已发货'"
            active-text="已发货"
            inactive-text="未发货"
            :disabled="isOrderSubmittedLocked(scope.row)"
            @change="toggleShipping(scope.row, $event)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="tracking_number" label="运单号" min-width="150">
        <template slot-scope="scope">
          <el-input
            v-model.trim="scope.row.tracking_number"
            :disabled="scope.row.shipping_status !== '已发货' || isOrderSubmittedLocked(scope.row)"
            placeholder="发货后填写"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            :loading="scope.row.updating"
            :disabled="isOrderSubmittedLocked(scope.row)"
            @click="updateShipping(scope.row)"
          >
            提交
          </el-button>
          <el-button
            size="mini"
            type="danger"
            :disabled="isOrderSubmittedLocked(scope.row) || scope.row.shipping_status === '已发货'"
            :loading="scope.row.deleting"
            @click="deleteOrder(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <div class="page-tip">第 {{ currentPage }} / {{ totalOrderPages }} 页</div>
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalOrders"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <div class="summary-bar">
      <span>总计订单数：{{ summaryTotal }}</span>
      <span>已付款订单数：{{ summaryPaidCount }}/{{ summaryTotal }}</span>
      <span>已付款总金额：{{ formatAmount(summaryPaidAmount) }}元</span>
    </div>

    <el-dialog title="订单详情" :visible.sync="showDialog" width="80%" @close="getOrders">
      <orders-view :order-id="currentOrderId" />
    </el-dialog>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="context-menu-item" @click="copyOrderByContext">复制订单</div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import OrdersView from '../components/OrdersView.vue'

function createDefaultFilters() {
  return {
    customer_name: '',
    product_code: '',
    product_name: '',
    start_date: '',
    end_date: '',
    clerk_id: null,
    salesperson: '',
    shipping_status: '',
    settlement_status: '',
    payment_method: '',
    reminder_only: false
  }
}

function escapeXml(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function columnName(index) {
  let name = ''
  let value = index + 1
  while (value > 0) {
    const remainder = (value - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    value = Math.floor((value - 1) / 26)
  }
  return name
}

function makeCrcTable() {
  const table = []
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
}

const crcTable = makeCrcTable()

function crc32(bytes) {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function uint16(value) {
  return [value & 0xff, (value >>> 8) & 0xff]
}

function uint32(value) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  ]
}

function dosDateTime(date) {
  const year = Math.max(date.getFullYear(), 1980)
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2)
  const day = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  return { time, day }
}

function concatBytes(parts) {
  const size = parts.reduce((sum, part) => sum + part.length, 0)
  const bytes = new Uint8Array(size)
  let offset = 0
  parts.forEach(part => {
    bytes.set(part, offset)
    offset += part.length
  })
  return bytes
}

function createZip(files) {
  const encoder = new TextEncoder()
  const now = dosDateTime(new Date())
  const localParts = []
  const centralParts = []
  let offset = 0

  files.forEach(file => {
    const nameBytes = encoder.encode(file.name)
    const dataBytes = encoder.encode(file.content)
    const crc = crc32(dataBytes)
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(now.time),
      ...uint16(now.day),
      ...uint32(crc),
      ...uint32(dataBytes.length),
      ...uint32(dataBytes.length),
      ...uint16(nameBytes.length),
      ...uint16(0)
    ])
    localParts.push(localHeader, nameBytes, dataBytes)

    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0x0800),
      ...uint16(0),
      ...uint16(now.time),
      ...uint16(now.day),
      ...uint32(crc),
      ...uint32(dataBytes.length),
      ...uint32(dataBytes.length),
      ...uint16(nameBytes.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset)
    ])
    centralParts.push(centralHeader, nameBytes)
    offset += localHeader.length + nameBytes.length + dataBytes.length
  })

  const centralDirectory = concatBytes(centralParts)
  const endRecord = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralDirectory.length),
    ...uint32(offset),
    ...uint16(0)
  ])

  return concatBytes(localParts.concat([centralDirectory, endRecord]))
}

function createXlsx(rows, colWidths) {
  const rowXml = rows.map((row, rowIndex) => {
    const cells = row.map((value, colIndex) => {
      const ref = `${columnName(colIndex)}${rowIndex + 1}`
      return `<c r="${ref}" t="inlineStr" s="1"><is><t>${escapeXml(value)}</t></is></c>`
    }).join('')
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')
  const colsXml = colWidths.map((width, index) => {
    return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`
  }).join('')
  const lastCell = `${columnName((rows[0] || []).length - 1)}${Math.max(rows.length, 1)}`

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastCell}"/>
  <cols>${colsXml}</cols>
  <sheetData>${rowXml}</sheetData>
</worksheet>`

  return createZip([
    {
      name: '[Content_Types].xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
    },
    {
      name: '_rels/.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
    },
    {
      name: 'xl/workbook.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="订单导出" sheetId="1" r:id="rId1"/></sheets>
</workbook>`
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
    },
    {
      name: 'xl/styles.xml',
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font/><font><sz val="12"/><name val="SimSun"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="2"><border/><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="49" fontId="1" fillId="0" borderId="1" applyNumberFormat="1" applyFont="1" applyBorder="1"/></cellXfs>
</styleSheet>`
    },
    { name: 'xl/worksheets/sheet1.xml', content: worksheet }
  ])
}

export default {
  components: { OrdersView },
  data() {
    return {
      orders: [],
      reminderOrders: [],
      users: [],
      salespersons: [],
      products: [],
      filters: createDefaultFilters(),
      loading: false,
      showDialog: false,
      currentOrderId: null,
      copying: false,
      exporting: false,
      currentUser: JSON.parse(sessionStorage.getItem('user')) || {},
      currentPage: 1,
      pageSize: 10,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        row: null
      }
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    },
    reminderTitle() {
      const prefix = this.isAdmin ? '全部未结账提醒' : '我的未结账提醒'
      return `${prefix}：${this.reminderOrders.length} 单`
    },
    totalOrders() {
      return this.orders.length
    },
    totalOrderPages() {
      return Math.max(1, Math.ceil(this.totalOrders / this.pageSize))
    },
    pagedOrders() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.orders.slice(start, start + this.pageSize)
    },
    productNameOptions() {
      return Array.from(new Set(
        this.products
          .map(item => String(item.name || '').trim())
          .filter(Boolean)
      ))
    },
    summaryTotal() {
      return this.orders.length
    },
    summaryPaidCount() {
      return this.orders.filter(item => item.settlement_status === '已结账').length
    },
    summaryPaidAmount() {
      return this.orders
        .filter(item => item.settlement_status === '已结账')
        .reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    }
  },
  mounted() {
    document.addEventListener('click', this.closeContextMenu)
    if (this.isAdmin) {
      this.getUsers()
      this.getProducts()
    }
    this.getSalespersons()
    this.getOrders()
    this.getReminderOrders()
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeContextMenu)
  },
  methods: {
    formatAmount(value) {
      return Number(value || 0).toFixed(2)
    },
    getProductCodeList(row) {
      const text = row && row.product_codes ? String(row.product_codes) : ''
      return text
        .split(/[,，、\n\r]+/)
        .map(item => item.trim())
        .filter(Boolean)
    },
    getProductNameList(row) {
      if (row && Array.isArray(row.items) && row.items.length) {
        return row.items
          .map(item => String(item.product_name || '').trim())
          .filter(Boolean)
      }

      const text = row && row.product_names ? String(row.product_names) : ''
      return text
        .split(/[,，、\n\r]+/)
        .map(item => item.trim())
        .filter(Boolean)
    },
    isOrderSubmittedLocked(row) {
      return !!row && row.submitted_locked
    },
    formatCompactDate(value) {
      if (!value) return '-'
      const text = String(value)
      const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
      if (matched) {
        return `${matched[1]}${matched[2]}${matched[3]}`
      }
      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return text
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}${month}${day}`
    },
    resetFilters() {
      this.filters = createDefaultFilters()
      this.getOrders()
    },
    getUsers() {
      axios.get('/users')
        .then(res => {
          this.users = res.data || []
        })
        .catch(() => {
          this.$message.error('制单员数据加载失败')
        })
    },
    getSalespersons() {
      axios.get('/salespersons')
        .then(res => {
          this.salespersons = res.data || []
        })
        .catch(() => {
          this.salespersons = []
          this.$message.error('业务员数据加载失败')
        })
    },
    getProducts() {
      axios.get('/products')
        .then(res => {
          this.products = res.data || []
        })
        .catch(() => {
          this.products = []
          this.$message.error('商品列表加载失败')
        })
    },
    buildParams(sourceFilters) {
      const params = { ...sourceFilters }
      params.product_code = String(params.product_code || '').trim()
      params.product_name = String(params.product_name || '').trim()
      if (!this.isAdmin) {
        params.clerk_id = this.currentUser.id
        delete params.product_name
      }
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })
      return params
    },
    normalizeOrders(list) {
      return (list || []).map(item => {
        const shippingStatus = item.shipping_status || '未发货'
        const settlementStatus = item.settlement_status || '已结账'
        return {
          ...item,
          shipping_status: shippingStatus,
          settlement_status: settlementStatus,
          tracking_number: item.tracking_number || '',
          payment_method: item.payment_method || '',
          product_names: item.product_names || '',
          submitted_locked: shippingStatus === '已发货',
          updating: false,
          deleting: false
        }
      })
    },
    getOrders() {
      const params = this.buildParams(this.filters)

      this.loading = true
      axios.get('/orders', { params })
        .then(res => {
          this.orders = this.normalizeOrders(res.data)
          this.currentPage = 1
        })
        .catch(() => {
          this.$message.error('订单列表加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    searchOrders() {
      this.currentPage = 1
      this.$nextTick(() => {
        this.getOrders()
      })
    },
    getReminderOrders() {
      const params = this.buildParams({
        reminder_only: true
      })

      axios.get('/orders', { params })
        .then(res => {
          this.reminderOrders = this.normalizeOrders(res.data)
        })
        .catch(() => {
          this.reminderOrders = []
        })
    },
    toggleShipping(row, value) {
      if (this.isOrderSubmittedLocked(row)) return
      row.shipping_status = value ? '已发货' : '未发货'
      if (!value) {
        row.tracking_number = ''
      }
    },
    updateShipping(row) {
      if (row.updating) return
      if (this.isOrderSubmittedLocked(row)) {
        this.$message.error('订单已提交，如需修改请先申请反结账')
        return
      }
      if (row.shipping_status !== '已发货') {
        this.$message.error('请先将发货状态设置为已发货')
        return
      }
      if (!String(row.tracking_number || '').trim()) {
        this.$message.error('请填写运单号')
        return
      }

      this.$confirm('确认提交该订单的发货信息吗？提交后如需修改，需要先申请反结账。', '确认提交', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        row.updating = true
        return axios.put(`/orders/${row.id}`, {
          shipping_status: row.shipping_status || '未发货',
          tracking_number: row.tracking_number
        }).then(() => {
          row.submitted_locked = row.shipping_status === '已发货'
          this.$message.success('订单状态已提交')
          this.getOrders()
          this.getReminderOrders()
        }).catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '订单状态提交失败')
          this.getOrders()
        }).finally(() => {
          row.updating = false
        })
      }).catch(() => {})
    },
    deleteOrder(row) {
      if (row.shipping_status === '已发货') return
      this.$confirm(`确认删除订单 ${row.order_number} 吗？`, '提示', { type: 'warning' }).then(() => {
        row.deleting = true
        axios.delete(`/orders/${row.id}`)
          .then(() => {
            this.$message.success('订单已删除')
            this.getOrders()
            this.getReminderOrders()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '删除订单失败')
          })
          .finally(() => {
            row.deleting = false
          })
      }).catch(() => {})
    },
    openRowContextMenu(row, column, event) {
      event.preventDefault()
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        row
      }
    },
    closeContextMenu() {
      if (!this.contextMenu.visible) return
      this.contextMenu.visible = false
      this.contextMenu.row = null
    },
    copyOrderByContext() {
      const row = this.contextMenu.row
      this.closeContextMenu()
      if (!row || this.copying) return
      this.copying = true
      axios.post(`/orders/${row.id}/copy`)
        .then(res => {
          const orderNumber = res && res.data && res.data.order_number
          this.$message.success(orderNumber ? `复制成功：${orderNumber}` : '复制成功')
          this.getOrders()
          this.getReminderOrders()
        })
        .catch(error => {
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '复制订单失败')
        })
        .finally(() => {
          this.copying = false
        })
    },
    viewOrder(row) {
      this.currentOrderId = row.id
      this.showDialog = true
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    buildExportWorkbook(orderDetails) {
      const headers = [
        '订单编号',
        '日期',
        '业务员名称',
        '客户名称',
        '商品名称',
        '商品编码/颜色',
        '容量',
        '数量',
        '单价',
        '运费',
        '折扣',
        '金额',
        '订单总金额',
        '收件人',
        '收件地址',
        '是否发货',
        '运单号',
        '是否结账',
        '结账方式'
      ]

      const rows = []
      orderDetails.forEach(order => {
        const items = order.items && order.items.length ? order.items : [{}]
        items.forEach(item => {
          rows.push([
            order.order_number || '',
            this.formatCompactDate(order.order_date),
            order.salesperson || '',
            order.customer_name || '',
            item.product_name || '',
            [item.product_code, item.color].filter(Boolean).join('/'),
            item.capacity || '',
            item.quantity || '',
            item.unit_price === null || item.unit_price === undefined ? '' : this.formatAmount(item.unit_price),
            this.formatAmount(order.shipping_fee),
            this.formatAmount(order.discount_amount),
            item.amount === null || item.amount === undefined ? '' : this.formatAmount(item.amount),
            this.formatAmount(order.total_amount),
            order.recipient_name || order.customer_name || '',
            order.recipient_address || '',
            order.shipping_status === '已发货' ? '是' : '否',
            order.tracking_number || '',
            order.settlement_status === '已结账' ? '是' : '否',
            order.payment_method || (order.settlement_status === '未结账' ? '未结账' : '')
          ])
        })
      })

      return createXlsx([headers].concat(rows), [
        18,
        12,
        12,
        16,
        22,
        18,
        10,
        8,
        10,
        10,
        10,
        10,
        12,
        14,
        34,
        10,
        18,
        10,
        14
      ])
    },
    fetchExportOrders() {
      return Promise.all(this.orders.map(order => {
        return axios.get(`/orders/${order.id}`)
          .then(res => res.data || order)
          .catch(() => order)
      }))
    },
    saveExcelWithPicker(content, filename) {
      if (!window.showSaveFilePicker) return Promise.resolve(false)

      return window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Excel 文件',
            accept: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
            }
          }
        ]
      }).then(handle => {
        return handle.createWritable()
          .then(writable => {
            return writable.write(content)
              .then(() => writable.close())
              .then(() => true)
          })
      })
    },
    downloadExcel(content, filename) {
      const blob = new Blob([content], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)
    },
    exportOrders() {
      if (!this.orders.length) {
        this.$message.warning('当前没有可导出的订单')
        return
      }
      this.exporting = true

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = `${now.getMonth() + 1}`.padStart(2, '0')
      const dd = `${now.getDate()}`.padStart(2, '0')
      const hh = `${now.getHours()}`.padStart(2, '0')
      const mi = `${now.getMinutes()}`.padStart(2, '0')
      const ss = `${now.getSeconds()}`.padStart(2, '0')
      const filename = `订单导出_${yyyy}${mm}${dd}_${hh}${mi}${ss}.xlsx`

      this.fetchExportOrders()
        .then(orderDetails => {
          const excel = this.buildExportWorkbook(orderDetails)
          return this.saveExcelWithPicker(excel, filename)
            .then(savedByPicker => ({ savedByPicker, excel }))
            .catch(() => ({ savedByPicker: false, excel }))
        })
        .then(({ savedByPicker, excel }) => {
          if (!savedByPicker) {
            this.downloadExcel(excel, filename)
          }
          this.$message.success('导出成功')
        })
        .catch(() => {
          this.$message.error('导出失败')
        })
        .finally(() => {
          this.exporting = false
        })
    }
  }
}
</script>

<style scoped>
.orders-management {
  padding: 8px 0;
}

.reminder-alert {
  margin-bottom: 16px;
}

.reminder-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.reminder-item {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  background: #fff7e6;
  border: 1px solid #f5dab1;
  border-radius: 6px;
  cursor: pointer;
}

.filters {
  margin-bottom: 16px;
}

.filters /deep/ .el-input,
.filters /deep/ .el-select,
.filters /deep/ .el-date-editor {
  width: 150px;
}

.orders-table {
  font-size: 13px;
}

.settlement-status-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.reminder-tag {
  margin-left: 0;
}

.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-tip {
  font-size: 13px;
  color: #606266;
}

.summary-bar {
  margin-top: 14px;
  display: flex;
  gap: 18px;
  font-size: 15px;
  font-weight: 700;
  color: #f56c6c;
}

.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 112px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.context-menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
}

.context-menu-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
</style>

<style>
.orders-management .el-switch__label {
  font-size: 12px;
  white-space: nowrap;
}

.orders-management .shipping-col .cell {
  white-space: nowrap;
}

.orders-management .product-codes-col .cell,
.orders-management .product-names-col .cell {
  white-space: normal !important;
  line-height: 20px;
}

.orders-management .product-code-list,
.orders-management .product-name-list {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 100%;
}

.orders-management .product-code-line,
.orders-management .product-name-line {
  max-width: 100%;
  white-space: normal !important;
  overflow-wrap: anywhere;
  word-break: break-all;
}
</style>

