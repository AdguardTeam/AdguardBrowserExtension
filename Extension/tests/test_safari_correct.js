var safariCorrectRules = [
  {
    "trigger": {
      "url-filter": ".*",
      "resource-type": [
        "document"
      ]
    },
    "action": {
      "type": "css-display-none",
      "selector": ".banner"
    }
  },
  {
    "trigger": {
      "url-filter": ".*",
      "resource-type": [
        "document"
      ],
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
      "resource-type": [
        "document"
      ],
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
      "url-filter": "^https?://[^.][^/]*\\.?test-elemhide\\.com",
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
          "url-filter": "^https?://[^.][^/]*\\.?pics\\.rbc\\.ru\\/js\\/swf"
      },
      "action": {
          "type":"block"
      }
  },
  {
    "trigger": {
      "url-filter": "^https?://[^.][^/]*\\.?tardangro\\.com[/:&?]?",
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
      "url-filter": "^https?://[^.][^/]*\\.?videoplaza\\.com[/:&?]?",
      "resource-type": [
        "image",
        "style-sheet",
        "script",
        "media",
        "raw",
        "font",
        "document"
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
      "url-filter": "^https?://[^.][^/]*\\.?b\\.babylon\\.com[/:&?]?"
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://[^.][^/]*\\.?getsecuredfiles\\.com[/:&?]?",
      "resource-type": [
        "popup",
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
      "url-filter": "\\/addyn\\|.*\\|adtech;"
    },
    "action": {
      "type": "block"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://[^.][^/]*\\.?emjcd\\.com[/:&?]?",
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
      "url-filter": "^https?://[^.][^/]*\\.?intellitxt\\.com\\/ast\\/js\\/nbcuni\\/",
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
      "url-filter": "^https?://[^.][^/]*\\.?hulu\\.com\\/embed"
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
      "url-filter": "\\.instantservice\\.com"
    },
    "action": {
      "type": "ignore-previous-rules"
    }
  },
  {
    "trigger": {
      "url-filter": "^https?://[^.][^/]*\\.?hulu-jsinject-image\\.com",
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
