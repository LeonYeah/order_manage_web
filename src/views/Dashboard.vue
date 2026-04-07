<template>
  <div class="dashboard-page">
    <el-card shadow="never">
      <div slot="header">
        <h2 class="dashboard-title">首页</h2>
      </div>

      <el-alert
        v-if="reminderOrders.length"
        :title="reminderTitle"
        type="warning"
        :closable="false"
        show-icon
        class="dashboard-alert"
      >
        <div class="dashboard-reminders">
          <div v-for="item in reminderOrders" :key="item.id" class="dashboard-reminder">
            <span>{{ item.order_number }}</span>
            <span>{{ item.customer_name }}</span>
            <span v-if="isAdmin">{{ item.clerk_name || '-' }}</span>
            <span>剩余 {{ item.settlement_remind_days_left }} 天</span>
          </div>
        </div>
      </el-alert>

      <el-alert
        v-if="rejectedOrders.length"
        :title="rejectedTitle"
        type="error"
        :closable="false"
        show-icon
        class="dashboard-alert"
      >
        <div class="dashboard-reminders">
          <div v-for="item in rejectedOrders" :key="item.id" class="dashboard-reminder dashboard-reminder-rejected">
            <span>{{ item.order_number }}</span>
            <span>{{ item.customer_name }}</span>
            <span v-if="isAdmin">{{ item.clerk_name || '-' }}</span>
            <span>{{ item.reject_reason || '存在驳回原因待处理' }}</span>
          </div>
        </div>
      </el-alert>

      <div v-if="isAdmin">
        <p class="dashboard-desc">当前为管理员视图，可管理用户和全部订单。</p>
        <div class="action-list">
          <el-button type="primary" @click="$router.push('/users')">进入用户管理</el-button>
          <el-button @click="$router.push('/orders-management')">进入订单管理</el-button>
          <el-button @click="$router.push('/checkout-review')">进入反结账管理</el-button>
          <el-button @click="$router.push('/draft-box')">进入草稿箱</el-button>
        </div>
      </div>

      <div v-else>
        <p class="dashboard-desc">当前为制单员视图，可创建订单并查看自己的单据。</p>
        <div class="action-list">
          <el-button type="primary" @click="$router.push('/orders')">去制单</el-button>
          <el-button @click="$router.push('/orders-management')">查看订单管理</el-button>
          <el-button @click="$router.push('/checkout-review')">查看反结账管理</el-button>
          <el-button @click="$router.push('/draft-box')">查看草稿箱</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Dashboard',
  data() {
    return {
      currentUser: JSON.parse(sessionStorage.getItem('user')) || {},
      reminderOrders: [],
      rejectedOrders: []
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    },
    reminderTitle() {
      return this.isAdmin
        ? `全部未结账提醒：${this.reminderOrders.length} 单`
        : `我的未结账提醒：${this.reminderOrders.length} 单`
    },
    rejectedTitle() {
      return this.isAdmin
        ? `全部被驳回单据：${this.rejectedOrders.length} 单`
        : `我的被驳回单据：${this.rejectedOrders.length} 单`
    }
  },
  mounted() {
    this.getReminderOrders()
    this.getRejectedOrders()
  },
  methods: {
    getReminderOrders() {
      axios.get('/orders', {
        params: {
          reminder_only: true
        }
      }).then(res => {
        this.reminderOrders = res.data || []
      }).catch(() => {
        this.reminderOrders = []
      })
    },
    getRejectedOrders() {
      axios.get('/orders/review', {
        params: {
          review_status: '驳回'
        }
      }).then(res => {
        this.rejectedOrders = res.data || []
      }).catch(() => {
        this.rejectedOrders = []
      })
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

.dashboard-alert {
  margin-bottom: 20px;
}

.dashboard-reminders {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.dashboard-reminder {
  display: inline-flex;
  gap: 8px;
  padding: 6px 10px;
  background: #fff7e6;
  border: 1px solid #f5dab1;
  border-radius: 6px;
}

.dashboard-reminder-rejected {
  background: #fef0f0;
  border-color: #fbc4c4;
}

.action-list .el-button + .el-button {
  margin-left: 12px;
}
</style>
