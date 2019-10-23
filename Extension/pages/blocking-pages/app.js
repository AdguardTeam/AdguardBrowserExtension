/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./browser-extension/src/js/main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./browser-extension/src/js/adBlockedPage.js":
/*!***************************************************!*\
  !*** ./browser-extension/src/js/adBlockedPage.js ***!
  \***************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _browserExtension__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./browserExtension */ "./browser-extension/src/js/browserExtension.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }


/**
 * DocumentBlockedPage controller
 */

var AdBlockedPage =
/*#__PURE__*/
function (_BrowserExtension) {
  _inherits(AdBlockedPage, _BrowserExtension);

  function AdBlockedPage() {
    _classCallCheck(this, AdBlockedPage);

    var defaultConfiguration = {
      locale: navigator.language || navigator.browserLanguage
    };
    return _possibleConstructorReturn(this, _getPrototypeOf(AdBlockedPage).call(this, defaultConfiguration));
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
}(_browserExtension__WEBPACK_IMPORTED_MODULE_0__["default"]);

/* harmony default export */ __webpack_exports__["default"] = (AdBlockedPage);

/***/ }),

/***/ "./browser-extension/src/js/browserExtension.js":
/*!******************************************************!*\
  !*** ./browser-extension/src/js/browserExtension.js ***!
  \******************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_localization__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../common/localization */ "./common/localization.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }


/**
 * Class for BrowserExtension page controllers
 */

var BrowserExtension =
/*#__PURE__*/
function () {
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
      _common_localization__WEBPACK_IMPORTED_MODULE_0__["default"].translateApp(this.currentConfiguration && this.currentConfiguration.locale);
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

/* harmony default export */ __webpack_exports__["default"] = (BrowserExtension);

/***/ }),

/***/ "./browser-extension/src/js/main.js":
/*!******************************************!*\
  !*** ./browser-extension/src/js/main.js ***!
  \******************************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _adBlockedPage__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./adBlockedPage */ "./browser-extension/src/js/adBlockedPage.js");
/* harmony import */ var _safeBrowsing__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./safeBrowsing */ "./browser-extension/src/js/safeBrowsing.js");


document.addEventListener('DOMContentLoaded', function () {
  var pageNameNode = document.querySelector('[data-page-name]');

  if (!pageNameNode) {
    return;
  }

  var pageName = pageNameNode.getAttribute('data-page-name');
  var controller = null;

  switch (pageName) {
    case 'safebrowsing':
      controller = new _safeBrowsing__WEBPACK_IMPORTED_MODULE_1__["default"]();
      break;

    case 'adBlockedPage':
      controller = new _adBlockedPage__WEBPACK_IMPORTED_MODULE_0__["default"]();
      break;

    default:
      break;
  }

  if (controller) {
    controller.init();
  }
});

/***/ }),

/***/ "./browser-extension/src/js/safeBrowsing.js":
/*!**************************************************!*\
  !*** ./browser-extension/src/js/safeBrowsing.js ***!
  \**************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _browserExtension__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./browserExtension */ "./browser-extension/src/js/browserExtension.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }


/**
 * SafeBrowsing block page controller
 */

var SafeBrowsing =
/*#__PURE__*/
function (_BrowserExtension) {
  _inherits(SafeBrowsing, _BrowserExtension);

  function SafeBrowsing() {
    _classCallCheck(this, SafeBrowsing);

    var defaultConfiguration = {
      locale: navigator.language || navigator.browserLanguage
    };
    return _possibleConstructorReturn(this, _getPrototypeOf(SafeBrowsing).call(this, defaultConfiguration));
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
}(_browserExtension__WEBPACK_IMPORTED_MODULE_0__["default"]);

/* harmony default export */ __webpack_exports__["default"] = (SafeBrowsing);

/***/ }),

/***/ "./common/localization.js":
/*!********************************!*\
  !*** ./common/localization.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _locales___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../locales/ */ "./locales/index.js");
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { if (i % 2) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } else { Object.defineProperties(target, Object.getOwnPropertyDescriptors(arguments[i])); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }



var i18n =
/*#__PURE__*/
function () {
  function i18n() {
    _classCallCheck(this, i18n);

    this.dictionaries = _objectSpread({}, _locales___WEBPACK_IMPORTED_MODULE_0__["default"]);
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

/* harmony default export */ __webpack_exports__["default"] = (new i18n());

/***/ }),

/***/ "./locales/ar/messages.json":
/*!**********************************!*\
  !*** ./locales/ar/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"تم الإبلاغ عن صفحة الويب هذه على <strong> (تغير المظيف) </strong> كصفحة ضارة وتم حظرها بناءً على تفضيلات الأمان.","phishing":"تم الإبلاغ عن صفحة الويب هذه على <strong> (تغير المظيف) </strong> كصفحة تصيد وتم حظرها بناءً على تفضيلات الأمان الخاصة بك","advancedButton":"المتقدمة","moreInfoButton":"معلومات اكثر","pageTitle":"تم رفض الوصول","safeHeaderTitle":"الوصول إلى هذه الصفحة AdGuard لقد حظر","safeContentTitle":"تم الإبلاغ عن صفحة الويب هذه كصفحة ضارة وتم حظرها بناءً على تفضيلات الأمان","parentalHeaderTitle":"الرقابة الابويه","parentalContentTitle":"لقد حظرنا هذه الصفحة بسبب قيود مرشح الوالدين","parentalDescOne":"هل أنت كبير بما فيه الكفاية؟ أدخل كلمة المرور","parentalDnsDescTwo":"أنت تحاول الوصول إلى موقع ويب مدرج بواسطة ادجوارد باعتباره غير مناسب للأطفال. إذا كنت شخصًا بالغًا ، يمكنك إيقاف التحكم الأبوي في الإعدادات أو إضافة هذا الموقع إلى القائمة البيضاء.","blockedContentTitle":"الوصول إلى هذا الموقع قم بإضافته إلى الاستثناءات{site}تم حظرطلب من خلال قاعدة الفلترإذا كنت ترغب في الوصول إلى هذا الموقع","ruleHeaderTitle":"AdGuardتم حظره بواسطة","ruleContentTitle":"لقد منع ادجوارد هذه الصفحة من التحميل بسبب قاعدة الفلتر التالية","btnGoBack":"الرجوع للخلف","btnFeedback":"إرسال الملاحظات","btnProceed":"المتابعة على أية حال","btnProceedTo":"متابعة للموقع","inputPassword":"أدخل كلمة المرور","errorPageHeader":"صفحة الويب غير متوفرة","summary":"ربما تكون صفحة الويب على <strong> (var.PageUrl) </strong> معطلة مؤقتًا ، أو ربما تكون قد انتقلت إلى عنوان ويب جديد","suggestionsHeader":"وفيما يلي بعض الاقتراحات","suggestion1":"حاول صفحة ويب هذه في وقت لاحق <a href='(var.PageUrl)'>إعادة تحميل</a>","suggestion2":"تحقق من عنوان صفحة الويب للتأكد من إدخالها بشكل صحيح","suggestion3":"تحقق من إعدادات جدار الحماية. يجب السماح لجميع الاتصالات لـ  ادجوارد","suggestion4":"تحقق من إعدادات الخادم الوكيل إذا كنت تستخدم الخادم الوكيل","showDetails":"إظهار التفاصيل","wrongPassword":"كلمة مرور خاطئة","somethingWrong":"هناك خطأ ما. يرجى المحاولة مرة أخرى في وقت لاحق ، أو الاتصال بخدمة الدعم الخاصة بنا","errorPageTitle":"خطأ"};

/***/ }),

/***/ "./locales/cs/messages.json":
/*!**********************************!*\
  !*** ./locales/cs/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Webová stránka <strong>(var.Host)</strong> byla ohlášena jako škodlivá a na základě Vašich bezpečnostních nastavení byla zablokována.","phishing":"Webová stránka <strong>(var.Host)</strong> byla ohlášena jako podvodná a na základě Vašich bezpečnostních nastavení byla zablokována.","advancedButton":"Pokročilé","moreInfoButton":"Více informací","pageTitle":"Přístup odepřen","safeHeaderTitle":"AdGuard zablokoval přístup na tuto stránku","safeContentTitle":"Webová stránka byla ohlášena jako škodlivá a na základě Vašich bezpečnostních nastavení byla zablokována.","parentalHeaderTitle":"Rodičovská kontrola","parentalContentTitle":"Tuto stránku jsme zablokovali kvůli omezením rodičovského filtru.","parentalDescOne":"Máte na to věk? Zadejte heslo","parentalDnsDescTwo":"Pokoušíte navštívit stránku, kterou AdGuard eviduje jako nevhodnou pro děti. Pokud jste dospělý/á, můžete v nastavení vypnout rodičovskou kontrolu nebo tuto stránku přidat na seznam povolených.","blockedContentTitle":"Přístup na {site} byl zablokován pravidlem filtru. Chcete-li tuto stránku zobrazit, přidejte ji mezi výjimky.","ruleHeaderTitle":"Blokováno programem AdGuard","ruleContentTitle":"AdGuard zabránil načtení této stránky kvůli následujícímu pravidlu filtru","btnGoBack":"Zpět","btnFeedback":"Odeslat zpětnou vazbu","btnProceed":"Přesto pokračovat","btnProceedTo":"Pokračovat na stránku","inputPassword":"Zadejte heslo","errorPageHeader":"Webová stránka není dostupná","summary":"Webová stránka <strong>(var.PageUrl)</strong> může být dočasně nedostupná, nebo se přesunula na jinou adresu.","suggestionsHeader":"Zde jsou některé návrhy","suggestion1":"Zkuste <a href='(var.PageUrl)'>znovu načíst</a> tuto webovou stránku později.","suggestion2":"Zkontrolujte webovou adresu a ujistěte se, že jste ji zadali správně.","suggestion3":"Zkontrolujte nastavení brány firewall. Všechna připojení by měla být pro AdGuard povolena.","suggestion4":"Zkontrolujte nastavení serveru proxy, pokud jej používáte.","showDetails":"Zobrazit podrobnosti","wrongPassword":"Nesprávné heslo","somethingWrong":"Něco se pokazilo. Zkuste to znovu později nebo kontaktujte naši technickou podporu.","errorPageTitle":"Chyba"};

/***/ }),

