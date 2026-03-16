<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">订单管理系统</h1>
      <el-form @submit.native.prevent="login">
        <el-form-item>
          <el-input v-model="username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
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
    login() {
      axios.post('/login', { username: this.username, password: this.password })
        .then(res => {
          localStorage.setItem('token', res.data.token)
          const payload = JSON.parse(atob(res.data.token.split('.')[1]))
          localStorage.setItem('user', JSON.stringify({ id: payload.user_id, role: payload.role }))
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
