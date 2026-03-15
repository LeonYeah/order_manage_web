import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import axios from 'axios'

Vue.use(ElementUI)

axios.defaults.baseURL = 'http://localhost:5000/api'
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if(token) config.headers.Authorization = token
  return config
})

// 路由守卫：检查登录和权限
router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user'))
  if(to.meta.requiresAuth && !user){
    next({ path:'/' })
  } else if(to.meta.roles && user && !to.meta.roles.includes(user.role)){
    next({ path:'/dashboard' }) // 没权限跳到首页
  } else {
    next()
  }
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')