/***/ "./locales/da/messages.json":
/*!**********************************!*\
  !*** ./locales/da/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Denne hjemmeside på <strong>(var.Host)</strong> er blevet rapporteret som en malware side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.","phishing":"Denne hjemmeside på <strong>(var.Host)</strong> er blevet rapporteret som en phishing side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.","advancedButton":"Avanceret","moreInfoButton":"Mere information","pageTitle":"Adgang nægtet","safeHeaderTitle":"AdGuard har blokeret adgangen til denne side","safeContentTitle":"Denne hjemmeside er blevet rapporteret som en malware side og er derfor blevet blokeret baseret på dine sikkerhedspræferencer.","parentalHeaderTitle":"Forældrekontrol","parentalContentTitle":"Vi blokerede denne side på grund af forældrefilter restriktionerne.","parentalDescOne":"Er du gammel nok? Indtast adgangskoden","parentalDnsDescTwo":"Du forsøger at nå en hjemmeside, der er noteret af AdGuard som upassende for børn. Hvis du er voksen, kan du slukke forældrekontrol i indstillingerne eller tilføje denne hjemmeside til whitelisten.","blockedContentTitle":"Forespørgslen til {site} blev blokeret af en filterregel. Hvis du ønsker adgang til denne side, skal du tilføje den til undtagelser.","ruleHeaderTitle":"Blokeret af AdGuard","ruleContentTitle":"AdGuard har forhindret denne side i at blive indlæst på grund af følgende filterregel","btnGoBack":"Gå tilbage","btnFeedback":"Send feedback","btnProceed":"Fortsæt alligevel","btnProceedTo":"Fortsæt til siden","inputPassword":"Indtast adgangskode","errorPageHeader":"Hjemmesiden er ikke tilgængelig","summary":"Hjemmesiden på <strong>(var.PageUrl)</strong> kan være midlertidigt nede, eller også er den flyttet til en ny webadresse.","suggestionsHeader":"Her er nogle forslag","suggestion1":"Prøv <a href='(var.PageUrl)'>at genindlæse</a> denne hjemmeside senere.","suggestion2":"Tjek webadressen for at være sikker på, at du har indtastet den rigtigt.","suggestion3":"Tjek dine firewall indstillinger. Alle forbindelser skal være tilladte for AdGuard.","suggestion4":"Tjek dine proxy indstillinger, hvis du bruger en proxyserver.","showDetails":"Vis detaljer","wrongPassword":"Forkert adgangskode","somethingWrong":"Noget gik galt. Prøv venligst igen senere eller kontakt vores support.","errorPageTitle":"Fejl"};

/***/ }),

/***/ "./locales/de/messages.json":
/*!**********************************!*\
  !*** ./locales/de/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Die Webseite unter <strong>(var.Host)</strong> wurde als bösartig gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.","phishing":"Die Webseite unter <strong>(var.Host)</strong> wurde als Phishing-Webseite gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.","advancedButton":"Weitere Aktionen","moreInfoButton":"Mehr Informationen","pageTitle":"Zugriff verweigert","safeHeaderTitle":"AdGuard hat den Zugriff auf diese Webseite blockiert","safeContentTitle":"Diese Webseite wurde als bösartig gemeldet und wurde aufgrund Ihrer Sicherheitseinstellungen blockiert.","parentalHeaderTitle":"Kindersicherung","parentalContentTitle":"Wir haben diese Seite aufgrund der Einschränkungen des Kinderschutz-Filters blockiert.","parentalDescOne":"Sind Sie alt genung? Geben Sie das Passwort ein.","parentalDnsDescTwo":"Sie versuchen, eine Webseite zu erreichen, die von AdGuard als ungeeignet für Kinder eingestuft wurde. Wenn Sie ein Erwachsener sind, können Sie die Kindersicherung in den Einstellungen deaktivieren oder diese Webseite zur Whitelist hinzufügen.","blockedContentTitle":"Die Anfrage an {site} wurde von einer Filter-Regel blockiert. Wenn Sie diese Seite besuchen möchten, fügen Sie diese bitte zu den Ausnahmen hinzu.","ruleHeaderTitle":"Blockiert durch AdGuard","ruleContentTitle":"AdGuard hat das Laden dieser Seite aufgrund folgender Filterregel verhindert","btnGoBack":"Zurück","btnFeedback":"Feedback senden","btnProceed":"Trotzdem fortfahren\n","btnProceedTo":"Weiter zur Webseite","inputPassword":"Passwort eingeben","errorPageHeader":"Diese Webseite ist nicht verfügbar","summary":"Die Webseite unter <strong>(var.PageUrl)</strong> scheint offline zu sein oder ist auf eine neue Internetadresse umgezogen.","suggestionsHeader":"Hier sind einige Vorschläge","suggestion1":"Versuchen Sie, diese Webseite später <a href='(var.PageUrl)'>neu zu laden</a>.","suggestion2":"Prüfen Sie bitte die Adresse der Webseite, um sicherzustellen, dass Sie diese korrekt eingegeben haben.","suggestion3":"Prüfen Sie bitte Ihre Firewall-Einstellungen. Alle Verbindungen sollten für AdGuard erlaubt sein.","suggestion4":"Prüfen Sie bitte Ihre Proxy-Einstellungen, wenn Sie einen Proxy-Server verwenden.","showDetails":"Details anzeigen","wrongPassword":"Falsches Passwort","somethingWrong":"Etwas ist schief gelaufen. Bitte versuchen Sie es später noch einmal oder kontaktieren Sie unseren Support-Service.","errorPageTitle":"Fehler"};

/***/ }),

/***/ "./locales/en/messages.json":
/*!**********************************!*\
  !*** ./locales/en/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"This web page at <strong>(var.Host)</strong> has been reported as a malware page and has been blocked based on your security preferences.","phishing":"This web page at <strong>(var.Host)</strong> has been reported as a phishing page and has been blocked based on your security preferences.","advancedButton":"Advanced","moreInfoButton":"More information","pageTitle":"Access denied","safeHeaderTitle":"AdGuard has blocked access to this page","safeContentTitle":"This web page has been reported as a malware page and has been blocked based on your security preferences.","parentalHeaderTitle":"Parental control","parentalContentTitle":"We blocked this page because of parental filter restrictions.","parentalDescOne":"Are you old enough? Enter the password","parentalDnsDescTwo":"You're trying to reach a website listed by AdGuard as inappropriate for kids. If you’re an adult then you can switch off parental control in the settings or add this website to the whitelist.","blockedContentTitle":"Request to {site} was blocked by a filter rule. If you want to access this site, add it to exceptions.","ruleHeaderTitle":"Blocked by AdGuard","ruleContentTitle":"AdGuard has prevented this page from loading due to the following filter rule","btnGoBack":"Go back","btnFeedback":"Send feedback","btnProceed":"Proceed anyway","btnProceedTo":"Proceed to site","inputPassword":"Enter password","errorPageHeader":"The webpage is not available","summary":"The webpage at <strong>(var.PageUrl)</strong> might be temporarily down or it may have moved to a new web address.","suggestionsHeader":"Here are some suggestions","suggestion1":"Try <a href='(var.PageUrl)'>reload</a> this web page later.","suggestion2":"Check the web page address to make sure you have entered it correctly.","suggestion3":"Check your firewall settings. All connections should be allowed for AdGuard.","suggestion4":"Check your proxy settings if you use proxy server.","showDetails":"Show details","wrongPassword":"Wrong password","somethingWrong":"Something went wrong. Please try again later or contact our support service.","errorPageTitle":"Error"};

/***/ }),

/***/ "./locales/es/messages.json":
/*!**********************************!*\
  !*** ./locales/es/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Esta página web en <strong>(var.Host)</strong> ha sido reportada como una página de malware y ha sido bloqueada en base a sus preferencias de seguridad.","phishing":"Esta página web en <fuerte>(var.Host)</fuerte> ha sido reportada como una página de phishing y ha sido bloqueada en base a sus preferencias de seguridad.","advancedButton":"Avanzado","moreInfoButton":"Más información","pageTitle":"Acceso denegado","safeHeaderTitle":"AdGuard ha bloqueado el acceso a esta página","safeContentTitle":"Esta página web ha sido reportada como una página de malware y ha sido bloqueada en base a sus preferencias de seguridad.","parentalHeaderTitle":"Control parental","parentalContentTitle":"Hemos bloqueado esta página debido a las restricciones de los filtros parentales.","parentalDescOne":"¿Tienes la edad suficiente? Ingrese la contraseña","parentalDnsDescTwo":"Está tratando de llegar a un sitio web listado por AdGuard como inapropiado para niños. Si es un adulto, puede desactivar el control parental en la configuración o añadir este sitio web a la lista blanca.","blockedContentTitle":"La petición a {site} fue bloqueada por una regla de filtro. Si desea acceder a este sitio, añádalo a las excepciones.","ruleHeaderTitle":"Bloqueado por AdGuard","ruleContentTitle":"AdGuard ha impedido que esta página se cargue debido a la siguiente regla de filtro","btnGoBack":"Regresar","btnFeedback":"Enviar comentarios","btnProceed":"Proceder de todos modos","btnProceedTo":"Proceder al sitio","inputPassword":"Ingrese la contraseña","errorPageHeader":"La página web no está disponible","summary":"La página web en <strong>(var.PageUrl)</strong> puede estar temporalmente desactivada o puede haberse movido a una nueva dirección web.","suggestionsHeader":"Aquí hay varias sugerencias","suggestion1":"Pruebe <a href='(var.PageUrl)'>recargar</a> esta página web más tarde.","suggestion2":"Compruebe la dirección de la página web para asegurarse de que la ha introducido correctamente.\n","suggestion3":"Compruebe la configuración de su cortafuegos. Todas las conexiones deben ser permitidas para AdGuard.\n","suggestion4":"Compruebe la configuración del proxy si utiliza un servidor proxy.","showDetails":"Mostrar detalles","wrongPassword":"Contraseña incorrecta\n","somethingWrong":"Algo salió mal. Por favor, inténtelo de nuevo más tarde o póngase en contacto con nuestro servicio de soporte.","errorPageTitle":"Error"};

/***/ }),

