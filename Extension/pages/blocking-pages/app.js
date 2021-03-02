'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);

      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}

var malware = "تم الإبلاغ عن صفحة الويب هذه على <strong> (تغير المظيف) </strong> كصفحة ضارة وتم حظرها بناءً على تفضيلات الأمان.";
var phishing = "تم الإبلاغ عن صفحة الويب هذه على <strong> (تغير المظيف) </strong> كصفحة تصيد وتم حظرها بناءً على تفضيلات الأمان الخاصة بك";
var advancedButton = "خيارات متقدمة";
var moreInfoButton = "معلومات اكثر";
var pageTitle = "تم رفض الوصول";
var safeHeaderTitle = "الوصول إلى هذه الصفحة AdGuard لقد حظر";
var safeContentTitle = "تم الإبلاغ عن صفحة الويب هذه كصفحة ضارة وتم حظرها بناءً على تفضيلات الأمان الخاصة بك.";
var parentalHeaderTitle = "الرقابة الأبوية";
var parentalContentTitle = "لقد حظرنا هذه الصفحة بسبب قيود مرشح الوالدين";
var parentalDescOne = "هل أنت كبير بما فيه الكفاية؟ أدخل كلمة المرور";
var parentalDnsDescTwo = "أنت تحاول الوصول إلى موقع ويب مدرج بواسطة ادجوارد باعتباره غير مناسب للأطفال. إذا كنت شخصًا بالغًا ، يمكنك إيقاف التحكم الأبوي في الإعدادات أو إضافة هذا الموقع إلى القائمة البيضاء.";
var blockedContentTitle = "الوصول إلى هذا الموقع قم بإضافته إلى الاستثناءات{site}تم حظرطلب من خلال قاعدة الفلترإذا كنت ترغب في الوصول إلى هذا الموقع";
var ruleHeaderTitle = "تم حظره بواسطة AdGuard";
var ruleContentTitle = "لقد منع AdGuard هذه الصفحة من التحميل بسبب قاعدة الفلتر التالية";
var btnGoBack = "الرجوع للخلف";
var btnFeedback = "إرسال ملاحظاتكم";
var btnProceed = "المتابعة على أية حال";
var btnProceedTo = "متابعة للموقع";
var inputPassword = "أدخل كلمة المرور";
var errorPageHeader = "الصفحة غير متوفرة";
var summary = "ربما تكون صفحة الويب على <strong> (var.PageUrl) </strong> معطلة مؤقتًا ، أو ربما تكون قد انتقلت إلى عنوان ويب جديد";
var suggestionsHeader = "وفيما يلي بعض الاقتراحات";
var suggestion1 = "حاول <a href='(var.PageUrl)'>إعادة تحميل</a> صفحة الويب هذه في وقت لاحق.";
var suggestion2 = "يرجى التحقق من عنوان صفحة الويب و التأكد من إدخال العنوان بشكل صحيح.";
var suggestion3 = "تحقق من إعدادات جدار الحماية. يجب السماح لجميع الاتصالات الخاصة بـ AdGuard.";
var suggestion4 = "تحقق من إعدادات الخادم الوكيل إذا كنت تستخدم الخادم الوكيل";
var showDetails = "إظهار التفاصيل";
var wrongPassword = "كلمة مرور خاطئة";
var somethingWrong = "هناك خطأ ما. يرجى المحاولة مرة أخرى في وقت لاحق ، أو الاتصال بخدمة الدعم الخاصة بنا";
var errorPageTitle = "خطأ";
var download = "تحميل";
var ar = {
	malware: malware,
	phishing: phishing,
	advancedButton: advancedButton,
	moreInfoButton: moreInfoButton,
	pageTitle: pageTitle,
	safeHeaderTitle: safeHeaderTitle,
	safeContentTitle: safeContentTitle,
	parentalHeaderTitle: parentalHeaderTitle,
	parentalContentTitle: parentalContentTitle,
	parentalDescOne: parentalDescOne,
	parentalDnsDescTwo: parentalDnsDescTwo,
	blockedContentTitle: blockedContentTitle,
	ruleHeaderTitle: ruleHeaderTitle,
	ruleContentTitle: ruleContentTitle,
	btnGoBack: btnGoBack,
	btnFeedback: btnFeedback,
	btnProceed: btnProceed,
	btnProceedTo: btnProceedTo,
	inputPassword: inputPassword,
	errorPageHeader: errorPageHeader,
	summary: summary,
	suggestionsHeader: suggestionsHeader,
	suggestion1: suggestion1,
	suggestion2: suggestion2,
	suggestion3: suggestion3,
	suggestion4: suggestion4,
	showDetails: showDetails,
	wrongPassword: wrongPassword,
	somethingWrong: somethingWrong,
	errorPageTitle: errorPageTitle,
	download: download
};

var malware$1 = "Webová stránka <strong>(var.Host)</strong> byla ohlášena jako škodlivá a na základě Vašich bezpečnostních nastavení byla zablokována.";
var phishing$1 = "Webová stránka <strong>(var.Host)</strong> byla ohlášena jako podvodná a na základě Vašich bezpečnostních nastavení byla zablokována.";
var advancedButton$1 = "Pokročilé";
var moreInfoButton$1 = "Více informací";
var pageTitle$1 = "Přístup odepřen";
var safeHeaderTitle$1 = "AdGuard zablokoval přístup na tuto stránku";
var safeContentTitle$1 = "Webová stránka byla ohlášena jako škodlivá a na základě Vašich bezpečnostních nastavení byla zablokována.";
var parentalHeaderTitle$1 = "Rodičovská kontrola";
var parentalContentTitle$1 = "Tuto stránku jsme zablokovali kvůli omezením rodičovského filtru.";
var parentalDescOne$1 = "Máte na to věk? Zadejte heslo";
var parentalDnsDescTwo$1 = "Pokoušíte navštívit stránku, kterou AdGuard eviduje jako nevhodnou pro děti. Pokud jste dospělý/á, můžete v nastavení vypnout rodičovskou kontrolu nebo tuto stránku přidat na seznam povolených.";
var blockedContentTitle$1 = "Přístup na {site} byl zablokován pravidlem filtru. Chcete-li tuto stránku zobrazit, přidejte ji mezi výjimky.";
var ruleHeaderTitle$1 = "Blokováno programem AdGuard";
var ruleContentTitle$1 = "AdGuard zabránil načtení této stránky kvůli následujícímu pravidlu filtru";
var btnGoBack$1 = "Zpět";
var btnFeedback$1 = "Odeslat zpětnou vazbu";
var btnProceed$1 = "Přesto pokračovat";
var btnProceedTo$1 = "Pokračovat na stránku";
var inputPassword$1 = "Zadejte heslo";
var errorPageHeader$1 = "Webová stránka není dostupná";
var summary$1 = "Webová stránka <strong>(var.PageUrl)</strong> může být dočasně nedostupná, nebo se přesunula na jinou adresu.";
var suggestionsHeader$1 = "Zde jsou některé návrhy";
var suggestion1$1 = "Zkuste <a href='(var.PageUrl)'>znovu načíst</a> tuto webovou stránku později.";
var suggestion2$1 = "Zkontrolujte webovou adresu a ujistěte se, že jste ji zadali správně.";
var suggestion3$1 = "Zkontrolujte nastavení brány firewall. Všechna připojení by měla být pro AdGuard povolena.";
var suggestion4$1 = "Zkontrolujte nastavení serveru proxy, pokud jej používáte.";
var showDetails$1 = "Zobrazit podrobnosti";
var wrongPassword$1 = "Nesprávné heslo";
var somethingWrong$1 = "Něco se pokazilo. Zkuste to znovu později nebo kontaktujte naši technickou podporu.";
var errorPageTitle$1 = "Chyba";
var knowledgeBase = "Pokyny k instalaci certifikátů naleznete v naší <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Základně znalostí</a>";
var download$1 = "Stáhnout";
var cs = {
	malware: malware$1,
	phishing: phishing$1,
	advancedButton: advancedButton$1,
	moreInfoButton: moreInfoButton$1,
	pageTitle: pageTitle$1,
	safeHeaderTitle: safeHeaderTitle$1,
	safeContentTitle: safeContentTitle$1,
	parentalHeaderTitle: parentalHeaderTitle$1,
	parentalContentTitle: parentalContentTitle$1,
	parentalDescOne: parentalDescOne$1,
	parentalDnsDescTwo: parentalDnsDescTwo$1,
	blockedContentTitle: blockedContentTitle$1,
	ruleHeaderTitle: ruleHeaderTitle$1,
	ruleContentTitle: ruleContentTitle$1,
	btnGoBack: btnGoBack$1,
	btnFeedback: btnFeedback$1,
	btnProceed: btnProceed$1,
	btnProceedTo: btnProceedTo$1,
	inputPassword: inputPassword$1,
	errorPageHeader: errorPageHeader$1,
	summary: summary$1,
	suggestionsHeader: suggestionsHeader$1,
	suggestion1: suggestion1$1,
	suggestion2: suggestion2$1,
	suggestion3: suggestion3$1,
	suggestion4: suggestion4$1,
	showDetails: showDetails$1,
	wrongPassword: wrongPassword$1,
	somethingWrong: somethingWrong$1,
	errorPageTitle: errorPageTitle$1,
	knowledgeBase: knowledgeBase,
	download: download$1
};

var malware$2 = "Denne hjemmeside på <strong>(var.Host)</strong> er blevet rapporteret som en malware side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.";
var phishing$2 = "Denne hjemmeside på <strong>(var.Host)</strong> er blevet rapporteret som en phishing side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.";
var advancedButton$2 = "Avanceret";
var moreInfoButton$2 = "Mere information";
var pageTitle$2 = "Adgang nægtet";
var safeHeaderTitle$2 = "AdGuard har blokeret adgangen til denne side";
var safeContentTitle$2 = "Denne hjemmeside er blevet rapporteret som en malware side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.";
var parentalHeaderTitle$2 = "Forældrekontrol";
var parentalContentTitle$2 = "Vi blokerede denne side på grund af forældrefilter restriktionerne.";
var parentalDescOne$2 = "Er du gammel nok? Indtast adgangskoden";
var parentalDnsDescTwo$2 = "Du forsøger at nå en hjemmeside, der er noteret af AdGuard som upassende for børn. Hvis du er voksen, kan du slukke forældrekontrol i indstillingerne eller tilføje denne hjemmeside til whitelisten.";
var blockedContentTitle$2 = "Forespørgslen til {site} blev blokeret af en filterregel. Hvis du ønsker adgang til denne side, skal du tilføje den til undtagelser.";
var ruleHeaderTitle$2 = "Blokeret af AdGuard";
var ruleContentTitle$2 = "AdGuard har forhindret denne side i at blive indlæst på grund af følgende filterregel";
var btnGoBack$2 = "Gå tilbage";
var btnFeedback$2 = "Send feedback";
var btnProceed$2 = "Fortsæt alligevel";
var btnProceedTo$2 = "Fortsæt til siden";
var inputPassword$2 = "Indtast adgangskode";
var errorPageHeader$2 = "Hjemmesiden er ikke tilgængelig";
var summary$2 = "Hjemmesiden på <strong>(var.PageUrl)</strong> kan være midlertidigt nede, eller også er den flyttet til en ny webadresse.";
var suggestionsHeader$2 = "Her er nogle forslag";
var suggestion1$2 = "Prøv <a href='(var.PageUrl)'>at genindlæse</a> denne hjemmeside senere.";
var suggestion2$2 = "Tjek webadressen for at være sikker på, at du har indtastet den rigtigt.";
var suggestion3$2 = "Tjek dine firewall indstillinger. Alle forbindelser skal være tilladte for AdGuard.";
var suggestion4$2 = "Tjek dine proxy indstillinger, hvis du bruger en proxyserver.";
var showDetails$2 = "Vis detaljer";
var wrongPassword$2 = "Forkert adgangskode";
var somethingWrong$2 = "Noget gik galt. Prøv venligst igen senere eller kontakt vores support.";
var errorPageTitle$2 = "Fejl";
var knowledgeBase$1 = "Du kan finde instruktionerne for installation af certifikater i vores <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Vidensbase</a>";
var download$2 = "Downloade";
var da = {
	malware: malware$2,
	phishing: phishing$2,
	advancedButton: advancedButton$2,
	moreInfoButton: moreInfoButton$2,
	pageTitle: pageTitle$2,
	safeHeaderTitle: safeHeaderTitle$2,
	safeContentTitle: safeContentTitle$2,
	parentalHeaderTitle: parentalHeaderTitle$2,
	parentalContentTitle: parentalContentTitle$2,
	parentalDescOne: parentalDescOne$2,
	parentalDnsDescTwo: parentalDnsDescTwo$2,
	blockedContentTitle: blockedContentTitle$2,
	ruleHeaderTitle: ruleHeaderTitle$2,
	ruleContentTitle: ruleContentTitle$2,
	btnGoBack: btnGoBack$2,
	btnFeedback: btnFeedback$2,
	btnProceed: btnProceed$2,
	btnProceedTo: btnProceedTo$2,
	inputPassword: inputPassword$2,
	errorPageHeader: errorPageHeader$2,
	summary: summary$2,
	suggestionsHeader: suggestionsHeader$2,
	suggestion1: suggestion1$2,
	suggestion2: suggestion2$2,
	suggestion3: suggestion3$2,
	suggestion4: suggestion4$2,
	showDetails: showDetails$2,
	wrongPassword: wrongPassword$2,
	somethingWrong: somethingWrong$2,
	errorPageTitle: errorPageTitle$2,
	knowledgeBase: knowledgeBase$1,
	download: download$2
};

