(function () {

    try {
        const ruleKey = "37b369fd8055940fcec359a75a531455727ead213968a9b49af9c12e43c203cc"; /* replaced with JSON.stringify(ruleHash) */
        if (_ag.b.has(ruleKey)) {
            return;
        }
        _ag.b.add(ruleKey);
        (()=>{const e={apply:(e,t,n)=>{const o=Reflect.apply(e,t,n);try{o instanceof HTMLIFrameElement&&"about:blank"===o.src&&o.contentWindow&&(o.contentWindow.fetch=window.fetch,o.contentWindow.Request=window.Request)}catch(e){}return o}};Node.prototype.appendChild=new Proxy(Node.prototype.appendChild,e)})();; /* replaced with rule source code */
    } catch (err) {}

})();