/***/ "./locales/fa/messages.json":
/*!**********************************!*\
  !*** ./locales/fa/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"این صفحه وب در <strong>(var.Host)</strong> بعنوان صفحه بدافزاز گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.","phishing":"این صفحه وب در <strong>(var.Host)</strong> بعنوان صفحه فیشینگ گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.","advancedButton":"پيشرفته","moreInfoButton":"اطلاعات بیشتر","pageTitle":"دسترسی رد شد","safeHeaderTitle":"AdGuard دسترسی به این صفحه را مسدود کرده است","safeContentTitle":"این صفحه وب بعنوان صفحه بدافزاز گزارش شده و بر طبق اولویت های امنیتی شما مسدود شده است.","parentalHeaderTitle":"نظارت والدین","parentalContentTitle":"ما این صفحه را به علت محدودیت فیاتر نظارت والدین مسدود کردیم.","parentalDescOne":"آیا به اندازه کافی سن تان زیاد است؟ رمزعبور را وارد کنید","parentalDnsDescTwo":"AdGuard دسترسی شما را بدلیل اینکه این محتوا مناسب کودکان نیست محدود کرده است. اگر شما یک انسان بالغ هستید میتوانید نظارت والدین را در قسمت تنظیمات غیرفعال کرده یا این سایت را در لیست سفید قرار دهید.","blockedContentTitle":"درخواست به {site} با مدل دستور فیلتر مسدود شده است. اگر میخواهید به این سایت دسترسی داشته باشید آن را به استثناء ها اضافه کنید.","ruleHeaderTitle":"با AdGuard مسدود شده است","ruleContentTitle":"AdGuard از دسترسی به این صفحه به علت دستور فیلتر زیر جلوگیری کرد","btnGoBack":"برگرد","btnFeedback":"اِرسال بازخورد","btnProceed":"بهر حال ادامه بده","btnProceedTo":"برو به سایت","inputPassword":"رمزعبور را وارد کنید","errorPageHeader":"صفحه وب در دسترس نیست","summary":"صفحه وب در<strong>(var.PageUrl)</strong> امکان دارد موقتی از کار افتاده باشد یا آ« به آدرس وب جدید تغیر مکان یافته باشد.","suggestionsHeader":"در اینجا تعدادی پیشنهاد","suggestion1":"در بعد سعی کنید این صفحه وب <a href='(var.PageUrl)'>بارگیری مجدد</a> کنید.","suggestion2":"آدرس وب را بررسی کنید و مطمئن شوید به درستی تایپ شده است.","suggestion3":"تنظیمات فایروال خود را چک کنید. AdGuard باید اجازه دسترسی به همه اتصالات را داشته باشد.","suggestion4":"اگر از پراکسی سرور استفاده می کنید،تنظیمات پراکسی را امتحان کنید.","showDetails":"نمایش جزئیات","wrongPassword":"رمزعبور اشتباه است","somethingWrong":"مشکلی وجود دارد.لطفا بعدا امتحان کنید یا با سرویس پشتیبانی تماس بگیرید","errorPageTitle":"خطا"};

/***/ }),

/***/ "./locales/fi/messages.json":
/*!**********************************!*\
  !*** ./locales/fi/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Tämä sivusto <strong>(var.Host)</strong> on ilmoitettu olevan haittaohjelmasivusto ja se on estetty sinun turvallisuusasetusten perusteella.","phishing":"Tämä sivusto <strong>(var.Host)</strong> on ilmoitettu olevan tietojenkalastelusivusto ja se on estetty sinun turvallisuusasetusten perusteella.","advancedButton":"Lisäasetukset","moreInfoButton":"Lisätiedot","pageTitle":"Pääsy estetty","safeHeaderTitle":"AdGuard on estänyt pääsyn tälle sivulle","safeContentTitle":"Tämä sivusto on ilmoitettu olevan haittaohjelmasivusto ja se on estetty sinun turvallisuusasetusten perusteella.","parentalHeaderTitle":"Lapsilukko","parentalContentTitle":"Estimme tämän sivun lapsilukon suodatusrajoituksien takia.","parentalDescOne":"Oletko riittävän vanha? Syötä salasana","parentalDnsDescTwo":"Yrität tavoitella verkkosivustoa, jonka AdGuard on luetteloinut sopimattomaksi lapsille. Jos olet aikuinen, voit poistaa lapsilukon käytöstä asetuksista tai lisätä tämän verkkosivuston sallittuun luetteloon.","blockedContentTitle":"Suodatussääntö esti pyynnön sivustoon {site}. Jos haluat päästä tälle sivustolle, lisää se poikkeuksiin.","ruleHeaderTitle":"Estetty AdGuardilla","ruleContentTitle":"AdGuard esti tätä sivustoa lataamasta seuraavan suodatinsäännön takia","btnGoBack":"Palaa takaisin","btnFeedback":"Lähetä palaute","btnProceed":"Jatka silti","btnProceedTo":"Jatka sivustolle","inputPassword":"Syötä salasana","errorPageHeader":"Verkkosivusto ei ole saatavilla","summary":"Verkkosivusto osoittessa <strong>(var.PageUrl)</strong> saattaa olla hetkellisesti alhaalla tai se on siirretty toiseen verkko-osoitteeseen.","suggestionsHeader":"Tässä joitakin ehdotuksia","suggestion1":"Yritä <a href='(var.PageUrl)'>päivittää</a> tämä verkkosivusto myöhemmin.","suggestion2":"Tarkista että olet kirjoittanut verkko-osoiteen oikein.","suggestion3":"Tarkista palomuurin asetukset. Kaikki yhteydet tulisi sallia AdGuardille.","suggestion4":"Tarkista välityspalvelinasetukset jos käytät välityspalvelinta.","showDetails":"Näytä tiedot","wrongPassword":"Väärä salasana","somethingWrong":"Jokin meni pieleen. Yritä myöhemmin uudelleen tai ota yhteyttä tukipalveluumme.","errorPageTitle":"Virhe"};

/***/ }),

/***/ "./locales/fr/messages.json":
/*!**********************************!*\
  !*** ./locales/fr/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Cette page web <strong>(var.Host)</strong> a été signalée comme une page malveillante et fût bloquée selon vos préférences de sécurité.","phishing":"Cette page web <strong>(var.Host)</strong> a été signalée comme une page d'hameçonnage et fût bloquée selon vos préférences de sécurité.","advancedButton":"Autres actions","moreInfoButton":"Plus d'information","pageTitle":"Accès refusé","safeHeaderTitle":"AdGuard a bloqué l'accès à cette page","safeContentTitle":"Cette page web a été signalée comme page malicieuse et a été bloquée selon vos préférences de sécurité.","parentalHeaderTitle":"Contrôle parental","parentalContentTitle":"Nous avons bloqué cette page à cause des restrictions du contrôle parental.","parentalDescOne":"Entrez le mot de passe si vous êtes majeur","parentalDnsDescTwo":"Vous essayez d'atteindre un site web classé par AdGuard comme inapproprié pour les enfants. Si vous êtes un adulte, alors vous pouvez désactiver le contrôle parental dans les paramètres ou bien ajouter ce site web à la liste blanche.","blockedContentTitle":"La requête vers {site} a été bloquée par une règle de filtrage. Si vous voulez accéder à ce site, ajoutez-le aux exceptions.","ruleHeaderTitle":"Bloqué par AdGuard","ruleContentTitle":"AdGuard n'a pas autorisé le chargement de cette page en raison de la régle de filtrage suivante","btnGoBack":"Retour","btnFeedback":"Envoyer un commentaire","btnProceed":"Forçage de procédure","btnProceedTo":"Procéder au site web","inputPassword":"Saisir le mot de passe","errorPageHeader":"La page web n'est pas disponible","summary":"La page web <strong>(var.PageUrl)</strong> pourrait être temporairement indisponible soit elle a été déplacée vers une nouvelle addresse.","suggestionsHeader":"Voici quelques suggestions","suggestion1":"Essayez de <a href='(var.PageUrl)'>recharger</a> cette page plus tard.","suggestion2":"Vérifiez l'adresse de la page web pour vous assurer que vous l'avez entré correctement.","suggestion3":"Vérifiez les paramètres de votre pare-feu. Toutes les connexions devraient être permises pour AdGuard.","suggestion4":"Vérifiez les paramètres de votre proxy si vous utilisez un serveur proxy.","showDetails":"Montrer les détails","wrongPassword":"Mot de passe incorrect","somethingWrong":"Un problème est survenu. Veuillez réessayer plus tard ou contacter notre service d'assistance technique.","errorPageTitle":"Erreur"};

/***/ }),

/***/ "./locales/id/messages.json":
/*!**********************************!*\
  !*** ./locales/id/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Halaman situs pada <strong>(var.Host)</strong> telah dilaporkan sebagai halaman malware dan telah diblokir berdasarkan preferensi keamanan Anda.","phishing":"Halaman situs pada <strong>(var.Host)</strong> telah dilaporkan sebagai halaman phising dan telah diblokir berdasarkan preferensi keamanan Anda.","advancedButton":"Lanjutan","moreInfoButton":"Informasi lebih lanjut","pageTitle":"Akses ditolak","safeHeaderTitle":"AdGuard telah memblokir akses ke halaman ini","safeContentTitle":"Halaman situs diketahui sebagai halaman malware dan telah diblokir berdasarkan preferensi keamanan Anda.","parentalHeaderTitle":"Kontrol orang tua","parentalContentTitle":"Kami memblokir halaman ini karena pembatasan penyaring orangtua.","parentalDescOne":"Apakah Anda cukup umur? Masukkan kata sandi","parentalDnsDescTwo":"Anda akan menjangkau situs yang terdaftar oleh AdGuard sebagai tindakan tidak pantas untuk anak. Jika anda seorang dewasa maka Anda dapat mematikan parental orang tua di pengaturan atau menambah situs ini kedalam daftar putih.","blockedContentTitle":"Permintaan ke {site} telah diblokir oleh aturan penyaring. Jika Anda ingin mengakses situs ini, tambahkan ini ke pengecualian.","ruleHeaderTitle":"Diblokir oleh AdGuard","ruleContentTitle":"AdGuard menolak memuat halaman ini dikarenakan aturan penyaring berikut","btnGoBack":"Kembali","btnFeedback":"Kirim umpan balik","btnProceed":"Tetap lanjutkan","btnProceedTo":"Lanjutkan ke situs","inputPassword":"Masukkan kata sandi","errorPageHeader":"Halaman situs ini tidak tersedia","summary":"Halaman situs <strong>(var.PageUrl)</strong> kemungkinan sedang mati sementara, atau mungkin telah pindah ke alamat web yang baru.","suggestionsHeader":"Berikut adalah beberapa saran","suggestion1":" Coba <a href='(var.PageUrl)'>muat ulang</a> halaman situs ini nanti.","suggestion2":"Periksa halaman situs dan pastikan Anda memasukkannya dengan benar.","suggestion3":"Periksa pengaturan firewall Anda. Semua koneksi harus sebaiknya diperbolehkan untuk AdGuard.","suggestion4":"Periksa pengaturan proksi Anda jika menggunakan server proksi.","showDetails":"Tampikan rincian","wrongPassword":"Kata sandi salah","somethingWrong":"Ada yang salah. Coba lagi nanti, atau kontak layanan dukungan kami.","errorPageTitle":"Kesalahan"};

/***/ }),

