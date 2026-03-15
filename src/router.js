import Vue from 'vue'
import Router from 'vue-router'
import Login from './views/Login.vue'
import Dashboard from './views/Dashboard.vue'
import Users from './views/Users.vue'
import Products from './views/Products.vue'
import Orders from './views/Orders.vue'
import OrdersManagement from './views/OrdersManagement.vue'

Vue.use(Router)

export default new Router({
  routes:[
    { path:'/', component:Login },
    { path:'/dashboard', component:Dashboard, meta:{ requiresAuth:true } },
    { path:'/users', component:Users, meta:{ requiresAuth:true, roles:['admin'] } }, // 仅管理员可访问
    { path:'/products', component:Products, meta:{ requiresAuth:true } },
    { path:'/orders', component:Orders, meta:{ requiresAuth:true, roles:['clerk','admin'] } }, // 制单员/管理员可访问
    { path:'/orders-management', component:OrdersManagement, meta:{ requiresAuth:true, roles:['admin'] } } // 仅管理员
  ]
})