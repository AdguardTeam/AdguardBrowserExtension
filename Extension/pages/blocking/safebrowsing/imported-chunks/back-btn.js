const k = document.querySelectorAll("[data-back-btn]");
k.forEach(e => {
    e.addEventListener("click", r => {
        window.history.back()
    })
});
