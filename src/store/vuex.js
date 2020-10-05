var Vue

var Module = function (module) {
    this.state = module.state
    this.rawModule = module
    this._children = {}
    this.namespaced= module.namespaced
}

Module.prototype.addChild = function (key,moduleS) {
    this._children[key] = moduleS
}

Module.prototype.getChild = function (key) {
    return this._children[key]
}

Module.prototype.forEachGetters = function (fn) {
    var getters = this.rawModule.getters
    if (getters){
        forEachValue(getters,fn)
    }
}

Module.prototype.forEachActions = function (fn) {
    var actions = this.rawModule.actions
    if (actions){
        forEachValue(actions,fn)
    }
}

Module.prototype.forEachMutations = function (fn) {
    var mutations = this.rawModule.mutations
    if (mutations){
        forEachValue(mutations,fn)
    }
}

function forEachValue(obj,fn) {
    Object.keys(obj).forEach(key=>{
        fn(obj[key],key)
    })
}
//getters的value不能是数组，mutation和actions是数组
function registerGetters(store,namespaceType,getter,local) {
    store._getters = store._getters||{}
    store._getters[namespaceType] = function (store) {
        return getter(
            local.state,
            local.getters,
            store.state,
            store._getters
        )
    }
}

function registerMutations(store,namespaceType,mutation,local) {
    store._mutations = store._mutations||{}
    store._mutations[namespaceType] = store._mutations[namespaceType]||[]
    store._mutations[namespaceType].push(function (payload) {
        mutation.call(store,local.state,payload)
    })
}

function registerActions(store,namespaceType,action,local) {
    // checkout ({ commit, state }, products)
    store._actions = store._actions||{}
    store._actions[namespaceType] = store._actions[namespaceType]||[]
    store._actions[namespaceType].push(function (payload) {
        var res = action.call(store,{
            dispatch: local.dispatch,
            commit: local.commit,
            getters: local.getters,
            state: local.state,
            rootGetters: store.getters,
            rootState: store.state
        },payload)
        if(!res||typeof res !== 'function'){
            res = Promise.resolve(res)
        }
        return res
    })
}

var ModuleCollection = function (rawRootModule) {
    this.register([],rawRootModule)
}

ModuleCollection.prototype.register = function (path,rootModule) {
    var newModule = new Module(rootModule)
    if(path.length===0){
        this.root = newModule
    }  else{
        var parent = path.slice(0,-1).reduce((pre,cur)=>{
            return pre.getChild(cur)
        },this.root)
        parent.addChild(path[path.length-1],newModule)
    }

    if(rootModule&&rootModule.modules){
        for(let key in rootModule.modules){
            let module = rootModule.modules[key]
            this.register(path.concat(key),module)
        }
    }
}

ModuleCollection.prototype.getNamespace = function (path) {
    let namespace = ""
    let module = this.root//moduleS
    namespace = path.reduce((pre,cur)=>{
        module = module.getChild(cur)
        if(module.namespaced){
            return pre+cur+"/"
        }else{
            return pre
        }
    },"")
    return namespace
}


ModuleCollection.prototype.getNestedState = function (path) {
    let module = this.root//moduleS
    let m = path.reduce((pre,cur)=>{
        module = module.getChild(cur)
        return module
    },module)
    return m.state
}



var _Store = function (options) {
    var {
        mutations,
        modules,
        namespaced,
        actions,
        getters
    } = options
    this._actions = Object.create(null)
    this._getters = Object.create(null)
    this._mutations = Object.create(null)
    this.nameSpaceModules
        = Object.create(null)
    this._modules = new ModuleCollection(options)
    console.log(this._modules)
    this.state = this._modules.root.state
    this.getters = this._getters

    installModule(this, this.state, [], this._modules.root);
    //this._modules.root是moduleS
    var computed = {};
    var _this = this
    forEachValue(this.getters ,  (fn, key) =>{
        // use computed to leverage its lazy-caching mechanism
        // direct inline function use will lead to closure preserving oldVm.
        // using partial to return function with only arguments preserved in closure environment.
        computed[key] = partial(fn, this);
        Object.defineProperty(this.getters, key, {
            get: function () { return _this._vm[key]; },
            enumerable: true // for local getters
        });
    });

    // use a Vue instance to store the state tree
    // suppress warnings just in case the user has added
    // some funky global mixins
    Vue.config.silent = true;
    this._vm = new Vue({
        data: {
            $$state: _this.state
        },
        computed: computed
    });
}