/***/ "./locales/index.js":
/*!**************************!*\
  !*** ./locales/index.js ***!
  \**************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _locales_ar_messages_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../locales/ar/messages.json */ "./locales/ar/messages.json");
var _locales_ar_messages_json__WEBPACK_IMPORTED_MODULE_0___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/ar/messages.json */ "./locales/ar/messages.json", 1);
/* harmony import */ var _locales_cs_messages_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../locales/cs/messages.json */ "./locales/cs/messages.json");
var _locales_cs_messages_json__WEBPACK_IMPORTED_MODULE_1___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/cs/messages.json */ "./locales/cs/messages.json", 1);
/* harmony import */ var _locales_da_messages_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../locales/da/messages.json */ "./locales/da/messages.json");
var _locales_da_messages_json__WEBPACK_IMPORTED_MODULE_2___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/da/messages.json */ "./locales/da/messages.json", 1);
/* harmony import */ var _locales_de_messages_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../locales/de/messages.json */ "./locales/de/messages.json");
var _locales_de_messages_json__WEBPACK_IMPORTED_MODULE_3___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/de/messages.json */ "./locales/de/messages.json", 1);
/* harmony import */ var _locales_en_messages_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../locales/en/messages.json */ "./locales/en/messages.json");
var _locales_en_messages_json__WEBPACK_IMPORTED_MODULE_4___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/en/messages.json */ "./locales/en/messages.json", 1);
/* harmony import */ var _locales_es_messages_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../locales/es/messages.json */ "./locales/es/messages.json");
var _locales_es_messages_json__WEBPACK_IMPORTED_MODULE_5___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/es/messages.json */ "./locales/es/messages.json", 1);
/* harmony import */ var _locales_fa_messages_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../locales/fa/messages.json */ "./locales/fa/messages.json");
var _locales_fa_messages_json__WEBPACK_IMPORTED_MODULE_6___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/fa/messages.json */ "./locales/fa/messages.json", 1);
/* harmony import */ var _locales_fi_messages_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../locales/fi/messages.json */ "./locales/fi/messages.json");
var _locales_fi_messages_json__WEBPACK_IMPORTED_MODULE_7___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/fi/messages.json */ "./locales/fi/messages.json", 1);
/* harmony import */ var _locales_fr_messages_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../locales/fr/messages.json */ "./locales/fr/messages.json");
var _locales_fr_messages_json__WEBPACK_IMPORTED_MODULE_8___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/fr/messages.json */ "./locales/fr/messages.json", 1);
/* harmony import */ var _locales_id_messages_json__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ../locales/id/messages.json */ "./locales/id/messages.json");
var _locales_id_messages_json__WEBPACK_IMPORTED_MODULE_9___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/id/messages.json */ "./locales/id/messages.json", 1);
/* harmony import */ var _locales_it_messages_json__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ../locales/it/messages.json */ "./locales/it/messages.json");
var _locales_it_messages_json__WEBPACK_IMPORTED_MODULE_10___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/it/messages.json */ "./locales/it/messages.json", 1);
/* harmony import */ var _locales_ja_messages_json__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ../locales/ja/messages.json */ "./locales/ja/messages.json");
var _locales_ja_messages_json__WEBPACK_IMPORTED_MODULE_11___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/ja/messages.json */ "./locales/ja/messages.json", 1);
/* harmony import */ var _locales_ko_messages_json__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ../locales/ko/messages.json */ "./locales/ko/messages.json");
var _locales_ko_messages_json__WEBPACK_IMPORTED_MODULE_12___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/ko/messages.json */ "./locales/ko/messages.json", 1);
/* harmony import */ var _locales_lt_messages_json__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ../locales/lt/messages.json */ "./locales/lt/messages.json");
var _locales_lt_messages_json__WEBPACK_IMPORTED_MODULE_13___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/lt/messages.json */ "./locales/lt/messages.json", 1);
/* harmony import */ var _locales_pl_messages_json__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ../locales/pl/messages.json */ "./locales/pl/messages.json");
var _locales_pl_messages_json__WEBPACK_IMPORTED_MODULE_14___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/pl/messages.json */ "./locales/pl/messages.json", 1);
/* harmony import */ var _locales_pt_BR_messages_json__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ../locales/pt-BR/messages.json */ "./locales/pt-BR/messages.json");
var _locales_pt_BR_messages_json__WEBPACK_IMPORTED_MODULE_15___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/pt-BR/messages.json */ "./locales/pt-BR/messages.json", 1);
/* harmony import */ var _locales_pt_PT_messages_json__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ../locales/pt-PT/messages.json */ "./locales/pt-PT/messages.json");
var _locales_pt_PT_messages_json__WEBPACK_IMPORTED_MODULE_16___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/pt-PT/messages.json */ "./locales/pt-PT/messages.json", 1);
/* harmony import */ var _locales_ru_messages_json__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ../locales/ru/messages.json */ "./locales/ru/messages.json");
var _locales_ru_messages_json__WEBPACK_IMPORTED_MODULE_17___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/ru/messages.json */ "./locales/ru/messages.json", 1);
/* harmony import */ var _locales_sk_messages_json__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ../locales/sk/messages.json */ "./locales/sk/messages.json");
var _locales_sk_messages_json__WEBPACK_IMPORTED_MODULE_18___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/sk/messages.json */ "./locales/sk/messages.json", 1);
/* harmony import */ var _locales_sl_messages_json__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ../locales/sl/messages.json */ "./locales/sl/messages.json");
var _locales_sl_messages_json__WEBPACK_IMPORTED_MODULE_19___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/sl/messages.json */ "./locales/sl/messages.json", 1);
/* harmony import */ var _locales_sr_messages_json__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! ../locales/sr/messages.json */ "./locales/sr/messages.json");
var _locales_sr_messages_json__WEBPACK_IMPORTED_MODULE_20___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/sr/messages.json */ "./locales/sr/messages.json", 1);
/* harmony import */ var _locales_sv_messages_json__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! ../locales/sv/messages.json */ "./locales/sv/messages.json");
var _locales_sv_messages_json__WEBPACK_IMPORTED_MODULE_21___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/sv/messages.json */ "./locales/sv/messages.json", 1);
/* harmony import */ var _locales_tr_messages_json__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! ../locales/tr/messages.json */ "./locales/tr/messages.json");
var _locales_tr_messages_json__WEBPACK_IMPORTED_MODULE_22___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/tr/messages.json */ "./locales/tr/messages.json", 1);
/* harmony import */ var _locales_uk_messages_json__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! ../locales/uk/messages.json */ "./locales/uk/messages.json");
var _locales_uk_messages_json__WEBPACK_IMPORTED_MODULE_23___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/uk/messages.json */ "./locales/uk/messages.json", 1);
/* harmony import */ var _locales_zh_CN_messages_json__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! ../locales/zh-CN/messages.json */ "./locales/zh-CN/messages.json");
var _locales_zh_CN_messages_json__WEBPACK_IMPORTED_MODULE_24___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/zh-CN/messages.json */ "./locales/zh-CN/messages.json", 1);
/* harmony import */ var _locales_zh_TW_messages_json__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! ../locales/zh-TW/messages.json */ "./locales/zh-TW/messages.json");
var _locales_zh_TW_messages_json__WEBPACK_IMPORTED_MODULE_25___namespace = /*#__PURE__*/__webpack_require__.t(/*! ../locales/zh-TW/messages.json */ "./locales/zh-TW/messages.json", 1);
// TODO import list of langs from .twosky.json


























/* harmony default export */ __webpack_exports__["default"] = ({
  ar: _locales_ar_messages_json__WEBPACK_IMPORTED_MODULE_0__,
  cs: _locales_cs_messages_json__WEBPACK_IMPORTED_MODULE_1__,
  da: _locales_da_messages_json__WEBPACK_IMPORTED_MODULE_2__,
  de: _locales_de_messages_json__WEBPACK_IMPORTED_MODULE_3__,
  en: _locales_en_messages_json__WEBPACK_IMPORTED_MODULE_4__,
  es: _locales_es_messages_json__WEBPACK_IMPORTED_MODULE_5__,
  fa: _locales_fa_messages_json__WEBPACK_IMPORTED_MODULE_6__,
  fi: _locales_fi_messages_json__WEBPACK_IMPORTED_MODULE_7__,
  fr: _locales_fr_messages_json__WEBPACK_IMPORTED_MODULE_8__,
  id: _locales_id_messages_json__WEBPACK_IMPORTED_MODULE_9__,
  it: _locales_it_messages_json__WEBPACK_IMPORTED_MODULE_10__,
  ja: _locales_ja_messages_json__WEBPACK_IMPORTED_MODULE_11__,
  ko: _locales_ko_messages_json__WEBPACK_IMPORTED_MODULE_12__,
  lt: _locales_lt_messages_json__WEBPACK_IMPORTED_MODULE_13__,
  pl: _locales_pl_messages_json__WEBPACK_IMPORTED_MODULE_14__,
  'pt-br': _locales_pt_BR_messages_json__WEBPACK_IMPORTED_MODULE_15__,
  'pt-pt': _locales_pt_PT_messages_json__WEBPACK_IMPORTED_MODULE_16__,
  ru: _locales_ru_messages_json__WEBPACK_IMPORTED_MODULE_17__,
  sk: _locales_sk_messages_json__WEBPACK_IMPORTED_MODULE_18__,
  sl: _locales_sl_messages_json__WEBPACK_IMPORTED_MODULE_19__,
  sr: _locales_sr_messages_json__WEBPACK_IMPORTED_MODULE_20__,
  sv: _locales_sv_messages_json__WEBPACK_IMPORTED_MODULE_21__,
  tr: _locales_tr_messages_json__WEBPACK_IMPORTED_MODULE_22__,
  uk: _locales_uk_messages_json__WEBPACK_IMPORTED_MODULE_23__,
  'zh-cn': _locales_zh_CN_messages_json__WEBPACK_IMPORTED_MODULE_24__,
  'zh-tw': _locales_zh_TW_messages_json__WEBPACK_IMPORTED_MODULE_25__
});

/***/ }),

