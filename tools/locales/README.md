## Locales script

### Synopsis
```
pnpm locales [download | upload | renew | validate | info]
```

- `download` — download, save and validate translations; defaults to download **all** locales and run `validate --min` after that; locales can be specified:
  - **-l**, **--locales** — for specific list of space-separated locales
    - **<list_of_locales>...** — locales to download

- `upload` — upload base locale

- `renew` — renew base locale

- `validate` — validate locales translations (defaults to **all** locales):
  - **-R**, **--min** — for critical errors of all locales and translations readiness of required ones
  - **-l**, **--locales** — for specific list of space-separated locales
    - **<list_of_locales>...** — locales to validate

- `info` — shows info about unused base-lang strings and all locales translations readiness; in other words, defaults to `-N -s` which can be used separately:
  - **-N**, **--unused** — for unused base-lang strings
  - **-s**, **--summary** — for all locales translations readiness

### Examples

```bash
# to download and save all locales
pnpm locales download
# or just 'ja' and 'ko' locales
pnpm locales download --locales ja ko

# to upload base strings
pnpm locales upload

# to renew base locale
pnpm locales renew

# validate all locales
pnpm locales validate
# or check critical errors for all locales and translations readiness for ours
pnpm locales validate --min
# or just 'es', 'ja' and 'ko' locales
pnpm locales validate -l es ja ko
# critical errors validation
pnpm locales validate -X

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
