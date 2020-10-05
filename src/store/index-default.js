/**
 * Created by demongao on 2017/3/20.
 */
/*
 初始化我们的Store
 */
import Vue from 'vue'
// import Vuex from 'vuex'
import Vuex from './vuex'

Vue.use(Vuex);
const state = {
    serverurl:'http://ip:port/level',
    map:{},
    article:{
        title:'title1',
        content:'content1',
        markdown:'markdown1',
        tag:'tag'
    }
}
const getters = {
    getterTitle(state){
        return state.title
    },
    getMarkdown(state){
        return state.markdown
    },
}
const actions = {
    action1(context) {
        setTimeout(()=>{
            context.commit("content",'content 1+1')
        },1000)

    },
    action2(context) {
        setTimeout(()=>{
            context.commit("content",'content 1+1')
        },1000)

        setTimeout(()=>{
            context.commit("content",'content 2+2')
        },2000)

    }
}
const modules = {
        child: {
            namespaced: true,
            state : {
                serverur2:'http://ip:port/leve2',
                map:{},
                article:{
                    title:'title2',
                    content:'content2',
                    markdown:'markdown2',
                    tag:'tag2',

                },
                count:1
            },
            getters : {
                getterChildTitle(state){
                    return state.title
                },
                getChildMarkdown(state){
                    return state.markdown
                },
            },
            actions : {
                actionChild1(context) {
                    setTimeout(()=>{
                        context.commit("increment",11)
                    },1000)

                },
                actionChild2(context) {
                    setTimeout(()=>{
                        context.dispatch("actionChild3",1000)
                    },1000)
                },
                actionChild3(context,payload) {
                    setTimeout(()=>{
                        context.commit("reduction",100)
                    },5000)

                    // setTimeout(()=>{
                    //     context.commit("content",'content 2+2')
                    // },2000)

                }
            },
            mutations: {
                increment (state, n) {
                    state.count += n
                },
                reduction(state, n){
                    state.count -= n
                }
            },
            modules: {
                grandChild: {
                    namespaced: false,
                    state : {
                        serverur2:'http://ip:port/leve3',
                        map:{},
                        article:{
                            title:'title3',
                            content:'content3',
                            markdown:'markdown3',
                            tag:'tag3'
                        }
                    },
                    getters : {
                        getterGrandTitle(state){
                            return state.title
                        },
                        getGrandMarkdown(state){
                            return state.markdown
                        },
                    },
                    actions : {
                        actionGrand1(context) {
                            setTimeout(()=>{
                                context.commit("content",'content 1+1')
                            },1000)

                        },
                        actionGrand2(context) {
                            setTimeout(()=>{
                                context.commit("content",'content 1+1')
                            },1000)

                            setTimeout(()=>{
                                context.commit("content",'content 2+2')
                            },2000)

                        }
                    },
                    modules:{
                        grandgrand:{
                            namespaced: true,
                            state : {
                                serverur2:'http://ip:port/leve4',
                                map:"map2",
                                article:{
                                    title:'title2',
                                    content:'content2',
                                    markdown:'markdown2',
                                    tag:'tag2'
                                },
                                title:'title2',
                                content:'content2',
                                markdown:'markdown2',
                            },
                            getters : {
                                getterGrandGrandTitle(state){
                                    console.log(state)
                                    return state.title
                                },
                                getGrandGrandMarkdown(state){
                                    console.log(state)
                                    return state.markdown
                                },
                            },
                            actions : {
                                actionGrandChild1(context) {
                                    setTimeout(()=>{
                                        context.commit("content",'content 1+1')
                                    },1000)

                                },
                                actionGrandChild2(context) {
                                    setTimeout(()=>{
                                        context.commit("content",'content 1+1')
                                    },1000)

                                    setTimeout(()=>{
                                        context.commit("content",'content 2+2')
                                    },2000)

                                }
                            },
                        }
                    }
                }
            }
        }
    }
;
export default new Vuex.Store({
    namespaced:true,
    getters,
    modules,
    state,
    actions
})
