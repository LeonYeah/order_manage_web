<template>
  <router-view v-if="isLoginPage" />
  <el-container v-else class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="user-panel">
        <div class="user-center">
          <div class="user-name">{{ displayName }}</div>
          <el-tag size="mini" :type="user.role === 'admin' ? 'danger' : 'success'">
            {{ user.role === 'admin' ? '管理员' : '制单员' }}
          </el-tag>
        </div>
        <div class="user-actions">
          <el-button type="text" class="logout-button" @click="logout">退出登录</el-button>
        </div>
      </div>

      <el-menu :default-active="$route.path" class="el-menu-vertical-demo">
        <el-menu-item index="/dashboard" @click="$router.push('/dashboard')">首页</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/orders" @click="$router.push('/orders')">制单</el-menu-item>
        <el-menu-item v-if="user.role === 'admin'" index="/users" @click="$router.push('/users')">用户管理</el-menu-item>
        <el-menu-item index="/products" @click="$router.push('/products')">商品管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/orders-management" @click="$router.push('/orders-management')">订单管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/checkout-review" @click="$router.push('/checkout-review')">反结账管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/draft-box" @click="$router.push('/draft-box')">草稿箱</el-menu-item>
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
    },
    displayName() {
      return this.user.username || '未登录'
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
    normalizeRole(role) {
      if (['admin', 'ADMIN', '管理员'].includes(role)) return 'admin'
      if (['clerk', 'CLERK', '制单员'].includes(role)) return 'clerk'
      return role || ''
    },
    syncUser() {
      const user = JSON.parse(localStorage.getItem('user')) || {}
      this.user = {
        ...user,
        role: this.normalizeRole(user.role)
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.user = {}
      this.$router.push('/login')
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

.user-panel {
  padding: 18px 16px 16px;
  background: #f3f7ff;
  border-bottom: 1px solid #ebeef5;
}

.user-name {
  color: #2b5da8;
  font-weight: 600;
  font-size: 18px;
  text-align: left;
  line-height: 1.2;
  margin-bottom: 6px;
}

.user-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.logout-button {
  padding: 0;
}

.user-center {
  margin-bottom: 8px;
  text-align: left;
}
</style>
