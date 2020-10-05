<template>
  <div>
    <div>{{article}}</div>
    <div>{{serverurl}}</div>
    <div>{{map}}</div>
    <div>{{serverur2}}</div>
    <el-button @click='increase1'>点击</el-button>
    <div>count {{count}}</div>
    <div>countN {{countN}}</div>
  </div>
</template>

<script>
import {mapMutations,mapActions,mapGetters,mapState} from './store/vuex.js'
export default {
  data(){
      return{
          getterTitleV:"",
          getMarkdownV:""
      }
  },
  mounted(){
      // console.log(this.actionChild1())//mapactions里的函数执行后返回promise对象
      this.$store.dispatch('child/actionChild1').then(res=> this.$store.dispatch('child/actionChild2'))
      this.actionChild1().then(res=> this.actionChild2())
  },
  methods:{
    ...mapMutations('child',{
        incrementN: 'increment'// 将 `this.increase()` 映射为 `this.$store.commit('increase')`
    }),
    ...mapMutations('child',{
        reductionN: 'reduction'// 将 `this.increase()` 映射为 `this.$store.commit('increase')`
    }),
      ...mapMutations('child',['increment']),
      increase1(id){
        this.incrementN(1)
        this.increment(1)
        this.reductionN(2)
          this.actionChild1()
      },
      ...mapActions('child', ['actionChild1','actionChild2']),
      ...mapActions('child', {
          login (dispatch) {
              dispatch('actionChild1', this)
          }
      })
  },
  computed:{
      ...mapState({
            count: state  => state.child.count
      }),
      ...mapState('child',{
          countN: state => state.count
      }),
      ...mapState('child/grandgrand',[
          'map',
          'serverur2'
      ]),
      ...mapState('child/grandgrand',{
          'map':state=>state.map
      }),
      ...mapGetters([
          'getterTitle',
          'getMarkdown'
      ]),
      ...mapGetters('child/grandgrand',[
          'getterGrandGrandTitle',
      ]),
  }
}
</script>
