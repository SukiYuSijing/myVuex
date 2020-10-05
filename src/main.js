import Vue from 'vue'
/*管理全局变量*/
import store from './store/index-default'				//vuex
//引入element ui库
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'

import App from './App'
// import 'animate.css'    //引入 Animate.css 动画库

Vue.use(ElementUI)


new Vue({
  el: '#app',
  // router,//路由
  store,//vuex
  render: h =>h(App)
})
