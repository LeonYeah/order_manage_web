<template>
  <div>
    <el-button type="primary" @click="addDialog = true">添加商品</el-button>
    <el-table :data="products" style="width:100%">
      <el-table-column prop="id" label="ID" width="50"/>
      <el-table-column prop="name" label="商品名称"/>
      <el-table-column prop="english_name" label="英文名称"/>
      <el-table-column prop="product_code" label="商品编号"/>
      <el-table-column prop="capacity" label="容量"/>
      <el-table-column prop="unit" label="单位"/>
    </el-table>

    <el-dialog title="添加商品" :visible.sync="addDialog">
      <el-form :model="form">
        <el-form-item label="名称"><el-input v-model="form.name"/></el-form-item>
        <el-form-item label="英文名"><el-input v-model="form.english_name"/></el-form-item>
        <el-form-item label="编号"><el-input v-model="form.product_code"/></el-form-item>
        <el-form-item label="容量"><el-input v-model="form.capacity"/></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit"/></el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="addDialog=false">取消</el-button>
        <el-button type="primary" @click="addProduct">添加</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data(){ return { products: [], addDialog:false, form:{ name:'', english_name:'', product_code:'', capacity:'', unit:'' } } },
  mounted(){ this.getProducts() },
  methods:{
    getProducts(){ axios.get('/products').then(res=>{ this.products = res.data }) },
    addProduct(){
      axios.post('/products', this.form).then(()=>{ this.addDialog=false; this.getProducts() })
    }
  }
}
</script>