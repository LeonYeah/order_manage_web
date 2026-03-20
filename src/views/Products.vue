<template>
  <div>
    <el-button v-if="isAdmin" type="primary" @click="addDialog = true">添加商品</el-button>
    <el-table :data="pagedProducts" style="width:100%" @row-dblclick="handleRowDblClick">
      <el-table-column type="index" label="序号" width="70" :index="productIndexMethod" />
      <el-table-column prop="name" label="商品名称" />
      <el-table-column prop="english_name" label="英文名称" />
      <el-table-column prop="product_code" label="商品编号" />
      <el-table-column prop="capacity" label="容量" />
      <el-table-column prop="unit" label="单位" />
    </el-table>
    <div class="pagination-wrap">
      <div class="page-tip">第 {{ currentPage }} / {{ totalProductPages }} 页</div>
      <el-pagination
        background
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalProducts"
        layout="prev, pager, next, jumper"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog title="添加商品" :visible.sync="addDialog">
      <el-form :model="form">
        <el-form-item label="名称"><el-input v-model.trim="form.name" /></el-form-item>
        <el-form-item label="英文名"><el-input v-model.trim="form.english_name" /></el-form-item>
        <el-form-item label="编号"><el-input v-model.trim="form.product_code" /></el-form-item>
        <el-form-item label="容量"><el-input v-model.trim="form.capacity" /></el-form-item>
        <el-form-item label="单位"><el-input v-model.trim="form.unit" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addDialog = false">取消</el-button>
        <el-button type="primary" @click="addProduct">添加</el-button>
      </div>
    </el-dialog>

    <el-dialog title="修改商品" :visible.sync="editDialog">
      <el-form :model="editForm">
        <el-form-item label="名称"><el-input v-model.trim="editForm.name" /></el-form-item>
        <el-form-item label="英文名"><el-input v-model.trim="editForm.english_name" /></el-form-item>
        <el-form-item label="编号"><el-input v-model.trim="editForm.product_code" /></el-form-item>
        <el-form-item label="容量"><el-input v-model.trim="editForm.capacity" /></el-form-item>
        <el-form-item label="单位"><el-input v-model.trim="editForm.unit" /></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitEdit">提交修改</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

function createEmptyForm() {
  return {
    name: '',
    english_name: '',
    product_code: '',
    capacity: '',
    unit: ''
  }
}

export default {
  data() {
    return {
      products: [],
      addDialog: false,
      editDialog: false,
      submitting: false,
      currentPage: 1,
      pageSize: 10,
      currentUser: JSON.parse(localStorage.getItem('user')) || {},
      form: createEmptyForm(),
      editForm: {
        id: null,
        ...createEmptyForm()
      }
    }
  },
  computed: {
    isAdmin() {
      return ['admin', 'ADMIN', '管理员'].includes(this.currentUser.role)
    },
    totalProducts() {
      return this.products.length
    },
    totalProductPages() {
      return Math.max(1, Math.ceil(this.totalProducts / this.pageSize))
    },
    pagedProducts() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.products.slice(start, start + this.pageSize)
    }
  },
  mounted() {
    this.getProducts()
  },
  methods: {
    getProducts() {
      axios.get('/products').then(res => {
        this.products = res.data || []
        this.currentPage = 1
      }).catch(() => {
        this.$message.error('商品列表加载失败')
      })
    },
    addProduct() {
      if (!this.form.name) {
        this.$message.error('请输入商品名称')
        return
      }
      axios.post('/products', this.form).then(() => {
        this.$message.success('商品添加成功')
        this.addDialog = false
        this.form = createEmptyForm()
        this.getProducts()
      }).catch(error => {
        const serverMessage = error && error.response && error.response.data && error.response.data.msg
        this.$message.error(serverMessage || '商品添加失败')
      })
    },
    handleRowDblClick(row) {
      if (!this.isAdmin) return
      this.editForm = {
        id: row.id,
        name: row.name || '',
        english_name: row.english_name || '',
        product_code: row.product_code || '',
        capacity: row.capacity || '',
        unit: row.unit || ''
      }
      this.editDialog = true
    },
    submitEdit() {
      if (!this.isAdmin) return
      if (!this.editForm.name) {
        this.$message.error('请输入商品名称')
        return
      }

      this.submitting = true
      axios.put(`/products/${this.editForm.id}`, this.editForm).then(() => {
        this.$message.success('商品修改成功')
        this.editDialog = false
        this.getProducts()
      }).catch(error => {
        const serverMessage = error && error.response && error.response.data && error.response.data.msg
        this.$message.error(serverMessage || '商品修改失败')
      }).finally(() => {
        this.submitting = false
      })
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    productIndexMethod(index) {
      return (this.currentPage - 1) * this.pageSize + index + 1
    }
  }
}
</script>

<style scoped>
.pagination-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-tip {
  font-size: 13px;
  color: #606266;
}
</style>
