(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
window.APP_NAME = "browser_extension";
window.PAGE_TYPE = "blocked";
class ThemeManager {
  constructor() {
    this._matchMedia = window.matchMedia("(prefers-color-scheme: dark)");
    this._matchMedia.addEventListener("change", this.listenForDarkMode.bind(this));
    this._STORAGE_KEY = "theme-name";
    this._THEMES = Object.freeze({
      auto: "auto",
      light: "light",
      dark: "dark"
    });
    this._changeCallbacks = [];
    this._theme = void 0;
  }
  _isThemeSupported(theme) {
    return Object.values(this._THEMES).includes(theme);
  }
  _storeTheme(theme) {
    if (this._isThemeSupported(theme)) {
      try {
        localStorage.setItem(this._STORAGE_KEY, theme);
      } catch {
      }
    }
  }
  _setPageTheme(theme) {
    const changed = this._theme !== theme;
    if (theme === this._THEMES.dark || theme === this._THEMES.light) {
      document.documentElement.dataset.theme = theme;
      this._theme = theme;
      if (changed) {
        this._changeCallbacks.forEach((cb) => cb(theme));
      }
    }
  }
  _detectSystemTheme() {
    const isSystemDarkMode = this._matchMedia.matches;
    const storedTheme = this.getStoredTheme();
    const isStoredDarkTheme = storedTheme === this._THEMES.dark;
    const isAutoTheme = storedTheme === this._THEMES.auto;
    if (isStoredDarkTheme || isAutoTheme && isSystemDarkMode) {
      this._setPageTheme(this._THEMES.dark);
    } else {
      this._setPageTheme(this._THEMES.light);
    }
  }
  getThemes() {
    return this._THEMES;
  }
  listenForDarkMode(event) {
    if (this.getStoredTheme() === this._THEMES.auto) {
      this._setPageTheme(event.matches ? this._THEMES.dark : this._THEMES.light);
    }
  }
  onThemeChange(cb) {
    this._changeCallbacks.push(cb);
  }
  // return the theme from storage. possible values for theme are: 'dark', 'light', and 'auto'.
  getStoredTheme() {
    try {
      const theme = localStorage.getItem(this._STORAGE_KEY);
      return this._isThemeSupported(theme) ? theme : this._THEMES.auto;
    } catch {
      return this._THEMES.auto;
    }
  }
  // the switchTheme method switches the current theme to the given one. possible `theme` values are: 'dark', 'light' and 'auto'.
  switchTheme(theme) {
    if (this._isThemeSupported(theme)) {
      this._storeTheme(theme);
      if (theme === this._THEMES.auto) {
        this._detectSystemTheme(theme);
      } else {
        this._setPageTheme(theme);
      }
    }
  }
  // returns only dark/light - the current body color, not the selected preset
  getCurrentTheme() {
    if (typeof this._theme === "undefined") {
      throw new Error("call the init method first");
    }
    return this._theme;
  }
  // the init method adds the dark modifier to <html /> if required.
  init() {
    this._detectSystemTheme();
  }
}
window.themeManager = new ThemeManager();
window.themeManager.init();
window.locales = {
  "ar": { "adgAccessBlockedTitle": "تم حظره بواسطة AdGuard", "extAccessBlockedDesc": "تم حظر الوصول إلى <strong id='adgAccessBlockedHost'></strong> بواسطة قاعدة الفلترة", "filter": "فلتر", "rule": "قاعدة", "proceedAnyway": "المتابعة على أية حال", "copy": "نسخ", "close": "إغلاق", "backBtn": "الرجوع للخلف", "adgAccessBlockedFaqTitle1": "كيفية إلغاء حظر هذا الموقع؟", "adgAccessBlockedFaqDesc1": "يمكنك <button type='button' id='adgAccessAllowToWhiteList'>إضافة هذا الموقع إلى القائمة المسموح بها</button>" },
  "cs": { "adgAccessBlockedTitle": "Přístup blokován AdGuardem", "extAccessBlockedDesc": "Přístup k <strong id='adgAccessBlockedHost'></strong> byl zablokován pravidlem filtrování", "filter": "Filtr", "rule": "Pravidlo", "proceedAnyway": "Přesto pokračovat", "copy": "Kopírovat", "close": "Zavřít", "backBtn": "Zpět", "adgAccessBlockedFaqTitle1": "Jak odblokovat tuto webovou stránku?", "adgAccessBlockedFaqDesc1": "Můžete <button type='button' id='adgAccessAllowToWhiteList'>přidat tuto webovou stránku na seznam povolených</button>" },
  "da": { "adgAccessBlockedTitle": "Adgang blokeret af AdGuard", "extAccessBlockedDesc": "Adgang til <strong id='adgAccessBlockedHost'></strong> blokeret af en filtreringsregel", "filter": "Filter", "rule": "Regel", "proceedAnyway": "Fortsæt alligevel", "copy": "Kopiér", "close": "Luk", "backBtn": "Gå tilbage", "adgAccessBlockedFaqTitle1": "Hvordan afblokeres dette websted?", "adgAccessBlockedFaqDesc1": "Man kan <button type='button' id='adgAccessAllowToWhiteList'>føje dette websted til hvidlisten</button>" },
  "de": { "adgAccessBlockedTitle": "Zugriff durch AdGuard blockiert", "extAccessBlockedDesc": "Der Zugriff auf <strong id='adgAccessBlockedHost'></strong> wurde durch eine Filterregel blockiert", "filter": "Filter", "rule": "Regel", "proceedAnyway": "Trotzdem fortfahren", "copy": "Kopieren", "close": "Schließen", "backBtn": "Zurück", "adgAccessBlockedFaqTitle1": "Wie entsperre ich diese Website?", "adgAccessBlockedFaqDesc1": "Sie können <button type='button' id='adgAccessAllowToWhiteList'>diese Website zur Liste der zulässigen Websites hinzufügen</button>" },
  "en": { "adgAccessBlockedTitle": "Access blocked by AdGuard", "extAccessBlockedDesc": "Access to <strong id='adgAccessBlockedHost'></strong> was blocked by a filtering rule", "filter": "Filter", "rule": "Rule", "proceedAnyway": "Proceed anyway", "copy": "Copy", "close": "Close", "backBtn": "Go back", "adgAccessBlockedFaqTitle1": "How to unblock this website?", "adgAccessBlockedFaqDesc1": "You can <button type='button' id='adgAccessAllowToWhiteList'>add this website to allowlist</button>" },
  "es": { "adgAccessBlockedTitle": "Acceso bloqueado por AdGuard", "extAccessBlockedDesc": "El acceso a <strong id='adgAccessBlockedHost'></strong> fue bloqueado por una regla de filtrado", "filter": "Filtro", "rule": "Regla", "proceedAnyway": "Continuar así mismo", "copy": "Copiar", "close": "Cerrar", "backBtn": "Volver", "adgAccessBlockedFaqTitle1": "¿Cómo desbloquear este sitio web?", "adgAccessBlockedFaqDesc1": "Puedes <button type='button' id='adgAccessAllowToWhiteList'>agregar este sitio web a la lista de permitidos</button>" },
  "fa": { "adgAccessBlockedTitle": "دسترسی به <strong>مسدود شده</strong> توسط AdGuard", "extAccessBlockedDesc": "دسترسی به <strong id='adgAccessBlockedHost'></strong> توسط یک رویه‌های پالایش مسدود شده است", "filter": "فیلتر", "rule": "رویه", "proceedAnyway": "در هر صورت ادامه یابد", "copy": "روگرفت", "close": "بستن", "backBtn": "برگرد", "adgAccessBlockedFaqTitle1": "چگونه می‌توان این تارنما را رفع انسداد کرد؟", "adgAccessBlockedFaqDesc1": "شما می‌توانید <button type='button' id='adgAccessAllowToWhiteList'>این تارنما را به فهرست سفید اضافه کنید</button>" },
  "fi": { "adgAccessBlockedTitle": "AdGuard esti pääsyn", "extAccessBlockedDesc": "Pääsy <strong id='adgAccessBlockedHost'></strong> estettiin suodatussäännöllä", "filter": "Suodatin", "rule": "Sääntö", "proceedAnyway": "Jatka silti", "copy": "Kopioi", "close": "Sulje", "backBtn": "Palaa takaisin", "adgAccessBlockedFaqTitle1": "Miten sallia tämä verkkosivusto?", "adgAccessBlockedFaqDesc1": "Voit <button type='button' id='adgAccessAllowToWhiteList'>lisätä tämän verkkosivuston hyväksyntäluetteloon</button>" },
  "fr": { "adgAccessBlockedTitle": "Accès bloqué par AdGuard", "extAccessBlockedDesc": "L'accès à <strong id='adgAccessBlockedHost'></strong> a été bloqué par une règle de filtrage", "filter": "Filtre", "rule": "Règle", "proceedAnyway": "Procéder malgré tout", "copy": "Copier", "close": "Fermer", "backBtn": "Retour", "adgAccessBlockedFaqTitle1": "Comment débloquer ce site web ?", "adgAccessBlockedFaqDesc1": "Vous pouvez <button type='button' id='adgAccessAllowToWhiteList'>ajouter ce site web à la liste d'autorisation</button>" },
  "id": { "adgAccessBlockedTitle": "Akses terblokir oleh AdGuard", "extAccessBlockedDesc": "Akses ke <strong id='adgAccessBlockedHost'></strong> diblokir oleh aturan pemfilteran", "filter": "Pemfilteran", "rule": "Aturan", "proceedAnyway": "Bagaimana pun juga lanjutkan", "copy": "Salin", "close": "Tutup", "backBtn": "Kembali", "adgAccessBlockedFaqTitle1": "Bagaimana cara membuka blokir situs ini?", "adgAccessBlockedFaqDesc1": "Anda dapat <button type='button' id='adgAccessAllowToWhiteList'>menambahkan situs web ini ke daftar izinkan</button>" },
  "it": { "adgAccessBlockedTitle": "Accesso bloccato da AdGuard", "extAccessBlockedDesc": "L'accesso a <strong id='adgAccessBlockedHost'></strong> è stato bloccato da una regola di filtraggio", "filter": "Filtro", "rule": "Regola", "proceedAnyway": "Procedi comunque", "copy": "Copia", "close": "Chiudi", "backBtn": "Torna indietro", "adgAccessBlockedFaqTitle1": "Come sbloccare questo sito web?", "adgAccessBlockedFaqDesc1": "Puoi <button type='button' id='adgAccessAllowToWhiteList'>aggiungere questo sito web alla lista consentita</button>" },
  "ja": { "adgAccessBlockedTitle": "AdGuard によってアクセスがブロックされています", "extAccessBlockedDesc": "フィルタリングルールによって <strong id='adgAccessBlockedHost'></strong> へのアクセスがブロックされました。", "filter": "フィルタ", "rule": "ルール", "proceedAnyway": "そのままリンクを開く", "copy": "コピー", "close": "閉じる", "backBtn": "戻る", "adgAccessBlockedFaqTitle1": "このウェブサイトのブロックを解除する方法は？", "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>このウェブサイトをホワイトリストに追加する</button>ことができます。" },
  "ko": { "adgAccessBlockedTitle": "AdGuard에 의해 차단됨", "extAccessBlockedDesc": "<strong id='adgAccessBlockedHost'></strong> 에 대한 액세스가 필터링 규칙에 의해 차단되었습니다.", "filter": "필터", "rule": "규칙", "proceedAnyway": "그래도 계속 진행", "copy": "복사", "close": "닫기", "backBtn": "뒤로 가기", "adgAccessBlockedFaqTitle1": "이 웹사이트 차단을 해제하는 방법은 무엇인가요?", "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>이 웹사이트를 허용 목록</button>에 추가할 수 있습니다." },
  "lt": { "adgAccessBlockedTitle": "Prieiga užblokuota AdGuard", "extAccessBlockedDesc": "Prieiga prie <strong id='adgAccessBlockedHost'></strong> buvo užblokuota pagal filtravimo taisyklę", "filter": "Filtras", "rule": "Taisyklė", "proceedAnyway": "Tęsti vis tiek", "copy": "Kopijuoti", "close": "Uždaryti", "backBtn": "Grįžti atgal", "adgAccessBlockedFaqTitle1": "Kaip atblokuoti šią svetainę?", "adgAccessBlockedFaqDesc1": "Galite <button type='button' id='adgAccessAllowToWhiteList'>pridėti šią svetainę į leidžiamų sąrašą</button>" },
  "pl": { "adgAccessBlockedTitle": "Dostęp zablokowany przez AdGuard", "extAccessBlockedDesc": "Dostęp do <strong id='adgAccessBlockedHost'></strong> został zablokowany przez regułę filtrowania", "filter": "Filtr", "rule": "Reguła", "proceedAnyway": "Mimo wszystko kontynuuj", "copy": "Kopiuj", "close": "Zamknij", "backBtn": "Wróć", "adgAccessBlockedFaqTitle1": "Jak odblokować tę stronę?", "adgAccessBlockedFaqDesc1": "Możesz <button type='button' id='adgAccessAllowToWhiteList'>dodać tę witrynę do listy dozwolonych</button>" },
  "pt-BR": { "adgAccessBlockedTitle": "Acesso bloqueado pelo AdGuard", "extAccessBlockedDesc": "O acesso a <strong id='adgAccessBlockedHost'></strong> foi bloqueado por uma regra de filtragem", "filter": "Filtro", "rule": "Regra", "proceedAnyway": "Continuar mesmo assim", "copy": "Copiar", "close": "Fechar", "backBtn": "Voltar", "adgAccessBlockedFaqTitle1": "Como desbloquear este site?", "adgAccessBlockedFaqDesc1": "Você pode <button type='button' id='adgAccessAllowToWhiteList'>adicionar este site à lista de permissões</button>" },
  "pt-PT": { "adgAccessBlockedTitle": "Acesso bloqueado pelo AdGuard", "extAccessBlockedDesc": "O acesso a <strong id='adgAccessBlockedHost'></strong> foi bloqueado por uma regra de filtragem", "filter": "Filtro", "rule": "Regra", "proceedAnyway": "Continuar mesmo assim", "copy": "Copiar", "close": "Fechar", "backBtn": "Voltar", "adgAccessBlockedFaqTitle1": "Como desbloquear este sítio Web?", "adgAccessBlockedFaqDesc1": "Pode <button type='button' id='adgAccessAllowToWhiteList'>adicionar este sítio Web à lista de permissões</button>" },
  "ru": { "adgAccessBlockedTitle": "Доступ заблокирован AdGuard", "extAccessBlockedDesc": "Доступ к <strong id='adgAccessBlockedHost'></strong> был заблокирован правилом фильтрации", "filter": "Фильтр", "rule": "Правило", "proceedAnyway": "Всё равно перейти", "copy": "Скопировать", "close": "Закрыть", "backBtn": "Назад", "adgAccessBlockedFaqTitle1": "Как разблокировать сайт?", "adgAccessBlockedFaqDesc1": "Вы можете <button type='button' id='adgAccessAllowToWhiteList'>добавить этот сайт в белый список</button>" },
  "sk": { "adgAccessBlockedTitle": "Prístup bol zablokovaný aplikáciou AdGuard", "extAccessBlockedDesc": "Prístup k <strong id='adgAccessBlockedHost'></strong> bol zablokovaný filtračným pravidlom", "filter": "Filter", "rule": "Pravidlo", "proceedAnyway": "Aj tak pokračovať", "copy": "Kopírovať", "close": "Zavrieť", "backBtn": "Naspäť", "adgAccessBlockedFaqTitle1": "Ako odblokovať túto webovú stránku?", "adgAccessBlockedFaqDesc1": "Môžete <button type='button' id='adgAccessAllowToWhiteList'>pridať túto webovú stránku do zoznamu povolených</button>" },
  "sl": { "adgAccessBlockedTitle": "Dostop blokira AdGuard", "extAccessBlockedDesc": "Dostop do <strong id='adgAccessBlockedHost'></strong> je bil blokiran s pravilom filtriranja", "filter": "Filtriraj", "rule": "Pravilo", "proceedAnyway": "Vseeno nadaljuj", "copy": "Kopiraj", "close": "Zapri", "backBtn": "Pojdi nazaj", "adgAccessBlockedFaqTitle1": "Kako znova omogočiti to spletno stran?", "adgAccessBlockedFaqDesc1": "Lahko <button type='button' id='adgAccessAllowToWhiteList'>dodate to spletno stran na dovoljen seznam</button>" },
  "sv": { "adgAccessBlockedTitle": "Åtkomst blockerad av AdGuard", "extAccessBlockedDesc": "Åtkomst till <strong id='adgAccessBlockedHost'></strong> blockerades av en filtreringsregel", "filter": "Filter", "rule": "Regel", "proceedAnyway": "Fortsätt ändå", "copy": "Kopiera", "close": "Stäng", "backBtn": "Gå tillbaka", "adgAccessBlockedFaqTitle1": "Hur avblockerar jag den här webbplatsen?", "adgAccessBlockedFaqDesc1": "Du kan <button type='button' id='adgAccessAllowToWhiteList'>lägga till den här webbplatsen i tillåtlistan</button>" },
  "tr": { "adgAccessBlockedTitle": "AdGuard tarafından erişim engellendi", "extAccessBlockedDesc": "<strong id='adgAccessBlockedHost'></strong> erişimi bir filtreleme kuralı tarafından engellendi", "filter": "Filtre", "rule": "Kural", "proceedAnyway": "Yine de devam et", "copy": "Kopyala", "close": "Kapat", "backBtn": "Geri dön", "adgAccessBlockedFaqTitle1": "Bu sitenin engeli nasıl kaldırılır?", "adgAccessBlockedFaqDesc1": "<button type='button' id='adgAccessAllowToWhiteList'>Bu siteyi izin listesine ekleyebilirsiniz</button>" },
  "uk": { "adgAccessBlockedTitle": "Доступ заблоковано AdGuard", "extAccessBlockedDesc": "Доступ до <strong id='adgAccessBlockedHost'></strong> заблоковано правилом фільтрації", "filter": "Фільтр", "rule": "Правило", "proceedAnyway": "Все одно продовжити", "copy": "Копіювати", "close": "Закрити", "backBtn": "Назад", "adgAccessBlockedFaqTitle1": "Як розблокувати сайт?", "adgAccessBlockedFaqDesc1": "Ви можете <button type='button' id='adgAccessAllowToWhiteList'>додати цей сайт до білого списку</button>" },
  "zh-CN": { "adgAccessBlockedTitle": "AdGuard 禁止访问", "extAccessBlockedDesc": "启用的过滤规则禁止访问 <strong id='adgAccessBlockedHost'></strong>", "filter": "过滤器", "rule": "规则", "proceedAnyway": "继续访问", "copy": "复制", "close": "关闭", "backBtn": "返回", "adgAccessBlockedFaqTitle1": "如何解除对此网站的拦截？", "adgAccessBlockedFaqDesc1": "您可以<button type='button' id='adgAccessAllowToWhiteList'>将此网站添加到白名单</button>" },
  "zh-TW": { "adgAccessBlockedTitle": "AdGuard 禁止存取", "extAccessBlockedDesc": "啟用的過濾規則禁止存取 <strong id='adgAccessBlockedHost'></strong>", "filter": "過濾器", "rule": "規則", "proceedAnyway": "仍要繼續", "copy": "複製", "close": "關閉", "backBtn": "返回", "adgAccessBlockedFaqTitle1": "如何解除對此網站的封鎖？", "adgAccessBlockedFaqDesc1": "您可以<button type='button' id='adgAccessAllowToWhiteList'>將此網站新增到允許清單</button>" }
};
let config = null;
const getConfig = () => {
  if (config) {
    return config;
  }
  config = {
    appName: window.APP_NAME,
    pageType: window.PAGE_TYPE,
    host: window.location.host
  };
  return config;
};
const getLocale = () => {
  const debugQueryParams = new URLSearchParams(window.location.search);
  const debugQueryLocale = debugQueryParams.get("_locale");
  if (debugQueryLocale) {
    return debugQueryLocale;
  }
  return navigator.language;
};
const resolveDictionary = () => {
  if (!window.locales || typeof window.locales !== "object") {
    console.error("Localization dictionaries not found in window.locales");
    return {};
  }
  const locale = getLocale();
  if (window.locales[locale]) {
    return window.locales[locale];
  }
  const lang = locale.split("-")[0];
  if (window.locales[lang]) {
    return window.locales[lang];
  }
  return window.locales["en"];
};
let dictionary = null;
const getDictionary = () => {
  if (dictionary) {
    return dictionary;
  }
  dictionary = resolveDictionary();
  return dictionary;
};
let placeholders = null;
const getPlaceholders = () => {
  if (placeholders) {
    return placeholders;
  }
  const config2 = getConfig();
  placeholders = {
    host: config2.host,
    reports_url: `https://link.adtidy.org/forward.html?action=site_report_page&domain=${config2.host}&from=${config2.pageType}&app=${config2.appName}`,
    dns_reports_new_issue_url: `https://link.adtidy.org/forward.html?action=report_issue&from=${config2.pageType}&app=${config2.appName}`,
    common_reports_new_issue_url: `https://link.adtidy.org/forward.html?action=report&from=${config2.pageType}&app=${config2.appName}`,
    adg_website_url: `https://link.adtidy.org/forward.html?action=adguard_site&from=${config2.pageType}&app=${config2.appName}`,
    vpn_website_url: `https://link.adtidy.org/forward.html?action=vpn_site&from=${config2.pageType}&app=${config2.appName}`,
    dns_website_url: `https://link.adtidy.org/forward.html?action=dns_site&from=${config2.pageType}&app=${config2.appName}`,
    dns_domain: "adguard-dns.io",
    user_rules_url: `https://link.adtidy.org/forward.html?action=dns_site_user_rules&from=${config2.pageType}&app=${config2.appName}`,
    locations_count: 65,
    users_count: "100",
    vpn_product_name: "AdGuard VPN"
  };
  return placeholders;
};
const translate = (id) => {
  const dict = getDictionary();
  return dict[id] ?? id;
};
const replacePlaceholders = (text) => {
  if (!text) {
    return "";
  }
  const placeholders2 = getPlaceholders();
  return Object.entries(placeholders2).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`%${key}%`, "g"), value);
  }, text);
};
const translateNode = (node) => {
  if (!node || !node.dataset) {
    return;
  }
  const id = node.dataset.id;
  if (!id) {
    return;
  }
  const translated = replacePlaceholders(translate(id));
  if (node.tagName === "INPUT") {
    node.placeholder = translated;
  } else {
    node.innerHTML = translated;
  }
};
const initTranslations = () => {
  document.querySelectorAll("[data-id]").forEach(translateNode);
};
initTranslations();
const backBtns = document.querySelectorAll("[data-back-btn]");
const MIN_BLOCKED_PAGE_HISTORY_LENGTH = 2;
backBtns.forEach((el) => {
  el.addEventListener("click", (event) => {
    if (window.history.length > MIN_BLOCKED_PAGE_HISTORY_LENGTH) {
      try {
        window.history.back();
      } catch (e) {
        console.error(`Error while going back: ${e}`);
      }
    } else {
      window.close();
    }
  });
});
function openModal(modal) {
  modal.classList.add("active");
}
function closeModal(modal) {
  modal.classList.remove("active");
}
function handleModalOpen(element, callback) {
  const modalId = element.dataset.modalId;
  const modal = document.getElementById(modalId);
  element.addEventListener("click", () => {
    if (modal) {
      callback();
      openModal(modal);
    }
  });
}
function initModals() {
  const modals = document.querySelectorAll(".js-modal");
  modals.forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeModal(modal);
      }
    });
    const closeButtons = modal.querySelectorAll(".js-modal-close");
    closeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        closeModal(modal);
      });
    });
  });
}
initModals();
const notify = document.querySelector(".js-notify");
const notifySuccessText = document.querySelector(".js-notify-copy-text");
const notifyFailedText = document.querySelector(".js-notify-fail-text");
let notifyTimeout;
function closeNotify() {
  if (!notify) return;
  notify.classList.remove("active");
  if (notifyTimeout) {
    clearTimeout(notifyTimeout);
  }
}
function openNotify({ copied }) {
  if (!notify) return;
  notify.classList.remove("active");
  requestAnimationFrame(() => {
    if (notifySuccessText && notifyFailedText) {
      notifySuccessText.style.display = copied ? "block" : "none";
      notifyFailedText.style.display = copied ? "none" : "block";
    }
    notify.classList.add("active");
  });
  if (notifyTimeout) {
    clearTimeout(notifyTimeout);
  }
  notifyTimeout = setTimeout(() => {
    closeNotify();
  }, 3e3);
}
const notifyCloseButton = document.querySelector(".js-notify-close");
if (notifyCloseButton) {
  notifyCloseButton.addEventListener("click", closeNotify);
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => openNotify({ copied: true })).catch(() => openNotify({ copied: false }));
}
function handleCopy(copyButtons2) {
  copyButtons2.forEach((el) => {
    const copyField = document.querySelector(`.${el.dataset.copyFieldClassname}`);
    el.addEventListener("click", () => {
      const text = copyField ? copyField.textContent : "";
      copyToClipboard(text);
    });
  });
}
const blockedUrlFieldText = document.getElementById("adgAccessBlockedUrl");
const blockingRuleFieldText = document.getElementById("adgAccessBlockingRule");
const openUrlModalButton = document.querySelector(".js-button-url-modal");
const modalUrlField = document.querySelector(".js-modal-url-field");
const openRuleModalButton = document.querySelector(".js-button-rule-modal");
const modalBlockingRuleField = document.querySelector(".js-modal-rule-field");
function handleAccessBlockedModals() {
  if (openUrlModalButton) {
    handleModalOpen(openUrlModalButton, () => {
      if (blockedUrlFieldText && blockedUrlFieldText.textContent && modalUrlField) {
        modalUrlField.textContent = blockedUrlFieldText.textContent;
      }
    });
  }
  if (openRuleModalButton) {
    handleModalOpen(openRuleModalButton, () => {
      if (blockingRuleFieldText && blockingRuleFieldText.textContent && modalBlockingRuleField) {
        modalBlockingRuleField.textContent = blockingRuleFieldText.textContent;
      }
    });
  }
}
handleAccessBlockedModals();
const copyButtons = document.querySelectorAll(".js-copy-button");
handleCopy(copyButtons);
