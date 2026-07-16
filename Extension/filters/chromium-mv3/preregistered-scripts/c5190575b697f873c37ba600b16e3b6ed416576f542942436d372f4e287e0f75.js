(function () {

    try {
        const ruleKey = "c5190575b697f873c37ba600b16e3b6ed416576f542942436d372f4e287e0f75"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const t=Function.prototype.call;let e=!1,o=!1,n=!1;const c={apply:(c,r,a)=>{const i=a[0];if(i?.requestNumber&&i?.snapshot)try{o=((t,e=5)=>{if("object"!=typeof t||null===t)return!1;const o=new Array(1e3);let c=0;const r=new WeakSet;for(o[c++]={obj:t,depth:0};c>0&&!n;){const{obj:t,depth:a}=o[--c];if(a>e||"object"!=typeof t||null===t||r.has(t))continue;let i;r.add(t);try{i=Object.hasOwn(t,"backoffTimeMs")}catch(t){}if(i)return void 0!==t.backoffTimeMs||(n=!0,!1);for(const e in t)if(Object.hasOwn(t,e)){let n;try{n=t[e]}catch(t){}null!==n&&"object"==typeof n&&!r.has(n)&&c<o.length&&(o[c++]={obj:n,depth:a+1})}}return!1})(i),e=!0,(o||n)&&(Function.prototype.call=t)}catch(t){}return Reflect.apply(c,r,a)}};window.Function.prototype.call=new Proxy(window.Function.prototype.call,c);window.addEventListener("load",(async()=>{if(Function.prototype.call=t,!o&&e)return;const n=window.location.search,c=new URLSearchParams(n).get("v");if(!c)return;const r=await(a="#movie_player",i=200,l=1e4,new Promise((t=>{if(!a||!i||!l)return void t(null);const e=Date.now()+l,o=()=>{const n=document.querySelector(a);n?t(n):Date.now()>e?t(null):setTimeout(o,i)};o()})));var a,i,l;if(!r)return;const s=new URLSearchParams(n).get("t")??"0",u=parseInt(s,10);if("function"==typeof r.loadVideoById&&!location.search.includes("&rco="))try{r.loadVideoById(c,u)}catch(t){}}))})();; /* replaced with rule source code */
    } catch (err) {}

})();
