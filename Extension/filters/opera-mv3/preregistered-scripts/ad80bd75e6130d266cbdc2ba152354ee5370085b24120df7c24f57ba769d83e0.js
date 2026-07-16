(function () {

    try {
        const ruleKey = "ad80bd75e6130d266cbdc2ba152354ee5370085b24120df7c24f57ba769d83e0"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{let t=!1;const i={apply:(i,n,a)=>{try{!t&&window.ytInitialData&&(window.ytInitialData=JSON.parse(JSON.stringify(window.ytInitialData)),t=!0)}catch(t){}return Reflect.apply(i,n,a)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,i)})();; /* replaced with rule source code */
    } catch (err) {}

})();