/***/ "./locales/it/messages.json":
/*!**********************************!*\
  !*** ./locales/it/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Questa pagina web su <strong>(var.Host)</strong> è stata segnalata come pagina malware ed è stata bloccata secondo le tue preferenze di sicurezza.","phishing":"Questa pagina web su <strong>(var.Host)</strong> è stata segnalata come pagina phishing ed è stata bloccata secondo le tue preferenze di sicurezza.","advancedButton":"Avanzato","moreInfoButton":"Maggiori informazioni","pageTitle":"Accesso negato","safeHeaderTitle":"AdGuard ha bloccato l'accesso a questa pagina","safeContentTitle":"Questa pagina web è stata segnalata come pagina malware ed è stata bloccata secondo le tue preferenze di sicurezza.","parentalHeaderTitle":"Filtro Famiglia","parentalContentTitle":"Abbiamo bloccato questa pagina a causa delle restrizioni del filtro famiglia.","parentalDescOne":"Sei abbastanza grande? Inserisci la password","parentalDnsDescTwo":"Stai cercando di raggiungere un sito internet elencato da AdGuard come non appropriato per i bambini. Se sei un adulto puoi disabilitare il filtro famiglia nelle impostazioni o aggiungere questo sito alla whitelist.","blockedContentTitle":"La richiesta verso {site} è stata bloccata da un filtro. Se vuoi accedere al sito, aggiungilo alle eccezioni.","ruleHeaderTitle":"Bloccato da AdGuard","ruleContentTitle":"AdGuard ha bloccato il caricamento di questa pagina per il seguente filtro","btnGoBack":"Torna indietro","btnFeedback":"Invia feedback","btnProceed":"Procedi comunque","btnProceedTo":"Procedi al sito","inputPassword":"Inserisci password","errorPageHeader":"La pagina web non è disponibile","summary":"La pagina web su <strong>(var.PageUrl)</strong> potrebbe essere temporaneamente non disponibile o potrebbe essere stata spostata ad un nuovo indirizzo.","suggestionsHeader":"Ecco alcuni suggerimenti","suggestion1":"Prova a <a href='(var.PageUrl)'>ricaricare</a> questa pagina web più tardi.","suggestion2":"Controlla l'indirizzo della pagina web per assicurarti che lo hai inserito correttamente.","suggestion3":"Controlla le impostazioni del firewall. Tutte le connessioni dovrebbero essere permesse per AdGuard.","suggestion4":"Controlla le impostazioni del proxy se usi un server proxy.","showDetails":"Mostra dettagli","wrongPassword":"Password errata","somethingWrong":"Qualcosa è andato storto. Perfavore riprova più tardi, oppure contatta il nostro supporto tecnico","errorPageTitle":"Errore"};

/***/ }),

/***/ "./locales/ja/messages.json":
/*!**********************************!*\
  !*** ./locales/ja/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"<strong>(var.Host)</strong> はマルウェアのページとして報告されています。セキュリティの設定に基づいてブロックされました。","phishing":"<strong>(var.Host)</strong> はフィッシング詐欺のページとして報告されており、セキュリティの設定に基づいてブロックれました。","advancedButton":"高度な設定","moreInfoButton":"詳細","pageTitle":"アクセス拒否","safeHeaderTitle":"AdGuardはこのページへのアクセスをブロックしました","safeContentTitle":"このページはマルウェアのページとして報告されています。セキュリティの設定に基づいてブロックされました。","parentalHeaderTitle":"ペアレンタルコントロール","parentalContentTitle":"このページはペアレンタルコントロールによってブロックされました。","parentalDescOne":"大人の方はパスワードを入力してください。","parentalDnsDescTwo":"子どもに不適切なウェブサイトとしてAdGuardに登録されているサイトにアクセスしようとしています。設定を行った保護者の方は設定からペアレンタルコントロールをオフにするか、このウェブサイトをホワイトリストに追加することができます。","blockedContentTitle":"{site}へのリクエストはフィルタルールによってブロックされました。サイトにアクセスしたい場合は例外に追加してください。","ruleHeaderTitle":"AdGuardによってブロックされました","ruleContentTitle":"AdGuardは以下のフィルタリング・ルールに従って、このページの読み込みを防止しました。","btnGoBack":"戻る","btnFeedback":"フィードバックを送る","btnProceed":"そのまま続行する","btnProceedTo":"サイトへ続行する","inputPassword":"パスワードを入力","errorPageHeader":"ウェブページは利用できません","summary":"<strong>(var.PageUrl)</strong> にあるウェブページが一時的にダウンしているか、新しいウェブアドレスに移動している可能性があります。","suggestionsHeader":"問題を解決するために、次の操作をお試しください","suggestion1":"後ほどこのウェブページを<a href='(var.PageUrl)'>リロード</a>してみてください。","suggestion2":"Webページのアドレスが正しく入力してあるかを確認してください。","suggestion3":"ファイアウォールの設定を確認してください。 AdGuard接続のすべてが許可されている必要があります。","suggestion4":"プロキシサーバーを使用している場合は、プロキシ設定を確認してください。","showDetails":"詳細を表示","wrongPassword":"パスワードが間違っています","somethingWrong":"原因不明の問題が起きました。 後でもう一度お試しいただくか、サポートサービスにご連絡ください。","errorPageTitle":"エラー"};

/***/ }),

/***/ "./locales/ko/messages.json":
/*!**********************************!*\
  !*** ./locales/ko/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"이 웹 페이지 <strong>(var.Host)</strong>는 악성 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.","phishing":"이 웹 페이지 <strong>(var.Host)</strong>는 피싱 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.","advancedButton":"고급 설정","moreInfoButton":"추가 정보","pageTitle":"접근 거부됨","safeHeaderTitle":"AdGuard가 이 페이지 접근을 차단하였습니다.","safeContentTitle":"이 웹 페이지는 악성 페이지로 보고되어, 설정하신 보안 설정에 따라 차단되었습니다.","parentalHeaderTitle":"자녀 보호","parentalContentTitle":"이 페이지는 자녀 보호 필터 제한으로 차단되었습니다.","parentalDescOne":"자녀 보호 모드를 해제하려면 비밀번호를 입력하세요.","parentalDnsDescTwo":"지금 AdGuard에서 지정한 어린이들에게 부적절한 웹 사이트에 접속하려고 합니다. 성인인 경우 설정에서 자녀 보호를 해제하거나 이 웹 사이트를 화이트리스트에 추가할 수 있습니다.","blockedContentTitle":"{site} 페이지는 필터 규칙에 의해 차단 되었습니다. 이 사이트에 접근하고 싶다면 예외 항목에 추가 하세요.","ruleHeaderTitle":"AdGuard에 의해 차단됨","ruleContentTitle":"다음 필터 규칙으로 인해 AdGuard에서 이 페이지를 로드하지 못했습니다.","btnGoBack":"뒤로가기","btnFeedback":"피드백 전송","btnProceed":"그래도 계속하기","btnProceedTo":"사이트 접속하기","inputPassword":"비밀번호 입력","errorPageHeader":"웹페이지를 사용할 수 없습니다.","summary":"<strong>(var.PageUrl)</strong> 웹 페이지는 일시적으로 다운되었거나 다른 웹 주소로 변경되었을 수 있습니다.","suggestionsHeader":"여기에 몇가지 제안이 있습니다.","suggestion1":"잠시 후 이 웹 페이지를 <a href='(var.PageUrl)'>새로고침</a>하세요.","suggestion2":"웹 페이지 주소를 올바르게 입력했는지 확인하세요.","suggestion3":"방화벽 설정을 확인하세요. AdGuard의 모든 연결은 허용되어 있어야 합니다.","suggestion4":"프록시 서버를 사용 하시면 프록시 설정을 확인 하세요.","showDetails":"자세히 보기","wrongPassword":"비밀번호가 맞지 않습니다.","somethingWrong":"알 수 없는 오류가 발생했습니다. 다시 시도하거나 고객 지원에 문의해주세요.","errorPageTitle":"오류"};

/***/ }),

/***/ "./locales/lt/messages.json":
/*!**********************************!*\
  !*** ./locales/lt/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Šis tinklalapis, adresu <strong>(var.Host)</strong>, buvo pažymėtas kaip kenkėjiškų programų puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.","phishing":"Šis tinklalapis, adresu <strong>(var.Host)</strong>, buvo pažymėtas kaip sukčiavimo puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.","advancedButton":"Papildomai","moreInfoButton":"Daugiau informacijos","pageTitle":"Prieiga neleidžiama","safeHeaderTitle":"AdGuard užblokavo prieigą prie šio puslapio","safeContentTitle":"Šis tinklalapis buvo pažymėtas kaip kenkėjiškų programų puslapis ir buvo užblokuotas atsižvelgiant į jūsų saugos nuostatas.","parentalHeaderTitle":"Tėvų kontrolė","parentalContentTitle":"Užblokavome šį puslapį dėl tėvų kontrolės filtrų apribojimų.","parentalDescOne":"Ar esate suaugęs? Įveskite slaptažodį","parentalDnsDescTwo":"Bandote pasiekti svetainę, kurią AdGuard laiko kaip netinkamą vaikams. Jei esate suaugęs, nustatymuose galite išjungti tėvų kontrolę arba įtraukti šią svetainę į baltąjį sąrašą.","blockedContentTitle":"Užklausą į {site} buvo užblokuota filtravimo taisyklės. Jei norite pasiekti šią svetainę, pridėkite ją prie išimčių.","ruleHeaderTitle":"Užblokavo AdGuard","ruleContentTitle":"AdGuard neleido įkelti šio puslapio dėl šios filtravimo taisyklės","btnGoBack":"Grįžti","btnFeedback":"Grįžtamasis ryšys","btnProceed":"Tęsti vis tiek","btnProceedTo":"Pereiti į svetainę","inputPassword":"Įveskite slaptažodį","errorPageHeader":"Tinklalapis nepasiekiamas","summary":"Tinklalapis <strong>(var.PageUrl)</strong> laikinai nepasiekiamas arba neegzistuoja.","suggestionsHeader":"Štai keletas prielaidų","suggestion1":"Pabandykite<a href='(var.PageUrl)'>įkelti</a> šį tinklalapį vėliau.","suggestion2":"Patikrinkite svetainės adresą, kad įsitikintumėte, jog jį teisingai įvedėte.","suggestion3":"Patikrinkite užkardos nustatymus. Visos jungtys turi būti leidžiamos AdGuard.","suggestion4":"Patikrinkite savo proxy nustatymus, jei jūs naudojate proxy serverį.","showDetails":"Rodyti išsamią informaciją","wrongPassword":"Neteisingas slaptažodis","somethingWrong":"Kažkas negerai. Pabandykite dar kartą vėliau arba susisiekite su mūsų palaikymo tarnyba.","errorPageTitle":"Klaida"};

/***/ }),