function partial (fn, arg) {
    return function () {
        return fn(arg)
    }
}

_Store.prototype.dispatch = function (_type,_payload,_options) {
    let actionsList = this._actions[_type]
    let list = actionsList.map(fn=>(fn(_payload)))
    var res = Promise.all(list)
    return new Promise((resolve,reject)=>{
        res.then(function (res) {
           resolve(res)
        },function (err) {
            reject(err)
        })
    })
}

_Store.prototype.commit = function (_type,_payload,_options) {
    let mutations = this._mutations[_type]
    mutations && mutations.forEach(fn=>fn(_payload))
}

function makeLocalContext(store,moduleS,namespace) {
    let noNamespace = namespace === ''

    let local = {
        dispatch:noNamespace?store.dispatch:function (_type,_payload) {
            // return function (_type,_payload) {
                let type = namespace + _type;
                return store.dispatch.call(store,type,_payload)
            // }
        },
        commit:noNamespace?store.commit:function (_type,_payload) {
            let type = namespace + _type;
            // return function (_type,_payload) {
                return store.commit.call(store,type,_payload)
            // }
        }
    }
    Object.defineProperty(local,'getters',{
        get:function () {
            return noNamespace?store.getters:moduleS.rawModule.getters
        }
    })
    Object.defineProperty(local,'state',{
        get:function () {
            return noNamespace?store.state:moduleS.state
        }
    })
    return local
    //这个方法最重要就是返回的state和getters都是自己模块下的局部
}
//  installModule主要做的是 给 state建立父子关系，用Vue.set的方式
//  把namespace的moduleS放进list里面
function installModule(store, state, path, moduleS) {
    var _this = store
    var isRoot = path.length === 0
    var namespace = _this._modules.getNamespace(path)
    if(moduleS.namespaced){
        _this._modulesNamespaceMap = _this._modulesNamespaceMap||{}
        _this._modulesNamespaceMap[namespace] = moduleS
    }
    //如果是root的话，state是没有父级的
    // var parentState = _this._modules.getNestedState(path)
    if(!isRoot){
        var parentState = _this._modules.getNestedState(path.slice(0,-1))
        var i = (path.length-1)
        var key = path[i]
        Vue.set(parentState,key,state)
    }
    var local = moduleS.context = makeLocalContext(store,moduleS,namespace)

    moduleS.forEachGetters(function (getter,key) {
        let namespaceType = namespace+key
        registerGetters(store,namespaceType,getter,local)
    })
    moduleS.forEachMutations(function (mutation,key) {
        let namespaceType = namespace+key
        registerMutations(store,namespaceType,mutation,local)
    })
    moduleS.forEachActions(function (action,key) {
        let namespaceType = namespace+key
        registerActions(store,namespaceType,action,local)
    })
    // console.log(local.getters)
    //把getters放进_getters里面


    //递归放在最后
    if(moduleS._children){
        //(moduleS._children 也是moduleS类型的
        for(let key in moduleS._children){
            let modules = moduleS._children[key]
            installModule(store, modules.state, path.concat(key), modules)
        }
    }
}

function normalizeNameSpace(fn) {
    return function (namespace,map) {
        if(typeof namespace !== "string"){
            map = namespace
            namespace = ''
        }else{
            if(namespace.charAt(namespace.length-1)!=='/'){
                namespace += '/'
            }
        }
        return fn(namespace,map)
    }
}

/*
* ...mapState({
    a: state => state.some.nested.module.a,
    b: state => state.some.nested.module.b
  })
* */
function normalizeMap(states) {
    if(Array.isArray(states)){
        return states.map((key)=>({
            val: key,
            key: key
        }))
    }else{
        return Object.keys(states).map(key=>({
            val:states[key],
            key:key,
        }))
    }
}

