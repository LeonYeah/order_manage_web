<template>
  <div class="salespersons-page">
    <el-card shadow="never">
      <div slot="header" class="page-header">
        <div>
          <h2 class="page-title">业务员管理</h2>
          <p class="page-desc">仅管理员可新增或删除业务员，供下单时直接选择。</p>
        </div>
        <div class="header-actions" v-if="isAdmin">
          <el-button @click="getSalespersons">刷新</el-button>
          <el-button type="primary" @click="openCreateDialog">新增业务员</el-button>
          <el-button type="danger" @click="openDeleteDialog">删除业务员</el-button>
        </div>
      </div>

      <el-alert
        v-if="!isAdmin"
        title="当前账号不是管理员，无法查看业务员管理页面。"
        type="warning"
        :closable="false"
        show-icon
      />

      <el-table
        v-else
        v-loading="loading"
        :data="salespersons"
        border
        style="width: 100%"
        empty-text="暂无业务员数据"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="name" label="业务员名称" min-width="180" />
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog title="新增业务员" :visible.sync="createDialogVisible" width="460px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item label="业务员名称" prop="name">
          <el-input v-model.trim="createForm.name" maxlength="30" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="createSalesperson">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="删除业务员" :visible.sync="deleteDialogVisible" width="460px">
      <el-form ref="deleteFormRef" :model="deleteForm" :rules="deleteRules" label-width="110px">
        <el-form-item label="选择业务员" prop="salespersonId">
          <el-select v-model="deleteForm.salespersonId" filterable placeholder="请选择业务员" style="width: 100%">
            <el-option
              v-for="item in salespersons"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleteSubmitting" @click="deleteSalesperson">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Salespersons',
  data() {
    return {
      loading: false,
      submitting: false,
      deleteSubmitting: false,
      salespersons: [],
      currentUser: {},
      createDialogVisible: false,
      deleteDialogVisible: false,
      createForm: {
        name: ''
      },
      deleteForm: {
        salespersonId: ''
      },
      createRules: {
        name: [
          { required: true, message: '请输入业务员名称', trigger: 'blur' }
        ]
      },
      deleteRules: {
        salespersonId: [
          { required: true, message: '请选择要删除的业务员', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    }
  },
  created() {
    this.syncCurrentUser()
  },
  mounted() {
    if (this.isAdmin) {
      this.getSalespersons()
    }
  },
  methods: {
    syncCurrentUser() {
      const raw = sessionStorage.getItem('user')
      if (!raw) {
        this.currentUser = {}
        return
      }
      try {
        this.currentUser = JSON.parse(raw) || {}
      } catch (error) {
        sessionStorage.removeItem('user')
        this.currentUser = {}
      }
    },
    normalizeSalespersons(payload) {
      const list = Array.isArray(payload)
        ? payload
        : payload && Array.isArray(payload.data)
          ? payload.data
          : payload && Array.isArray(payload.users)
            ? payload.users
            : []

      return list.slice().sort((a, b) => {
        const timeA = new Date(a && a.created_at).getTime()
        const timeB = new Date(b && b.created_at).getTime()
        const hasTimeA = !Number.isNaN(timeA)
        const hasTimeB = !Number.isNaN(timeB)

        if (hasTimeA && hasTimeB && timeA !== timeB) {
          return timeA - timeB
        }

        const idA = Number(a && a.id)
        const idB = Number(b && b.id)
        const hasIdA = !Number.isNaN(idA)
        const hasIdB = !Number.isNaN(idB)

        if (hasIdA && hasIdB && idA !== idB) {
          return idA - idB
        }

        return 0
      })
    },
    getSalespersons() {
      this.loading = true
      axios.get('/salespersons')
        .then(res => {
          this.salespersons = this.normalizeSalespersons(res.data)
        })
        .catch(() => {
          this.$message.error('业务员列表加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    openCreateDialog() {
      this.createDialogVisible = true
      this.createForm = { name: '' }
      this.$nextTick(() => {
        if (this.$refs.createFormRef) {
          this.$refs.createFormRef.clearValidate()
        }
      })
    },
    openDeleteDialog() {
      this.deleteDialogVisible = true
      this.deleteForm = {
        salespersonId: this.salespersons.length ? this.salespersons[0].id : ''
      }
      this.$nextTick(() => {
        if (this.$refs.deleteFormRef) {
          this.$refs.deleteFormRef.clearValidate()
        }
      })
    },
    createSalesperson() {
      if (!this.$refs.createFormRef) return
      this.$refs.createFormRef.validate(valid => {
        if (!valid) return
        this.submitting = true
        axios.post('/salespersons', this.createForm)
          .then(() => {
            this.$message.success('业务员创建成功')
            this.createDialogVisible = false
            this.getSalespersons()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '业务员创建失败')
          })
          .finally(() => {
            this.submitting = false
          })
      })
    },
    deleteSalesperson() {
      if (!this.$refs.deleteFormRef) return
      this.$refs.deleteFormRef.validate(valid => {
        if (!valid) return

        const selected = this.salespersons.find(item => item.id === this.deleteForm.salespersonId)
        const name = selected ? selected.name : ''

        this.$confirm(`确认删除业务员 ${name} 吗？`, '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.deleteSubmitting = true
            return axios.delete(`/salespersons/${this.deleteForm.salespersonId}`)
          })
          .then(() => {
            this.$message.success('业务员删除成功')
            this.deleteDialogVisible = false
            this.getSalespersons()
          })
          .catch(error => {
            if (error === 'cancel' || error === 'close') return
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '业务员删除失败')
          })
          .finally(() => {
            this.deleteSubmitting = false
          })
      })
    },
    formatDate(value) {
      if (!value) return '-'
      const text = String(value)
      const matched = text.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/)
      if (matched) return `${matched[1]}${matched[2]}${matched[3]}`

      const date = new Date(text)
      if (Number.isNaN(date.getTime())) return text

      const yyyy = date.getFullYear()
      const mm = `${date.getMonth() + 1}`.padStart(2, '0')
      const dd = `${date.getDate()}`.padStart(2, '0')
      return `${yyyy}${mm}${dd}`
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions .el-button + .el-button {
  margin-left: 12px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.page-desc {
  margin: 8px 0 0;
  color: #909399;
}
</style>
