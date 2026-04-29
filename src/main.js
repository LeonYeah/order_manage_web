import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/zh-CN'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'
import { Message } from 'element-ui'

Vue.use(ElementUI, { locale })

axios.defaults.baseURL = '/api'
axios.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = token
  return config
})

let hasShownExpiredMessage = false

axios.interceptors.response.use(
  response => response,
  error => {
    const status = error && error.response && error.response.status

    if (status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')

      if (!hasShownExpiredMessage) {
        hasShownExpiredMessage = true
        Message.error('登录已过期，请重新登录')
        setTimeout(() => {
          hasShownExpiredMessage = false
        }, 1000)
      }

      if (router.currentRoute.path !== '/login') {
        router.replace('/login')
      }
    }

    return Promise.reject(error)
  }
)

function getSessionUser() {
  const raw = sessionStorage.getItem('user')
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch (error) {
    sessionStorage.removeItem('user')
    return null
  }
}

function normalizeRole(role) {
  if (['admin', 'ADMIN', '管理员'].includes(role)) return 'admin'
  if (['clerk', 'CLERK', '制单员'].includes(role)) return 'clerk'
  return role
}

// Route guard for auth and role checks.
router.beforeEach((to, from, next) => {
  const user = getSessionUser()
  if (user && user.role) {
    user.role = normalizeRole(user.role)
  }

  if (to.path === '/login') {
    if (user) {
      next({ path: '/dashboard' })
    } else {
      next()
    }
    return
  }

  if (to.meta.requiresAuth && !user) {
    next({ path: '/login' })
  } else if (to.meta.roles && user && !to.meta.roles.includes(user.role)) {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

