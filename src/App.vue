<template>
  <router-view v-if="isLoginPage" />
  <el-container v-else class="app-shell">
    <el-aside width="220px" class="app-aside">
      <div class="user-panel">
        <el-popover
          placement="right-start"
          width="220"
          trigger="click"
          popper-class="font-setting-popover"
        >
          <div class="font-setting">
            <div class="font-setting-title">字体大小</div>
            <div class="font-setting-control">
              <el-input-number
                v-model="fontSize"
                :min="10"
                :max="20"
                :step="1"
                size="mini"
                controls-position="right"
                @change="handleFontSizeChange"
              />
              <span>px</span>
            </div>
            <div class="font-setting-actions">
              <el-button size="mini" @click="resetFontSize">恢复默认</el-button>
            </div>
          </div>
          <el-button
            slot="reference"
            type="text"
            class="settings-button"
            title="设置"
          >
            <i class="el-icon-setting"></i>
          </el-button>
        </el-popover>
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

      <el-menu
        :default-active="$route.path"
        :default-openeds="defaultOpeneds"
        class="el-menu-vertical-demo"
        router
      >
        <el-menu-item index="/dashboard">首页</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/orders">制单</el-menu-item>
        <el-submenu v-if="user.role === 'admin'" index="user-center">
          <template slot="title">用户管理</template>
          <el-menu-item index="/users">制单员管理</el-menu-item>
          <el-menu-item index="/salespersons">业务员管理</el-menu-item>
        </el-submenu>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/products">商品管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/orders-management">订单管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/checkout-review">反结账管理</el-menu-item>
        <el-menu-item v-if="['admin', 'clerk'].includes(user.role)" index="/draft-box">草稿箱</el-menu-item>
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
      user: {},
      fontSize: 12
    }
  },
  computed: {
    isLoginPage() {
      return this.$route.path === '/login'
    },
    displayName() {
      return this.user.username || '未登录'
    },
    defaultOpeneds() {
      return this.$route.path === '/users' || this.$route.path === '/salespersons'
        ? ['user-center']
        : []
    }
  },
  watch: {
    fontSize: {
      immediate: true,
      handler(value) {
        this.applyFontSize(value)
      }
    },
    $route: {
      immediate: true,
      handler() {
        this.syncUser()
        this.$nextTick(this.relayoutTables)
      }
    }
  },
  created() {
    this.loadFontSize()
  },
  methods: {
    getSessionUser() {
      const raw = sessionStorage.getItem('user')
      if (!raw) return {}
      try {
        return JSON.parse(raw) || {}
      } catch (error) {
        sessionStorage.removeItem('user')
        return {}
      }
    },
    normalizeRole(role) {
      if (['admin', 'ADMIN', '管理员'].includes(role)) return 'admin'
      if (['clerk', 'CLERK', '制单员'].includes(role)) return 'clerk'
      return role || ''
    },
    syncUser() {
      const user = this.getSessionUser()
      this.user = {
        ...user,
        role: this.normalizeRole(user.role)
      }
    },
    loadFontSize() {
      const saved = Number(localStorage.getItem('appFontSize'))
      if (saved >= 10 && saved <= 20) {
        this.fontSize = saved
      }
    },
    applyFontSize(value) {
      const size = Number(value) || 12
      document.documentElement.style.setProperty('--app-font-size', `${size}px`)
      this.$nextTick(this.relayoutTables)
    },
    handleFontSizeChange(value) {
      const size = Number(value) || 12
      this.fontSize = size
      localStorage.setItem('appFontSize', String(size))
      this.applyFontSize(size)
    },
    resetFontSize() {
      this.fontSize = 12
      localStorage.setItem('appFontSize', '12')
      this.applyFontSize(12)
    },
    relayoutTables() {
      const tables = document.querySelectorAll('.el-table')
      tables.forEach(table => {
        if (table.__vue__ && typeof table.__vue__.doLayout === 'function') {
          table.__vue__.doLayout()
        }
      })
    },
    logout() {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
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
  position: relative;
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

.settings-button {
  position: absolute;
  top: 8px;
  right: 12px;
  padding: 0;
  color: #606266;
}

.settings-button:hover {
  color: #409eff;
}

.user-center {
  margin-bottom: 8px;
  text-align: left;
}
</style>

<style>
body,
button,
input,
textarea,
select,
h1,
h2,
h3,
h4,
h5,
h6,
p,
span,
div,
.el-button,
.el-input__inner,
.el-textarea__inner,
.el-table,
.el-menu,
.el-dialog,
.el-form-item__label,
.el-form-item__content {
  font-family: SimSun, "宋体", serif;
  font-size: var(--app-font-size, 12px);
}

.app-shell .user-name,
.order-page .order-table,
.orders-view .detail-table,
.draft-order-view .detail-table {
  font-size: var(--app-font-size, 12px);
}

.el-table th,
.el-table td {
  padding: 12px 0;
}

.el-table .cell {
  line-height: 24px;
}

.el-table th .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  word-break: keep-all !important;
}

.el-table td .cell {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  overflow-wrap: anywhere !important;
  word-break: break-all !important;
  line-height: 1.45;
}

.el-table .caret-wrapper {
  flex: 0 0 auto;
}

body * {
  font-size: var(--app-font-size, 12px) !important;
}

.font-setting-popover {
  font-family: SimSun, "宋体", serif;
  font-size: var(--app-font-size, 12px);
}

.font-setting-title {
  margin-bottom: 10px;
}

.font-setting-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-setting-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

