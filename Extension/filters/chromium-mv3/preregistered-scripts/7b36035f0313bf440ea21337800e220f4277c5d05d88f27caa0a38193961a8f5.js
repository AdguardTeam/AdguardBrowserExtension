(function () {

    try {
        const ruleKey = "7b36035f0313bf440ea21337800e220f4277c5d05d88f27caa0a38193961a8f5"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const t={apply:(t,o,n)=>{const e=n[0];return"function"==typeof e&&e.toString().includes("onAbnormalityDetected")&&(n[0]=function(){}),Reflect.apply(t,o,n)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();; /* replaced with rule source code */
    } catch (err) {}

})();
