import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // Import CSS của Element Plus
import './style.css' // Import CSS chứa Tailwind của chúng ta
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia()) // Khởi tạo kho dữ liệu Pinia TRƯỚC Router
app.use(router)        // Khởi tạo bộ định hướng
app.use(ElementPlus)   // Khởi tạo thư viện UI

app.mount('#app')