var malware$3 = "Die Webseite unter <strong>(var.Host)</strong> wurde als bösartig gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.";
var phishing$3 = "Die Webseite unter <strong>(var.Host)</strong> wurde als Phishing-Webseite gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.";
var advancedButton$3 = "Weitere Aktionen";
var moreInfoButton$3 = "Mehr Informationen";
var pageTitle$3 = "Zugriff verweigert";
var safeHeaderTitle$3 = "AdGuard hat den Zugriff auf diese Webseite blockiert";
var safeContentTitle$3 = "Diese Webseite wurde als bösartig gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.";
var parentalHeaderTitle$3 = "Kindersicherung";
var parentalContentTitle$3 = "Wir haben diese Seite aufgrund der Einschränkungen des Kinderschutz-Filters blockiert.";
var parentalDescOne$3 = "Sind Sie alt genung? Geben Sie das Passwort ein.";
var parentalDnsDescTwo$3 = "Sie versuchen, eine Webseite zu erreichen, die von AdGuard als ungeeignet für Kinder eingestuft wurde. Wenn Sie ein Erwachsener sind, können Sie die Kindersicherung in den Einstellungen deaktivieren oder diese Webseite zur Whitelist hinzufügen.";
var blockedContentTitle$3 = "Die Anfrage an {site} wurde von einer Filter-Regel blockiert. Wenn Sie diese Seite besuchen möchten, fügen Sie diese bitte zu den Ausnahmen hinzu.";
var ruleHeaderTitle$3 = "Blockiert durch AdGuard";
var ruleContentTitle$3 = "AdGuard hat das Laden dieser Seite aufgrund folgender Filterregel verhindert";
var btnGoBack$3 = "Zurück";
var btnFeedback$3 = "Feedback senden";
var btnProceed$3 = "Trotzdem fortfahren\n";
var btnProceedTo$3 = "Weiter zur Webseite";
var inputPassword$3 = "Passwort eingeben";
var errorPageHeader$3 = "Diese Webseite ist nicht verfügbar";
var summary$3 = "Die Webseite unter <strong>(var.PageUrl)</strong> scheint offline zu sein oder ist auf eine neue Internetadresse umgezogen.";
var suggestionsHeader$3 = "Hier sind einige Vorschläge";
var suggestion1$3 = "Versuchen Sie, diese Webseite später <a href='(var.PageUrl)'>neu zu laden</a>.";
var suggestion2$3 = "Prüfen Sie bitte die Adresse der Webseite, um sicherzustellen, dass Sie diese korrekt eingegeben haben.";
var suggestion3$3 = "Prüfen Sie bitte Ihre Firewall-Einstellungen. Alle Verbindungen sollten für AdGuard erlaubt sein.";
var suggestion4$3 = "Prüfen Sie bitte Ihre Proxy-Einstellungen, wenn Sie einen Proxy-Server verwenden.";
var showDetails$3 = "Details anzeigen";
var wrongPassword$3 = "Falsches Passwort";
var somethingWrong$3 = "Etwas ist schief gelaufen. Bitte versuchen Sie es später noch einmal oder kontaktieren Sie unseren Support-Service.";
var errorPageTitle$3 = "Fehler";
var knowledgeBase$2 = "Die Installationsanweisungen für das Zertifikat finden Sie in unserer <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Wissensdatenbank</a>";
var download$3 = "Herunterladen";
var de = {
	malware: malware$3,
	phishing: phishing$3,
	advancedButton: advancedButton$3,
	moreInfoButton: moreInfoButton$3,
	pageTitle: pageTitle$3,
	safeHeaderTitle: safeHeaderTitle$3,
	safeContentTitle: safeContentTitle$3,
	parentalHeaderTitle: parentalHeaderTitle$3,
	parentalContentTitle: parentalContentTitle$3,
	parentalDescOne: parentalDescOne$3,
	parentalDnsDescTwo: parentalDnsDescTwo$3,
	blockedContentTitle: blockedContentTitle$3,
	ruleHeaderTitle: ruleHeaderTitle$3,
	ruleContentTitle: ruleContentTitle$3,
	btnGoBack: btnGoBack$3,
	btnFeedback: btnFeedback$3,
	btnProceed: btnProceed$3,
	btnProceedTo: btnProceedTo$3,
	inputPassword: inputPassword$3,
	errorPageHeader: errorPageHeader$3,
	summary: summary$3,
	suggestionsHeader: suggestionsHeader$3,
	suggestion1: suggestion1$3,
	suggestion2: suggestion2$3,
	suggestion3: suggestion3$3,
	suggestion4: suggestion4$3,
	showDetails: showDetails$3,
	wrongPassword: wrongPassword$3,
	somethingWrong: somethingWrong$3,
	errorPageTitle: errorPageTitle$3,
	knowledgeBase: knowledgeBase$2,
	download: download$3
};

var malware$4 = "This web page at <strong>(var.Host)</strong> has been reported as a malware page and has been blocked based on your security preferences.";
var phishing$4 = "This web page at <strong>(var.Host)</strong> has been reported as a phishing page and has been blocked based on your security preferences.";
var advancedButton$4 = "Advanced";
var moreInfoButton$4 = "More information";
var pageTitle$4 = "Access denied";
var safeHeaderTitle$4 = "AdGuard has blocked access to this page";
var safeContentTitle$4 = "This web page has been reported as a malware page and has been blocked based on your security preferences.";
var parentalHeaderTitle$4 = "Parental control";
var parentalContentTitle$4 = "We blocked this page because of parental filter restrictions.";
var parentalDescOne$4 = "Are you old enough? Enter the password";
var parentalDnsDescTwo$4 = "You're trying to reach a website listed by AdGuard as inappropriate for kids. If you’re an adult then you can switch off parental control in the settings or add this website to the whitelist.";
var blockedContentTitle$4 = "Request to {site} was blocked by a filter rule. If you want to access this site, add it to exceptions.";
var ruleHeaderTitle$4 = "Blocked by AdGuard";
var ruleContentTitle$4 = "AdGuard has prevented this page from loading due to the following filter rule";
var btnGoBack$4 = "Go back";
var btnFeedback$4 = "Send feedback";
var btnProceed$4 = "Proceed anyway";
var btnProceedTo$4 = "Proceed to site";
var inputPassword$4 = "Enter password";
var errorPageHeader$4 = "The webpage is not available";
var summary$4 = "The webpage at <strong>(var.PageUrl)</strong> might be temporarily down or it may have moved to a new web address.";
var suggestionsHeader$4 = "Here are some suggestions";
var suggestion1$4 = "Try <a href='(var.PageUrl)'>reload</a> this web page later.";
var suggestion2$4 = "Check the web page address to make sure you have entered it correctly.";
var suggestion3$4 = "Check your firewall settings. All connections should be allowed for AdGuard.";
var suggestion4$4 = "Check your proxy settings if you use proxy server.";
var showDetails$4 = "Show details";
var wrongPassword$4 = "Wrong password";
var somethingWrong$4 = "Something went wrong. Please try again later or contact our support service.";
var errorPageTitle$4 = "Error";
var knowledgeBase$3 = "You can find the certificate installation instructions in our <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Knowledge base</a>";
var download$4 = "Download";
var en = {
	malware: malware$4,
	phishing: phishing$4,
	advancedButton: advancedButton$4,
	moreInfoButton: moreInfoButton$4,
	pageTitle: pageTitle$4,
	safeHeaderTitle: safeHeaderTitle$4,
	safeContentTitle: safeContentTitle$4,
	parentalHeaderTitle: parentalHeaderTitle$4,
	parentalContentTitle: parentalContentTitle$4,
	parentalDescOne: parentalDescOne$4,
	parentalDnsDescTwo: parentalDnsDescTwo$4,
	blockedContentTitle: blockedContentTitle$4,
	ruleHeaderTitle: ruleHeaderTitle$4,
	ruleContentTitle: ruleContentTitle$4,
	btnGoBack: btnGoBack$4,
	btnFeedback: btnFeedback$4,
	btnProceed: btnProceed$4,
	btnProceedTo: btnProceedTo$4,
	inputPassword: inputPassword$4,
	errorPageHeader: errorPageHeader$4,
	summary: summary$4,
	suggestionsHeader: suggestionsHeader$4,
	suggestion1: suggestion1$4,
	suggestion2: suggestion2$4,
	suggestion3: suggestion3$4,
	suggestion4: suggestion4$4,
	showDetails: showDetails$4,
	wrongPassword: wrongPassword$4,
	somethingWrong: somethingWrong$4,
	errorPageTitle: errorPageTitle$4,
	knowledgeBase: knowledgeBase$3,
	download: download$4
};

var malware$5 = "Esta página en <strong>(var.Host)</strong> ha sido reportada como una página de malware y ha sido bloqueada basado en tus preferencias de seguridad.";
var phishing$5 = "Esta página en <strong>(var.Host)</strong> ha sido reportada como una página de phishing y ha sido bloqueada basado en tus preferencias de seguridad.";
var advancedButton$5 = "Avanzado";
var moreInfoButton$5 = "Más información";
var pageTitle$5 = "Acceso denegado";
var safeHeaderTitle$5 = "AdGuard ha bloqueado el acceso a esta página";
var safeContentTitle$5 = "Esta página ha sido reportada como una página de malware y ha sido bloqueada basado en tus preferencias de seguridad.";
var parentalHeaderTitle$5 = "Control parental";
var parentalContentTitle$5 = "Hemos bloqueado esta página debido a las restricciones de los filtros parentales.";
var parentalDescOne$5 = "¿Tienes la edad suficiente? Ingrese la contraseña";
var parentalDnsDescTwo$5 = "Está tratando de llegar a un sitio web listado por AdGuard como inapropiado para niños. Si es un adulto, puede desactivar el control parental en la configuración o añadir este sitio web a la lista blanca.";
var blockedContentTitle$5 = "La petición a {site} fue bloqueada por una regla de filtro. Si desea acceder a este sitio, añádalo a las excepciones.";
var ruleHeaderTitle$5 = "Bloqueado por AdGuard";
var ruleContentTitle$5 = "AdGuard ha impedido que esta página se cargue debido a la siguiente regla de filtro";
var btnGoBack$5 = "Regresar";
var btnFeedback$5 = "Enviar comentarios";
var btnProceed$5 = "Continuar de todos modos";
var btnProceedTo$5 = "Proceder al sitio";
var inputPassword$5 = "Ingrese la contraseña";
var errorPageHeader$5 = "La página web no está disponible";
var summary$5 = "La página web en <strong>(var.PageUrl)</strong> puede estar temporalmente desactivada o puede haberse movido a una nueva dirección web.";
var suggestionsHeader$5 = "Aquí hay varias sugerencias";
var suggestion1$5 = "Pruebe <a href='(var.PageUrl)'>recargar</a> esta página web más tarde.";
var suggestion2$5 = "Compruebe la dirección de la página web para asegurarse de que la ha introducido correctamente.";
var suggestion3$5 = "Compruebe la configuración de tu cortafuegos. Todas las conexiones deben ser permitidas para AdGuard.";
var suggestion4$5 = "Compruebe la configuración del proxy si utiliza un servidor proxy.";
var showDetails$5 = "Mostrar detalles";
var wrongPassword$5 = "Contraseña incorrecta\n";
var somethingWrong$5 = "Algo salió mal. Por favor, inténtelo de nuevo más tarde o póngase en contacto con nuestro servicio de soporte.";
var errorPageTitle$5 = "Error";
var knowledgeBase$4 = "Puede encontrar las instrucciones de instalación del certificado en nuestra <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>base de conocimientos</a>";
var download$5 = "Descargar";
var es = {
	malware: malware$5,
	phishing: phishing$5,
	advancedButton: advancedButton$5,
	moreInfoButton: moreInfoButton$5,
	pageTitle: pageTitle$5,
	safeHeaderTitle: safeHeaderTitle$5,
	safeContentTitle: safeContentTitle$5,
	parentalHeaderTitle: parentalHeaderTitle$5,
	parentalContentTitle: parentalContentTitle$5,
	parentalDescOne: parentalDescOne$5,
	parentalDnsDescTwo: parentalDnsDescTwo$5,
	blockedContentTitle: blockedContentTitle$5,
	ruleHeaderTitle: ruleHeaderTitle$5,
	ruleContentTitle: ruleContentTitle$5,
	btnGoBack: btnGoBack$5,
	btnFeedback: btnFeedback$5,
	btnProceed: btnProceed$5,
	btnProceedTo: btnProceedTo$5,
	inputPassword: inputPassword$5,
	errorPageHeader: errorPageHeader$5,
	summary: summary$5,
	suggestionsHeader: suggestionsHeader$5,
	suggestion1: suggestion1$5,
	suggestion2: suggestion2$5,
	suggestion3: suggestion3$5,
	suggestion4: suggestion4$5,
	showDetails: showDetails$5,
	wrongPassword: wrongPassword$5,
	somethingWrong: somethingWrong$5,
	errorPageTitle: errorPageTitle$5,
	knowledgeBase: knowledgeBase$4,
	download: download$5
};

var malware$6 = "این صفحه وب در <strong>(var.Host)</strong> بعنوان صفحه بدافزاز گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.";
var phishing$6 = "این صفحه وب در <strong>(var.Host)</strong> بعنوان صفحه فیشینگ گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.";
var advancedButton$6 = "پيشرفته";
var moreInfoButton$6 = "اطلاعات بیشتر";
var pageTitle$6 = "دسترسی رد شد";
var safeHeaderTitle$6 = "AdGuard دسترسی به این صفحه را مسدود کرده است";
var safeContentTitle$6 = "این صفحه وب بعنوان صفحه بدافزاز گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.";
var parentalHeaderTitle$6 = "نظارت والدین";
var parentalContentTitle$6 = "ما این صفحه را به علت محدودیت فیاتر نظارت والدین مسدود کردیم.";
var parentalDescOne$6 = "آیا به اندازه کافی سن تان زیاد است؟ رمزعبور را وارد کنید";
var parentalDnsDescTwo$6 = "AdGuard دسترسی شما را بدلیل اینکه این محتوا مناسب کودکان نیست محدود کرده است. اگر شما یک انسان بالغ هستید میتوانید نظارت والدین را در قسمت تنظیمات غیرفعال کرده یا این سایت را در لیست سفید قرار دهید.";
var blockedContentTitle$6 = "درخواست به {site} با مدل دستور فیلتر مسدود شده است. اگر میخواهید به این سایت دسترسی داشته باشید آن را به استثناء ها اضافه کنید.";
var ruleHeaderTitle$6 = "با AdGuard مسدود شده است";
var ruleContentTitle$6 = "AdGuard از دسترسی به این صفحه به علت دستور فیلتر زیر جلوگیری کرد";
var btnGoBack$6 = "برگرد";
var btnFeedback$6 = "اِرسال بازخورد";
var btnProceed$6 = "بهر حال ادامه بده";
var btnProceedTo$6 = "برو به سایت";
var inputPassword$6 = "رمزعبور را وارد کنید";
var errorPageHeader$6 = "صفحه وب در دسترس نیست";
var summary$6 = "صفحه وب در<strong>(var.PageUrl)</strong> امکان دارد موقتی از کار افتاده باشد یا آ« به آدرس وب جدید تغیر مکان یافته باشد.";
var suggestionsHeader$6 = "در اینجا تعدادی پیشنهاد";
var suggestion1$6 = "در بعد سعی کنید این صفحه وب <a href='(var.PageUrl)'>بارگیری مجدد</a> کنید.";
var suggestion2$6 = "آدرس وب را بررسی کنید و مطمئن شوید به درستی تایپ شده است.";
var suggestion3$6 = "تنظیمات فایروال خود را چک کنید. AdGuard باید اجازه دسترسی به همه اتصالات را داشته باشد.";
var suggestion4$6 = "اگر از پراکسی سرور استفاده می کنید،تنظیمات پراکسی را امتحان کنید.";
var showDetails$6 = "نمایش جزئیات";
var wrongPassword$6 = "رمزعبور اشتباه است";
var somethingWrong$6 = "مشکلی وجود دارد.لطفا بعدا امتحان کنید یا با سرویس پشتیبانی تماس بگیرید";
var errorPageTitle$6 = "خطا";
var knowledgeBase$5 = "شما میتوانید دستورالعمل نصب گواهینامه را در <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>محور آگاهی ما بیابید</a>";
var download$6 = "دانلود";
var fa = {
	malware: malware$6,
	phishing: phishing$6,
	advancedButton: advancedButton$6,
	moreInfoButton: moreInfoButton$6,
	pageTitle: pageTitle$6,
	safeHeaderTitle: safeHeaderTitle$6,
	safeContentTitle: safeContentTitle$6,
	parentalHeaderTitle: parentalHeaderTitle$6,
	parentalContentTitle: parentalContentTitle$6,
	parentalDescOne: parentalDescOne$6,
	parentalDnsDescTwo: parentalDnsDescTwo$6,
	blockedContentTitle: blockedContentTitle$6,
	ruleHeaderTitle: ruleHeaderTitle$6,
	ruleContentTitle: ruleContentTitle$6,
	btnGoBack: btnGoBack$6,
	btnFeedback: btnFeedback$6,
	btnProceed: btnProceed$6,
	btnProceedTo: btnProceedTo$6,
	inputPassword: inputPassword$6,
	errorPageHeader: errorPageHeader$6,
	summary: summary$6,
	suggestionsHeader: suggestionsHeader$6,
	suggestion1: suggestion1$6,
	suggestion2: suggestion2$6,
	suggestion3: suggestion3$6,
	suggestion4: suggestion4$6,
	showDetails: showDetails$6,
	wrongPassword: wrongPassword$6,
	somethingWrong: somethingWrong$6,
	errorPageTitle: errorPageTitle$6,
	knowledgeBase: knowledgeBase$5,
	download: download$6
};

