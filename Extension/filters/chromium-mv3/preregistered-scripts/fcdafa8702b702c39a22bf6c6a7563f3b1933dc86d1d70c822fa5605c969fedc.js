(function () {

    try {
        const ruleKey = "fcdafa8702b702c39a22bf6c6a7563f3b1933dc86d1d70c822fa5605c969fedc"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const t={apply:(t,e,n)=>{if(location.href.includes("/shorts/")||location.href.includes("youtube.com/tv")||location.href.includes("youtube.com/embed/"))return Reflect.apply(t,e,n);try{const a=n[0];if(!a?.context?.client)return Reflect.apply(t,e,n);const o=String(Date.now());a.playbackContext&&void 0===a.playbackContext.adPlaybackContext&&(a.playbackContext.contentPlaybackContext.lactMilliseconds=o),a.playerRequest&&void 0===a.playerRequest.playbackContext?.adPlaybackContext&&(a.playerRequest.playbackContext.contentPlaybackContext.lactMilliseconds=o),n[0]=a}catch(t){}return Reflect.apply(t,e,n)}};window.JSON.stringify=new Proxy(window.JSON.stringify,t)})();; /* replaced with rule source code */
    } catch (err) {}

})();
