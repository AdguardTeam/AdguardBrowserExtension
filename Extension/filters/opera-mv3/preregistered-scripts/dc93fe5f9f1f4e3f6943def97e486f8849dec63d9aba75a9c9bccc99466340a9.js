(function () {

    try {
        const ruleKey = "dc93fe5f9f1f4e3f6943def97e486f8849dec63d9aba75a9c9bccc99466340a9"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const e={apply:(e,r,t)=>{const n=t[0];if("string"==typeof n?.value&&n.value.includes("playerResponse"))try{n.value=(l=n.value,(location.href.includes("/watch")||l.includes("cards")&&!l.includes('"miniplayer"'))&&l.includes('"muteOnStart":true')&&(l=l.replace('"muteOnStart":true','"muteOnStart":false')).includes('"youThereRenderer":')&&(l=l.replace('"youThereRenderer":','"no_youThereRenderer":')),l.replace(/"(adSlots|playerAds)":/g,'"no_ads":')),t[0]=n}catch(e){}var l;return Reflect.apply(e,r,t)}},r={apply:(r,t,n)=>{const l=n[0];return"function"==typeof l&&l.toString().includes(".next(")&&(n[0]=new Proxy(l,e)),Reflect.apply(r,t,n)}};window.Promise.prototype.then=new Proxy(window.Promise.prototype.then,r)})();; /* replaced with rule source code */
    } catch (err) {}

})();