var malware$7 = "Tämä sivusto <strong>(var.Host)</strong> on ilmoitettu olevan haittaohjelmasivusto ja se on estetty sinun turvallisuusasetusten perusteella.";
var phishing$7 = "Tämä sivusto <strong>(var.Host)</strong> on ilmoitettu olevan tietojenkalastelusivusto ja se on estetty sinun turvallisuusasetusten perusteella.";
var advancedButton$7 = "Lisäasetukset";
var moreInfoButton$7 = "Lisätiedot";
var pageTitle$7 = "Pääsy estetty";
var safeHeaderTitle$7 = "AdGuard on estänyt pääsyn tälle sivulle";
var safeContentTitle$7 = "Tämä sivusto on ilmoitettu olevan haittaohjelmasivusto ja se on estetty sinun turvallisuusasetusten perusteella.";
var parentalHeaderTitle$7 = "Lapsilukko";
var parentalContentTitle$7 = "Estimme tämän sivun lapsilukon suodatusrajoituksien takia.";
var parentalDescOne$7 = "Oletko riittävän vanha? Syötä salasana";
var parentalDnsDescTwo$7 = "Yrität tavoitella verkkosivustoa, jonka AdGuard on luetteloinut sopimattomaksi lapsille. Jos olet aikuinen, voit poistaa lapsilukon käytöstä asetuksista tai lisätä tämän verkkosivuston sallittuun luetteloon.";
var blockedContentTitle$7 = "Suodatussääntö esti pyynnön sivustoon {site}. Jos haluat päästä tälle sivustolle, lisää se poikkeuksiin.";
var ruleHeaderTitle$7 = "Estetty AdGuardilla";
var ruleContentTitle$7 = "AdGuard esti tätä sivustoa lataamasta seuraavan suodatinsäännön takia";
var btnGoBack$7 = "Palaa takaisin";
var btnFeedback$7 = "Lähetä palaute";
var btnProceed$7 = "Jatka silti";
var btnProceedTo$7 = "Jatka sivustolle";
var inputPassword$7 = "Syötä salasana";
var errorPageHeader$7 = "Verkkosivusto ei ole saatavilla";
var summary$7 = "Verkkosivusto osoittessa <strong>(var.PageUrl)</strong> saattaa olla hetkellisesti alhaalla tai se on siirretty toiseen verkko-osoitteeseen.";
var suggestionsHeader$7 = "Tässä joitakin ehdotuksia";
var suggestion1$7 = "Yritä <a href='(var.PageUrl)'>päivittää</a> tämä verkkosivusto myöhemmin.";
var suggestion2$7 = "Tarkista että olet kirjoittanut verkko-osoiteen oikein.";
var suggestion3$7 = "Tarkista palomuurin asetukset. Kaikki yhteydet tulisi sallia AdGuardille.";
var suggestion4$7 = "Tarkista välityspalvelinasetukset jos käytät välityspalvelinta.";
var showDetails$7 = "Näytä tiedot";
var wrongPassword$7 = "Väärä salasana";
var somethingWrong$7 = "Jokin meni pieleen. Yritä myöhemmin uudelleen tai ota yhteyttä tukipalveluumme.";
var errorPageTitle$7 = "Virhe";
var download$7 = "Ladata";
var fi = {
	malware: malware$7,
	phishing: phishing$7,
	advancedButton: advancedButton$7,
	moreInfoButton: moreInfoButton$7,
	pageTitle: pageTitle$7,
	safeHeaderTitle: safeHeaderTitle$7,
	safeContentTitle: safeContentTitle$7,
	parentalHeaderTitle: parentalHeaderTitle$7,
	parentalContentTitle: parentalContentTitle$7,
	parentalDescOne: parentalDescOne$7,
	parentalDnsDescTwo: parentalDnsDescTwo$7,
	blockedContentTitle: blockedContentTitle$7,
	ruleHeaderTitle: ruleHeaderTitle$7,
	ruleContentTitle: ruleContentTitle$7,
	btnGoBack: btnGoBack$7,
	btnFeedback: btnFeedback$7,
	btnProceed: btnProceed$7,
	btnProceedTo: btnProceedTo$7,
	inputPassword: inputPassword$7,
	errorPageHeader: errorPageHeader$7,
	summary: summary$7,
	suggestionsHeader: suggestionsHeader$7,
	suggestion1: suggestion1$7,
	suggestion2: suggestion2$7,
	suggestion3: suggestion3$7,
	suggestion4: suggestion4$7,
	showDetails: showDetails$7,
	wrongPassword: wrongPassword$7,
	somethingWrong: somethingWrong$7,
	errorPageTitle: errorPageTitle$7,
	download: download$7
};

var malware$8 = "Cette page web <strong>(var.Host)</strong> a été signalée comme une page malveillante et fût bloquée selon vos préférences de sécurité.";
var phishing$8 = "Cette page web <strong>(var.Host)</strong> a été signalée comme une page d'hameçonnage et fût bloquée selon vos préférences de sécurité.";
var advancedButton$8 = "Autres actions";
var moreInfoButton$8 = "Plus d'information";
var pageTitle$8 = "Accès refusé";
var safeHeaderTitle$8 = "AdGuard a bloqué l'accès à cette page";
var safeContentTitle$8 = "Cette page web a été signalée comme page malicieuse et a été bloquée selon vos préférences de sécurité.";
var parentalHeaderTitle$8 = "Contrôle parental";
var parentalContentTitle$8 = "Nous avons bloqué cette page à cause des restrictions du contrôle parental.";
var parentalDescOne$8 = "Entrez le mot de passe si vous êtes majeur";
var parentalDnsDescTwo$8 = "Vous essayez d'atteindre un site web classé par AdGuard comme inapproprié pour les enfants. Si vous êtes un adulte, alors vous pouvez désactiver le contrôle parental dans les paramètres ou bien ajouter ce site web à la liste blanche.";
var blockedContentTitle$8 = "La requête vers {site} a été bloquée par une règle de filtrage. Si vous voulez accéder à ce site, ajoutez-le aux exceptions.";
var ruleHeaderTitle$8 = "Bloqué par AdGuard";
var ruleContentTitle$8 = "AdGuard n'a pas autorisé le chargement de cette page en raison de la régle de filtrage suivante";
var btnGoBack$8 = "Retour";
var btnFeedback$8 = "Envoyer un commentaire";
var btnProceed$8 = "Forçage de procédure";
var btnProceedTo$8 = "Procéder au site web";
var inputPassword$8 = "Saisir le mot de passe";
var errorPageHeader$8 = "La page web n'est pas disponible";
var summary$8 = "La page web <strong>(var.PageUrl)</strong> pourrait être temporairement indisponible soit elle a été déplacée vers une nouvelle addresse.";
var suggestionsHeader$8 = "Voici quelques suggestions";
var suggestion1$8 = "Essayez de <a href='(var.PageUrl)'>recharger</a> cette page plus tard.";
var suggestion2$8 = "Vérifiez l'adresse de la page web pour vous assurer que vous l'avez entré correctement.";
var suggestion3$8 = "Vérifiez les paramètres de votre pare-feu. Toutes les connexions devraient être permises pour AdGuard.";
var suggestion4$8 = "Vérifiez les paramètres de votre proxy si vous utilisez un serveur proxy.";
var showDetails$8 = "Montrer les détails";
var wrongPassword$8 = "Mot de passe incorrect";
var somethingWrong$8 = "Un problème est survenu. Veuillez réessayer plus tard ou contacter notre service d'assistance technique.";
var errorPageTitle$8 = "Erreur";
var knowledgeBase$6 = "Vous pouvez trouver le manuel d'installation du certificat dans notre <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Base de connaissances</a>";
var download$8 = "Téléchargement";
var fr = {
	malware: malware$8,
	phishing: phishing$8,
	advancedButton: advancedButton$8,
	moreInfoButton: moreInfoButton$8,
	pageTitle: pageTitle$8,
	safeHeaderTitle: safeHeaderTitle$8,
	safeContentTitle: safeContentTitle$8,
	parentalHeaderTitle: parentalHeaderTitle$8,
	parentalContentTitle: parentalContentTitle$8,
	parentalDescOne: parentalDescOne$8,
	parentalDnsDescTwo: parentalDnsDescTwo$8,
	blockedContentTitle: blockedContentTitle$8,
	ruleHeaderTitle: ruleHeaderTitle$8,
	ruleContentTitle: ruleContentTitle$8,
	btnGoBack: btnGoBack$8,
	btnFeedback: btnFeedback$8,
	btnProceed: btnProceed$8,
	btnProceedTo: btnProceedTo$8,
	inputPassword: inputPassword$8,
	errorPageHeader: errorPageHeader$8,
	summary: summary$8,
	suggestionsHeader: suggestionsHeader$8,
	suggestion1: suggestion1$8,
	suggestion2: suggestion2$8,
	suggestion3: suggestion3$8,
	suggestion4: suggestion4$8,
	showDetails: showDetails$8,
	wrongPassword: wrongPassword$8,
	somethingWrong: somethingWrong$8,
	errorPageTitle: errorPageTitle$8,
	knowledgeBase: knowledgeBase$6,
	download: download$8
};

var malware$9 = "Halaman situs pada <strong>(var.Host)</strong> telah dilaporkan sebagai halaman malware dan telah diblokir berdasarkan preferensi keamanan Anda.";
var phishing$9 = "Halaman situs pada <strong>(var.Host)</strong> telah dilaporkan sebagai halaman phising dan telah diblokir berdasarkan preferensi keamanan Anda.";
var advancedButton$9 = "Lanjutan";
var moreInfoButton$9 = "Informasi lebih lanjut";
var pageTitle$9 = "Akses ditolak";
var safeHeaderTitle$9 = "AdGuard telah memblokir akses ke halaman ini";
var safeContentTitle$9 = "Halaman situs diketahui sebagai halaman malware dan telah diblokir berdasarkan preferensi keamanan Anda.";
var parentalHeaderTitle$9 = "Kontrol orang tua";
var parentalContentTitle$9 = "Kami memblokir halaman ini karena pembatasan penyaring orangtua.";
var parentalDescOne$9 = "Apakah Anda cukup umur? Masukkan kata sandi";
var parentalDnsDescTwo$9 = "Anda akan menjangkau situs yang terdaftar oleh AdGuard sebagai tindakan tidak pantas untuk anak. Jika anda seorang dewasa maka Anda dapat mematikan parental orang tua di pengaturan atau menambah situs ini kedalam daftar putih.";
var blockedContentTitle$9 = "Permintaan ke {site} telah diblokir oleh aturan penyaring. Jika Anda ingin mengakses situs ini, tambahkan ini ke pengecualian.";
var ruleHeaderTitle$9 = "Diblokir oleh AdGuard";
var ruleContentTitle$9 = "AdGuard menolak memuat halaman ini dikarenakan aturan penyaring berikut";
var btnGoBack$9 = "Kembali";
var btnFeedback$9 = "Kirim umpan balik";
var btnProceed$9 = "Tetap lanjutkan";
var btnProceedTo$9 = "Lanjutkan ke situs";
var inputPassword$9 = "Masukkan kata sandi";
var errorPageHeader$9 = "Halaman situs ini tidak tersedia";
var summary$9 = "Halaman situs <strong>(var.PageUrl)</strong> kemungkinan sedang mati sementara, atau mungkin telah pindah ke alamat web yang baru.";
var suggestionsHeader$9 = "Berikut adalah beberapa saran";
var suggestion1$9 = " Coba <a href='(var.PageUrl)'>muat ulang</a> halaman situs ini nanti.";
var suggestion2$9 = "Periksa halaman situs dan pastikan Anda memasukkannya dengan benar.";
var suggestion3$9 = "Periksa pengaturan firewall Anda. Semua koneksi harus sebaiknya diperbolehkan untuk AdGuard.";
var suggestion4$9 = "Periksa pengaturan proksi Anda jika menggunakan server proksi.";
var showDetails$9 = "Tampikan rincian";
var wrongPassword$9 = "Kata sandi salah";
var somethingWrong$9 = "Ada yang salah. Coba lagi nanti, atau kontak layanan dukungan kami.";
var errorPageTitle$9 = "Kesalahan";
var download$9 = "Mengunduh";
var id = {
	malware: malware$9,
	phishing: phishing$9,
	advancedButton: advancedButton$9,
	moreInfoButton: moreInfoButton$9,
	pageTitle: pageTitle$9,
	safeHeaderTitle: safeHeaderTitle$9,
	safeContentTitle: safeContentTitle$9,
	parentalHeaderTitle: parentalHeaderTitle$9,
	parentalContentTitle: parentalContentTitle$9,
	parentalDescOne: parentalDescOne$9,
	parentalDnsDescTwo: parentalDnsDescTwo$9,
	blockedContentTitle: blockedContentTitle$9,
	ruleHeaderTitle: ruleHeaderTitle$9,
	ruleContentTitle: ruleContentTitle$9,
	btnGoBack: btnGoBack$9,
	btnFeedback: btnFeedback$9,
	btnProceed: btnProceed$9,
	btnProceedTo: btnProceedTo$9,
	inputPassword: inputPassword$9,
	errorPageHeader: errorPageHeader$9,
	summary: summary$9,
	suggestionsHeader: suggestionsHeader$9,
	suggestion1: suggestion1$9,
	suggestion2: suggestion2$9,
	suggestion3: suggestion3$9,
	suggestion4: suggestion4$9,
	showDetails: showDetails$9,
	wrongPassword: wrongPassword$9,
	somethingWrong: somethingWrong$9,
	errorPageTitle: errorPageTitle$9,
	download: download$9
};

