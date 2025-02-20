// one more script
const l = !!window.MSInputMethodContext && !!document.documentMode,
    e = "active",
    s = document.querySelectorAll("[data-dropdown-item]");
s.forEach(t => {
    const o = t.querySelector("[data-dropdown-toggle]"),
        n = t.querySelector("[data-dropdown-content]");
    o == null || o.addEventListener("click", r => {
        s.forEach(c => {
            const d = c.querySelector("[data-dropdown-toggle]"),
                a = c.querySelector("[data-dropdown-content]");
            d !== o && (d.classList.remove(e), a.classList.remove(e))
        }), r.currentTarget.classList.toggle(e), n.classList.toggle(e), l ? document.documentElement.scrollTop = t.offsetTop : n.addEventListener("transitionend", () => {
            window.scrollTo({
                top: window.scrollY + t.getBoundingClientRect().top,
                behavior: "smooth"
            })
        }, {
            once: !0
        })
    })
});
