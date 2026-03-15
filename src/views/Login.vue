<template>
  <el-form @submit.native.prevent="login">
    <el-form-item label="用户名">
      <el-input v-model="username"/>
    </el-form-item>
    <el-form-item label="密码">
      <el-input v-model="password" type="password"/>
    </el-form-item>
    <el-button type="primary" @click="login">登录</el-button>
  </el-form>
</template>

<script>
import axios from 'axios'

export default {
  data(){ return { username:'', password:'' } },
  methods:{
    login(){
      axios.post('/login', { username:this.username, password:this.password })
          .then(res=>{
            localStorage.setItem('token', res.data.token)
            // 解码 token 获取角色信息
            const payload = JSON.parse(atob(res.data.token.split('.')[1]))
            localStorage.setItem('user', JSON.stringify({ id:payload.user_id, role:payload.role }))
            this.$router.push('/dashboard')
          })
          .catch(()=>{ this.$message.error('用户名或密码错误') })
    }
  }
}
</script>