// mapState(namespace?: string, map: Array<string> | Object<string | function>): Object
var mapState = normalizeNameSpace(function (namespace,states) {
    var res = {}
    normalizeMap(states).forEach(function(ref){
        let val = ref.val
        let key = ref.key
        res[key] = function () {
            var state = this.$store.state
            var getters = this.$store.getters
            if(namespace!==''){
                let moduleS = this.$store._modulesNamespaceMap[namespace]
                if(!moduleS){
                    return
                }
                state = moduleS.context.state
                getters = moduleS.context.getters
            }
            console.log(state)
            return typeof val === 'function'?val.call(this,state):state[val]
        }
    })
    return res
})


var mapActions = normalizeNameSpace(function (namespace,actions) {
    var res = {}
    normalizeMap(actions).forEach(function(ref){
        let val = ref.val
        let key = ref.key
        res[key] = function () {
            var args = []
            var len = arguments.length
            while(len--){
                args[len] = arguments[len]
            }

            var state = this.$store.state
            var getters = this.$store.getters
            var dispatch = this.$store.dispatch
            if(namespace!==''){
                let moduleS = this.$store._modulesNamespaceMap[namespace]
                if(!moduleS){
                    return
                }
                state = moduleS.context.state
                getters = moduleS.context.getters
                dispatch = moduleS.context.dispatch
            }
            return typeof val === 'function'?val.apply(this,[dispatch].concat(val)):
                dispatch.apply(this,[val].concat(args))
        }
    })
    return res
})

var mapMutations = normalizeNameSpace(function (namespace,mutations) {
    var res = {}
    normalizeMap(mutations).forEach(ref=>{
        let val = ref.val
        let key = ref.key
        res[key] = function (state,payload) {
            var args = []
            var len = arguments.length
            while(len--){
                args[len] = arguments[len]
            }

            var state = this.$store.state
            var getters = this.$store.getters
            var commit = this.$store.commit
            if(namespace!==''){
                let moduleS = this.$store._modulesNamespaceMap[namespace]
                if(!moduleS){
                    return
                }
                state = moduleS.context.state
                getters = moduleS.context.getters
                commit = moduleS.context.commit
            }
            return typeof val === 'function'?val.apply(this,state.concat(val)):
                commit.apply(this.$store,[val].concat(args))
        }
    })
    return res
})

var mapGetters = normalizeNameSpace(function (namespace,getters) {
    var res = {}
    normalizeMap(getters).forEach(function(ref){
        let val = ref.val
        let key = ref.key
        res[key] =  function () {
            // var args = []
            // var len = arguments.length
            // while(len--){
            //     args[len] = arguments[len]
            // }

            var state = this.$store.state
            var getters = this.$store.getters
            val = namespace + val;
            // console.log(this.$store.getters[val])
            return this.$store.getters[val]
        }
    })
    return res
})

    function install(_Vue){
        if(Vue&&Vue===_Vue){
            return
        }
        Vue = _Vue
        Vue.mixin({
            beforeCreate(){
                console.log(this)
                let options = this.$options
                if( options&& options.store){
                    this._root = this
                    this.$store = options.store
                }else if(options.parent && options.parent.$store){
                    this.$store = options.parent.$store
                }
            }
        })
    }

var index_cjs = {
    Store: _Store,
    install: install,
    version: '3.5.1',
    mapState: mapState,
    mapMutations: mapMutations,
    mapGetters: mapGetters,
    mapActions: mapActions
};

module.exports = index_cjs;

// 1.	注册store的时候，已经将wrapGetter里面的所有的getters注册到computed上面了，initcomputed同时会把key绑定在vm上面，这样每次get key的时候，就是这个getter的函数，也就是function(){return rawGetter()}
// 并且把每次调用store.getters[key]直接用这个vm上面，也就是上面的getter函数.这个vm对象和下面的页面子组件的vm并不是同一个，用_vm和vm区分
// 2.	组件里的mapgetter里面会获得nametype对应的fn，这个fn this.$store.getters[val]的调用会直接获取上面定义的对应key的值
