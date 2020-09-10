function Magpie(){}
//加载
Magpie.loadResources = function(resources,fn){
    var result = [];
    function callback(){
        if(len == 0){
            typeof fn == 'function' && fn(result);
        }
    };
    function loadImg(resource,i){
        var img = new Image();
        img.onload = function(){
            result[i]['state'] = 'success';
            len --;
            callback();
        };
        img.onerror = function(){
            result[i]['state'] = 'fail';
            len --;
            callback();
        };
        result[i] = {
            content : img,
            src : resource.src,
            name : resource.name
        };
        img.src = resource.src;
    };
    for(var i = 0,len = resources.length; i < len; i++){
        loadImg(resources[i],i);
    }
};
//查询
Magpie.findResourceByName = function(name,resources){
    var result = [];
    resources.forEach(function(v){
        if(name == v.name){
            result.push(v);
        }
    });
    return result.length ? result : null;
};