var malware$a = "Questa pagina web su <strong>(var.Host)</strong> è stata segnalata come pagina malware ed è stata bloccata secondo le tue preferenze di sicurezza.";
var phishing$a = "Questa pagina web su <strong>(var.Host)</strong> è stata segnalata come pagina phishing ed è stata bloccata secondo le tue preferenze di sicurezza.";
var advancedButton$a = "Avanzato";
var moreInfoButton$a = "Maggiori informazioni";
var pageTitle$a = "Accesso negato";
var safeHeaderTitle$a = "AdGuard ha bloccato l'accesso a questa pagina";
var safeContentTitle$a = "Questa pagina web è stata segnalata come pagina malware ed è stata bloccata secondo le tue preferenze di sicurezza.";
var parentalHeaderTitle$a = "Filtro Famiglia";
var parentalContentTitle$a = "Abbiamo bloccato questa pagina a causa delle restrizioni del filtro famiglia.";
var parentalDescOne$a = "Sei abbastanza grande? Inserisci la password";
var parentalDnsDescTwo$a = "Stai cercando di raggiungere un sito internet elencato da AdGuard come non appropriato per i bambini. Se sei un adulto puoi disabilitare il filtro famiglia nelle impostazioni o aggiungere questo sito alla whitelist.";
var blockedContentTitle$a = "La richiesta verso {site} è stata bloccata da un filtro. Se vuoi accedere al sito, aggiungilo alle eccezioni.";
var ruleHeaderTitle$a = "Bloccato da AdGuard";
var ruleContentTitle$a = "AdGuard ha bloccato il caricamento di questa pagina per il seguente filtro";
var btnGoBack$a = "Torna indietro";
var btnFeedback$a = "Invia feedback";
var btnProceed$a = "Procedi comunque";
var btnProceedTo$a = "Procedi al sito";
var inputPassword$a = "Inserisci password";
var errorPageHeader$a = "La pagina web non è disponibile";
var summary$a = "La pagina web su <strong>(var.PageUrl)</strong> potrebbe essere temporaneamente non disponibile o potrebbe essere stata spostata ad un nuovo indirizzo.";
var suggestionsHeader$a = "Ecco alcuni suggerimenti";
var suggestion1$a = "Prova a <a href='(var.PageUrl)'>ricaricare</a> questa pagina web più tardi.";
var suggestion2$a = "Controlla l'indirizzo della pagina web per assicurarti che lo hai inserito correttamente.";
var suggestion3$a = "Controlla le impostazioni del firewall. Tutte le connessioni dovrebbero essere permesse per AdGuard.";
var suggestion4$a = "Controlla le impostazioni del proxy se usi un server proxy.";
var showDetails$a = "Mostra dettagli";
var wrongPassword$a = "Password errata";
var somethingWrong$a = "Qualcosa è andato storto. Perfavore riprova più tardi, oppure contatta il nostro supporto tecnico";
var errorPageTitle$a = "Errore";
var knowledgeBase$7 = "Puoi trovare le istruzioni per installare il certificato nella <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Base di conoscenza</a>";
var download$a = "Scaricare";
var it = {
	malware: malware$a,
	phishing: phishing$a,
	advancedButton: advancedButton$a,
	moreInfoButton: moreInfoButton$a,
	pageTitle: pageTitle$a,
	safeHeaderTitle: safeHeaderTitle$a,
	safeContentTitle: safeContentTitle$a,
	parentalHeaderTitle: parentalHeaderTitle$a,
	parentalContentTitle: parentalContentTitle$a,
	parentalDescOne: parentalDescOne$a,
	parentalDnsDescTwo: parentalDnsDescTwo$a,
	blockedContentTitle: blockedContentTitle$a,
	ruleHeaderTitle: ruleHeaderTitle$a,
	ruleContentTitle: ruleContentTitle$a,
	btnGoBack: btnGoBack$a,
	btnFeedback: btnFeedback$a,
	btnProceed: btnProceed$a,
	btnProceedTo: btnProceedTo$a,
	inputPassword: inputPassword$a,
	errorPageHeader: errorPageHeader$a,
	summary: summary$a,
	suggestionsHeader: suggestionsHeader$a,
	suggestion1: suggestion1$a,
	suggestion2: suggestion2$a,
	suggestion3: suggestion3$a,
	suggestion4: suggestion4$a,
	showDetails: showDetails$a,
	wrongPassword: wrongPassword$a,
	somethingWrong: somethingWrong$a,
	errorPageTitle: errorPageTitle$a,
	knowledgeBase: knowledgeBase$7,
	download: download$a
};

var malware$b = "<strong>(var.Host)</strong> はマルウェアのページとして報告されています。セキュリティの設定に基づいてブロックされました。";
var phishing$b = "<strong>(var.Host)</strong> はフィッシング詐欺のページとして報告されており、セキュリティの設定に基づいてブロックれました。";
var advancedButton$b = "高度な設定";
var moreInfoButton$b = "詳細";
var pageTitle$b = "アクセス拒否";
var safeHeaderTitle$b = "AdGuardはこのページへのアクセスをブロックしました";
var safeContentTitle$b = "このページはマルウェアのページとして報告されています。セキュリティの設定に基づいてブロックされました。";
var parentalHeaderTitle$b = "ペアレンタルコントロール";
var parentalContentTitle$b = "このページはペアレンタルコントロールによってブロックされました。";
var parentalDescOne$b = "大人の方はパスワードを入力してください。";
var parentalDnsDescTwo$b = "子どもに不適切なウェブサイトとしてAdGuardに登録されているサイトにアクセスしようとしています。設定を行った保護者の方は設定からペアレンタルコントロールをオフにするか、このウェブサイトをホワイトリストに追加することができます。";
var blockedContentTitle$b = "{site}へのリクエストはフィルタルールによってブロックされました。サイトにアクセスしたい場合は例外に追加してください。";
var ruleHeaderTitle$b = "AdGuardによってブロックされました";
var ruleContentTitle$b = "AdGuardは以下のフィルタリング・ルールに従って、このページの読み込みを防止しました。";
var btnGoBack$b = "戻る";
var btnFeedback$b = "フィードバックを送る";
var btnProceed$b = "そのまま続行する";
var btnProceedTo$b = "サイトへ続行する";
var inputPassword$b = "パスワードを入力";
var errorPageHeader$b = "ウェブページは利用できません";
var summary$b = "<strong>(var.PageUrl)</strong> にあるウェブページが一時的にダウンしているか、新しいウェブアドレスに移動している可能性があります。";
var suggestionsHeader$b = "問題を解決するために、次の操作をお試しください";
var suggestion1$b = "後ほどこのウェブページを<a href='(var.PageUrl)'>リロード</a>してみてください。";
var suggestion2$b = "Webページのアドレスが正しく入力してあるかを確認してください。";
var suggestion3$b = "ファイアウォールの設定を確認してください。 AdGuard接続のすべてが許可されている必要があります。";
var suggestion4$b = "プロキシサーバーを使用している場合は、プロキシ設定を確認してください。";
var showDetails$b = "詳細を表示";
var wrongPassword$b = "パスワードが間違っています";
var somethingWrong$b = "原因不明の問題が起きました。 後でもう一度お試しいただくか、サポートサービスにご連絡ください。";
var errorPageTitle$b = "エラー";
var knowledgeBase$8 = "証明書のインストール手順は私たちの<a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>ナレッジ・ベース</a>でご確認できます。";
var download$b = "ダウンロード";
var ja = {
	malware: malware$b,
	phishing: phishing$b,
	advancedButton: advancedButton$b,
	moreInfoButton: moreInfoButton$b,
	pageTitle: pageTitle$b,
	safeHeaderTitle: safeHeaderTitle$b,
	safeContentTitle: safeContentTitle$b,
	parentalHeaderTitle: parentalHeaderTitle$b,
	parentalContentTitle: parentalContentTitle$b,
	parentalDescOne: parentalDescOne$b,
	parentalDnsDescTwo: parentalDnsDescTwo$b,
	blockedContentTitle: blockedContentTitle$b,
	ruleHeaderTitle: ruleHeaderTitle$b,
	ruleContentTitle: ruleContentTitle$b,
	btnGoBack: btnGoBack$b,
	btnFeedback: btnFeedback$b,
	btnProceed: btnProceed$b,
	btnProceedTo: btnProceedTo$b,
	inputPassword: inputPassword$b,
	errorPageHeader: errorPageHeader$b,
	summary: summary$b,
	suggestionsHeader: suggestionsHeader$b,
	suggestion1: suggestion1$b,
	suggestion2: suggestion2$b,
	suggestion3: suggestion3$b,
	suggestion4: suggestion4$b,
	showDetails: showDetails$b,
	wrongPassword: wrongPassword$b,
	somethingWrong: somethingWrong$b,
	errorPageTitle: errorPageTitle$b,
	knowledgeBase: knowledgeBase$8,
	download: download$b
};

var malware$c = "이 웹 페이지 <strong>(var.Host)</strong>는 악성 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.";
var phishing$c = "이 웹 페이지 <strong>(var.Host)</strong>는 피싱 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.";
var advancedButton$c = "고급 설정";
var moreInfoButton$c = "추가 정보";
var pageTitle$c = "접근 거부됨";
var safeHeaderTitle$c = "AdGuard가 이 페이지 접근을 차단하였습니다.";
var safeContentTitle$c = "이 웹 페이지는 악성 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.";
var parentalHeaderTitle$c = "자녀 보호";
var parentalContentTitle$c = "이 페이지는 자녀 보호 필터 제한으로 차단되었습니다.";
var parentalDescOne$c = "자녀 보호 모드를 해제하려면 비밀번호를 입력하세요.";
var parentalDnsDescTwo$c = "지금 AdGuard에서 지정한 어린이들에게 부적절한 웹 사이트에 접속하려고 합니다. 성인인 경우 설정에서 자녀 보호를 해제하거나 이 웹 사이트를 화이트리스트에 추가할 수 있습니다.";
var blockedContentTitle$c = "{site} 페이지는 필터 규칙에 의해 차단 되었습니다. 이 사이트에 접근하고 싶다면 예외 항목에 추가 하세요.";
var ruleHeaderTitle$c = "AdGuard에 의해 차단됨";
var ruleContentTitle$c = "다음 필터 규칙으로 인해 AdGuard에서 이 페이지를 로드하지 못했습니다.";
var btnGoBack$c = "뒤로가기";
var btnFeedback$c = "피드백 전송";
var btnProceed$c = "그래도 계속하기";
var btnProceedTo$c = "사이트 접속하기";
var inputPassword$c = "비밀번호 입력";
var errorPageHeader$c = "웹페이지를 사용할 수 없습니다.";
var summary$c = "<strong>(var.PageUrl)</strong> 웹 페이지는 일시적으로 다운되었거나 다른 웹 주소로 변경되었을 수 있습니다.";
var suggestionsHeader$c = "여기에 몇가지 제안이 있습니다.";
var suggestion1$c = "잠시 후 이 웹 페이지를 <a href='(var.PageUrl)'>새로고침</a>하세요.";
var suggestion2$c = "웹 페이지 주소를 올바르게 입력했는지 확인하세요.";
var suggestion3$c = "방화벽 설정을 확인하세요. AdGuard의 모든 연결은 허용되어 있어야 합니다.";
var suggestion4$c = "프록시 서버를 사용 하시면 프록시 설정을 확인 하세요.";
var showDetails$c = "자세히 보기";
var wrongPassword$c = "비밀번호가 맞지 않습니다.";
var somethingWrong$c = "알 수 없는 오류가 발생했습니다. 다시 시도하거나 고객 지원에 문의해주세요.";
var errorPageTitle$c = "오류";
var knowledgeBase$9 = "<a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>지식 창고</a>에서 인증서 설치 방법을 확인할 수 있습니다.";
var download$c = "다운로드";
var ko = {
	malware: malware$c,
	phishing: phishing$c,
	advancedButton: advancedButton$c,
	moreInfoButton: moreInfoButton$c,
	pageTitle: pageTitle$c,
	safeHeaderTitle: safeHeaderTitle$c,
	safeContentTitle: safeContentTitle$c,
	parentalHeaderTitle: parentalHeaderTitle$c,
	parentalContentTitle: parentalContentTitle$c,
	parentalDescOne: parentalDescOne$c,
	parentalDnsDescTwo: parentalDnsDescTwo$c,
	blockedContentTitle: blockedContentTitle$c,
	ruleHeaderTitle: ruleHeaderTitle$c,
	ruleContentTitle: ruleContentTitle$c,
	btnGoBack: btnGoBack$c,
	btnFeedback: btnFeedback$c,
	btnProceed: btnProceed$c,
	btnProceedTo: btnProceedTo$c,
	inputPassword: inputPassword$c,
	errorPageHeader: errorPageHeader$c,
	summary: summary$c,
	suggestionsHeader: suggestionsHeader$c,
	suggestion1: suggestion1$c,
	suggestion2: suggestion2$c,
	suggestion3: suggestion3$c,
	suggestion4: suggestion4$c,
	showDetails: showDetails$c,
	wrongPassword: wrongPassword$c,
	somethingWrong: somethingWrong$c,
	errorPageTitle: errorPageTitle$c,
	knowledgeBase: knowledgeBase$9,
	download: download$c
};