/***/ "./locales/pl/messages.json":
/*!**********************************!*\
  !*** ./locales/pl/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Strona internetowa <strong>(var.Host)</strong> została zgłoszona jako zawierająca złośliwe oprogramowanie i została ona zablokowana w oparciu o Twoje ustawienia bezpieczeństwa.","phishing":"Strona internetowa <strong>(var.Host)</strong> jest stroną wyłudzającą poufne informacje i została ona zablokowana w oparciu o Twoje ustawienia bezpieczeństwa.","advancedButton":"Zaawansowane","moreInfoButton":"Więcej informacji","pageTitle":"Odmowa dostępu","safeHeaderTitle":"AdGuard zablokował dostęp do tej strony","safeContentTitle":"Ta strona internetowa została zgłoszona jako strona ze złośliwym oprogramowaniem i została zablokowana na podstawie Twoich preferencji zabezpieczeń.","parentalHeaderTitle":"Kontrola rodzicielska","parentalContentTitle":"Zablokowaliśmy stronę z powodu ograniczeń filtra rodzicielskiego.","parentalDescOne":"Jesteś wystarczająco dorosły? Podaj hasło","parentalDnsDescTwo":"Próbujesz dotrzeć do witryny oznaczonej przez AdGuard jako nieodpowiednia dla dzieci. Jeśli jesteś dorosły, możesz wyłączyć kontrolę rodzicielską w ustawieniach lub dodać tę witrynę do białej listy.","blockedContentTitle":"Żądanie {site} zostało zablokowane przez regułę filtrowania. Jeśli chcesz uzyskać dostęp do tej witryny, dodaj ją do wyjątków.","ruleHeaderTitle":"Zablokowana przez AdGuard","ruleContentTitle":"AdGuard uniemożliwił załadowanie tej strony z powodu następującej reguły filtrowania","btnGoBack":"Wróć","btnFeedback":"Wyślij opinię","btnProceed":"Mimo wszystko kontynuuj","btnProceedTo":"Przejdź do witryny","inputPassword":"Wpisz hasło","errorPageHeader":"Strona internetowa nie jest dostępna","summary":"Strona <strong>(var.PageUrl)</strong> może być tymczasowo niedostępna lub mogła zostać przeniesiona do nowego adresu internetowego.","suggestionsHeader":"Oto kilka propozycji","suggestion1":"Spróbuj <a href='(var.PageUrl)'>odświeżyć</a>tę stronę później.","suggestion2":"Sprawdź adres strony internetowej, aby upewnić się, że został wpisany prawidłowo.","suggestion3":"Sprawdź ustawienia zapory sieciowej. Wszystkie połączenia programu AdGuard powinny być dozwolone.","suggestion4":"Jeśli korzystasz z serwera proxy, sprawdź jego ustawienia.","showDetails":"Pokaż szczegóły","wrongPassword":"Błędne hasło","somethingWrong":"Coś poszło nie tak. Spróbuj ponownie później lub skontaktuj się z naszym działem wsparcia.","errorPageTitle":"Błąd"};

/***/ }),

/***/ "./locales/pt-BR/messages.json":
/*!*************************************!*\
  !*** ./locales/pt-BR/messages.json ***!
  \*************************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Este site <strong>(var.Host)</strong> foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.","phishing":"Este site <strong>(var.Host)</strong> foi classificado como uma página de phishing e foi bloqueada com base em suas preferências de segurança.","advancedButton":"Avançado","moreInfoButton":"Mais informações","pageTitle":"Acesso negado","safeHeaderTitle":"AdGuard bloqueou o acesso a esta página","safeContentTitle":"Este site foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.","parentalHeaderTitle":"Controle parental","parentalContentTitle":"Bloqueamos esta página por causa das restrições de filtros do controle parental.","parentalDescOne":"Você tem idade suficiente? Digite a senha","parentalDnsDescTwo":"Você está tentando acessar um site listado pelo AdGuard como impróprio para crianças. Se você é um adulto, você pode desativar o controle parental nas configurações ou adicionar esse site na lista branca.","blockedContentTitle":"Solicitação para {site} foi bloqueada pelo filtro de usuário. Se você quiser acessar este site, adicione na lista de exceções.","ruleHeaderTitle":"Bloqueado pelo AdGuard","ruleContentTitle":"O AdGuard impediu o carregamento dessa página devido à seguinte regra de filtro","btnGoBack":"Voltar","btnFeedback":"Enviar Feedback","btnProceed":"Continuar mesmo assim","btnProceedTo":"Prosseguir para o site","inputPassword":"Digite a senha","errorPageHeader":"Este site não está disponível","summary":"O site <strong>(var.PageUrl)</strong> pode estar temporariamente indisponível ou pode ter sido movido para um novo endereço.","suggestionsHeader":"Aqui estão algumas sugestões","suggestion1":"Tente <a href='(var.PageUrl)'>recarregar</a> este site mais tarde.","suggestion2":"Verifique o endereço da página e certifique de que você digitou corretamente.","suggestion3":"Verifique suas configurações de firewall. Todas conexões devem estar permitidas para o AdGuard.","suggestion4":"Se você estiver usando um servidor proxy, verifique suas configurações.","showDetails":"Mostrar detalhes","wrongPassword":"Senha incorreta","somethingWrong":"Algo deu errado. Por favor, tente novamente mais tarde ou entre em contato com o nosso suporte técnico.","errorPageTitle":"Erro"};

/***/ }),

/***/ "./locales/pt-PT/messages.json":
/*!*************************************!*\
  !*** ./locales/pt-PT/messages.json ***!
  \*************************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Este site <strong>(var.Host)</strong> foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.","phishing":"Este site <strong>(var.Host)</strong> foi classificado como uma página de phishing e foi bloqueada com base em suas preferências de segurança.","advancedButton":"Avançado","moreInfoButton":"Mais informações","pageTitle":"Acesso negado","safeHeaderTitle":"AdGuard bloqueou o acesso a esta página","safeContentTitle":"Este site foi classificado como uma página de malware e foi bloqueada com base em suas preferências de segurança.","parentalHeaderTitle":"Controle parental","parentalContentTitle":"Bloqueamos esta página por causa das restrições de filtros do controle parental.","parentalDescOne":"Você tem idade suficiente? Digite a senha","parentalDnsDescTwo":"Você está tentando acessar um site listado pelo AdGuard como impróprio para crianças. Se você é um adulto, você pode desativar o controle parental nas configurações ou adicionar esse site na lista branca.","blockedContentTitle":"Solicitação para {site} foi bloqueada pelo filtro de usuário. Se você quiser acessar este site, adicione na lista de exceções.","ruleHeaderTitle":"Bloqueado pelo AdGuard","ruleContentTitle":"O AdGuard impediu o carregamento dessa página devido à seguinte regra de filtro","btnGoBack":"Voltar","btnFeedback":"Enviar Feedback","btnProceed":"Continuar mesmo assim","btnProceedTo":"Prosseguir para o site","inputPassword":"Digite a senha","errorPageHeader":"Este site não está disponível","summary":"O site <strong>(var.PageUrl)</strong> pode estar temporariamente indisponível ou pode ter sido movido para um novo endereço.","suggestionsHeader":"Aqui estão algumas sugestões","suggestion1":"Tente <a href='(var.PageUrl)'>recarregar</a> este site mais tarde.","suggestion2":"Verifique o endereço da página e certifique de que você digitou corretamente.","suggestion3":"Verifique suas configurações de firewall. Todas conexões devem estar permitidas para o AdGuard.","suggestion4":"Se você estiver usando um servidor proxy, verifique suas configurações.","showDetails":"Mostrar detalhes","wrongPassword":"Senha incorreta","somethingWrong":"Algo deu errado. Por favor, tente novamente mais tarde ou entre em contato com o nosso suporte técnico.","errorPageTitle":"Erro"};

/***/ }),

/***/ "./locales/ru/messages.json":
/*!**********************************!*\
  !*** ./locales/ru/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Данная веб-страница <strong>(var.Host)</strong> может содержать вредоносное ПО. Она была заблокирована в соответствии с вашими настройками безопасности.","phishing":"Данная веб-страница <strong>(var.Host)</strong> может являться фишинговой. Она была заблокирована в соответствии с вашими настройками безопасности.","advancedButton":"Дополнительно","moreInfoButton":"Подробная информация","pageTitle":"Доступ заблокирован","safeHeaderTitle":"AdGuard заблокировал доступ к этой странице","safeContentTitle":"Данная страница может содержать вредоносное ПО. Она была заблокирована в соответствии с вашими настройками безопасности.","parentalHeaderTitle":"Родительский контроль","parentalContentTitle":"Данная страница была заблокирована из-за ограничений фильтра Родительского контроля.","parentalDescOne":"Введите пароль, если вы совершеннолетний.","parentalDnsDescTwo":"Вы пытаетесь получить доступ к сайту, который AdGuard считает неподходящим для детей. Если вы взрослый человек, вы можете отключить Родительский контроль в настройках AdGuard или внести сайт в белый список.","blockedContentTitle":"Запрос к {site} был заблокирован правилом фильтрации. Если вы хотите получить доступ к этому сайту, добавьте его в исключения.","ruleHeaderTitle":"Запрос заблокирован AdGuard","ruleContentTitle":"AdGuard предотвратил загрузку этой страницы в соответствии со следующим правилом фильтрации","btnGoBack":"Назад","btnFeedback":"Отправить отзыв","btnProceed":"Все равно продолжить","btnProceedTo":"Перейти на сайт","inputPassword":"Введите пароль","errorPageHeader":"Веб-страница недоступна","summary":"Данная веб-страница <strong>(var.PageUrl)</strong>, возможно, временно недоступна или перемещена на новый веб-адрес.","suggestionsHeader":"Вот несколько советов и рекомендаций","suggestion1":"Попробуйте <a href='(var.PageUrl)'>обновить</a> страницу позже.","suggestion2":"Проверьте, правильно ли вы ввели адрес страницы.","suggestion3":"Проверьте настройки брэндмауэра. Для AdGuard должны быть разрешены все соединения.","suggestion4":"Проверьте настройки прокси-сервера, если вы используете его для доступа в интернет.","showDetails":"Подробнее","wrongPassword":"Неверный пароль","somethingWrong":"Что-то пошло не так. Пожалуйста, повторите попытку позже или обратитесь в нашу службу поддержки.","errorPageTitle":"Ошибка"};

/***/ }),

