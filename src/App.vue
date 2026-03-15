<template>
  <el-container>
    <el-aside width="200px">
      <el-menu :default-active="$route.path" class="el-menu-vertical-demo">
        <el-menu-item index="/dashboard" @click="$router.push('/dashboard')">首页</el-menu-item>
        <el-menu-item v-if="user.role==='admin'" index="/users" @click="$router.push('/users')">用户管理</el-menu-item>
        <el-menu-item index="/products" @click="$router.push('/products')">商品管理</el-menu-item>
        <el-menu-item v-if="user.role==='clerk'" index="/orders" @click="$router.push('/orders')">制单</el-menu-item>
        <el-menu-item v-if="user.role==='admin'" index="/orders-management" @click="$router.push('/orders-management')">订单管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main>
        <router-view/>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  data(){
    return {
      user: JSON.parse(localStorage.getItem('user')) || {}
    }
  }
}
</script>