var malware$d = "Šis tinklalapis, adresu <strong>(var.Host)</strong>, buvo pažymėtas kaip kenkėjiškų programų puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.";
var phishing$d = "Šis tinklalapis, adresu <strong>(var.Host)</strong>, buvo pažymėtas kaip sukčiavimo puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.";
var advancedButton$d = "Papildomai";
var moreInfoButton$d = "Daugiau informacijos";
var pageTitle$d = "Prieiga neleidžiama";
var safeHeaderTitle$d = "AdGuard užblokavo prieigą prie šio puslapio";
var safeContentTitle$d = "Šis tinklalapis buvo pažymėtas kaip kenkėjiškų programų puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.";
var parentalHeaderTitle$d = "Tėvų kontrolė";
var parentalContentTitle$d = "Užblokavome šį puslapį dėl tėvų kontrolės filtrų apribojimų.";
var parentalDescOne$d = "Ar esate suaugęs? Įveskite slaptažodį";
var parentalDnsDescTwo$d = "Bandote pasiekti svetainę, kurią AdGuard laiko kaip netinkamą vaikams. Jei esate suaugęs, nustatymuose galite išjungti tėvų kontrolę arba įtraukti šią svetainę į baltąjį sąrašą.";
var blockedContentTitle$d = "Užklausą į {site} buvo užblokuota filtravimo taisyklės. Jei norite pasiekti šią svetainę, pridėkite ją prie išimčių.";
var ruleHeaderTitle$d = "Užblokavo AdGuard";
var ruleContentTitle$d = "AdGuard neleido įkelti šio puslapio dėl šios filtravimo taisyklės";
var btnGoBack$d = "Grįžti";
var btnFeedback$d = "Grįžtamasis ryšys";
var btnProceed$d = "Tęsti vis tiek";
var btnProceedTo$d = "Pereiti į svetainę";
var inputPassword$d = "Įveskite slaptažodį";
var errorPageHeader$d = "Tinklalapis nepasiekiamas";
var summary$d = "Tinklalapis <strong>(var.PageUrl)</strong> laikinai nepasiekiamas arba neegzistuoja.";
var suggestionsHeader$d = "Štai keletas prielaidų";
var suggestion1$d = "Pabandykite<a href='(var.PageUrl)'>įkelti</a> šį tinklalapį vėliau.";
var suggestion2$d = "Patikrinkite svetainės adresą, kad įsitikintumėte, jog jį teisingai įvedėte.";
var suggestion3$d = "Patikrinkite užkardos nustatymus. Visos jungtys turi būti leidžiamos AdGuard.";
var suggestion4$d = "Patikrinkite savo proxy nustatymus, jei jūs naudojate proxy serverį.";
var showDetails$d = "Rodyti išsamią informaciją";
var wrongPassword$d = "Neteisingas slaptažodis";
var somethingWrong$d = "Kažkas negerai. Pabandykite dar kartą vėliau arba susisiekite su mūsų palaikymo tarnyba.";
var errorPageTitle$d = "Klaida";
var knowledgeBase$a = "Sertifikato diegimo instrukcijas galite rasti mūsų <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Knowledge base</a>Žinių bazėje";
var download$d = "Atsiunčiama";
var lt = {
	malware: malware$d,
	phishing: phishing$d,
	advancedButton: advancedButton$d,
	moreInfoButton: moreInfoButton$d,
	pageTitle: pageTitle$d,
	safeHeaderTitle: safeHeaderTitle$d,
	safeContentTitle: safeContentTitle$d,
	parentalHeaderTitle: parentalHeaderTitle$d,
	parentalContentTitle: parentalContentTitle$d,
	parentalDescOne: parentalDescOne$d,
	parentalDnsDescTwo: parentalDnsDescTwo$d,
	blockedContentTitle: blockedContentTitle$d,
	ruleHeaderTitle: ruleHeaderTitle$d,
	ruleContentTitle: ruleContentTitle$d,
	btnGoBack: btnGoBack$d,
	btnFeedback: btnFeedback$d,
	btnProceed: btnProceed$d,
	btnProceedTo: btnProceedTo$d,
	inputPassword: inputPassword$d,
	errorPageHeader: errorPageHeader$d,
	summary: summary$d,
	suggestionsHeader: suggestionsHeader$d,
	suggestion1: suggestion1$d,
	suggestion2: suggestion2$d,
	suggestion3: suggestion3$d,
	suggestion4: suggestion4$d,
	showDetails: showDetails$d,
	wrongPassword: wrongPassword$d,
	somethingWrong: somethingWrong$d,
	errorPageTitle: errorPageTitle$d,
	knowledgeBase: knowledgeBase$a,
	download: download$d
};

var malware$e = "Strona internetowa <strong>(var.Host)</strong> została zgłoszona jako zawierająca złośliwe oprogramowanie i została ona zablokowana w oparciu o Twoje ustawienia bezpieczeństwa.";
var phishing$e = "Strona internetowa <strong>(var.Host)</strong> jest stroną wyłudzającą poufne informacje i została ona zablokowana w oparciu o Twoje ustawienia bezpieczeństwa.";
var advancedButton$e = "Zaawansowane";
var moreInfoButton$e = "Więcej informacji";
var pageTitle$e = "Odmowa dostępu";
var safeHeaderTitle$e = "AdGuard zablokował dostęp do tej strony";
var safeContentTitle$e = "Ta strona internetowa została zgłoszona jako strona ze złośliwym oprogramowaniem i została zablokowana na podstawie Twoich preferencji zabezpieczeń.";
var parentalHeaderTitle$e = "Kontrola rodzicielska";
var parentalContentTitle$e = "Zablokowaliśmy stronę z powodu ograniczeń filtra rodzicielskiego.";
var parentalDescOne$e = "Jesteś wystarczająco dorosły? Podaj hasło";
var parentalDnsDescTwo$e = "Próbujesz dotrzeć do witryny oznaczonej przez AdGuard jako nieodpowiednia dla dzieci. Jeśli jesteś dorosły, możesz wyłączyć kontrolę rodzicielską w ustawieniach lub dodać tę witrynę do białej listy.";
var blockedContentTitle$e = "Żądanie {site} zostało zablokowane przez regułę filtrowania. Jeśli chcesz uzyskać dostęp do tej witryny, dodaj ją do wyjątków.";
var ruleHeaderTitle$e = "Zablokowana przez AdGuard";
var ruleContentTitle$e = "AdGuard uniemożliwił załadowanie tej strony z powodu następującej reguły filtrowania";
var btnGoBack$e = "Wróć";
var btnFeedback$e = "Wyślij opinię";
var btnProceed$e = "Mimo wszystko kontynuuj";
var btnProceedTo$e = "Przejdź do witryny";
var inputPassword$e = "Wpisz hasło";
var errorPageHeader$e = "Strona internetowa nie jest dostępna";
var summary$e = "Strona <strong>(var.PageUrl)</strong> może być tymczasowo niedostępna lub mogła zostać przeniesiona do nowego adresu internetowego.";
var suggestionsHeader$e = "Oto kilka propozycji";
var suggestion1$e = "Spróbuj <a href='(var.PageUrl)'>odświeżyć</a>tę stronę później.";
var suggestion2$e = "Sprawdź adres strony internetowej, aby upewnić się, że został wpisany prawidłowo.";
var suggestion3$e = "Sprawdź ustawienia zapory sieciowej. Wszystkie połączenia programu AdGuard powinny być dozwolone.";
var suggestion4$e = "Jeśli korzystasz z serwera proxy, sprawdź jego ustawienia.";
var showDetails$e = "Pokaż szczegóły";
var wrongPassword$e = "Błędne hasło";
var somethingWrong$e = "Coś poszło nie tak. Spróbuj ponownie później lub skontaktuj się z naszym działem wsparcia.";
var errorPageTitle$e = "Błąd";
var knowledgeBase$b = "Instrukcje instalacji certyfikatu można znaleźć w naszej <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Bazie wiedzy</a>";
var download$e = "Pobierz";
var pl = {
	malware: malware$e,
	phishing: phishing$e,
	advancedButton: advancedButton$e,
	moreInfoButton: moreInfoButton$e,
	pageTitle: pageTitle$e,
	safeHeaderTitle: safeHeaderTitle$e,
	safeContentTitle: safeContentTitle$e,
	parentalHeaderTitle: parentalHeaderTitle$e,
	parentalContentTitle: parentalContentTitle$e,
	parentalDescOne: parentalDescOne$e,
	parentalDnsDescTwo: parentalDnsDescTwo$e,
	blockedContentTitle: blockedContentTitle$e,
	ruleHeaderTitle: ruleHeaderTitle$e,
	ruleContentTitle: ruleContentTitle$e,
	btnGoBack: btnGoBack$e,
	btnFeedback: btnFeedback$e,
	btnProceed: btnProceed$e,
	btnProceedTo: btnProceedTo$e,
	inputPassword: inputPassword$e,
	errorPageHeader: errorPageHeader$e,
	summary: summary$e,
	suggestionsHeader: suggestionsHeader$e,
	suggestion1: suggestion1$e,
	suggestion2: suggestion2$e,
	suggestion3: suggestion3$e,
	suggestion4: suggestion4$e,
	showDetails: showDetails$e,
	wrongPassword: wrongPassword$e,
	somethingWrong: somethingWrong$e,
	errorPageTitle: errorPageTitle$e,
	knowledgeBase: knowledgeBase$b,
	download: download$e
};

var malware$f = "Este site <strong>(var.Host)</strong> foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.";
var phishing$f = "Este site <strong>(var.Host)</strong> foi classificado como uma página de phishing e foi bloqueada com base em suas preferências de segurança.";
var advancedButton$f = "Avançado";
var moreInfoButton$f = "Mais informações";
var pageTitle$f = "Acesso negado";
var safeHeaderTitle$f = "AdGuard bloqueou o acesso a esta página";
var safeContentTitle$f = "Este site foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.";
var parentalHeaderTitle$f = "Controle parental";
var parentalContentTitle$f = "Bloqueamos esta página por causa das restrições de filtros do controle parental.";
var parentalDescOne$f = "Você tem idade suficiente? Digite a senha";
var parentalDnsDescTwo$f = "Você está tentando acessar um site listado pelo AdGuard como impróprio para crianças. Se você é um adulto, você pode desativar o controle parental nas configurações ou adicionar esse site na lista branca.";
var blockedContentTitle$f = "Solicitação para {site} foi bloqueada pelo filtro de usuário. Se você quiser acessar este site, adicione na lista de exceções.";
var ruleHeaderTitle$f = "Bloqueado pelo AdGuard";
var ruleContentTitle$f = "O AdGuard impediu o carregamento dessa página devido à seguinte regra de filtro";
var btnGoBack$f = "Voltar";
var btnFeedback$f = "Enviar Feedback";
var btnProceed$f = "Continuar mesmo assim";
var btnProceedTo$f = "Prosseguir para o site";
var inputPassword$f = "Digite a senha";
var errorPageHeader$f = "Este site não está disponível";
var summary$f = "O site <strong>(var.PageUrl)</strong> pode estar temporariamente indisponível ou pode ter sido movido para um novo endereço.";
var suggestionsHeader$f = "Aqui estão algumas sugestões";
var suggestion1$f = "Tente <a href='(var.PageUrl)'>recarregar</a> este site mais tarde.";
var suggestion2$f = "Verifique o endereço da página e certifique de que você digitou corretamente.";
var suggestion3$f = "Verifique suas configurações de firewall. Todas conexões devem estar permitidas para o AdGuard.";
var suggestion4$f = "Se você estiver usando um servidor proxy, verifique suas configurações.";
var showDetails$f = "Mostrar detalhes";
var wrongPassword$f = "Senha incorreta";
var somethingWrong$f = "Algo deu errado. Por favor, tente novamente mais tarde ou entre em contato com o nosso suporte técnico.";
var errorPageTitle$f = "Erro";
var knowledgeBase$c = "Você pode encontrar as instruções de instalação do certificado em nossa <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Base de conhecimento</a>";
var download$f = "Baixar";
var ptBR = {
	malware: malware$f,
	phishing: phishing$f,
	advancedButton: advancedButton$f,
	moreInfoButton: moreInfoButton$f,
	pageTitle: pageTitle$f,
	safeHeaderTitle: safeHeaderTitle$f,
	safeContentTitle: safeContentTitle$f,
	parentalHeaderTitle: parentalHeaderTitle$f,
	parentalContentTitle: parentalContentTitle$f,
	parentalDescOne: parentalDescOne$f,
	parentalDnsDescTwo: parentalDnsDescTwo$f,
	blockedContentTitle: blockedContentTitle$f,
	ruleHeaderTitle: ruleHeaderTitle$f,
	ruleContentTitle: ruleContentTitle$f,
	btnGoBack: btnGoBack$f,
	btnFeedback: btnFeedback$f,
	btnProceed: btnProceed$f,
	btnProceedTo: btnProceedTo$f,
	inputPassword: inputPassword$f,
	errorPageHeader: errorPageHeader$f,
	summary: summary$f,
	suggestionsHeader: suggestionsHeader$f,
	suggestion1: suggestion1$f,
	suggestion2: suggestion2$f,
	suggestion3: suggestion3$f,
	suggestion4: suggestion4$f,
	showDetails: showDetails$f,
	wrongPassword: wrongPassword$f,
	somethingWrong: somethingWrong$f,
	errorPageTitle: errorPageTitle$f,
	knowledgeBase: knowledgeBase$c,
	download: download$f
};

var malware$g = "Este site <strong>(var.Host)</strong> foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.";
var phishing$g = "Este site <strong>(var.Host)</strong> foi classificado como uma página de phishing e foi bloqueada com base em suas preferências de segurança.";
var advancedButton$g = "Avançado";
var moreInfoButton$g = "Mais informações";
var pageTitle$g = "Acesso negado";
var safeHeaderTitle$g = "AdGuard bloqueou o acesso a esta página";
var safeContentTitle$g = "Este site foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.";
var parentalHeaderTitle$g = "Controle parental";
var parentalContentTitle$g = "Bloqueamos esta página por causa das restrições de filtros do controle parental.";
var parentalDescOne$g = "Você tem idade suficiente? Digite a senha";
var parentalDnsDescTwo$g = "Você está tentando acessar um site listado pelo AdGuard como impróprio para crianças. Se você é um adulto, você pode desativar o controle parental nas configurações ou adicionar esse site na lista branca.";
var blockedContentTitle$g = "Solicitação para {site} foi bloqueada pelo filtro de usuário. Se você quiser acessar este site, adicione na lista de exceções.";
var ruleHeaderTitle$g = "Bloqueado pelo AdGuard";
var ruleContentTitle$g = "O AdGuard impediu o carregamento dessa página devido à seguinte regra de filtro";
var btnGoBack$g = "Voltar";
var btnFeedback$g = "Enviar Feedback";
var btnProceed$g = "Continuar mesmo assim";
var btnProceedTo$g = "Prosseguir para o site";
var inputPassword$g = "Digite a senha";
var errorPageHeader$g = "Este site não está disponível";
var summary$g = "O site <strong>(var.PageUrl)</strong> pode estar temporariamente indisponível ou pode ter sido movido para um novo endereço.";
var suggestionsHeader$g = "Aqui estão algumas sugestões";
var suggestion1$g = "Tente <a href='(var.PageUrl)'>recarregar</a> este site mais tarde.";
var suggestion2$g = "Verifique o endereço da página e certifique de que você digitou corretamente.";
var suggestion3$g = "Verifique suas configurações de firewall. Todas conexões devem estar permitidas para o AdGuard.";
var suggestion4$g = "Se você estiver usando um servidor proxy, verifique suas configurações.";
var showDetails$g = "Mostrar detalhes";
var wrongPassword$g = "Senha incorreta";
var somethingWrong$g = "Algo deu errado. Por favor, tente novamente mais tarde ou entre em contato com o nosso suporte técnico.";
var errorPageTitle$g = "Erro";
var knowledgeBase$d = "Pode encontrar as instruções de instalação do certificado na nossa <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Base de conhecimentos</a>";
var download$g = "Transferência";
var ptPT = {
	malware: malware$g,
	phishing: phishing$g,
	advancedButton: advancedButton$g,
	moreInfoButton: moreInfoButton$g,
	pageTitle: pageTitle$g,
	safeHeaderTitle: safeHeaderTitle$g,
	safeContentTitle: safeContentTitle$g,
	parentalHeaderTitle: parentalHeaderTitle$g,
	parentalContentTitle: parentalContentTitle$g,
	parentalDescOne: parentalDescOne$g,
	parentalDnsDescTwo: parentalDnsDescTwo$g,
	blockedContentTitle: blockedContentTitle$g,
	ruleHeaderTitle: ruleHeaderTitle$g,
	ruleContentTitle: ruleContentTitle$g,
	btnGoBack: btnGoBack$g,
	btnFeedback: btnFeedback$g,
	btnProceed: btnProceed$g,
	btnProceedTo: btnProceedTo$g,
	inputPassword: inputPassword$g,
	errorPageHeader: errorPageHeader$g,
	summary: summary$g,
	suggestionsHeader: suggestionsHeader$g,
	suggestion1: suggestion1$g,
	suggestion2: suggestion2$g,
	suggestion3: suggestion3$g,
	suggestion4: suggestion4$g,
	showDetails: showDetails$g,
	wrongPassword: wrongPassword$g,
	somethingWrong: somethingWrong$g,
	errorPageTitle: errorPageTitle$g,
	knowledgeBase: knowledgeBase$d,
	download: download$g
};

