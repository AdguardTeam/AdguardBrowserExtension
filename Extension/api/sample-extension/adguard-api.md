# AdGuard API
**Document version: 0.9**

This document is a draft of AdGuard's API.

## Including AdGuard files into extension manifest

Here is what should be done for AdGuard API to work.

#### 1. Add AdGuard's content script to the manifest:
```
    {
      "all_frames": true,
      "js": ["adguard/adguard-content.js"],
      "matches": [
        "http://*/*",
        "https://*/*"
      ],
      "match_about_blank": true,
      "run_at": "document_start"
    }
```

#### 2. Add AdGuard's script to the background page:
```
<script type="text/javascript" src="adguard/adguard-api.js"></script>
```

#### 3. Add AdGuard's assistant content script and CSS file to the manifest and modify `web_accessible_resources`:
```
    {
      "all_frames": false,
      "css": ["adguard/assistant/css/selector.css"],
      "js": ["adguard/adguard-assistant.js"],
      "matches": [
        "http://*/*",
        "https://*/*"
      ],
      "run_at": "document_end"
    }
```
```
    "web_accessible_resources": [
      "adguard/assistant/css/assistant.css",
      "adguard/assistant/i/close.svg"
    ]
```  

## API methods

AdGuard API is exposed through a global javascript object: `adguardApi`.

### `adguardApi.start`

Initializes AdGuard and starts it immediately.

#### Syntax
```javascript
adguardApi.start(
  configuration,    // object, mandatory
  callback          // function, optional
);
```

#### Parameters

##### `configuration`

**Syntax**
```javascript
configuration = {
    filters: [],
    whitelist: [],
    blacklist: [],
    rules: [],
    filtersMetadataUrl: 'https://filters.adtidy.org/extension/chromium/filters.json',
    filterRulesUrl: 'https://filters.adtidy.org/extension/chromium/filters/{filter_id}.txt'
};
```

**Properties**

`filters` (mandatory)
An array of filters identifiers. You can look for possible filters identifiers in the [filters metadata file](https://filters.adtidy.org/extension/chromium/filters.json).

`whitelist` (optional)

An array of domains, for which AdGuard won't work.

`blacklist` (optional)

This property completely changes AdGuard behavior. If it is defined, Adguard will work for domains from the `blacklist` only. All other domains will be ignored. If `blacklist` is defined, `whitelist` will be ignored.

`rules` (optional)

An array of custom filtering rules. Here is an [article](https://adguard.com/en/filterrules.html) describing filtering rules syntax.

These custom rules might be created by a user via AdGuard Assistant UI.

`filtersMetadataUrl` (mandatory)

An absolute path to a file, containing filters metadata. Once started, AdGuard will periodically check filters updates by downloading this file.

**Example:**
```
https://filters.adtidy.org/extension/chromium/filters.json
```

`filterRulesUrl` (mandatory)

URL mask used for fetching filters rules. `{filter_id}` parameter will be replaced with an actual filter identifier.

**Example:**
```
https://filters.adtidy.org/extension/chromium/filters/{filter_id}.txt

// English filter (filter id = 2) will be loaded from:
https://filters.adtidy.org/extension/chromium/2.txt
```

> **Please note, that we do not allow using `filters.adtidy.org` other than for testing purposes**. You have to use your own server for storing filters files. You can (and actually should) to use `filters.adtidy.org` for updating files on your side periodically.

### `adguardApi.stop`

Completely stops AdGuard.

#### Syntax
```javascript
adguardApi.stop(
  callback          // function, optional
);
```

### `adguardApi.configure`

This method modifies AdGuard configuration. Please note, that Adguard must be already started.

#### Syntax
```javascript
adguardApi.configure(
  configuration,    // object, mandatory
  callback          // function, optional
);
```

### `adguardApi.onRequestBlocked`

This object allows adding and removing listeners for request blocking events.

#### Syntax
```javascript
// Registers an event listener
adguardApi.onRequestBlocked.addListener(
  callback // function, mandatory
)
// Removes specified event listener
adguardApi.onRequestBlocked.removeListener(
  callback // function, mandatory
)
```

#### callback parameter properties

`tabId`
Tab identifier.

`requestUrl`
Blocked request URL.

`referrerUrl`
Referrer URL.

`rule`
Filtering rule, which has blocked this request.

`filterId`
Rule's filter identifier.

`requestType`
Request mime type. Possible values are listed below.

* `DOCUMENT` - top-level frame document.
* `SUBDOCUMENT` - document loaded in a nested frame.
* `SCRIPT`
* `STYLESHEET`
* `OBJECT`
* `IMAGE`
* `XMLHTTPREQUEST`
* `OBJECT_SUBREQUEST`
* `MEDIA`
* `FONT`
* `WEBSOCKET`
* `OTHER`

### `adguardApi.openAssistant`

This method opens the AdGuard assistant UI in the specified tab. You should also add a listener for messages with type `assistant-create-rule` for rules, which are created by the Adguard assistant.

#### Syntax
```javascript
adguardApi.openAssistant(
  tabId // number, mandatory
)
```

### `adguardApi.closeAssistant`

This method closes AdGuard assistant in the specified tab.

#### Syntax
```javascript
adguardApi.closeAssistant(
  tabId // number, mandatory
)
```

### Examples

```javascript
// Init the configuration
var configuration = {
    // English, Social and Spyware filters
    filters: [ 2, 3, 4 ],

    // Adguard is disabled on www.example.com
    whitelist: [ 'www.example.com' ],

    // Array with custom filtering rules
    rules: [ 'example.org##h1' ],
   
    // Filters metadata file path
    filtersMetadataUrl: 'https://filters.adtidy.org/extension/chromium/filters.json',
    
    // Filter file mask
    filterRulesUrl: 'https://filters.adtidy.org/extension/chromium/filters/{filter_id}.txt'
};

// Add event listener for blocked requests
var onBlocked = function(details){
    console.log(details);
};
adguardApi.onRequestBlocked.addListener(onBlocked);

// Add event listener for rules created by Adguard Assistant
chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'assistant-create-rule') {
        console.log('Rule ' + message.ruleText + ' was created by Adguard Assistant');
        configuration.rules.push(message.ruleText);
        adguardApi.configure(configuration, function () {
            console.log('Finished Adguard API re-configuration');
        });
    }
});

adguardApi.start(configuration, function() {
    console.log('Finished Adguard API initialization.');

    // Now we want to disable Adguard on www.google.com
    configuration.whitelist.push('www.google.com');
    adguardApi.configure(configuration, function() {
        console.log('Finished Adguard API re-configuration');
    });
});

// Disable Adguard in 1 minute
setTimeout(function() {
    adguardApi.onRequestBlocked.removeListener(onBlocked);
    adguardApi.stop(function() {
        console.log('Adguard API has been disabled.');
    });
}, 60 * 1000);
```
