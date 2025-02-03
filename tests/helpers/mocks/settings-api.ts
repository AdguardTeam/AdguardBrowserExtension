import { vi } from 'vitest';

export class SettingsApi {
    init = vi.fn();

    setSetting = vi.fn();

    static getSetting = vi.fn();

    getData = vi.fn();

    getTsWebExtConfiguration = vi.fn();

    reset = vi.fn();

    import = vi.fn();

    export = vi.fn();

    importGeneralSettings = vi.fn();

    exportGeneralSettings = vi.fn();

    importExtensionSpecificSettings = vi.fn();

    exportExtensionSpecificSettings = vi.fn();

    importFilters = vi.fn();

    exportFilters = vi.fn();

    importUserFilter = vi.fn();

    exportUserFilter = vi.fn();

    importAllowlist = vi.fn();

    exportAllowlist = vi.fn();

    importStealth = vi.fn();

    exportStealth = vi.fn();
}