var malware$h = "Данная веб-страница <strong>(var.Host)</strong> может содержать вредоносное ПО. Она была заблокирована в соответствии с вашими настройками безопасности.";
var phishing$h = "Данная веб-страница <strong>(var.Host)</strong> может являться фишинговой. Она была заблокирована в соответствии с вашими настройками безопасности.";
var advancedButton$h = "Дополнительно";
var moreInfoButton$h = "Подробная информация";
var pageTitle$h = "Доступ заблокирован";
var safeHeaderTitle$h = "AdGuard заблокировал доступ к этой странице";
var safeContentTitle$h = "Данная страница может содержать вредоносное ПО. Она была заблокирована в соответствии с вашими настройками безопасности.";
var parentalHeaderTitle$h = "Родительский контроль";
var parentalContentTitle$h = "Данная страница была заблокирована из-за ограничений фильтра Родительского контроля.";
var parentalDescOne$h = "Введите пароль, если вы совершеннолетний.";
var parentalDnsDescTwo$h = "Вы пытаетесь получить доступ к сайту, который AdGuard считает неподходящим для детей. Если вы взрослый человек, вы можете отключить Родительский контроль в настройках AdGuard или внести сайт в белый список.";
var blockedContentTitle$h = "Запрос к {site} был заблокирован правилом фильтрации. Если вы хотите получить доступ к этому сайту, добавьте его в исключения.";
var ruleHeaderTitle$h = "Запрос заблокирован AdGuard";
var ruleContentTitle$h = "AdGuard предотвратил загрузку этой страницы в соответствии со следующим правилом фильтрации";
var btnGoBack$h = "Назад";
var btnFeedback$h = "Отправить отзыв";
var btnProceed$h = "Все равно продолжить";
var btnProceedTo$h = "Перейти на сайт";
var inputPassword$h = "Введите пароль";
var errorPageHeader$h = "Веб-страница недоступна";
var summary$h = "Данная веб-страница <strong>(var.PageUrl)</strong>, возможно, временно недоступна или перемещена на новый веб-адрес.";
var suggestionsHeader$h = "Вот несколько советов и рекомендаций";
var suggestion1$h = "Попробуйте <a href='(var.PageUrl)'>обновить</a> страницу позже.";
var suggestion2$h = "Проверьте, правильно ли вы ввели адрес страницы.";
var suggestion3$h = "Проверьте настройки брэндмауэра. Для AdGuard должны быть разрешены все соединения.";
var suggestion4$h = "Проверьте настройки прокси-сервера, если вы используете его для доступа в интернет.";
var showDetails$h = "Подробнее";
var wrongPassword$h = "Неверный пароль";
var somethingWrong$h = "Что-то пошло не так. Пожалуйста, повторите попытку позже или обратитесь в нашу службу поддержки.";
var errorPageTitle$h = "Ошибка";
var knowledgeBase$e = "Вы можете ознакомиться с инструкцией по установке сертификата в нашей <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Базе знаний</a>";
var download$h = "Скачать";
var ru = {
	malware: malware$h,
	phishing: phishing$h,
	advancedButton: advancedButton$h,
	moreInfoButton: moreInfoButton$h,
	pageTitle: pageTitle$h,
	safeHeaderTitle: safeHeaderTitle$h,
	safeContentTitle: safeContentTitle$h,
	parentalHeaderTitle: parentalHeaderTitle$h,
	parentalContentTitle: parentalContentTitle$h,
	parentalDescOne: parentalDescOne$h,
	parentalDnsDescTwo: parentalDnsDescTwo$h,
	blockedContentTitle: blockedContentTitle$h,
	ruleHeaderTitle: ruleHeaderTitle$h,
	ruleContentTitle: ruleContentTitle$h,
	btnGoBack: btnGoBack$h,
	btnFeedback: btnFeedback$h,
	btnProceed: btnProceed$h,
	btnProceedTo: btnProceedTo$h,
	inputPassword: inputPassword$h,
	errorPageHeader: errorPageHeader$h,
	summary: summary$h,
	suggestionsHeader: suggestionsHeader$h,
	suggestion1: suggestion1$h,
	suggestion2: suggestion2$h,
	suggestion3: suggestion3$h,
	suggestion4: suggestion4$h,
	showDetails: showDetails$h,
	wrongPassword: wrongPassword$h,
	somethingWrong: somethingWrong$h,
	errorPageTitle: errorPageTitle$h,
	knowledgeBase: knowledgeBase$e,
	download: download$h
};

var malware$i = "Táto stránka bola na <strong>(var.Host)</strong> nahlásená ako stránka so škodlivým kódom a bola zablokovaná na základe Vašich bezpečnostných nastavení.";
var phishing$i = "Stránka <strong>(var.Host)</strong> bola nahlásená ako podvodná a bola zablokovaná na základe Vašich bezpečnostných nastavení.";
var advancedButton$i = "Pokročilé";
var moreInfoButton$i = "Viac informácií";
var pageTitle$i = "Prístup bol zamietnutý";
var safeHeaderTitle$i = "AdGuard zablokoval prístup k tejto stránke";
var safeContentTitle$i = "Táto stránka bola nahlásená ako stránka so škodlivým kódom a bola zablokovaná na základe Vašich bezpečnostných nastavení";
var parentalHeaderTitle$i = "Rodičovská kontrola";
var parentalContentTitle$i = "Túto stránku sme zablokovali kvôli obmedzeniam rodičovského filtra.";
var parentalDescOne$i = "Ste plnoletý? Zadajte heslo";
var parentalDnsDescTwo$i = "Pokúšate sa navštíviť stránku, ktorú AdGuard eviduje ako nevhodnú pre deti. Ak ste dospelý/á, môžete v nastaveniach vypnúť rodičovskú kontrolu alebo túto stránku pridať na bielu listinu.";
var blockedContentTitle$i = "Prístup na {site} bol zablokovaný filtračným pravidlom. Ak chcete túto stránku zobraziť, pridajte ju medzi výnimky.";
var ruleHeaderTitle$i = "Blokované AdGuardom";
var ruleContentTitle$i = "AdGuard zabránil načítaniu tejto stránky kvôli nasledujúcemu filtračnému pravidlu";
var btnGoBack$i = "Naspäť";
var btnFeedback$i = "Poslať spätnú väzbu";
var btnProceed$i = "Aj tak pokračovať";
var btnProceedTo$i = "Pokračovať na stránku";
var inputPassword$i = "Zadajte heslo";
var errorPageHeader$i = "Webová stránka nie je dostupná.";
var summary$i = "Stránka <strong>(var.PageUrl)</strong> môže byť dočasne nedostupná alebo sa presunula na novú adresu.";
var suggestionsHeader$i = "Tu sú niektoré návrhy";
var suggestion1$i = "Skúste stránku <a href='(var.PageUrl)'>znovu načítať </a> neskôr.";
var suggestion2$i = "Skontrolujte webovú adresu a uistite sa, že ste ju zadali správne.";
var suggestion3$i = "Skontrolujte Vaše nastavenia firewall. Všetky spojenia pre AdGuard musia byť povolené.";
var suggestion4$i = "Ak používate proxy server, skontrolujte nastavenia Vášho proxy.";
var showDetails$i = "Zobraziť podrobnosti";
var wrongPassword$i = "Neplatné heslo";
var somethingWrong$i = "Niečo sa pokazilo. Skúste to znova neskôr alebo kontaktujte našu službu podpory.";
var errorPageTitle$i = "Chyba";
var knowledgeBase$f = "Pokyny na inštaláciu certifikátu nájdete v našej <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>znalostnej databáze</a>";
var download$i = "Sťahovanie";
var sk = {
	malware: malware$i,
	phishing: phishing$i,
	advancedButton: advancedButton$i,
	moreInfoButton: moreInfoButton$i,
	pageTitle: pageTitle$i,
	safeHeaderTitle: safeHeaderTitle$i,
	safeContentTitle: safeContentTitle$i,
	parentalHeaderTitle: parentalHeaderTitle$i,
	parentalContentTitle: parentalContentTitle$i,
	parentalDescOne: parentalDescOne$i,
	parentalDnsDescTwo: parentalDnsDescTwo$i,
	blockedContentTitle: blockedContentTitle$i,
	ruleHeaderTitle: ruleHeaderTitle$i,
	ruleContentTitle: ruleContentTitle$i,
	btnGoBack: btnGoBack$i,
	btnFeedback: btnFeedback$i,
	btnProceed: btnProceed$i,
	btnProceedTo: btnProceedTo$i,
	inputPassword: inputPassword$i,
	errorPageHeader: errorPageHeader$i,
	summary: summary$i,
	suggestionsHeader: suggestionsHeader$i,
	suggestion1: suggestion1$i,
	suggestion2: suggestion2$i,
	suggestion3: suggestion3$i,
	suggestion4: suggestion4$i,
	showDetails: showDetails$i,
	wrongPassword: wrongPassword$i,
	somethingWrong: somethingWrong$i,
	errorPageTitle: errorPageTitle$i,
	knowledgeBase: knowledgeBase$f,
	download: download$i
};

var malware$j = "Ta spletna stran v <strong>(var.Host)</strong> je bila prijavljena kot stran s slonamernimi programi in je bila onemogočena glede na vaše varnostne nastavitve.";
var phishing$j = "Ta spletna stran v <strong>(var.Host)</strong> je bila prijavljena kot lažna stran in je bila onemogočena glede na vaše varnostne nastavitve.";
var advancedButton$j = "Napredno";
var moreInfoButton$j = "Več informacij";
var pageTitle$j = "Dostop zavrnjen";
var safeHeaderTitle$j = "AdGuard je onemogočil dostop do te strani";
var safeContentTitle$j = "Ta spletna stran je bila prijavljena kot stran s slonamernimi programi in je bila onemogočena glede na vaše varnostne nastavitve.";
var parentalHeaderTitle$j = "Starševski nadzor";
var parentalContentTitle$j = "To stran smo onemogočili zaradi omejitev Starševskega filtra.";
var parentalDescOne$j = "Ste dovolj stari? Vnesite geslo";
var parentalDnsDescTwo$j = "Poskušate doseči spletno stran, ki ga je AdGuard navedel kot neprimerno za otroke. Če ste odrasli, lahko v nastavitvah izklopite Starševski nadzor ali dodate to spletno stran na seznam dovoljenih.";
var blockedContentTitle$j = "Zahteva za {site} je onemogočena s pravilom filtra. Če želite dostopati do te strani, jo dodajte izjemam.";
var ruleHeaderTitle$j = "Onemogočeno z AdGuardom";
var ruleContentTitle$j = "AdGuard je preprečil nalaganje te strani zaradi naslednjega pravila filtriranja";
var btnGoBack$j = "Pojdi nazaj";
var btnFeedback$j = "Pošlji povratne informacije";
var btnProceed$j = "Vseeno nadaljuj";
var btnProceedTo$j = "Pojdi na spletno stran";
var inputPassword$j = "Vnesite geslo";
var errorPageHeader$j = "Spletna stran ni na voljo";
var summary$j = "Spletna stran na <strong>(var.PageUrl)</strong>  je morda začasno onemogočena ali pa je morda prestavljena na nov spletni naslov.";
var suggestionsHeader$j = "Tukaj je nekaj predlogov";
var suggestion1$j = "Poskusite kasneje <a href='(var.PageUrl)'>ponovno naložiti</a> to spletno stran.";
var suggestion2$j = "Preverite naslov spletne strani in se prepričajte, da ste ga pravilno vnesli.";
var suggestion3$j = "Preverite svoje nastavitve požarnega zidu. Vse povezave je treba dovoliti za AdGuard.";
var suggestion4$j = "Preverite nastavitve Proxy strežnika, če ga uporabljate.";
var showDetails$j = "Prikaži podrobnosti";
var wrongPassword$j = "Napačno geslo";
var somethingWrong$j = "Nekaj je šlo narobe. Poskusite znova pozneje ali se obrnite na našo službo za podporo.";
var errorPageTitle$j = "Napaka";
var knowledgeBase$g = "Navodila za namestitev potrdila lahko najdete v naši <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Zbirki znanja</a>";
var download$j = "Prenos";
var sl = {
	malware: malware$j,
	phishing: phishing$j,
	advancedButton: advancedButton$j,
	moreInfoButton: moreInfoButton$j,
	pageTitle: pageTitle$j,
	safeHeaderTitle: safeHeaderTitle$j,
	safeContentTitle: safeContentTitle$j,
	parentalHeaderTitle: parentalHeaderTitle$j,
	parentalContentTitle: parentalContentTitle$j,
	parentalDescOne: parentalDescOne$j,
	parentalDnsDescTwo: parentalDnsDescTwo$j,
	blockedContentTitle: blockedContentTitle$j,
	ruleHeaderTitle: ruleHeaderTitle$j,
	ruleContentTitle: ruleContentTitle$j,
	btnGoBack: btnGoBack$j,
	btnFeedback: btnFeedback$j,
	btnProceed: btnProceed$j,
	btnProceedTo: btnProceedTo$j,
	inputPassword: inputPassword$j,
	errorPageHeader: errorPageHeader$j,
	summary: summary$j,
	suggestionsHeader: suggestionsHeader$j,
	suggestion1: suggestion1$j,
	suggestion2: suggestion2$j,
	suggestion3: suggestion3$j,
	suggestion4: suggestion4$j,
	showDetails: showDetails$j,
	wrongPassword: wrongPassword$j,
	somethingWrong: somethingWrong$j,
	errorPageTitle: errorPageTitle$j,
	knowledgeBase: knowledgeBase$g,
	download: download$j
};

