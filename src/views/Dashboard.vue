<template>
  <div class="dashboard-page">
    <el-card shadow="never">
      <div slot="header">
        <h2 class="dashboard-title">首页</h2>
      </div>

      <div v-if="currentUser.role === 'admin'">
        <p class="dashboard-desc">当前为管理员视图，可以管理用户、商品和全部订单。</p>
        <div class="action-list">
          <el-button type="primary" @click="$router.push('/users')">进入用户管理</el-button>
          <el-button @click="$router.push('/orders-management')">进入订单管理</el-button>
          <el-button @click="$router.push('/products')">进入商品管理</el-button>
        </div>
      </div>

      <div v-else>
        <p class="dashboard-desc">当前为制单员视图，可以创建订单并查看自己制作的单据。</p>
        <div class="action-list">
          <el-button type="primary" @click="$router.push('/orders')">去制单</el-button>
          <el-button @click="$router.push('/products')">查看商品</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      currentUser: JSON.parse(localStorage.getItem('user')) || {}
    }
  }
}
</script>

<style scoped>
.dashboard-title {
  margin: 0;
}

.dashboard-desc {
  margin: 0 0 20px;
  color: #606266;
}

.action-list .el-button + .el-button {
  margin-left: 12px;
}
</style>
