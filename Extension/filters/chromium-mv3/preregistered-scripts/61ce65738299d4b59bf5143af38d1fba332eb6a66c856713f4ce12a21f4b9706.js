(function () {

    try {
        const ruleKey = "61ce65738299d4b59bf5143af38d1fba332eb6a66c856713f4ce12a21f4b9706"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const e={apply:(e,t,o)=>{const n=Reflect.apply(e,t,o);if(n?.responseContext)try{delete n.adSlots,delete n.playerAds,n.playerConfig?.audioConfig?.muteOnStart&&(location.href.includes("/watch")||n.cards&&!n.playabilityStatus?.miniplayer)&&(delete n.playerConfig.audioConfig.muteOnStart,n.messages[0]?.youThereRenderer&&delete n.messages[0].youThereRenderer)}catch(e){}return n}},t={apply:(t,o,n)=>{const r=n[0];return"function"==typeof r&&r.toString().includes("jspbResponseCtor")&&(n[0]=new Proxy(r,e)),Reflect.apply(t,o,n)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,t)})();; /* replaced with rule source code */
    } catch (err) {}

})();
