<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">登录</h1>
      <el-form @submit.native.prevent="login">
        <el-form-item>
          <el-input v-model="username" placeholder="请输入用户名" @keyup.enter.native="login" />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter.native="login"
          />
        </el-form-item>
        <el-button type="primary" class="login-button" @click="login">登录</el-button>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      password: ''
    }
  },
  methods: {
    buildUserFromResponse(response) {
      const token = response && response.token
      const payload = token ? JSON.parse(atob(token.split('.')[1])) : {}

      return {
        id: payload.user_id || payload.id || null,
        username: (response && response.username) || this.username,
        role: payload.role || (response && response.role) || ''
      }
    },
    isTrialExpired() {
      const now = new Date()
      const expiryTime = new Date(2026, 3, 7, 0, 0, 0, 0)

      return now >= expiryTime
    },
    login() {
      if (this.isTrialExpired()) {
        this.$alert('软件试用期已过期，请联系制作方', '提示', {
          confirmButtonText: '确定',
          type: 'warning'
        })
        return
      }

      axios.post('/login', { username: this.username, password: this.password })
        .then(res => {
          sessionStorage.setItem('token', res.data.token)
          sessionStorage.setItem('user', JSON.stringify(this.buildUserFromResponse(res.data)))
          this.$router.push('/dashboard')
        })
        .catch(() => {
          this.$message.error('用户名或密码错误')
        })
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4ecf7 100%);
}

.login-card {
  width: 420px;
  padding: 48px 40px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(31, 45, 61, 0.12);
}

.login-title {
  margin: 0 0 32px;
  text-align: center;
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.login-button {
  width: 100%;
  margin-top: 8px;
}
</style>
