function q(t) {
    t.classList.add("active")
}

function d(t) {
    t.classList.remove("active")
}

function a(t, e) {
    const n = t.dataset.modalId,
        o = document.getElementById(n);
    t.addEventListener("click", () => {
        o && (e(), q(o))
    })
}

function B() {
    document.querySelectorAll(".js-modal").forEach(e => {
        e.addEventListener("click", o => {
            o.target === e && d(e)
        }), e.querySelectorAll(".js-modal-close").forEach(o => {
            o.addEventListener("click", g => {
                d(e)
            })
        })
    })
}
B();
const c = document.querySelector(".js-notify"),
    u = document.querySelector(".js-notify-copy-text"),
    r = document.querySelector(".js-notify-fail-text");
let l;

function k() {
    c && (c.classList.remove("active"), l && clearTimeout(l))
}

function f({
    copied: t
}) {
    c && (c.classList.remove("active"), requestAnimationFrame(() => {
        u && r && (u.style.display = t ? "block" : "none", r.style.display = t ? "none" : "block"), c.classList.add("active")
    }), l && clearTimeout(l), l = setTimeout(() => {
        k()
    }, 3e3))
}
const y = document.querySelector(".js-notify-close");
y && y.addEventListener("click", k);

function S(t) {
    navigator.clipboard.writeText(t).then(() => f({
        copied: !0
    })).catch(() => f({
        copied: !1
    }))
}

function j(t) {
    t.forEach(e => {
        const n = document.querySelector(`.${e.dataset.copyFieldClassname}`);
        e.addEventListener("click", () => {
            const o = n ? n.textContent : "";
            S(o)
        })
    })
}
const s = document.getElementById("adgAccessBlockedUrl"),
    i = document.getElementById("adgAccessBlockingRule"),
    m = document.querySelector(".js-button-url-modal"),
    p = document.querySelector(".js-modal-url-field"),
    x = document.querySelector(".js-button-rule-modal"),
    v = document.querySelector(".js-modal-rule-field");

function C() {
    m && a(m, () => {
        s && s.textContent && p && (p.textContent = s.textContent)
    }), x && a(x, () => {
        i && i.textContent && v && (v.textContent = i.textContent)
    })
}
C();
const E = document.querySelectorAll(".js-copy-button");
j(E);
