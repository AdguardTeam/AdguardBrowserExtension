var safariCorrectRules = [
  { 
    "trigger": { 
      "url-filter": ".*" 
    }, 
    "action": { 
      "type": "css-display-none", 
      "selector": ".banner" 
    } 
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*popsugar.com"
      ]
    },
    "action": {
      "type": "css-display-none",
      "selector": "#calendar_widget"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "unless-domain": [
        "*lenta1.ru",
        "*lenta2.ru"
      ]
    },
    "action": {
      "type": "css-display-none",
      "selector": "#social"
    }
  },
  {
    "trigger": {
      "url-filter": "test-elemhide\\.com",
      "resource-type": [
        "document"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?tardangro\\.com([^ a-zA-Z0-9.%])",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "raw",
        "font"
      ],
      "load-type": [
        "third-party"
      ]
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?videoplaza\\.com([^ a-zA-Z0-9.%])",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "raw",
        "font"
      ],
      "load-type": [
        "third-party"
      ]
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?b\\.babylon\\.com([^ a-zA-Z0-9.%])",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "raw",
        "font"
      ]
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?getsecuredfiles\\.com([^ a-zA-Z0-9.%])",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "popup",
        "raw",
        "font"
      ],
      "load-type": [
        "third-party"
      ]
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "\\/addyn\\|.*\\|adtech;",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "raw",
        "font"
      ]
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?emjcd\\.com([^ a-zA-Z0-9.%])",
      "resource-type": [
        "image"
      ],
      "if-domain": [
        "*catalogfavoritesvip.com",
        "*freeshipping.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?intellitxt\\.com\\/ast\\/js\\/nbcuni\\/",
      "resource-type": [
        "script"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?hulu\\.com\\/embed"
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*hulu.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*hulu.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*hulu.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*www.any.gs"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*wfarm.yandex.net"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*.instantservice.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://([a-z0-9-_.]+\\.)?hulu-jsinject-image\\.com",
      "resource-type": [
        "image"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*test-document.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "if-domain": [
        "*test-urlblock.com"
      ]
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "\\/testelemhidenodomain"
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  }
]