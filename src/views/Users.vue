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
          <el-button type="warning" @click="openPasswordDialog">修改密码</el-button>
          <el-button type="danger" @click="openDeleteDialog">删除用户</el-button>
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

    <el-card shadow="never" class="salesperson-card">
      <div slot="header" class="page-header">
        <div>
          <h2 class="page-title">业务员管理</h2>
          <p class="page-desc">仅管理员可新增或删除业务员，供下单时直接选择。</p>
        </div>
        <div class="header-actions" v-if="isAdmin">
          <el-button @click="getSalespersons">刷新</el-button>
          <el-button type="primary" @click="openSalespersonCreateDialog">新增业务员</el-button>
          <el-button type="danger" @click="openSalespersonDeleteDialog">删除业务员</el-button>
        </div>
      </div>

      <el-table
        v-if="isAdmin"
        v-loading="salespersonLoading"
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

    <el-dialog title="修改密码" :visible.sync="passwordDialogVisible" width="460px">
      <el-form ref="passwordForm" :model="passwordForm" :rules="passwordRules" label-width="110px">
        <el-form-item label="选择用户" prop="userId">
          <el-select v-model="passwordForm.userId" filterable placeholder="请选择用户" style="width: 100%">
            <el-option
              v-for="item in users"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="新的登录密码" prop="password">
          <el-input v-model="passwordForm.password" type="password" show-password maxlength="30" />
        </el-form-item>
        <el-form-item label="再次输入密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password maxlength="30" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSubmitting" @click="changePassword">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="删除用户" :visible.sync="deleteDialogVisible" width="460px">
      <el-form ref="deleteForm" :model="deleteForm" :rules="deleteRules" label-width="110px">
        <el-form-item label="选择用户" prop="userId">
          <el-select v-model="deleteForm.userId" filterable placeholder="请选择用户" style="width: 100%">
            <el-option
              v-for="item in users"
              :key="item.id"
              :label="item.username"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="deleteSubmitting" @click="deleteUser">确认</el-button>
      </div>
    </el-dialog>

    <el-dialog title="新增业务员" :visible.sync="salespersonCreateDialogVisible" width="460px">
      <el-form ref="salespersonCreateFormRef" :model="salespersonCreateForm" :rules="salespersonCreateRules" label-width="110px">
        <el-form-item label="业务员名称" prop="name">
          <el-input v-model.trim="salespersonCreateForm.name" maxlength="30" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="salespersonCreateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="salespersonSubmitting" @click="createSalesperson">确定</el-button>
      </div>
    </el-dialog>

    <el-dialog title="删除业务员" :visible.sync="salespersonDeleteDialogVisible" width="460px">
      <el-form ref="salespersonDeleteFormRef" :model="salespersonDeleteForm" :rules="salespersonDeleteRules" label-width="110px">
        <el-form-item label="选择业务员" prop="salespersonId">
          <el-select v-model="salespersonDeleteForm.salespersonId" filterable placeholder="请选择业务员" style="width: 100%">
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
        <el-button @click="salespersonDeleteDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="salespersonDeleteSubmitting" @click="deleteSalesperson">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Users',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请再次输入密码'))
        return
      }

      if (value !== this.passwordForm.password) {
        callback(new Error('两次输入的密码不一致'))
        return
      }

      callback()
    }

    return {
      loading: false,
      submitting: false,
      passwordSubmitting: false,
      deleteSubmitting: false,
      salespersonLoading: false,
      salespersonSubmitting: false,
      salespersonDeleteSubmitting: false,
      users: [],
      salespersons: [],
      currentUser: {},
      createDialogVisible: false,
      passwordDialogVisible: false,
      deleteDialogVisible: false,
      salespersonCreateDialogVisible: false,
      salespersonDeleteDialogVisible: false,
      createForm: {
        username: '',
        password: '',
        role: 'clerk'
      },
      passwordForm: {
        userId: '',
        password: '',
        confirmPassword: ''
      },
      deleteForm: {
        userId: ''
      },
      salespersonCreateForm: {
        name: ''
      },
      salespersonDeleteForm: {
        salespersonId: ''
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
      passwordRules: {
        userId: [
          { required: true, message: '请选择要修改的用户', trigger: 'change' }
        ],
        password: [
          { required: true, message: '请输入新的登录密码', trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      deleteRules: {
        userId: [
          { required: true, message: '请选择要删除的用户', trigger: 'change' }
        ]
      },
      salespersonCreateRules: {
        name: [
          { required: true, message: '请输入业务员名称', trigger: 'blur' }
        ]
      },
      salespersonDeleteRules: {
        salespersonId: [
          { required: true, message: '请选择要删除的业务员', trigger: 'change' }
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
    },
    selectedDeleteUser() {
      return this.users.find(item => item.id === this.deleteForm.userId) || null
    }
  },
  created() {
    this.syncCurrentUser()
  },
  mounted() {
    if (this.isAdmin) {
      this.getUsers()
      this.getSalespersons()
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
    getSalespersons() {
      this.salespersonLoading = true
      axios.get('/salespersons')
        .then(res => {
          this.salespersons = this.normalizeUsers(res.data)
        })
        .catch(() => {
          this.$message.error('业务员列表加载失败')
        })
        .finally(() => {
          this.salespersonLoading = false
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
    openPasswordDialog() {
      this.passwordDialogVisible = true
      this.passwordForm = {
        userId: this.users.length ? this.users[0].id : '',
        password: '',
        confirmPassword: ''
      }
      this.$nextTick(() => {
        if (this.$refs.passwordForm) {
          this.$refs.passwordForm.clearValidate()
        }
      })
    },
    openDeleteDialog() {
      this.deleteDialogVisible = true
      this.deleteForm = {
        userId: this.users.length ? this.users[0].id : ''
      }
      this.$nextTick(() => {
        if (this.$refs.deleteForm) {
          this.$refs.deleteForm.clearValidate()
        }
      })
    },
    openSalespersonCreateDialog() {
      this.salespersonCreateDialogVisible = true
      this.salespersonCreateForm = { name: '' }
      this.$nextTick(() => {
        if (this.$refs.salespersonCreateFormRef) {
          this.$refs.salespersonCreateFormRef.clearValidate()
        }
      })
    },
    openSalespersonDeleteDialog() {
      this.salespersonDeleteDialogVisible = true
      this.salespersonDeleteForm = {
        salespersonId: this.salespersons.length ? this.salespersons[0].id : ''
      }
      this.$nextTick(() => {
        if (this.$refs.salespersonDeleteFormRef) {
          this.$refs.salespersonDeleteFormRef.clearValidate()
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
    changePassword() {
      if (!this.$refs.passwordForm) return

      this.$refs.passwordForm.validate(valid => {
        if (!valid) return

        this.passwordSubmitting = true
        axios.put(`/users/${this.passwordForm.userId}/password`, {
          password: this.passwordForm.password
        })
          .then(() => {
            this.$message.success('密码修改成功')
            this.passwordDialogVisible = false
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '密码修改失败')
          })
          .finally(() => {
            this.passwordSubmitting = false
          })
      })
    },
    deleteUser() {
      if (!this.$refs.deleteForm) return

      this.$refs.deleteForm.validate(valid => {
        if (!valid) return

        const selectedUser = this.selectedDeleteUser
        const username = selectedUser ? selectedUser.username : ''

        this.$confirm(`确认删除${username}用户吗？`, '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.deleteSubmitting = true
            return axios.delete(`/users/${this.deleteForm.userId}`)
          })
          .then(() => {
            this.$message.success('用户删除成功')
            this.deleteDialogVisible = false
            this.getUsers()
          })
          .catch(error => {
            if (error === 'cancel' || error === 'close') return

            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '用户删除失败')
          })
          .finally(() => {
            this.deleteSubmitting = false
          })
      })
    },
    createSalesperson() {
      if (!this.$refs.salespersonCreateFormRef) return
      this.$refs.salespersonCreateFormRef.validate(valid => {
        if (!valid) return
        this.salespersonSubmitting = true
        axios.post('/salespersons', this.salespersonCreateForm)
          .then(() => {
            this.$message.success('业务员创建成功')
            this.salespersonCreateDialogVisible = false
            this.getSalespersons()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '业务员创建失败')
          })
          .finally(() => {
            this.salespersonSubmitting = false
          })
      })
    },
    deleteSalesperson() {
      if (!this.$refs.salespersonDeleteFormRef) return
      this.$refs.salespersonDeleteFormRef.validate(valid => {
        if (!valid) return
        const selected = this.salespersons.find(item => item.id === this.salespersonDeleteForm.salespersonId)
        const name = selected ? selected.name : ''
        this.$confirm(`确认删除业务员 ${name} 吗？`, '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.salespersonDeleteSubmitting = true
          return axios.delete(`/salespersons/${this.salespersonDeleteForm.salespersonId}`)
        }).then(() => {
          this.$message.success('业务员删除成功')
          this.salespersonDeleteDialogVisible = false
          this.getSalespersons()
        }).catch(error => {
          if (error === 'cancel' || error === 'close') return
          const serverMessage = error && error.response && error.response.data && error.response.data.msg
          this.$message.error(serverMessage || '业务员删除失败')
        }).finally(() => {
          this.salespersonDeleteSubmitting = false
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

.salesperson-card {
  margin-top: 16px;
}

.page-tip {
  font-size: 13px;
  color: #606266;
}
</style>