/***/ "./locales/sk/messages.json":
/*!**********************************!*\
  !*** ./locales/sk/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Táto stránka bola na <strong>(var.Host)</strong> nahlásená ako stránka so škodlivým kódom a bola zablokovaná na základe Vašich bezpečnostných nastavení.","phishing":"Stránka <strong>(var.Host)</strong> bola nahlásená ako podvodná a bola zablokovaná na základe Vašich bezpečnostných nastavení.","advancedButton":"Pokročilé","moreInfoButton":"Viac informácií","pageTitle":"Prístup bol zamietnutý","safeHeaderTitle":"AdGuard zablokoval prístup k tejto stránke","safeContentTitle":"Táto stránka bola nahlásená ako stránka so škodlivým kódom a bola zablokovaná na základe Vašich bezpečnostných nastavení","parentalHeaderTitle":"Rodičovská kontrola","parentalContentTitle":"Túto stránku sme zablokovali kvôli obmedzeniam rodičovského filtra.","parentalDescOne":"Ste plnoletý? Zadajte heslo","parentalDnsDescTwo":"Pokúšate sa navštíviť stránku, ktorú AdGuard eviduje ako nevhodnú pre deti. Ak ste dospelý/á, môžete v nastaveniach vypnúť rodičovskú kontrolu alebo túto stránku pridať na bielu listinu.","blockedContentTitle":"Prístup na {site} bol zablokovaný filtračným pravidlom. Ak chcete túto stránku zobraziť, pridajte ju medzi výnimky.","ruleHeaderTitle":"Blokované AdGuardom","ruleContentTitle":"AdGuard zabránil načítaniu tejto stránky kvôli nasledujúcemu filtračnému pravidlu","btnGoBack":"Naspäť","btnFeedback":"Poslať spätnú väzbu","btnProceed":"Aj tak pokračovať","btnProceedTo":"Pokračovať na stránku","inputPassword":"Zadajte heslo","errorPageHeader":"Webová stránka nie je dostupná.","summary":"Stránka <strong>(var.PageUrl)</strong> môže byť dočasne nedostupná alebo sa presunula na novú adresu.","suggestionsHeader":"Tu sú niektoré návrhy","suggestion1":"Skúste stránku <a href='(var.PageUrl)'>znovu načítať </a> neskôr.","suggestion2":"Skontrolujte webovú adresu a uistite sa, že ste ju zadali správne.","suggestion3":"Skontrolujte Vaše nastavenia firewall. Všetky spojenia pre AdGuard musia byť povolené.","suggestion4":"Ak používate proxy server, skontrolujte nastavenia Vášho proxy.","showDetails":"Zobraziť podrobnosti","wrongPassword":"Neplatné heslo","somethingWrong":"Niečo sa pokazilo. Skúste to znova neskôr alebo kontaktujte našu službu podpory.","errorPageTitle":"Chyba"};

/***/ }),

/***/ "./locales/sl/messages.json":
/*!**********************************!*\
  !*** ./locales/sl/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Ta spletna stran v <strong>(var.Host)</strong> je bila prijavljena kot stran s slonamernimi programi in je bila onemogočena glede na vaše varnostne nastavitve.","phishing":"Ta spletna stran v <strong>(var.Host)</strong> je bila prijavljena kot lažna stran in je bila onemogočena glede na vaše varnostne nastavitve.","advancedButton":"Napredno","moreInfoButton":"Več informacij","pageTitle":"Dostop zavrnjen","safeHeaderTitle":"AdGuard je onemogočil dostop do te strani","safeContentTitle":"Ta spletna stran je bila prijavljena kot stran s slonamernimi programi in je bila onemogočena glede na vaše varnostne nastavitve.","parentalHeaderTitle":"Starševski nadzor","parentalContentTitle":"To stran smo onemogočili zaradi omejitev Starševskega filtra.","parentalDescOne":"Ste dovolj stari? Vnesite geslo","parentalDnsDescTwo":"Poskušate doseči spletno stran, ki ga je AdGuard navedel kot neprimerno za otroke. Če ste odrasli, lahko v nastavitvah izklopite Starševski nadzor ali dodate to spletno stran na seznam dovoljenih.","blockedContentTitle":"Zahteva za {site} je onemogočena s pravilom filtra. Če želite dostopati do te strani, jo dodajte izjemam.","ruleHeaderTitle":"Onemogočeno z AdGuardom","ruleContentTitle":"AdGuard je preprečil nalaganje te strani zaradi naslednjega pravila filtriranja","btnGoBack":"Pojdi nazaj","btnFeedback":"Pošlji povratne informacije","btnProceed":"Vseeno nadaljuj","btnProceedTo":"Pojdi na spletno stran","inputPassword":"Vnesite geslo","errorPageHeader":"Spletna stran ni na voljo","summary":"Spletna stran na <strong>(var.PageUrl)</strong>  je morda začasno onemogočena ali pa je morda prestavljena na nov spletni naslov.","suggestionsHeader":"Tukaj je nekaj predlogov","suggestion1":"Poskusite kasneje <a href='(var.PageUrl)'>ponovno naložiti</a> to spletno stran.","suggestion2":"Preverite naslov spletne strani in se prepričajte, da ste ga pravilno vnesli.","suggestion3":"Preverite svoje nastavitve požarnega zidu. Vse povezave je treba dovoliti za AdGuard.","suggestion4":"Preverite nastavitve Proxy strežnika, če ga uporabljate.","showDetails":"Prikaži podrobnosti","wrongPassword":"Napačno geslo","somethingWrong":"Nekaj je šlo narobe. Poskusite znova pozneje ali se obrnite na našo službo za podporo.","errorPageTitle":"Napaka"};

/***/ }),

/***/ "./locales/sr/messages.json":
/*!**********************************!*\
  !*** ./locales/sr/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"","phishing":"","advancedButton":"Više opcija","moreInfoButton":"Više informacija","pageTitle":"","safeHeaderTitle":"","safeContentTitle":"","parentalHeaderTitle":"","parentalContentTitle":"","parentalDescOne":"","parentalDnsDescTwo":"","blockedContentTitle":"","ruleHeaderTitle":"","ruleContentTitle":"","btnGoBack":"Vrati se","btnFeedback":"","btnProceed":"Ipak nastavi","btnProceedTo":"","inputPassword":"Unesite lozinku","errorPageHeader":"Web-stranica nije dostupna","summary":"Web-stranica <strong>(var.PageUrl)</strong> možda privremeno ne funkcioniše ili je premeštena na novu web-adresu.","suggestionsHeader":"Evo nekoliko predloga","suggestion1":"Pokušajte sa <a href='(var.PageUrl)'>ponovnim učitavanjem</a> ove stranice malo kasnije.","suggestion2":"Proverite adresu web-stranice da bi ste bili sigurni da je uneta korektno.","suggestion3":"Proverite podešavanja Vašeg vatrenog zida. Sve konekcije za AdGuard treba dozvoliti.","suggestion4":"Proverite podešavanja proxy-a ako koristite proxy server.","showDetails":"Prikaži detalje","wrongPassword":"Pogrešna lozinka.","somethingWrong":"","errorPageTitle":"Greške "};

/***/ }),

/***/ "./locales/sv/messages.json":
/*!**********************************!*\
  !*** ./locales/sv/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Den här webbsidan, på <strong>(var.Host)</strong>, har rapporterats som skadlig och blockeras utifrån dina säkerhetsinställningar.","phishing":"Den här sidan, på <strong>(var.Host)</strong>, har rapporterats som för phishing och har blockerats utifrån dina säkerhetsinställningar.","advancedButton":"Avancerat","moreInfoButton":"Ytterligare information","pageTitle":"Nekad åtkomst","safeHeaderTitle":"Sidans åtkomst har blockerats av AdGuard","safeContentTitle":"Webbsidan har rapporterats som skadlig och blockeras utifrån dina säkerhetsinställningar.","parentalHeaderTitle":"Föräldrakontroll","parentalContentTitle":"Sidan blockerades på grund av restriktioner i föräldrafiltret","parentalDescOne":"Är du tillräckligt gammal? Skriv in lösenordet","parentalDnsDescTwo":"Du försöker nå en webbplats som av AdGuard listas som olämplig för barn. Om du är en vuxen person kan du koppla bort föräldraskyddet under Inställningar eller lägga till webbplatsen i vitlistan.","blockedContentTitle":"Åtkomst till {site} blockerades av filterregler. Om du vill ha åtkomst till sidan kan du lägga till den till undantag.","ruleHeaderTitle":"Blockerat av AdGuard","ruleContentTitle":"AdGuard har förhindrat inläsning av sidan till följd av följande filterregel:","btnGoBack":"Återgå","btnFeedback":"Skicka kommentar","btnProceed":"Fortsätt ändå","btnProceedTo":"Fortsätt till webbplats","inputPassword":"Skriv in lösenord","errorPageHeader":"Webbsidan är inte tillgänglig","summary":"Webbsidan på, <strong>(var.PageUrl)</strong>, kan tillfälligt ligga nere eller flyttats till en annan webbadress.","suggestionsHeader":"Här är några förslag","suggestion1":"Prova att <a href='(var.PageUrl)'>ladda</a> sidan senare.","suggestion2":"Kontrollera att du skrivit in korrekt webbadress.","suggestion3":"Kontrollera dina brandväggsinställningar. Alla anslutningar skall tillåtas för AdGuard.","suggestion4":"Kontrollera dina proxyinställningarna om du använder proxyserver.","showDetails":"Visa detaljer","wrongPassword":"Fel lösenord","somethingWrong":"Något gick fel. Var god försök senare eller kontakta vår support.","errorPageTitle":"Fel"};

/***/ }),