var malware$k = "";
var phishing$k = "";
var advancedButton$k = "Više opcija";
var moreInfoButton$k = "Više informacija";
var pageTitle$k = "";
var safeHeaderTitle$k = "";
var safeContentTitle$k = "";
var parentalHeaderTitle$k = "";
var parentalContentTitle$k = "";
var parentalDescOne$k = "";
var parentalDnsDescTwo$k = "";
var blockedContentTitle$k = "";
var ruleHeaderTitle$k = "";
var ruleContentTitle$k = "";
var btnGoBack$k = "Vrati se";
var btnFeedback$k = "";
var btnProceed$k = "Ipak nastavi";
var btnProceedTo$k = "";
var inputPassword$k = "Unesite lozinku";
var errorPageHeader$k = "Web-stranica nije dostupna";
var summary$k = "Web-stranica <strong>(var.PageUrl)</strong> možda privremeno ne funkcioniše ili je premeštena na novu web-adresu.";
var suggestionsHeader$k = "Evo nekoliko predloga";
var suggestion1$k = "Pokušajte sa <a href='(var.PageUrl)'>ponovnim učitavanjem</a> ove stranice malo kasnije.";
var suggestion2$k = "Proverite adresu web-stranice da bi ste bili sigurni da je uneta korektno.";
var suggestion3$k = "Proverite podešavanja Vašeg vatrenog zida. Sve konekcije za AdGuard treba dozvoliti.";
var suggestion4$k = "Proverite podešavanja proxy-a ako koristite proxy server.";
var showDetails$k = "Prikaži detalje";
var wrongPassword$k = "Pogrešna lozinka.";
var somethingWrong$k = "";
var errorPageTitle$k = "Greške ";
var sr = {
	malware: malware$k,
	phishing: phishing$k,
	advancedButton: advancedButton$k,
	moreInfoButton: moreInfoButton$k,
	pageTitle: pageTitle$k,
	safeHeaderTitle: safeHeaderTitle$k,
	safeContentTitle: safeContentTitle$k,
	parentalHeaderTitle: parentalHeaderTitle$k,
	parentalContentTitle: parentalContentTitle$k,
	parentalDescOne: parentalDescOne$k,
	parentalDnsDescTwo: parentalDnsDescTwo$k,
	blockedContentTitle: blockedContentTitle$k,
	ruleHeaderTitle: ruleHeaderTitle$k,
	ruleContentTitle: ruleContentTitle$k,
	btnGoBack: btnGoBack$k,
	btnFeedback: btnFeedback$k,
	btnProceed: btnProceed$k,
	btnProceedTo: btnProceedTo$k,
	inputPassword: inputPassword$k,
	errorPageHeader: errorPageHeader$k,
	summary: summary$k,
	suggestionsHeader: suggestionsHeader$k,
	suggestion1: suggestion1$k,
	suggestion2: suggestion2$k,
	suggestion3: suggestion3$k,
	suggestion4: suggestion4$k,
	showDetails: showDetails$k,
	wrongPassword: wrongPassword$k,
	somethingWrong: somethingWrong$k,
	errorPageTitle: errorPageTitle$k
};

var malware$l = "Den här webbsidan, på <strong>(var.Host)</strong>, har rapporterats som skadlig och blockeras utifrån dina säkerhetsinställningar.";
var phishing$l = "Den här sidan, på <strong>(var.Host)</strong>, har rapporterats som för phishing och har blockerats utifrån dina säkerhetsinställningar.";
var advancedButton$l = "Avancerat";
var moreInfoButton$l = "Ytterligare information";
var pageTitle$l = "Nekad åtkomst";
var safeHeaderTitle$l = "Sidans åtkomst har blockerats av AdGuard";
var safeContentTitle$l = "Webbsidan har rapporterats som skadlig och blockeras utifrån dina säkerhetsinställningar.";
var parentalHeaderTitle$l = "Föräldrakontroll";
var parentalContentTitle$l = "Sidan blockerades på grund av restriktioner i föräldrafiltret";
var parentalDescOne$l = "Är du tillräckligt gammal? Skriv in lösenordet";
var parentalDnsDescTwo$l = "Du försöker nå en webbplats som av AdGuard listas som olämplig för barn. Om du är en vuxen person kan du koppla bort föräldraskyddet under Inställningar eller lägga till webbplatsen i vitlistan.";
var blockedContentTitle$l = "Åtkomst till {site} blockerades av filterregler. Om du vill ha åtkomst till sidan kan du lägga till den till undantag.";
var ruleHeaderTitle$l = "Blockerat av AdGuard";
var ruleContentTitle$l = "AdGuard har förhindrat inläsning av sidan till följd av följande filterregel:";
var btnGoBack$l = "Återgå";
var btnFeedback$l = "Skicka kommentar";
var btnProceed$l = "Fortsätt ändå";
var btnProceedTo$l = "Fortsätt till webbplats";
var inputPassword$l = "Skriv in lösenord";
var errorPageHeader$l = "Webbsidan är inte tillgänglig";
var summary$l = "Webbsidan på, <strong>(var.PageUrl)</strong>, kan tillfälligt ligga nere eller flyttats till en annan webbadress.";
var suggestionsHeader$l = "Här är några förslag";
var suggestion1$l = "Prova att <a href='(var.PageUrl)'>ladda</a> sidan senare.";
var suggestion2$l = "Kontrollera att du skrivit in korrekt webbadress.";
var suggestion3$l = "Kontrollera dina brandväggsinställningar. Alla anslutningar skall tillåtas för AdGuard.";
var suggestion4$l = "Kontrollera dina proxyinställningarna om du använder proxyserver.";
var showDetails$l = "Visa detaljer";
var wrongPassword$l = "Fel lösenord";
var somethingWrong$l = "Något gick fel. Var god försök senare eller kontakta vår support.";
var errorPageTitle$l = "Fel";
var sv = {
	malware: malware$l,
	phishing: phishing$l,
	advancedButton: advancedButton$l,
	moreInfoButton: moreInfoButton$l,
	pageTitle: pageTitle$l,
	safeHeaderTitle: safeHeaderTitle$l,
	safeContentTitle: safeContentTitle$l,
	parentalHeaderTitle: parentalHeaderTitle$l,
	parentalContentTitle: parentalContentTitle$l,
	parentalDescOne: parentalDescOne$l,
	parentalDnsDescTwo: parentalDnsDescTwo$l,
	blockedContentTitle: blockedContentTitle$l,
	ruleHeaderTitle: ruleHeaderTitle$l,
	ruleContentTitle: ruleContentTitle$l,
	btnGoBack: btnGoBack$l,
	btnFeedback: btnFeedback$l,
	btnProceed: btnProceed$l,
	btnProceedTo: btnProceedTo$l,
	inputPassword: inputPassword$l,
	errorPageHeader: errorPageHeader$l,
	summary: summary$l,
	suggestionsHeader: suggestionsHeader$l,
	suggestion1: suggestion1$l,
	suggestion2: suggestion2$l,
	suggestion3: suggestion3$l,
	suggestion4: suggestion4$l,
	showDetails: showDetails$l,
	wrongPassword: wrongPassword$l,
	somethingWrong: somethingWrong$l,
	errorPageTitle: errorPageTitle$l
};

var malware$m = "<strong>(var.Host)</strong> adresindeki bu site kötü amaçlı yazılım sitesi olarak rapor edildi ve güvenlik tercihlerinize göre engellendi.";
var phishing$m = "<strong>(var.Host)</strong> adresindeki bu site kimlik avı sitesi olarak rapor edildi ve güvenlik tercihlerinize bağlı olarak engellendi.";
var advancedButton$m = "Gelişmiş";
var moreInfoButton$m = "Daha fazla bilgi";
var pageTitle$m = "Erişim engellendi";
var safeHeaderTitle$m = "AdGuard bu sayfaya erişimi engelledi";
var safeContentTitle$m = "Bu site kötü amaçlı yazılım içeren bir site olarak rapor edildi ve güvenlik tercihlerinize göre engellendi.";
var parentalHeaderTitle$m = "Ebeveyn kontrolü";
var parentalContentTitle$m = "Bu sayfayı ebeveyn filtresi kısıtlamaları nedeniyle engelledik.";
var parentalDescOne$m = "Yeterli yaşa sahip misin? Lütfen şifreyi girin";
var parentalDnsDescTwo$m = "AdGuard tarafından çocuklar için uygun olmayan bir web sitesine ulaşmaya çalışıyorsunuz. Yetişkin iseniz ayarlarda ebeveyn kontrolünü kapatabilir veya bu web sitesini beyaz listeye ekleyebilirsiniz.";
var blockedContentTitle$m = "{site} isteği, bir filtre kuralı tarafından engellendi. Bu siteye erişmek istiyorsanız, istisnalara ekleyin.";
var ruleHeaderTitle$m = "AdGuard tarafından engellendi";
var ruleContentTitle$m = "AdGuard, aşağıdaki filtre kuralı nedeniyle bu sayfanın yüklenmesini engelledi";
var btnGoBack$m = "Geri git";
var btnFeedback$m = "Geribildirim gönder";
var btnProceed$m = "Yine de devam et";
var btnProceedTo$m = "Siteye gir";
var inputPassword$m = "Parolayı girin";
var errorPageHeader$m = "Bu sayfa mevcut değil";
var summary$m = "Buradaki <strong>(var.PageUrl)</strong> websitesi geçici olarak devredışı olabilir ya da yeni bir web adresine taşınmış olabilir.";
var suggestionsHeader$m = "İşte birkaç öneri";
var suggestion1$m = "Bu web sayfasını daha sonra <a href='(var.PageUrl)'> yeniden yüklemeyi</a> deneyin.";
var suggestion2$m = "Web sayfasının adresini doğru girdiğinizden emin olun";
var suggestion3$m = "Güvenlik duvarı ayarlarınızı kontrol edin. AdGuard için tüm bağlantılara izin verilmelidir.";
var suggestion4$m = "Eğer bir proxy sunucusu kullanıyorsanız proxy ayarlarınızı kontol edin.";
var showDetails$m = "Detayları göster";
var wrongPassword$m = "Yanlış şifre girdiniz";
var somethingWrong$m = "Bir sorun oluştu. Lütfen daha sonra tekrar deneyiniz ya da destek servisimizle iletişime geçin.";
var errorPageTitle$m = "Hata";
var tr = {
	malware: malware$m,
	phishing: phishing$m,
	advancedButton: advancedButton$m,
	moreInfoButton: moreInfoButton$m,
	pageTitle: pageTitle$m,
	safeHeaderTitle: safeHeaderTitle$m,
	safeContentTitle: safeContentTitle$m,
	parentalHeaderTitle: parentalHeaderTitle$m,
	parentalContentTitle: parentalContentTitle$m,
	parentalDescOne: parentalDescOne$m,
	parentalDnsDescTwo: parentalDnsDescTwo$m,
	blockedContentTitle: blockedContentTitle$m,
	ruleHeaderTitle: ruleHeaderTitle$m,
	ruleContentTitle: ruleContentTitle$m,
	btnGoBack: btnGoBack$m,
	btnFeedback: btnFeedback$m,
	btnProceed: btnProceed$m,
	btnProceedTo: btnProceedTo$m,
	inputPassword: inputPassword$m,
	errorPageHeader: errorPageHeader$m,
	summary: summary$m,
	suggestionsHeader: suggestionsHeader$m,
	suggestion1: suggestion1$m,
	suggestion2: suggestion2$m,
	suggestion3: suggestion3$m,
	suggestion4: suggestion4$m,
	showDetails: showDetails$m,
	wrongPassword: wrongPassword$m,
	somethingWrong: somethingWrong$m,
	errorPageTitle: errorPageTitle$m
};

var malware$n = "Веб-сторінка <strong>(var.Host)</strong> відома, як зловмисна і була заблокована згідно з вашими налаштуваннями безпеки.";
var phishing$n = "Веб-сторінка <strong>(var.Host)</strong> відома, як шахрайська і була заблокована згідно з вашими налаштуваннями безпеки.";
var advancedButton$n = "Додатково";
var moreInfoButton$n = "Докладніша інформація";
var pageTitle$n = "Доступ заборонено";
var safeHeaderTitle$n = "AdGuard заблокував доступ до цієї сторінки";
var safeContentTitle$n = "Ця веб-сторінка відома, як зловмисна і була заблокована згідно з вашими налаштуваннями безпеки.";
var parentalHeaderTitle$n = "Батьківський контроль";
var parentalContentTitle$n = "Цю сторінку заблоковано у зв'язку з обмеженнями батьківського контролю.";
var parentalDescOne$n = "Якщо ви повнолітні, введіть пароль";
var parentalDnsDescTwo$n = "Ви намагаєтесь отримати доступ до веб-сайту, який в AdGuard позначений неприйнятним для дітей. Якщо ви повнолітні, ви можете вимкнути батьківський контроль в налаштуваннях, або додати цей веб-сайт до білого списку.";
var blockedContentTitle$n = "Запит до {site} було заблоковано правилом фільтру. Якщо ви хочете отримати доступ до цього сайту, додайте його до винятків.";
var ruleHeaderTitle$n = "Заблоковано AdGuard";
var ruleContentTitle$n = "AdGuard не дозволив цій сторінці завантажитись, у зв'язку з таким правилом фільтру";
var btnGoBack$n = "Назад";
var btnFeedback$n = "Надіслати відгук";
var btnProceed$n = "Продовжити в будь-якому разі";
var btnProceedTo$n = "Перейти на сайт";
var inputPassword$n = "Уведіть пароль";
var errorPageHeader$n = "Веб-сторінка недоступна";
var summary$n = "Веб-сторінка <strong>(var.PageUrl)</strong>, ймовірно, тимчасово недоступна, або її адреса змінилася.";
var suggestionsHeader$n = "Ось декілька пропозицій";
var suggestion1$n = "Спробуйте <a href='(var.PageUrl)'>перезавантажити</a> цю сторінку пізніше.";
var suggestion2$n = "Перевірте правильність введення адреси веб-сторінки.";
var suggestion3$n = "Перевірте налаштування мережевого екрану. Слід дозволити всі з'єднання для AdGuard.";
var suggestion4$n = "Перевірте ваші налаштування проксі-сервера, якщо ви його використовуєте.";
var showDetails$n = "Показати деталі";
var wrongPassword$n = "Хибний пароль";
var somethingWrong$n = "Щось пішло не так. Будь ласка, повторіть спробу пізніше або зверніться до нашої служби підтримки.";
var errorPageTitle$n = "Помилка";
var knowledgeBase$h = "Як встановити сертифікат, можете почитати в нашій <a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>Базі знань</a>";
var download$k = "Завантажити";
var uk = {
	malware: malware$n,
	phishing: phishing$n,
	advancedButton: advancedButton$n,
	moreInfoButton: moreInfoButton$n,
	pageTitle: pageTitle$n,
	safeHeaderTitle: safeHeaderTitle$n,
	safeContentTitle: safeContentTitle$n,
	parentalHeaderTitle: parentalHeaderTitle$n,
	parentalContentTitle: parentalContentTitle$n,
	parentalDescOne: parentalDescOne$n,
	parentalDnsDescTwo: parentalDnsDescTwo$n,
	blockedContentTitle: blockedContentTitle$n,
	ruleHeaderTitle: ruleHeaderTitle$n,
	ruleContentTitle: ruleContentTitle$n,
	btnGoBack: btnGoBack$n,
	btnFeedback: btnFeedback$n,
	btnProceed: btnProceed$n,
	btnProceedTo: btnProceedTo$n,
	inputPassword: inputPassword$n,
	errorPageHeader: errorPageHeader$n,
	summary: summary$n,
	suggestionsHeader: suggestionsHeader$n,
	suggestion1: suggestion1$n,
	suggestion2: suggestion2$n,
	suggestion3: suggestion3$n,
	suggestion4: suggestion4$n,
	showDetails: showDetails$n,
	wrongPassword: wrongPassword$n,
	somethingWrong: somethingWrong$n,
	errorPageTitle: errorPageTitle$n,
	knowledgeBase: knowledgeBase$h,
	download: download$k
};

