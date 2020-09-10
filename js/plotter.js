//浏览器
var browser = (function(){
    var ua = navigator.userAgent;
    var doc = document;
    var win = window;
    var data = /** @lends browser */ {
        /**
         * 是否是iphone
         * @type {Boolean}
         */
        iphone: /iphone/i.test(ua),

        /**
         * 是否是ipad
         * @type {Boolean}
         */
        ipad: /ipad/i.test(ua),

        /**
         * 是否是ipod
         * @type {Boolean}
         */
        ipod: /ipod/i.test(ua),

        /**
         * 是否是ios
         * @type {Boolean}
         */
        ios: /iphone|ipad|ipod/i.test(ua),

        /**
         * 是否是android
         * @type {Boolean}
         */
        android: /android/i.test(ua),

        /**
         * 是否是webkit
         * @type {Boolean}
         */
        webkit: /webkit/i.test(ua),

        /**
         * 是否是chrome
         * @type {Boolean}
         */
        chrome: /chrome/i.test(ua),

        /**
         * 是否是safari
         * @type {Boolean}
         */
        safari: /safari/i.test(ua),

        /**
         * 是否是firefox
         * @type {Boolean}
         */
        firefox: /firefox/i.test(ua),

        /**
         * 是否是ie
         * @type {Boolean}
         */
        ie: /msie/i.test(ua),

        /**
         * 是否是opera
         * @type {Boolean}
         */
        opera: /opera/i.test(ua)
    };
    data.jsVendor = data.webkit ? 'webkit' : data.firefox ? 'webkit' : data.opera ? 'o' : data.ie ? 'ms' : '';
    return data;
})();
//定时器
/*
    控制间隔执行
    管理所有ticker方法
*/
function Ticker(){
    this.tickers = [];
    this.intervalId = null;
    //状态
    this._useRAF = false;
    this._paused = false;
};
Ticker.prototype = {
    constructor : Ticker,
    start : function (interval){
        var _this = this;
        if(_this.intervalId){
            _this.stop();
        }
        var runLoop;
        var raf = window.requestAnimationFrame || window[browser.jsVendor + 'RequestAnimationFrame'];
        interval = typeof interval != 'number' ? 16 : interval;
        if(interval > 17 || !raf){
            runLoop = function(){
                _this.tick();
                _this.intervalId = setTimeout(runLoop,interval);
            }
        }else{
            _this._useRAF = true;
            runLoop = function(){
                _this.tick();
                _this.intervalId = raf(runLoop);
            }
        }
        runLoop();
    },
    pause : function (){
        this._paused = true;
    },
    resume : function (){
        this._paused = false;
    },
    stop : function (){
        var _this = this;
        if(_this._useRAF){
            var cancelRAF = window.cancelAnimationFrame || window[browser.jsVendor + 'CancelAnimationFrame'];
            cancelRAF(_this.intervalId);
        }else{
            clearTimeout(_this.intervalId);
        }
        _this.intervalId = null;
    },
    tick : function (){
        var _this = this;
        if(_this._paused || !_this.tickers.length){ return }
        //遍历执行
        for(var i = 0,len = _this.tickers.length; i < len; i++){
            _this.tickers[i]();
        }
    },
    addTicker : function (ticker){
        var _this = this;
        if(typeof ticker != 'function'){ return }
        _this.tickers.push(ticker);
    },
    removeTicker : function (ticker){
        var _this = this;
        var index = _this.tickers.indexOf(ticker);
        if(index < 0){ return }
        _this.tickers.splice(index,1);
    }
};
//舞台
/*
    创建画布
    管理子集
    调用子集绘制
*/
function Stage(){
    this.children = [];
    this.eventGroup = [];
    this.minIndex = -100000;
};
Stage.prototype = {
    constructor : Stage,
    create : function (options){
        var _this = this;
        _this.canvas = document.createElement('canvas');
        _this.canvas.width = options.width;
        _this.canvas.height = options.height;
        _this.ctx = _this.canvas.getContext('2d');
        //插入
        options.container.appendChild(_this.canvas);
    },
    //插入子集
    addChild : function (child){
        var _this = this;
        if(typeof child != 'object'){ return }
        //子集绑定事件
        _this.crossChild(child);
    },
    //融合子集
    crossChild : function (child){
        var _this = this;
        //设置父级
        child.parent = _this.children;
        //设置zIndex
        if(typeof child.zIndex != 'number'){
            _this.minIndex ++;
        }
        child.zIndex = typeof child.zIndex != 'number' ? _this.minIndex  : child.zIndex;
        //设置canvas
        child.canvas = _this.canvas;
        child.ctx = _this.ctx;
        //添加删除方法
        child.remove = function(){
            var _self = this;
            var index = _self.parent.indexOf(_self); 
            _self.parent.splice(index,1);
        }
        //插入
        _this.children.push(child);
    },
    //绘制
    getDrawData : function (){
        var _this = this;
        if(!_this.children.length){ return null }
        var data = _this.children.slice();
        //进行zIndex排序
        data.sort(function(a,b){
            return a.zIndex - b.zIndex;
        });
        return data;
    },
    clear : function (){
        var _this = this;
        _this.ctx.clearRect(0,0,_this.canvas.width,_this.canvas.height);
    },
    //绘制
    draw : function (){
        var _this = this;
        var data = _this.getDrawData();
        if(!data){ return }
        //清除画布
        _this.clear();
        for(var i = 0,len = data.length; i < len; i++){
            _this.ctx.save();
            typeof data[i].render == 'function' && data[i].render();
            _this.ctx.restore();
        }
    },
    //获取事件参数
    getEventOption : function (args){
        var event = {
            type : typeof args[0] == 'string' ? args[0] : null,
            target : typeof args[1] == 'function' ? null : args[1],
            fn :  typeof args[1] == 'function' ? args[1] : ( typeof args[2] == 'function' ? args[2] : null )
        };
        
        return event;
    },
    //绑定事件
    on : function (){
        var args = [].slice.call(arguments);
        this.bindEve(this.addEventGroup(this.getEventOption(args)));
    },
    //添加事件组
    addEventGroup : function (event){
        if(!event.fn || !event.type){ return null }
        this.eventGroup.push(event);
        return event;
    },
    //绑定事件
    bindEve : function (event){
        if(!event){ return }
        event.listenerEve = this.createListenerEve(event);
        this.canvas.addEventListener(event.type,event.listenerEve);
    },
    //创建监听事件
    createListenerEve : function (event){
        return (e) => {
            event.fn.call(this,e);
        }
    },
    //查询命中目标
    getEventTarget : function (e){
 
    },
    //关闭事件
    off : function (){
        var args = [].slice.call(arguments);
        this.removeEve(this.removeEventGroup(this.getEventOption(args)));
    },
    //删除事件组
    removeEventGroup : function (event){
        var eventGroup = [];
        for(var i = 0,len = this.eventGroup.length; i < len; i++){
            var e = this.eventGroup[i];
            if(event.type != e.type || event.target != e.target){ continue }
            if(!event.fn || event.fn == e.fn){
                eventGroup.push(this.eventGroup.splice(i,1)[0]);
                i --;
                len --;
            }
        }
        return eventGroup;
    },
    //删除事件
    removeEve : function (events){
        if(!events || !events.length){ return }
        events.forEach((v) => {
            this.canvas.removeEventListener(v.type,v.listenerEve);
        })
    }
};
