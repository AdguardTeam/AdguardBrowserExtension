# Locales script

## Synopsis

```text
pnpm locales [download | upload | renew | validate | info]
```

- `download` — download, save and validate translations;
  defaults to download *all* locales and run `validate --min` after that;
  locales can be specified:
    - **-l** or **--locales** — for specific list of space-separated locales
        - **<list_of_locales>...** — locales to download

### <a name="dev-locales"></a> Locales

#### Localization Workflow

**⚠️ IMPORTANT: Follow this workflow strictly to avoid overwriting translations in Crowdin**

##### Workflow A: Direct Upload to Crowdin

1. **Download latest translations** (before making changes)
   ```shell
   pnpm locales download
   ```

2. **Add new keys to English locale**
   - Add new translation keys to `./Extension/_locales/en/messages.json`

3. **Validate new keys**
   ```shell
   pnpm locales validate
   ```

4. **Create Pull Request**
   - Create PR to main/develop branch with your changes including the new locale keys
   - **DO NOT run `pnpm locales upload` yet**

5. **Get approvals**
   - Team Lead approval (for code changes)
   - Content Manager approval (for new translation keys and text)

6. **Upload to Crowdin** (only after approvals)
   ```shell
   pnpm locales upload
   ```

##### Workflow B: Release Branch Consolidation

1. **Pull latest changes from release branch** (e.g., `release/v5.3`)
   ```shell
   git pull origin release/v5.3
   ```

2. **Add new keys to English locale**
   - Add new translation keys to `./Extension/_locales/en/messages.json`

3. **Validate new keys**
   ```shell
   pnpm locales validate
   ```

4. **Create Pull Request to release branch**
   - Create PR targeting the release branch (e.g., `release/v5.3`)
   - Include only the new locale keys

5. **Get approvals**
   - Team Lead approval (for code changes)
   - Content Manager approval (for new translation keys and text)

6. **Merge to release branch**
   - All translation changes are consolidated in the release branch
   - **Upload to Crowdin happens when the release branch is merged** (handled by Team Lead)

**⚠️ Always confirm with your Team Lead which workflow your team is currently using!**

##### Common Steps After Upload to Crowdin

7. **Wait for translations**
   - Notify the #adguard-translations Slack channel about new translation keys
   - Translators will work on new keys in Crowdin
   - Monitor translation progress in Crowdin dashboard and Slack channel updates

8. **Download completed translations**
   ```shell
   pnpm locales download
   ```

9. **Validate completed translations**
   ```shell
   pnpm locales validate
   ```

10. **Update PR and merge**
    - Add downloaded translations to your PR
    - Merge PR after final review

#### Locales Commands

- `upload` — upload base locale

- `renew` — renew base locale

- `validate` — validate locales translations and check for missing locale keys used in source code. Also performs static analysis to ensure `translator.getMessage()` and `translator.getPlural()` calls use string literals instead of variables for proper locale key detection (defaults to validate *all* locales):
    - **-R**, **--min** — for critical errors of all locales and translations readiness of required ones
    - **-l** or **--locales** — for specific list of space-separated locales
        - **<list_of_locales>...** — locales to validate

- `info` — shows info about unused base-lang strings and all locales translations readiness;
  in other words, defaults to `-N -s` which can be used separately:
    - **-N** or **--unused** — for unused base-lang strings
    - **-s** or **--summary** — for all locales translations readiness

## Examples

```bash
# to download and save all locales
pnpm locales download
# or just 'ja' and 'ko' locales
pnpm locales download --locales ja ko

# to upload base strings
pnpm locales upload

# to renew base locale
pnpm locales renew

# validate all locales, check for missing locale keys, and verify translator calls use string literals
pnpm locales validate
# or check critical errors for all locales and translations readiness for ours
pnpm locales validate --min
# or just 'es', 'ja' and 'ko' locales
pnpm locales validate -l es ja ko

# show info about translations readiness and unused strings
pnpm locales info
```

After download you'll find the locales in the `src/_locales/` folder.

List of minimum required locales and other input data are in `config.json`. There are such properties defined:

- `twosky_config_path` — relative path to twosky config file
- `api_url` — twosky api url
- `source_relative_path` — relative path to source files — where translation strings are used
- `supported_source_filename_extensions` — supported extensions of source files
- `persistent_messages` — strings protected from checking for it's translated versions
- `locales_relative_path` — relative path to locales
- `locales_data_format` — locales data format
- `locales_data_filename` — locales data filename
- `required_locales` — list of locales we main
- `threshold_percentage` — percentage of translations readiness for locale to be validated successfully

#### Translation Functions Usage

**⚠️ IMPORTANT: Always use string literal keys for static analysis compatibility**

```javascript
// ✅ Correct usage
translator.getMessage('popup_tab_general');
translator.getPlural('items_count', count);

// ❌ Incorrect usage - variables not detected by validation
const key = 'popup_tab_general';
translator.getMessage(key);
translator.getPlural(keyMap[type], count);
```

The validation script uses static analysis to find translation keys. Dynamic keys (variables, object properties) cannot be detected and will cause missing translation errors.
