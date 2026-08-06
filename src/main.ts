import { createApp } from 'vue'
import { createPinia } from 'pinia'

import '@/assets/design-tokens.css'
import '@/composables/useTheme'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
