<template>
  <div class="users-page">
    <el-card shadow="never">
      <div slot="header" class="page-header">
        <div>
          <h2 class="page-title">用户管理</h2>
          <p class="page-desc">仅管理员可以查看列表、新增用户并分配角色。</p>
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
        :data="users"
        border
        style="width: 100%"
        empty-text="暂无用户数据"
      >
        <el-table-column prop="id" label="ID" width="80" />
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
        <el-table-column label="操作" width="160">
          <template slot-scope="scope">
            <el-button type="text" @click="openRoleDialog(scope.row)">分配角色</el-button>
          </template>
        </el-table-column>
      </el-table>
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

    <el-dialog title="分配角色" :visible.sync="roleDialogVisible" width="420px">
      <el-form label-width="90px">
        <el-form-item label="用户名">
          <el-input :value="selectedUser.username" disabled />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="roleForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="制单员" value="clerk" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="updateRole">保存</el-button>
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
      roleDialogVisible: false,
      selectedUser: {},
      createForm: {
        username: '',
        password: '',
        role: 'clerk'
      },
      roleForm: {
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
      }
    }
  },
  computed: {
    isAdmin() {
      return this.isAdminRole(this.currentUser.role)
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
      this.currentUser = JSON.parse(localStorage.getItem('user')) || {}
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
          .catch(() => {
            this.$message.error('用户创建失败')
          })
          .finally(() => {
            this.submitting = false
          })
      })
    },
    openRoleDialog(user) {
      this.selectedUser = user || {}
      this.roleForm = {
        role: this.isAdminRole(user && user.role) ? 'admin' : 'clerk'
      }
      this.roleDialogVisible = true
    },
    updateRole() {
      if (!this.selectedUser.id) return

      this.submitting = true
      axios.put(`/users/${this.selectedUser.id}`, {
        role: this.roleForm.role
      })
        .then(() => {
          this.$message.success('角色更新成功')
          this.roleDialogVisible = false
          this.getUsers()
        })
        .catch(() => {
          this.$message.error('角色更新失败')
        })
        .finally(() => {
          this.submitting = false
        })
    },
    formatDate(value) {
      if (!value) return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return value

      const yyyy = date.getFullYear()
      const mm = `${date.getMonth() + 1}`.padStart(2, '0')
      const dd = `${date.getDate()}`.padStart(2, '0')
      const hh = `${date.getHours()}`.padStart(2, '0')
      const mi = `${date.getMinutes()}`.padStart(2, '0')
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
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
