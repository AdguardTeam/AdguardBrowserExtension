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
window.PAGE_TYPE = "safebrowsing";
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
  "ar": { "adgSafebrowsingTitle": "هذا الموقع خطير!", "extSafebrowsingDesc": "حظر AdGuard الوصول إلى <strong id='adgSafebrowsingHost'></strong> لأنه موجود في قاعدة بياناتنا الخاصة بمجالات التصيد الاحتيالي والبرامج الضارة", "proceedAnyway": "المتابعة على أية حال", "backBtn": "الرجوع للخلف", "adgSafebrowsingFaqTitle1": "لماذا لا يمكنني الوصول إلى هذا الموقع؟", "extSafebrowsingReport": "يتحقق AdGuard من أمان جميع الصفحات المطلوبة. تم وضع علامة على هذا الموقع <a id='adgSafebrowsingUnsafeLink'>على أنه غير آمن</a> — ولهذا السبب يقوم AdGuard بحظر الوصول إليه", "adgSafebrowsingFaqDesc1_2": "إذا كنت تعتقد أن هذا الموقع قد تم حظره عن طريق الخطأ، فيرجى <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>إخبارنا</a>" },
  "cs": { "adgSafebrowsingTitle": "Tato webová stránka je nebezpečná!", "extSafebrowsingDesc": "AdGuard zablokoval přístup na <strong id='adgSafebrowsingHost'></strong>, protože je v naší databázi podvodných a škodlivých domén", "proceedAnyway": "Přesto pokračovat", "backBtn": "Zpět", "adgSafebrowsingFaqTitle1": "Proč nemám přístup na tuto webovou stránku?", "extSafebrowsingReport": "AdGuard kontroluje zabezpečení všech požadovaných stránek. Tato webová stránka je <a id='adgSafebrowsingUnsafeLink'>označena jako nebezpečná</a> — proto k ní AdGuard blokuje přístup", "adgSafebrowsingFaqDesc1_2": "Pokud se domníváte, že tato webová stránka byla zablokována omylem, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>dejte nám prosím vědět</a>" },
  "da": { "adgSafebrowsingTitle": "Dette websted er farligt!", "extSafebrowsingDesc": "AdGuard blokerede adgang til <strong id='adgSafebrowsingHost'></strong>, da det findes i vores database over phishing og skadelige domæner", "proceedAnyway": "Fortsæt alligevel", "backBtn": "Gå tilbage", "adgSafebrowsingFaqTitle1": "Hvorfor kan man ikke tilgå dette websted?", "extSafebrowsingReport": "AdGuard tjekker sikkerheden på alle forespurgte sider. Dette websted er <a id='adgSafebrowsingUnsafeLink'>markeret som usikkert</a>, hvorfor AdGuard blokerer adgangen hertil", "adgSafebrowsingFaqDesc1_2": "Anses blokeringen af dette websted for en fejl, så <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>underret os gerne om det</a>" },
  "de": { "adgSafebrowsingTitle": "Diese Website ist gefährlich!", "extSafebrowsingDesc": "AdGuard hat den Zugriff auf <strong id='adgSafebrowsingHost'></strong> blockiert, da diese Website als betrügerisch oder bösartig in unserer Datenbank eingestuft ist", "proceedAnyway": "Trotzdem fortfahren", "backBtn": "Zurück", "adgSafebrowsingFaqTitle1": "Warum kann ich nicht auf diese Website zugreifen?", "extSafebrowsingReport": "AdGuard prüft die Sicherheit aller angeforderten Seiten. Diese Website ist <a id='adgSafebrowsingUnsafeLink'>als unsicher gekennzeichnet</a> — daher blockiert AdGuard den Zugriff darauf", "adgSafebrowsingFaqDesc1_2": "Wenn Sie glauben, dass diese Website irrtümlich gesperrt wurde, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>teilen Sie uns dies bitte mit</a>" },
  "en": { "adgSafebrowsingTitle": "This website is dangerous!", "extSafebrowsingDesc": "AdGuard blocked access to <strong id='adgSafebrowsingHost'></strong> because it's in our database of phishing and malicious domains", "proceedAnyway": "Proceed anyway", "backBtn": "Go back", "adgSafebrowsingFaqTitle1": "Why can't I access this website?", "extSafebrowsingReport": "AdGuard checks the security of all requested pages. This website is <a id='adgSafebrowsingUnsafeLink'>marked as unsafe</a> — that's why AdGuard blocks access to it", "adgSafebrowsingFaqDesc1_2": "If you believe this website has been blocked in error, please <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>let us know</a>" },
  "es": { "adgSafebrowsingTitle": "¡Este sitio web es peligroso!", "extSafebrowsingDesc": "AdGuard bloqueó el acceso a <strong id='adgSafebrowsingHost'></strong> porque está en nuestra base de datos de dominios maliciosos y de phishing", "proceedAnyway": "Continuar así mismo", "backBtn": "Volver", "adgSafebrowsingFaqTitle1": "¿Por qué no puedo acceder a este sitio web?", "extSafebrowsingReport": "AdGuard verifica la seguridad de todas las páginas solicitadas. Este sitio web está <a id='adgSafebrowsingUnsafeLink'>marcado como inseguro</a>, por eso AdGuard bloquea el acceso a él", "adgSafebrowsingFaqDesc1_2": "Si crees que este sitio web ha sido bloqueado por error, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>comunícanoslo</a>" },
  "fa": { "adgSafebrowsingTitle": "این تارنما خطرناک است!", "extSafebrowsingDesc": "AdGuard DNS دسترسی به <strong id='adgSafebrowsingHost'></strong> را مسدود کرد زیرا در پایگاه داده طعمه‌گذاری و دامنه‌های مخرب ما قرار دارد", "proceedAnyway": "در هر صورت ادامه یابد", "backBtn": "برگرد", "adgSafebrowsingFaqTitle1": "چرا نمی‌توانم به این تارنما دسترسی پیدا کنم؟", "extSafebrowsingReport": "AdGuard امنیت تمام صفحات درخواست شده را بررسی می کند. این تارنما <a id='adgSafebrowsingUnsafeLink'>مشخص شده به عنوان نا امن</a> — به همین دلیل AdGuard دسترسی به آن را مسدود می کند", "adgSafebrowsingFaqDesc1_2": "اگر باور دارید این تارنما به اشتباه مسدود شده است، لطفا <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>به ما اطلاع دهید</a>" },
  "fi": { "adgSafebrowsingTitle": "Tämä sivusto on vaarallinen!", "extSafebrowsingDesc": "AdGuard esti pääsyn <strong id='adgSafebrowsingHost'></strong> verkkotunnukselle, koska se on tietojenkalasteluun ja haitallisiin verkkotunnuksiin liittyvässä tietokannassamme", "proceedAnyway": "Jatka silti", "backBtn": "Palaa takaisin", "adgSafebrowsingFaqTitle1": "Miksi en pääse tälle verkkosivustolle?", "extSafebrowsingReport": "AdGuard tarkistaa kaikkien pyydettyjen sivujen turvallisuuden. Tämä verkkosivusto on <a id='adgSafebrowsingUnsafeLink'>merkitty epäluotettavaksi</a> — siksi AdGuard estää pääsyn sille", "adgSafebrowsingFaqDesc1_2": "Jos uskot, että tämä verkkosivusto on estetty virheellisesti, ole hyvä ja <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>kerro meille</a>" },
  "fr": { "adgSafebrowsingTitle": "Ce site web est dangereux !", "extSafebrowsingDesc": "AdGuard a bloqué l'accès à <strong id='adgSafebrowsingHost'></strong>, car il se trouve dans notre base de données de domaines malveillants et hameçonneurs", "proceedAnyway": "Procéder malgré tout", "backBtn": "Retour", "adgSafebrowsingFaqTitle1": "Pourquoi ne puis-je pas accéder à ce site web ?", "extSafebrowsingReport": "AdGuard vérifie la sécurité de toutes les pages demandées. Ce site web est <a id='adgSafebrowsingUnsafeLink'>marqué comme dangereux</a> — c'est pourquoi AdGuard y a bloqué l'accès", "adgSafebrowsingFaqDesc1_2": "Si vous pensez que ce site web a été bloqué par erreur, veuillez <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>nous en informer</a>" },
  "id": { "adgSafebrowsingTitle": "Situs ini mungkin berbahaya!", "extSafebrowsingDesc": "AdGuard diblokir akses ke <strong id='adgSafebrowsingHost'></strong> karena ada di basis data phishing dan domain berbahaya kami", "proceedAnyway": "Bagaimana pun juga lanjutkan", "backBtn": "Kembali", "adgSafebrowsingFaqTitle1": "Mengapa saya tidak dapat mengakses situs ini?", "extSafebrowsingReport": "AdGuard memeriksa keamanan semua halaman yang diminta. Situs web ini <a id='adgSafebrowsingUnsafeLink'>ditandai sebagai tidak aman</a> — itulah sebabnya AdGuard diblokir akses ke situs web tersebut", "adgSafebrowsingFaqDesc1_2": "Jika Anda yakin situs web ini diblokir karena kesalahan, mohon <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>kabarkan kami</a>" },
  "it": { "adgSafebrowsingTitle": "Questo sito web è pericoloso!", "extSafebrowsingDesc": "AdGuard ha bloccato l'accesso a <strong id='adgSafebrowsingHost'></strong> perché è nel nostro database di domini di phishing e malevoli", "proceedAnyway": "Procedi comunque", "backBtn": "Torna indietro", "adgSafebrowsingFaqTitle1": "Perché non riesco ad accedere a questo sito web?", "extSafebrowsingReport": "AdGuard controlla la sicurezza di tutte le pagine richieste. Questo sito web è <a id='adgSafebrowsingUnsafeLink'>contrassegnato come non sicuro</a> — ecco perché AdGuard blocca l'accesso ad esso", "adgSafebrowsingFaqDesc1_2": "Se pensi che questo sito web sia stato bloccato per errore, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>facci sapere</a>" },
  "ja": { "adgSafebrowsingTitle": "このウェブサイトは危険です！", "extSafebrowsingDesc": "<strong id='adgSafebrowsingHost'></strong> はフィッシングドメイン・悪意のあるドメインのAdGuardデータベースに登録されているため、AdGuard がアクセスをブロックしました。", "proceedAnyway": "そのままリンクを開く", "backBtn": "戻る", "adgSafebrowsingFaqTitle1": "なぜこのウェブサイトにアクセスできないのですか？", "extSafebrowsingReport": "AdGuard は、リクエストされたページの全てのセキュリティチェックを行います。このウェブサイトは、<a id='adgSafebrowsingUnsafeLink'>安全でない</a>としてマークされています。そのため、AdGuard はこのドメインへのアクセスをブロックしています。", "adgSafebrowsingFaqDesc1_2": "このウェブサイトが誤ってブロックされていると思われる場合は、<a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>こちらから</a>お知らせください。" },
  "ko": { "adgSafebrowsingTitle": "이 웹사이트는 위험합니다!", "extSafebrowsingDesc": "피싱 및 악성 도메인 데이터베이스에 포함되어 있기 때문에 AdGuard가 <strong id='adgSafebrowsingHost'></strong>에 대한 액세스를 차단했습니다.", "proceedAnyway": "그래도 계속 진행", "backBtn": "뒤로 가기", "adgSafebrowsingFaqTitle1": "왜 이 웹사이트에 접속할 수 없나요?", "extSafebrowsingReport": "AdGuard는 요청된 모든 페이지의 보안을 확인합니다. 이 웹사이트는 <a id='adgSafebrowsingUnsafeLink'>안전하지 않은 것으로 표시되어</a> AdGuard가 해당 웹사이트에 대한 액세스를 차단합니다.", "adgSafebrowsingFaqDesc1_2": "이 웹사이트가 오류로 차단되었다고 생각되면 <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>알려주세요</a>." },
  "lt": { "adgSafebrowsingTitle": "Ši svetainė yra pavojinga!", "extSafebrowsingDesc": "AdGuard užblokavo prieigą prie <strong id='adgSafebrowsingHost'></strong>, nes tai yra mūsų sukčiavimo ir kenkėjiškų domenų duomenų bazėje", "proceedAnyway": "Tęsti vis tiek", "backBtn": "Grįžti atgal", "adgSafebrowsingFaqTitle1": "Kodėl negaliu pasiekti šios svetainės?", "extSafebrowsingReport": "AdGuard tikrina visų prašomų puslapių saugumą. Ši svetainė <a id='adgSafebrowsingUnsafeLink'>pažymėta kaip nesaugus</a> – štai kodėl AdGuard blokuoja prieigą prie jos", "adgSafebrowsingFaqDesc1_2": "Jei manote, kad ši svetainė buvo užblokuota per klaidą, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>praneškite mums</a>" },
  "pl": { "adgSafebrowsingTitle": "Ta strona jest niebezpieczna!", "extSafebrowsingDesc": "AdGuard zablokował dostęp do <strong id='adgSafebrowsingHost'></strong>, ponieważ znajduje się ona w naszej bazie phishingowych i złośliwych domen", "proceedAnyway": "Mimo wszystko kontynuuj", "backBtn": "Wróć", "adgSafebrowsingFaqTitle1": "Dlaczego nie mogę uzyskać dostępu do tej witryny?", "extSafebrowsingReport": "AdGuard sprawdza bezpieczeństwo wszystkich żądanych stron. Ta strona internetowa jest <a id='adgSafebrowsingUnsafeLink'>oznaczona jako niebezpieczna</a> — dlatego AdGuard zablokował do niej dostęp", "adgSafebrowsingFaqDesc1_2": "Jeśli uważasz, że ta strona internetowa została zablokowana przez pomyłkę, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>daj nam znać</a>" },
  "pt-BR": { "adgSafebrowsingTitle": "Este site é perigoso!", "extSafebrowsingDesc": "O AdGuard bloqueou o acesso a <strong id='adgSafebrowsingHost'></strong> porque está em nossa base de dados de phishing e domínios maliciosos", "proceedAnyway": "Continuar mesmo assim", "backBtn": "Voltar", "adgSafebrowsingFaqTitle1": "Por que não consigo acessar este site?", "extSafebrowsingReport": "O AdGuard verifica a segurança de todas as páginas solicitadas. Este site está <a id='adgSafebrowsingUnsafeLink'>marcado como inseguro</a> e, por isso, o AdGuard bloqueia o acesso a ele", "adgSafebrowsingFaqDesc1_2": "Se você acredita que este site foi bloqueado por engano, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>nos informe</a>" },
  "pt-PT": { "adgSafebrowsingTitle": "Este sítio Web é perigoso!", "extSafebrowsingDesc": "O AdGuard bloqueou o acesso a <strong id='adgSafebrowsingHost'></strong> porque está na nossa base de dados de phishing e domínios maliciosos", "proceedAnyway": "Continuar mesmo assim", "backBtn": "Voltar", "adgSafebrowsingFaqTitle1": "Por que não consigo acessar este sítio?", "extSafebrowsingReport": "O AdGuard verifica a segurança de todas as páginas solicitadas. Este sítio está <a id='adgSafebrowsingUnsafeLink'>marcado como não seguro</a>, por isso o AdGuard bloqueia o acesso ao mesmo", "adgSafebrowsingFaqDesc1_2": "Se considera que este sítio Web foi bloqueado por engano, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>informe-nos</a>" },
  "ru": { "adgSafebrowsingTitle": "Осторожно, опасный сайт!", "extSafebrowsingDesc": "AdGuard заблокировал доступ к <strong id='adgSafebrowsingHost'></strong>: этот сайт находится в нашей базе фишинговых и вредоносных доменов", "proceedAnyway": "Всё равно перейти", "backBtn": "Назад", "adgSafebrowsingFaqTitle1": "Почему сайт заблокирован?", "extSafebrowsingReport": "AdGuard проверяет безопасность всех страниц, на которые вы переходите. Этот сайт <a id='adgSafebrowsingUnsafeLink'>помечен как небезопасный</a> — поэтому AdGuard блокирует доступ к нему", "adgSafebrowsingFaqDesc1_2": "Если вы считаете, что сайт заблокирован по ошибке, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>сообщите нам об этом</a>" },
  "sk": { "adgSafebrowsingTitle": "Táto webová stránka je nebezpečná!", "extSafebrowsingDesc": "AdGuard zablokoval prístup k <strong id='adgSafebrowsingHost'></strong>, pretože je v našej databáze phishingových a nebezpečných domén", "proceedAnyway": "Aj tak pokračovať", "backBtn": "Naspäť", "adgSafebrowsingFaqTitle1": "Prečo sa nemôžem dostať na túto webovú stránku?", "extSafebrowsingReport": "AdGuard kontroluje bezpečnosť všetkých požadovaných stránok. Táto webová stránka je <a id='adgSafebrowsingUnsafeLink'>označená ako nebezpečná</a> – preto k nej AdGuard blokuje prístup", "adgSafebrowsingFaqDesc1_2": "Ak si myslíte, že táto webová stránka bola zablokovaná omylom, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>dajte nám vedieť</a>" },
  "sl": { "adgSafebrowsingTitle": "Ta spletna stran je nevarna!", "extSafebrowsingDesc": "AdGuard je onemogočil dostop do <strong id='adgSafebrowsingHost'></strong>, ker je v naši zbirki podatkov lažnega predstavljanja in zlonamernih domen", "proceedAnyway": "Vseeno nadaljuj", "backBtn": "Pojdi nazaj", "adgSafebrowsingFaqTitle1": "Zakaj ne morem dostopati do te spletne strani?", "extSafebrowsingReport": "AdGuard preveri varnost vseh zahtevanih strani. To spletno mesto je <a id='adgSafebrowsingUnsafeLink'>označeno kot nevarno</a> — zato AdGuard blokira dostop do njega", "adgSafebrowsingFaqDesc1_2": "Če menite, da je bila ta spletna stran pomotoma onemogočena, nam <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>sporočite</a>" },
  "sv": { "adgSafebrowsingTitle": "Den här webbplatsen är farlig!", "extSafebrowsingDesc": "AdGuard blockerade åtkomsten till <strong id='adgSafebrowsingHost'></strong> eftersom den finns i vår databas över nätfiske och skadliga domäner", "proceedAnyway": "Fortsätt ändå", "backBtn": "Gå tillbaka", "adgSafebrowsingFaqTitle1": "Varför kan jag inte komma åt den här webbplatsen?", "extSafebrowsingReport": "AdGuard kontrollerar säkerheten för alla begärda sidor. Den här webbplatsen är <a id='adgSafebrowsingUnsafeLink'>markerad som osäker</a> — det är därför AdGuard blockerar åtkomst till den", "adgSafebrowsingFaqDesc1_2": "Om du tror att denna webbplats har blockerats av misstag, vänligen <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>meddela oss</a>" },
  "tr": { "adgSafebrowsingTitle": "Bu site tehlikeli!", "extSafebrowsingDesc": "AdGuard, kimlik avı ve kötü amaçlı alan adları veri tabanımızda yer aldığından <strong id='adgSafebrowsingHost'></strong> erişimini engelledi", "proceedAnyway": "Yine de devam et", "backBtn": "Geri dön", "adgSafebrowsingFaqTitle1": "Bu siteye neden erişemiyorum?", "extSafebrowsingReport": "AdGuard, istenen tüm sayfaların güvenliğini kontrol eder. Bu site <a id='adgSafebrowsingUnsafeLink'>güvenli değil olarak işaretlendi</a> — bu yüzden AdGuard onu engelliyor", "adgSafebrowsingFaqDesc1_2": "Bu sitenin yanlışlıkla engellendiğini düşünüyorsanız, lütfen <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>bize bildirin</a>" },
  "uk": { "adgSafebrowsingTitle": "Цей сайт небезпечний!", "extSafebrowsingDesc": "AdGuard заблокував доступ до <strong id='adgSafebrowsingHost'></strong> тому, що цей сайт міститься в нашій базі даних фішингових і зловмисних доменів", "proceedAnyway": "Все одно продовжити", "backBtn": "Назад", "adgSafebrowsingFaqTitle1": "Чому сайт заблоковано?", "extSafebrowsingReport": "AdGuard перевіряє безпеку всіх запитуваних сторінок. Цей сайт <a id='adgSafebrowsingUnsafeLink'>позначений як небезпечний</a> — тому AdGuard блокує доступ до нього", "adgSafebrowsingFaqDesc1_2": "Якщо ви вважаєте, що цей сайт було заблоковано помилково, будь ласка, <a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>повідомте нас</a>" },
  "zh-CN": { "adgSafebrowsingTitle": "此网站危险！", "extSafebrowsingDesc": "AdGuard 禁止访问 <strong id='adgSafebrowsingHost'></strong>，因为该网站在我们的网络钓鱼和恶意域数据库中。", "proceedAnyway": "继续访问", "backBtn": "返回", "adgSafebrowsingFaqTitle1": "为什么我无法访问此网站？", "extSafebrowsingReport": "AdGuard 检查所有请求网页的安全性。该网站被<a id='adgSafebrowsingUnsafeLink'>标记为不安全</a>的网站，因此 AdGuard 禁止访问它。", "adgSafebrowsingFaqDesc1_2": "如果您认为此网站被错误地拦截，请<a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>告诉我们</a>" },
  "zh-TW": { "adgSafebrowsingTitle": "此網站是危險的！", "extSafebrowsingDesc": "AdGuard 禁止存取 <strong id='adgSafebrowsingHost'></strong>，因為該網站在我們的網路釣魚和惡意域數據庫中。", "proceedAnyway": "仍要繼續", "backBtn": "返回", "adgSafebrowsingFaqTitle1": "為什麼我無法訪問此網站？", "extSafebrowsingReport": "AdGuard 檢查所有請求網頁的安全性。該網站被<a id='adgSafebrowsingUnsafeLink'>標記為不安全</a>的網站，因此 AdGuard 禁止存取它。", "adgSafebrowsingFaqDesc1_2": "如果您認為此網站被錯誤地封鎖，請<a id='adgSafebrowsingBlockedInErrorLink' href='%common_reports_new_issue_url%'>告訴我們</a>" }
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
