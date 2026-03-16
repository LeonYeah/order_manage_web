<template>
  <router-view v-if="isLoginPage" />
  <el-container v-else class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="brand">订单管理系统</div>
      <div class="user-panel">
        <div class="user-name">{{ user.username || '未登录' }}</div>
        <el-tag size="mini" :type="user.role === 'admin' ? 'danger' : 'success'">
          {{ user.role === 'admin' ? '管理员' : '制单员' }}
        </el-tag>
      </div>
      <el-menu :default-active="$route.path" class="el-menu-vertical-demo">
        <el-menu-item index="/dashboard" @click="$router.push('/dashboard')">首页</el-menu-item>
        <el-menu-item v-if="user.role === 'admin'" index="/users" @click="$router.push('/users')">用户管理</el-menu-item>
        <el-menu-item index="/products" @click="$router.push('/products')">商品管理</el-menu-item>
        <el-menu-item v-if="user.role === 'clerk'" index="/orders" @click="$router.push('/orders')">制单</el-menu-item>
        <el-menu-item v-if="user.role === 'admin'" index="/orders-management" @click="$router.push('/orders-management')">订单管理</el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  data() {
    return {
      user: {}
    }
  },
  computed: {
    isLoginPage() {
      return this.$route.path === '/login'
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler() {
        this.syncUser()
      }
    }
  },
  methods: {
    isAdminRole(role) {
      return ['admin', 'ADMIN', '管理员'].includes(role)
    },
    syncUser() {
      this.user = JSON.parse(localStorage.getItem('user')) || {}
    }
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-aside {
  background: #fff;
  border-right: 1px solid #ebeef5;
}

.brand {
  padding: 20px 16px 8px;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.user-panel {
  padding: 0 16px 16px;
}

.user-name {
  margin-bottom: 8px;
  color: #606266;
}
</style>