var malware$o = "位于 <strong>(var.Host)</strong> 的网页已报告为恶意网站，根据您的安全设置，我们拦截了与此网站的连接。";
var phishing$o = "位于 <strong>(var.Host)</strong> 的网页已报告为钓鱼网站，根据您的安全设置，我们拦截了与此网站的连接。";
var advancedButton$o = "高级设置";
var moreInfoButton$o = "更多信息";
var pageTitle$o = "拒绝访问";
var safeHeaderTitle$o = "AdGuard 已阻止访问此网页";
var safeContentTitle$o = "位于 <strong>(var.Host)</strong> 的网页已报告为恶意网站，根据您的安全设置，我们拦截了与此网站的连接。";
var parentalHeaderTitle$o = "家长控制";
var parentalContentTitle$o = "由于家长控制过滤器的限制，我们拦截了此网站。";
var parentalDescOne$o = "您的年龄是否满足使用要求？请输入密码";
var parentalDnsDescTwo$o = "您正在尝试访问在 AdGuard 家长控制中被列为不适合儿童访问的网站。如果你是成年人，你可以在 AdGuard 设置中关闭家长控制模块，或将此站点移至白名单中。";
var blockedContentTitle$o = "过滤规则已拦截了访问 {site}的请求。如果您要访问此网站，请将其添加到排除列表。";
var ruleHeaderTitle$o = "被 AdGuard 拦截";
var ruleContentTitle$o = "根据以下过滤规则， Adguard 已停止加载该网页。";
var btnGoBack$o = "返回";
var btnFeedback$o = "发送反馈";
var btnProceed$o = "依然继续访问";
var btnProceedTo$o = "前往该网站";
var inputPassword$o = "输入密码";
var errorPageHeader$o = "该网页当前不可用";
var summary$o = "该网页的 <strong>(var.PageUrl)</strong> 可能被临时关闭，或已永久移动到其它地址。";
var suggestionsHeader$o = "以下是我们提供的建议：";
var suggestion1$o = "您可以稍后再 <a href='(var.PageUrl)'> 重新加载</a> 此网页。";
var suggestion2$o = "请确保您输入的网页地址是正确的。";
var suggestion3$o = "请检查防火墙设置，有关 AdGuard 的全部连接都应当被允许。";
var suggestion4$o = "如果您正在使用代理服务，请检查相关的代理配置。";
var showDetails$o = "显示详细信息";
var wrongPassword$o = "密码错误";
var somethingWrong$o = "出现了一些问题。请稍后重试或者联系我们的客服支持。";
var errorPageTitle$o = "错误";
var zhCN = {
	malware: malware$o,
	phishing: phishing$o,
	advancedButton: advancedButton$o,
	moreInfoButton: moreInfoButton$o,
	pageTitle: pageTitle$o,
	safeHeaderTitle: safeHeaderTitle$o,
	safeContentTitle: safeContentTitle$o,
	parentalHeaderTitle: parentalHeaderTitle$o,
	parentalContentTitle: parentalContentTitle$o,
	parentalDescOne: parentalDescOne$o,
	parentalDnsDescTwo: parentalDnsDescTwo$o,
	blockedContentTitle: blockedContentTitle$o,
	ruleHeaderTitle: ruleHeaderTitle$o,
	ruleContentTitle: ruleContentTitle$o,
	btnGoBack: btnGoBack$o,
	btnFeedback: btnFeedback$o,
	btnProceed: btnProceed$o,
	btnProceedTo: btnProceedTo$o,
	inputPassword: inputPassword$o,
	errorPageHeader: errorPageHeader$o,
	summary: summary$o,
	suggestionsHeader: suggestionsHeader$o,
	suggestion1: suggestion1$o,
	suggestion2: suggestion2$o,
	suggestion3: suggestion3$o,
	suggestion4: suggestion4$o,
	showDetails: showDetails$o,
	wrongPassword: wrongPassword$o,
	somethingWrong: somethingWrong$o,
	errorPageTitle: errorPageTitle$o
};

var malware$p = "於 <strong>(var.Host)</strong> 之網頁已被報告為惡意軟體頁面，且根據您的安全性偏好設定，已被封鎖。";
var phishing$p = "於 <strong>(var.Host)</strong> 之網頁已被報告為網路釣魚頁面，且根據您的安全性偏好設定，已被封鎖。";
var advancedButton$p = "進階的";
var moreInfoButton$p = "更多的資訊";
var pageTitle$p = "拒絕存取";
var safeHeaderTitle$p = "AdGuard 已封鎖至該頁面之存取";
var safeContentTitle$p = "該網頁已被報告為惡意軟體頁面，且根據您的安全性偏好設定，已被封鎖。";
var parentalHeaderTitle$p = "家長監控";
var parentalContentTitle$p = "由於父母的過濾器限制，我們已封鎖該頁面。";
var parentalDescOne$p = "您夠大了嗎？輸入該密碼";
var parentalDnsDescTwo$p = "您正在嘗試觸及被 AdGuard 列為對孩子不合適的網站。如果您是成年人，那麼您可在設定中關掉家長監控或增加該網站至白名單。";
var blockedContentTitle$p = "至 {site} 之請求已被過濾器規則封鎖。如果您想要存取該網站，增加它至例外。";
var ruleHeaderTitle$p = "被 AdGuard 封鎖";
var ruleContentTitle$p = "由於下面的過濾器規則，AdGuard 已防止該頁面載入";
var btnGoBack$p = "返回";
var btnFeedback$p = "傳送回饋意見";
var btnProceed$p = "無論如何繼續";
var btnProceedTo$p = "前往網站";
var inputPassword$p = "輸入密碼";
var errorPageHeader$p = "該網頁為不可用的";
var summary$p = "於 <strong>(var.PageUrl)</strong> 之網頁可能暫時地下線，或它可能已移至新的網路位址。";
var suggestionsHeader$p = "這是一些建議";
var suggestion1$p = "稍後嘗試<a href='(var.PageUrl)'>重新載入</a>該網頁。";
var suggestion2$p = "檢查該網頁網址以確定您已正確地輸入它。";
var suggestion3$p = "檢查您的防火牆設定。所有的連線應被允許用於 AdGuard。";
var suggestion4$p = "如果您使用代理伺服器，檢查您的代理設定。";
var showDetails$p = "顯示細節";
var wrongPassword$p = "錯誤的密碼";
var somethingWrong$p = "某事物出現問題。請稍後再試，或與我們的支援服務聯繫。";
var errorPageTitle$p = "錯誤";
var knowledgeBase$i = "在我們的<a href='https://kb.adguard.com/technical-support/how-to-install-certificate'>知識庫</a>中，您可找到該憑證安裝用法說明";
var download$l = "下載";
var zhTW = {
	malware: malware$p,
	phishing: phishing$p,
	advancedButton: advancedButton$p,
	moreInfoButton: moreInfoButton$p,
	pageTitle: pageTitle$p,
	safeHeaderTitle: safeHeaderTitle$p,
	safeContentTitle: safeContentTitle$p,
	parentalHeaderTitle: parentalHeaderTitle$p,
	parentalContentTitle: parentalContentTitle$p,
	parentalDescOne: parentalDescOne$p,
	parentalDnsDescTwo: parentalDnsDescTwo$p,
	blockedContentTitle: blockedContentTitle$p,
	ruleHeaderTitle: ruleHeaderTitle$p,
	ruleContentTitle: ruleContentTitle$p,
	btnGoBack: btnGoBack$p,
	btnFeedback: btnFeedback$p,
	btnProceed: btnProceed$p,
	btnProceedTo: btnProceedTo$p,
	inputPassword: inputPassword$p,
	errorPageHeader: errorPageHeader$p,
	summary: summary$p,
	suggestionsHeader: suggestionsHeader$p,
	suggestion1: suggestion1$p,
	suggestion2: suggestion2$p,
	suggestion3: suggestion3$p,
	suggestion4: suggestion4$p,
	showDetails: showDetails$p,
	wrongPassword: wrongPassword$p,
	somethingWrong: somethingWrong$p,
	errorPageTitle: errorPageTitle$p,
	knowledgeBase: knowledgeBase$i,
	download: download$l
};

// TODO import list of langs from .twosky.json
var locales = {
  ar: ar,
  cs: cs,
  da: da,
  de: de,
  en: en,
  es: es,
  fa: fa,
  fi: fi,
  fr: fr,
  id: id,
  it: it,
  ja: ja,
  ko: ko,
  lt: lt,
  pl: pl,
  'pt-br': ptBR,
  'pt-pt': ptPT,
  ru: ru,
  sk: sk,
  sl: sl,
  sr: sr,
  sv: sv,
  tr: tr,
  uk: uk,
  'zh-cn': zhCN,
  'zh-tw': zhTW
};

var i18n = /*#__PURE__*/function () {
  function i18n() {
    _classCallCheck(this, i18n);

    this.dictionaries = _objectSpread2({}, locales);
    this.dict = '';
    this.defaultDict = 'en';
  }
  /**
   * Entry point to translate app
   */


  _createClass(i18n, [{
    key: "translateApp",
    value: function translateApp(locale) {
      this.defineDict(locale);
      this.transformHtml();
    }
    /**
     * Define what lang messages we can use by navigator lang
     */

  }, {
    key: "defineDict",
    value: function defineDict(locale) {
      var navigatorLocale = locale || navigator.language || navigator.browserLanguage;
      var navigatorLanguage = navigatorLocale.substr(0, 2);
      var dict = null; // Looking for locale match

      var fullMatch = Object.keys(this.dictionaries).some(function (key) {
        var match = key.replace(/-/g, '_').toLowerCase() === navigatorLocale.replace(/-/g, '_').toLowerCase();

        if (match) {
          dict = key;
        }

        return match;
      }); // Looking for language match

      if (!fullMatch) {
        Object.keys(this.dictionaries).some(function (key) {
          var match = key.toLowerCase() === navigatorLanguage.toLowerCase();

          if (match) {
            dict = key;
          }

          return match;
        });
      }

      this.dict = dict ? dict : this.defaultDict;
    }
    /**
     * Set appropriate text to elements in html
     */

  }, {
    key: "transformHtml",
    value: function transformHtml() {
      var _this = this;

      var elementsForTranslationText = document.querySelectorAll('[data-key]');

      if (elementsForTranslationText) {
        elementsForTranslationText.forEach(function (el) {
          var key = el.getAttribute('data-key');
          el.innerHTML = _this.getMessageByKey(key);
        });
      }

      var elementsForTranslationPhldr = document.querySelectorAll('[data-key-placeholder]');

      if (elementsForTranslationPhldr) {
        elementsForTranslationPhldr.forEach(function (el) {
          var key = el.getAttribute('data-key-placeholder');
          el.setAttribute('placeholder', _this.getMessageByKey(key));
        });
      }
    }
    /**
     * Get message from current dictionary by key
     * @param {string} key
     */

  }, {
    key: "getMessageByKey",
    value: function getMessageByKey(key) {
      if (this.dictionaries[this.dict][key]) {
        return this.dictionaries[this.dict][key];
      }

      console.warn("".concat(key, " for ").concat(this.dict, " is not defined"));
      return this.dictionaries[this.defaultDict][key];
    }
  }]);

  return i18n;
}();

var i18n$1 = new i18n();

/**
 * Class for BrowserExtension page controllers
 */

var BrowserExtension = /*#__PURE__*/function () {
  function BrowserExtension(defaultConfiguration) {
    _classCallCheck(this, BrowserExtension);

    this.setConfiguration(defaultConfiguration);
  }
  /**
   * Initialization method
   * Should be executed when DOM loaded
   */


  _createClass(BrowserExtension, [{
    key: "init",
    value: function init() {
      this.translateApp();
      this.initGoBackButton();
      this.showContent();
    }
    /**
     * Translate page
     */

  }, {
    key: "translateApp",
    value: function translateApp() {
      i18n$1.translateApp(this.currentConfiguration && this.currentConfiguration.locale);
    }
    /**
     * Show content of the page by removing `hidden` class
     */

  }, {
    key: "showContent",
    value: function showContent() {
      var app = document.getElementById('app');

      if (app) {
        app.classList.remove('hidden');
      }
    }
    /**
     * Set configuration to controller
     */

  }, {
    key: "setConfiguration",
    value: function setConfiguration() {
      var defaultConfiguration = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.currentConfiguration = defaultConfiguration;
    }
    /**
     * Set Go Back button
     */

  }, {
    key: "initGoBackButton",
    value: function initGoBackButton() {
      var backButton = document.getElementById('btnGoBack');

      if (backButton) {
        backButton.setAttribute('href', '#');
        backButton.addEventListener('click', function (e) {
          e.preventDefault();
          history.back();
        });
      }
    }
  }]);

  return BrowserExtension;
}();

/**
 * DocumentBlockedPage controller
 */

var AdBlockedPage = /*#__PURE__*/function (_BrowserExtension) {
  _inherits(AdBlockedPage, _BrowserExtension);

  var _super = _createSuper(AdBlockedPage);

  function AdBlockedPage() {
    _classCallCheck(this, AdBlockedPage);

    var defaultConfiguration = {
      locale: navigator.language || navigator.browserLanguage
    };
    return _super.call(this, defaultConfiguration);
  }
  /**
   * Initialization DocumentBlockedPage controller
   * Should be execute when DOM loaded
   */


  _createClass(AdBlockedPage, [{
    key: "init",
    value: function init() {
      _get(_getPrototypeOf(AdBlockedPage.prototype), "translateApp", this).call(this);

      _get(_getPrototypeOf(AdBlockedPage.prototype), "initGoBackButton", this).call(this);

      _get(_getPrototypeOf(AdBlockedPage.prototype), "showContent", this).call(this);
    }
  }]);

  return AdBlockedPage;
}(BrowserExtension);

/**
 * SafeBrowsing block page controller
 */

var SafeBrowsing = /*#__PURE__*/function (_BrowserExtension) {
  _inherits(SafeBrowsing, _BrowserExtension);

  var _super = _createSuper(SafeBrowsing);

  function SafeBrowsing() {
    _classCallCheck(this, SafeBrowsing);

    var defaultConfiguration = {
      locale: navigator.language || navigator.browserLanguage
    };
    return _super.call(this, defaultConfiguration);
  }
  /**
   * Initialization of the SafeBrowsing controller
   * Should be executed when DOM loaded
   */


  _createClass(SafeBrowsing, [{
    key: "init",
    value: function init() {
      _get(_getPrototypeOf(SafeBrowsing.prototype), "translateApp", this).call(this);

      _get(_getPrototypeOf(SafeBrowsing.prototype), "initGoBackButton", this).call(this);

      _get(_getPrototypeOf(SafeBrowsing.prototype), "showContent", this).call(this);
    }
  }]);

  return SafeBrowsing;
}(BrowserExtension);

document.addEventListener('DOMContentLoaded', function () {
  var pageNameNode = document.querySelector('[data-page-name]');

  if (!pageNameNode) {
    return;
  }

  var pageName = pageNameNode.getAttribute('data-page-name');
  var controller = null;

  switch (pageName) {
    case 'safebrowsing':
      controller = new SafeBrowsing();
      break;

    case 'adBlockedPage':
      controller = new AdBlockedPage();
      break;
  }

  if (controller) {
    controller.init();
  }
});
