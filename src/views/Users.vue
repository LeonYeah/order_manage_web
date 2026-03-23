<template>
  <div class="users-page">
    <el-card shadow="never">
      <div slot="header" class="page-header">
        <div>
          <h2 class="page-title">用户管理</h2>
          <p class="page-desc">仅管理员可查看并新增用户。</p>
        </div>
        <div class="header-actions" v-if="isAdmin">
          <el-button @click="getUsers">刷新</el-button>
          <el-button type="primary" @click="openCreateDialog">新增用户</el-button>
        </div>
      </div>

      <el-alert
        v-if="!isAdmin"
        title="当前账号不是管理员，无法查看用户管理页面。"
        type="warning"
        :closable="false"
        show-icon
      />

      <el-table
        v-else
        v-loading="loading"
        :data="pagedUsers"
        border
        style="width: 100%"
        empty-text="暂无用户数据"
      >
        <el-table-column type="index" label="序号" width="80" :index="userIndexMethod" />
        <el-table-column prop="username" label="用户名" min-width="180" />
        <el-table-column label="角色" width="140">
          <template slot-scope="scope">
            <el-tag :type="isAdminRole(scope.row.role) ? 'danger' : 'success'">
              {{ isAdminRole(scope.row.role) ? '管理员' : '制单员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="180">
          <template slot-scope="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="isAdmin" class="pagination-wrap">
        <div class="page-tip">第 {{ currentPage }} / {{ totalUserPages }} 页</div>
        <el-pagination
          background
          :current-page="currentPage"
          :page-size="pageSize"
          :total="totalUsers"
          layout="prev, pager, next, jumper"
          @current-change="handleUserPageChange"
        />
      </div>
    </el-card>

    <el-dialog title="新增用户" :visible.sync="createDialogVisible" width="460px">
      <el-form ref="createForm" :model="createForm" :rules="createRules" label-width="90px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model.trim="createForm.username" maxlength="30" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password maxlength="30" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="制单员" value="clerk" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="createUser">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Users',
  data() {
    return {
      loading: false,
      submitting: false,
      users: [],
      currentUser: {},
      createDialogVisible: false,
      createForm: {
        username: '',
        password: '',
        role: 'clerk'
      },
      createRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      },
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    isAdmin() {
      return this.isAdminRole(this.currentUser.role)
    },
    totalUsers() {
      return this.users.length
    },
    totalUserPages() {
      return Math.max(1, Math.ceil(this.totalUsers / this.pageSize))
    },
    pagedUsers() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.users.slice(start, start + this.pageSize)
    }
  },
  created() {
    this.syncCurrentUser()
  },
  mounted() {
    if (this.isAdmin) {
      this.getUsers()
    }
  },
  methods: {
    syncCurrentUser() {
      this.currentUser = JSON.parse(sessionStorage.getItem('user')) || {}
    },
    isAdminRole(role) {
      return ['admin', 'ADMIN', '管理员'].includes(role)
    },
    normalizeUsers(payload) {
      if (Array.isArray(payload)) return payload
      if (payload && Array.isArray(payload.data)) return payload.data
      if (payload && Array.isArray(payload.users)) return payload.users
      return []
    },
    getUsers() {
      this.loading = true
      axios.get('/users')
        .then(res => {
          this.users = this.normalizeUsers(res.data)
          this.currentPage = 1
        })
        .catch(() => {
          this.$message.error('用户列表加载失败')
        })
        .finally(() => {
          this.loading = false
        })
    },
    openCreateDialog() {
      this.createDialogVisible = true
      this.createForm = {
        username: '',
        password: '',
        role: 'clerk'
      }
      this.$nextTick(() => {
        if (this.$refs.createForm) {
          this.$refs.createForm.clearValidate()
        }
      })
    },
    createUser() {
      if (!this.$refs.createForm) return

      this.$refs.createForm.validate(valid => {
        if (!valid) return

        this.submitting = true
        axios.post('/users', this.createForm)
          .then(() => {
            this.$message.success('用户创建成功')
            this.createDialogVisible = false
            this.getUsers()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '用户创建失败')
          })
          .finally(() => {
            this.submitting = false
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
    },
    handleUserPageChange(page) {
      this.currentPage = page
    },
    userIndexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1
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
</style>
