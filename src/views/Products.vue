<template>
  <div class="products-page">
    <div class="toolbar" v-if="canManageProducts">
      <el-button type="primary" @click="openAddDialog">添加商品</el-button>
      <el-button type="danger" :disabled="!selectedRows.length" :loading="deleting" @click="handleBatchDelete">
        删除商品
      </el-button>
    </div>

    <el-table
      :data="pagedProducts"
      style="width: 100%"
      @row-dblclick="handleRowDblClick"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column type="index" label="序号" width="70" :index="productIndexMethod" />
      <el-table-column prop="name" label="商品名称" />
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
      deleting: false,
      selectedRows: [],
      currentPage: 1,
      pageSize: 10,
      currentUser: JSON.parse(sessionStorage.getItem('user')) || {},
      form: createEmptyForm(),
      editForm: {
        id: null,
        ...createEmptyForm()
      }
    }
  },
  computed: {
    normalizedRole() {
      const role = this.currentUser.role
      if (['admin', 'ADMIN', '管理员'].includes(role)) return 'admin'
      if (['clerk', 'CLERK', '制单员'].includes(role)) return 'clerk'
      return role || ''
    },
    canManageProducts() {
      return ['admin', 'clerk'].includes(this.normalizedRole)
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
    openAddDialog() {
      if (!this.canManageProducts) return
      this.form = createEmptyForm()
      this.addDialog = true
    },
    addProduct() {
      if (!this.canManageProducts) return
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
    handleSelectionChange(selection) {
      this.selectedRows = selection || []
    },
    handleBatchDelete() {
      if (!this.canManageProducts) return
      const ids = this.selectedRows.map(item => item.id).filter(Boolean)
      if (!ids.length) {
        this.$message.warning('请先勾选要删除的商品')
        return
      }

      this.$confirm(`确认删除选中的 ${ids.length} 个商品吗？`, '提示', { type: 'warning' }).then(() => {
        this.deleting = true
        axios.post('/products/batch-delete', { ids })
          .then(res => {
            const count = res && res.data && res.data.deleted_count
            this.$message.success(typeof count === 'number' ? `已删除 ${count} 个商品` : '商品删除成功')
            this.selectedRows = []
            this.getProducts()
          })
          .catch(error => {
            const serverMessage = error && error.response && error.response.data && error.response.data.msg
            this.$message.error(serverMessage || '商品删除失败')
          })
          .finally(() => {
            this.deleting = false
          })
      }).catch(() => {})
    },
    handleRowDblClick(row) {
      if (!this.canManageProducts) return
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
      if (!this.canManageProducts) return
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
.products-page {
  padding: 8px 0;
}

.toolbar {
  margin-bottom: 12px;
  display: flex;
  gap: 10px;
}

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