/***/ "./locales/tr/messages.json":
/*!**********************************!*\
  !*** ./locales/tr/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"<strong>(var.Host)</strong> adresindeki bu site kötü amaçlı yazılım sitesi olarak rapor edildi ve güvenlik tercihlerinize göre engellendi.","phishing":"<strong>(var.Host)</strong> adresindeki bu site kimlik avı sitesi olarak rapor edildi ve güvenlik tercihlerinize bağlı olarak engellendi.","advancedButton":"Gelişmiş","moreInfoButton":"Daha fazla bilgi","pageTitle":"Erişim engellendi","safeHeaderTitle":"AdGuard bu sayfaya erişimi engelledi","safeContentTitle":"Bu site kötü amaçlı yazılım içeren bir site olarak rapor edildi ve güvenlik tercihlerinize göre engellendi.","parentalHeaderTitle":"Ebeveyn kontrolü","parentalContentTitle":"Bu sayfayı ebeveyn filtresi kısıtlamaları nedeniyle engelledik.","parentalDescOne":"Yeterli yaşa sahip misin? Lütfen şifreyi girin","parentalDnsDescTwo":"AdGuard tarafından çocuklar için uygun olmayan bir web sitesine ulaşmaya çalışıyorsunuz. Yetişkin iseniz ayarlarda ebeveyn kontrolünü kapatabilir veya bu web sitesini beyaz listeye ekleyebilirsiniz.","blockedContentTitle":"{site} isteği, bir filtre kuralı tarafından engellendi. Bu siteye erişmek istiyorsanız, istisnalara ekleyin.","ruleHeaderTitle":"AdGuard tarafından engellendi","ruleContentTitle":"AdGuard, aşağıdaki filtre kuralı nedeniyle bu sayfanın yüklenmesini engelledi","btnGoBack":"Geri git","btnFeedback":"Geribildirim gönder","btnProceed":"Yine de devam et","btnProceedTo":"Siteye gir","inputPassword":"Parolayı girin","errorPageHeader":"Bu sayfa mevcut değil","summary":"Buradaki <strong>(var.PageUrl)</strong> websitesi geçici olarak devredışı olabilir ya da yeni bir web adresine taşınmış olabilir.","suggestionsHeader":"İşte birkaç öneri","suggestion1":"Bu web sayfasını daha sonra <a href='(var.PageUrl)'> yeniden yüklemeyi</a> deneyin.","suggestion2":"Web sayfasının adresini doğru girdiğinizden emin olun","suggestion3":"Güvenlik duvarı ayarlarınızı kontrol edin. AdGuard için tüm bağlantılara izin verilmelidir.","suggestion4":"Eğer bir proxy sunucusu kullanıyorsanız proxy ayarlarınızı kontol edin.","showDetails":"Detayları göster","wrongPassword":"Yanlış şifre girdiniz","somethingWrong":"Bir sorun oluştu. Lütfen daha sonra tekrar deneyiniz ya da destek servisimizle iletişime geçin.","errorPageTitle":"Hata"};

/***/ }),

/***/ "./locales/uk/messages.json":
/*!**********************************!*\
  !*** ./locales/uk/messages.json ***!
  \**********************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"Веб-сторінка <strong>(var.Host)</strong> відома, як зловмисна і була заблокована згідно з вашими налаштуваннями безпеки.","phishing":"Веб-сторінка <strong>(var.Host)</strong> відома, як шахрайська і була заблокована згідно з вашими налаштуваннями безпеки.","advancedButton":"Додатково","moreInfoButton":"Докладніша інформація","pageTitle":"Доступ заборонено","safeHeaderTitle":"AdGuard заблокував доступ до цієї сторінки","safeContentTitle":"Ця веб-сторінка відома, як зловмисна і була заблокована згідно з вашими налаштуваннями безпеки.","parentalHeaderTitle":"Батьківський контроль","parentalContentTitle":"Цю сторінку заблоковано у зв'язку з обмеженнями батьківського контролю.","parentalDescOne":"Якщо ви повнолітні, введіть пароль","parentalDnsDescTwo":"Ви намагаєтесь отримати доступ до веб-сайту, який в AdGuard позначений неприйнятним для дітей. Якщо ви повнолітні, ви можете вимкнути батьківський контроль в налаштуваннях, або додати цей веб-сайт до білого списку.","blockedContentTitle":"Запит до {site} було заблоковано правилом фільтру. Якщо ви хочете отримати доступ до цього сайту, додайте його до винятків.","ruleHeaderTitle":"Заблоковано AdGuard","ruleContentTitle":"AdGuard не дозволив цій сторінці завантажитись, у зв'язку з таким правилом фільтру","btnGoBack":"Назад","btnFeedback":"Надіслати відгук","btnProceed":"Продовжити в будь-якому разі","btnProceedTo":"Перейти на сайт","inputPassword":"Уведіть пароль","errorPageHeader":"Веб-сторінка недоступна","summary":"Веб-сторінка <strong>(var.PageUrl)</strong>, ймовірно, тимчасово недоступна, або її адреса змінилася.","suggestionsHeader":"Ось декілька пропозицій","suggestion1":"Спробуйте <a href='(var.PageUrl)'>перезавантажити</a> цю сторінку пізніше.","suggestion2":"Перевірте правильність введення адреси веб-сторінки.","suggestion3":"Перевірте налаштування мережевого екрану. Слід дозволити всі з'єднання для AdGuard.","suggestion4":"Перевірте ваші налаштування проксі-сервера, якщо ви його використовуєте.","showDetails":"Показати деталі","wrongPassword":"Хибний пароль","somethingWrong":"Щось пішло не так. Будь ласка, повторіть спробу пізніше або зверніться до нашої служби підтримки.","errorPageTitle":"Помилка"};

/***/ }),

/***/ "./locales/zh-CN/messages.json":
/*!*************************************!*\
  !*** ./locales/zh-CN/messages.json ***!
  \*************************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"位于 <strong>(var.Host)</strong> 的网页已报告为恶意网站，根据您的安全设置，我们拦截了与此网站的连接。","phishing":"位于 <strong>(var.Host)</strong> 的网页已报告为钓鱼网站，根据您的安全设置，我们拦截了与此网站的连接。","advancedButton":"高级设置","moreInfoButton":"更多信息","pageTitle":"拒绝访问","safeHeaderTitle":"AdGuard 已阻止访问此网页","safeContentTitle":"位于 <strong>(var.Host)</strong> 的网页已报告为恶意网站，根据您的安全设置，我们拦截了与此网站的连接。","parentalHeaderTitle":"家长控制","parentalContentTitle":"由于家长控制过滤器的限制，我们拦截了此网站。","parentalDescOne":"您的年龄是否满足使用要求？请输入密码","parentalDnsDescTwo":"您正在尝试访问在 AdGuard 家长控制中被列为不适合儿童访问的网站。如果你是成年人，你可以在 AdGuard 设置中关闭家长控制模块，或将此站点移至白名单中。","blockedContentTitle":"过滤规则已拦截了访问 {site}的请求。如果您要访问此网站，请将其添加到排除列表。","ruleHeaderTitle":"被 AdGuard 拦截","ruleContentTitle":"根据以下过滤规则， Adguard 已停止加载该网页。","btnGoBack":"返回","btnFeedback":"发送反馈","btnProceed":"依然继续访问","btnProceedTo":"前往该网站","inputPassword":"输入密码","errorPageHeader":"该网页当前不可用","summary":"该网页的 <strong>(var.PageUrl)</strong> 可能被临时关闭，或已永久移动到其它地址。","suggestionsHeader":"以下是我们提供的建议：","suggestion1":"您可以稍后再 <a href='(var.PageUrl)'> 重新加载</a> 此网页。","suggestion2":"请确保您输入的网页地址是正确的。","suggestion3":"请检查防火墙设置，有关 AdGuard 的全部连接都应当被允许。","suggestion4":"如果您正在使用代理服务，请检查相关的代理配置。","showDetails":"显示详细信息","wrongPassword":"密码错误","somethingWrong":"出现了一些问题。请稍后重试或者联系我们的客服支持。","errorPageTitle":"错误"};

/***/ }),

/***/ "./locales/zh-TW/messages.json":
/*!*************************************!*\
  !*** ./locales/zh-TW/messages.json ***!
  \*************************************/
/*! exports provided: malware, phishing, advancedButton, moreInfoButton, pageTitle, safeHeaderTitle, safeContentTitle, parentalHeaderTitle, parentalContentTitle, parentalDescOne, parentalDnsDescTwo, blockedContentTitle, ruleHeaderTitle, ruleContentTitle, btnGoBack, btnFeedback, btnProceed, btnProceedTo, inputPassword, errorPageHeader, summary, suggestionsHeader, suggestion1, suggestion2, suggestion3, suggestion4, showDetails, wrongPassword, somethingWrong, errorPageTitle, default */
/***/ (function(module) {

module.exports = {"malware":"於 <strong>(var.Host)</strong> 之網頁已被報告為惡意軟體頁面，且根據您的安全性偏好設定，已被封鎖。","phishing":"於 <strong>(var.Host)</strong> 之網頁已被報告為網路釣魚頁面，且根據您的安全性偏好設定，已被封鎖。","advancedButton":"進階的","moreInfoButton":"更多的資訊","pageTitle":"拒絕存取","safeHeaderTitle":"AdGuard 已封鎖至該頁面之存取","safeContentTitle":"該網頁已被報告為惡意軟體頁面，且根據您的安全性偏好設定，已被封鎖。","parentalHeaderTitle":"家長監控","parentalContentTitle":"由於父母的過濾器限制，我們已封鎖該頁面。","parentalDescOne":"您夠大了嗎？輸入該密碼","parentalDnsDescTwo":"您正在嘗試觸及被 AdGuard 列為對孩子不合適的網站。如果您是成年人，那麼您可在設定中關掉家長監控或增加該網站至白名單。","blockedContentTitle":"至 {site} 之請求已被過濾器規則封鎖。如果您想要存取該網站，增加它至例外。","ruleHeaderTitle":"被 AdGuard 封鎖","ruleContentTitle":"由於下面的過濾器規則，AdGuard 已防止該頁面載入","btnGoBack":"返回","btnFeedback":"傳送回饋意見","btnProceed":"無論如何繼續","btnProceedTo":"前往網站","inputPassword":"輸入密碼","errorPageHeader":"該網頁為不可用的","summary":"於 <strong>(var.PageUrl)</strong> 之網頁可能暫時地下線，或它可能已移至新的網路位址。","suggestionsHeader":"這是一些建議","suggestion1":"稍後嘗試<a href='(var.PageUrl)'>重新載入</a>該網頁。","suggestion2":"檢查該網頁網址以確定您已正確地輸入它。","suggestion3":"檢查您的防火牆設定。所有的連線應被允許用於 AdGuard。","suggestion4":"如果您使用代理伺服器，檢查您的代理設定。","showDetails":"顯示細節","wrongPassword":"錯誤的密碼","somethingWrong":"某事物出現問題。請稍後再試，或與我們的支援服務聯繫。","errorPageTitle":"錯誤"};

/***/ })

/******/ });
//# sourceMappingURL=app.js.map