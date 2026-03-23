<template>
  <div class="draft-box">
    <el-form inline class="filters">
      <el-form-item label="用户名称">
        <el-input v-model.trim="filters.user_name" placeholder="输入用户名称" clearable />
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
      <el-form-item>
        <el-button type="primary" @click="getDrafts">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      :data="pagedDrafts"
      border
      style="width: 100%"
      @row-dblclick="openDraftEditor"
    >
      <el-table-column type="index" label="序号" width="60" :index="draftIndexMethod" />
      <el-table-column prop="customer_name" label="客户名称" min-width="140" />
      <el-table-column prop="order_clerk" label="制单员" width="100" />
      <el-table-column prop="salesperson" label="业务员" width="100" />
      <el-table-column label="下单日期" width="100">
        <template slot-scope="scope">
          {{ formatCompactDate(scope.row.order_date) }}
        </template>
      </el-table-column>
      <el-table-column label="结账状态" width="90">
        <template slot-scope="scope">
          {{ scope.row.settlement_status || '未结账' }}
        </template>
      </el-table-column>
      <el-table-column prop="item_count" label="明细数" width="80" />
      <el-table-column prop="total_amount" label="总金额(元)" width="100">
        <template slot-scope="scope">
          {{ formatAmount(scope.row.total_amount) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="primary"
            size="mini"
            :loading="scope.row.confirming"
            @click="confirmDraft(scope.row)"
          >
            确认下单
          </el-button>
          <el-button
            type="danger"
            size="mini"
            :loading="scope.row.deleting"
            @click="deleteDraft(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrap">
      <div class="page-tip">第 {{ currentPage }} / {{ totalPages }} 页</div>
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalDrafts"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <div class="summary-bar">
      <span>总草稿数：{{ filteredTotalCount }}</span>
      <span>草稿总金额：{{ formatAmount(totalDraftAmount) }}元</span>
    </div>

    <el-dialog title="修改草稿" :visible.sync="showEditDialog" width="80%">
      <draft-order-view v-if="currentDraftId" :draft-id="currentDraftId" @saved="handleDraftSaved" />
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import DraftOrderView from '../components/DraftOrderView.vue'

export default {
  components: { DraftOrderView },
  data() {
    return {
      drafts: [],
      filters: {
        user_name: '',
        start_date: '',
        end_date: ''
      },
      loading: false,
      currentPage: 1,
      pageSize: 10,
      showEditDialog: false,
      currentDraftId: null
    }
  },
  computed: {
    totalDrafts() {
      return this.drafts.length
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.totalDrafts / this.pageSize))
    },
    pagedDrafts() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.drafts.slice(start, start + this.pageSize)
    },
    filteredTotalCount() {
      return this.drafts.length
    },
    totalDraftAmount() {
      return this.drafts.reduce((sum, item) => sum + Number(item.total_amount || 0), 0)
    }
  },
  mounted() {
    this.getDrafts()
  },
  methods: {
    formatAmount(value) {
      return Number(value || 0).toFixed(2)
    },
    formatCompactDate(value) {
      if (!value) return '-'
      const text = String(value)
      const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
      if (matched) {
        return `${matched[1]}${matched[2]}${matched[3]}`
      }
      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return '-'
      const year = date.getFullYear()
      const month = `${date.getMonth() + 1}`.padStart(2, '0')
      const day = `${date.getDate()}`.padStart(2, '0')
      return `${year}${month}${day}`
    },
    draftIndexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    resetFilters() {
      this.filters = {
        user_name: '',
        start_date: '',
        end_date: ''
      }
      this.getDrafts()
    },
    normalizeDrafts(list) {
      return (list || []).map(item => ({
        ...item,
        confirming: false,
        deleting: false
      }))
    },
    getDrafts() {
      this.loading = true
      const params = {
        user_name: this.filters.user_name || undefined,
        start_date: this.filters.start_date || undefined,
        end_date: this.filters.end_date || undefined
      }
      axios.get('/order-drafts', { params })
        .then(res => {
          this.drafts = this.normalizeDrafts(res.data)
          this.currentPage = 1
        })
        .catch(() => {
          this.$message.error('草稿箱加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    confirmDraft(row) {
      if (row.confirming) return
      this.$confirm(`确认将草稿 #${row.id} 下单吗？`, '提示', { type: 'warning' }).then(() => {
        row.confirming = true
        axios.post(`/order-drafts/${row.id}/confirm`)
          .then(res => {
            const orderNumber = res && res.data && res.data.order_number
            this.$message.success(orderNumber ? `下单成功，订单号：${orderNumber}` : '下单成功')
            this.getDrafts()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '确认下单失败')
          })
          .finally(() => {
            row.confirming = false
          })
      }).catch(() => {})
    },
    deleteDraft(row) {
      if (row.deleting) return
      this.$confirm(`确认删除草稿 #${row.id} 吗？`, '提示', { type: 'warning' }).then(() => {
        row.deleting = true
        axios.delete(`/order-drafts/${row.id}`)
          .then(() => {
            this.$message.success('草稿已删除')
            this.getDrafts()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '草稿删除失败')
          })
          .finally(() => {
            row.deleting = false
          })
      }).catch(() => {})
    },
    openDraftEditor(row) {
      this.currentDraftId = row.id
      this.showEditDialog = true
    },
    handleDraftSaved() {
      this.showEditDialog = false
      this.getDrafts()
    }
  }
}
</script>

<style scoped>
.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  margin-bottom: 12px;
}

.filters /deep/ .el-input,
.filters /deep/ .el-date-editor {
  width: 150px;
}

.page-tip {
  font-size: 13px;
  color: #606266;
}

.summary-bar {
  margin-top: 8px;
  font-size: 13px;
  color: #f56c6c;
  font-weight: 700;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}
</style>
