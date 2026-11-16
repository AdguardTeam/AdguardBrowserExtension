/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { configurationImportApi } from 'configuration-import-api';

import { RulesLimitsService } from 'rules-limits-service';

import { type ImportConfiguration, SettingsApi } from '../../../../../Extension/src/background/api';
import { engine } from '../../../../../Extension/src/background/engine';
import { UiService } from '../../../../../Extension/src/background/services/ui/main';
import { logger } from '../../../../../Extension/src/common/logger';

type UiServicePrivate = {
    pendingImportConfig: ImportConfiguration | null;
    handleApplyImportConfiguration: () => Promise<boolean>;
};

const uiService = UiService as unknown as UiServicePrivate;

const importConfig = {} as ImportConfiguration;

describe('UiService.handleApplyImportConfiguration', () => {
    beforeEach(() => {
        uiService.pendingImportConfig = importConfig;

        vi.spyOn(SettingsApi, 'export').mockResolvedValue('snapshot');
        vi.spyOn(engine, 'update').mockResolvedValue(undefined);
        vi.spyOn(RulesLimitsService, 'areFilterLimitsExceeded').mockResolvedValue(false);
        vi.spyOn(RulesLimitsService, 'clearRulesLimitsWarning').mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        uiService.pendingImportConfig = null;
    });

    it('rolls back and logs when the import fails', async () => {
        vi.spyOn(configurationImportApi, 'applyConfig').mockResolvedValue(false);
        vi.spyOn(SettingsApi, 'import').mockResolvedValue(false);
        const logError = vi.spyOn(logger, 'error').mockImplementation(() => {});

        const result = await uiService.handleApplyImportConfiguration();

        expect(result).toBe(false);
        expect(SettingsApi.import).toHaveBeenCalledWith('snapshot');
        expect(engine.update).toHaveBeenCalledTimes(1);
        expect(logError).toHaveBeenCalledWith(expect.stringContaining('cannot restore settings'));
        expect(uiService.pendingImportConfig).toBeNull();
    });

    it('does not roll back when the import succeeds', async () => {
        vi.spyOn(configurationImportApi, 'applyConfig').mockResolvedValue(true);
        const importSpy = vi.spyOn(SettingsApi, 'import');

        const result = await uiService.handleApplyImportConfiguration();

        expect(result).toBe(true);
        expect(importSpy).not.toHaveBeenCalled();
        expect(engine.update).toHaveBeenCalledTimes(1);
        expect(uiService.pendingImportConfig).toBeNull();
    });
});
