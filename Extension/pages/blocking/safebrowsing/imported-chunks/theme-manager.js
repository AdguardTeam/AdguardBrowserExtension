// theme manager
class i {
    constructor() {
        this._matchMedia = window.matchMedia("(prefers-color-scheme: dark)"), this._matchMedia.addEventListener("change", this.listenForDarkMode.bind(this)), this._STORAGE_KEY = "theme-name", this._THEMES = Object.freeze({
            auto: "auto",
            light: "light",
            dark: "dark"
        }), this._changeCallbacks = [], this._theme = void 0
    }
    _isThemeSupported(e) {
        return Object.values(this._THEMES).includes(e)
    }
    _storeTheme(e) {
        if (this._isThemeSupported(e)) try {
            localStorage.setItem(this._STORAGE_KEY, e)
        } catch (t) {}
    }
    _setPageTheme(e) {
        const t = this._theme !== e;
        (e === this._THEMES.dark || e === this._THEMES.light) && (document.documentElement.dataset.theme = e, this._theme = e, t && this._changeCallbacks.forEach(h => h(e)))
    }
    _detectSystemTheme() {
        const e = this._matchMedia.matches,
            t = this.getStoredTheme(),
            h = t === this._THEMES.dark,
            s = t === this._THEMES.auto;
        h || s && e ? this._setPageTheme(this._THEMES.dark) : this._setPageTheme(this._THEMES.light)
    }
    getThemes() {
        return this._THEMES
    }
    listenForDarkMode(e) {
        this.getStoredTheme() === this._THEMES.auto && this._setPageTheme(e.matches ? this._THEMES.dark : this._THEMES.light)
    }
    onThemeChange(e) {
        this._changeCallbacks.push(e)
    }
    getStoredTheme() {
        try {
            const e = localStorage.getItem(this._STORAGE_KEY);
            return this._isThemeSupported(e) ? e : this._THEMES.auto
        } catch (e) {
            return this._THEMES.auto
        }
    }
    switchTheme(e) {
        this._isThemeSupported(e) && (this._storeTheme(e), e === this._THEMES.auto ? this._detectSystemTheme(e) : this._setPageTheme(e))
    }
    getCurrentTheme() {
        if (typeof this._theme == "undefined") throw new Error("call the init method first");
        return this._theme
    }
    init() {
        this._detectSystemTheme()
    }
}
window.themeManager = new i;
window.themeManager.init();
