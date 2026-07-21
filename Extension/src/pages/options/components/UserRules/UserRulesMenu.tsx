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

import React, {
    useContext,
    useRef,
    useState,
} from 'react';
import { observer } from 'mobx-react';

import cn from 'classnames';

import { translator } from '../../../../common/translators/translator';
import { logger } from '../../../../common/logger';
import { TelemetryEventName, TelemetryScreenName } from '../../../../common/telemetry';
import { messenger } from '../../../services/messenger';
import { MenuDropDown } from '../../../common/components/ui/MenuDropDown';
import { ConfirmModal } from '../../../common/components/ConfirmModal';
import { NotificationType } from '../../../common/types';
import { handleFileUpload } from '../../../helpers';
import { exportData, ExportTypes } from '../../../common/utils/export';
import { rootStore } from '../../stores/RootStore';
import { userRulesEditorStore } from '../../../common/components/UserRulesEditor/UserRulesEditorStore';
import { HOW_TO_CREATE_RULES_URL } from '../../constants';
import { mergeImportedRules } from '../../../../common/utils/user-rules';

import styles from './UserRulesMenu.module.pcss';
import menuStyles from '../../../common/components/ui/MenuDropDown/MenuDropDown.module.pcss';

/**
 * Header dropdown menu for the User Rules screen. Provides Rule syntax, Import,
 * Export, and Delete all. Rendered once in the shared header so it is available
 * in both the list view and the editor view.
 *
 * @returns Dropdown menu element.
 */
export const UserRulesMenu = observer(() => {
    const { uiStore, telemetryStore, settingsStore } = useContext(rootStore);
    const editorStore = useContext(userRulesEditorStore);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const importingRef = useRef(false);
    const deletingRef = useRef(false);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleImportClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryEventName.UserRulesImportClick,
            TelemetryScreenName.UserRulesScreen,
        );
        inputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        // Guard against overlapping imports (rapid double selection).
        if (!file || importingRef.current) {
            return;
        }
        importingRef.current = true;

        try {
            const raw = await handleFileUpload(file, 'txt');

            if (raw.trim().length === 0) {
                return;
            }

            const { content: oldRulesString } = await messenger.getUserRules();
            const { merged, addedCount } = mergeImportedRules(oldRulesString, raw);

            if (addedCount > 0) {
                // Clear the dirty flag before saving so the UserFilterUpdated
                // notification (fired synchronously by saveUserRules) will
                // reload the editor with the merged content instead of
                // preserving stale unsaved changes.
                editorStore.setUserRulesEditorContentChangedState(false);
                await messenger.saveUserRules(merged);
                // Imported content may push the rule count above/below the MV3
                // dynamic rules limit, so the warning must be recalculated here.
                await settingsStore.checkLimitations();
                uiStore.addNotification({
                    type: NotificationType.Success,
                    text: translator.getMessage('options_user_rules_import_success'),
                });
            }
        } catch (e) {
            logger.debug('[ext.UserRulesMenu]: import error:', e);
            uiStore.addNotification({
                type: NotificationType.Error,
                text: translator.getMessage('options_user_rules_import_error'),
            });
        } finally {
            importingRef.current = false;
            // Allow re-importing the same file path.
            // eslint-disable-next-line no-param-reassign
            event.target.value = '';
        }
    };

    const handleExportClick = () => {
        exportData(ExportTypes.UserFilter);
    };

    const handleDeleteAllClick = () => {
        setIsConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        // Guard against duplicate concurrent clears (rapid double-confirm).
        if (deletingRef.current) {
            return;
        }
        deletingRef.current = true;

        try {
            // Reset the editor's unsaved-changes flag so the UserFilterUpdated
            // notification (fired by saveUserRules above) reloads the now-empty
            // content instead of preserving stale unsaved changes.
            editorStore.setUserRulesEditorContentChangedState(false);
            await messenger.saveUserRules('');
            await settingsStore.checkLimitations();
            uiStore.addNotification({
                type: NotificationType.Success,
                text: translator.getMessage('options_user_rules_delete_all_success'),
            });
        } catch (e) {
            logger.error('[ext.UserRulesMenu]: failed to delete all user rules:', e);
        } finally {
            deletingRef.current = false;
        }
    };

    /**
     * Whether non-editing menu actions are blocked because the editor has
     * unsaved changes that would be lost or overwritten.
     */
    const actionsBlocked = editorStore.userRulesEditorContentChanged;

    return (
        <>
            <input
                type="file"
                accept="text/plain"
                ref={inputRef}
                onChange={handleFileChange}
                className={styles.fileInput}
            />
            <MenuDropDown
                ariaLabel={translator.getMessage('options_user_rules_menu')}
                onButtonClick={() => {
                    telemetryStore.sendCustomEvent(
                        TelemetryEventName.UserRulesMenuClick,
                        TelemetryScreenName.UserRulesScreen,
                    );
                }}
            >
                <a
                    className={menuStyles.menuItem}
                    href={HOW_TO_CREATE_RULES_URL}
                    target="_blank"
                    rel="noreferrer"
                    role="menuitem"
                >
                    {translator.getMessage('options_rule_syntax')}
                </a>
                <button
                    type="button"
                    className={menuStyles.menuItem}
                    role="menuitem"
                    onClick={handleImportClick}
                    disabled={actionsBlocked}
                >
                    {translator.getMessage('options_userfilter_import')}
                </button>
                <button
                    type="button"
                    className={menuStyles.menuItem}
                    role="menuitem"
                    onClick={handleExportClick}
                    disabled={!editorStore.userRulesExportAvailable}
                >
                    {translator.getMessage('options_userfilter_export')}
                </button>
                <button
                    type="button"
                    className={cn(menuStyles.menuItem, menuStyles.menuItemDanger)}
                    role="menuitem"
                    onClick={handleDeleteAllClick}
                    disabled={actionsBlocked || !editorStore.userRulesExportAvailable}
                >
                    {translator.getMessage('options_user_rules_delete_all')}
                </button>
            </MenuDropDown>
            <ConfirmModal
                title={translator.getMessage('options_user_rules_delete_all_confirm_title')}
                subtitle={translator.getMessage('options_user_rules_delete_all_confirm_subtitle')}
                isOpen={isConfirmOpen}
                setIsOpen={setIsConfirmOpen}
                onConfirm={handleDeleteConfirm}
                customConfirmTitle={translator.getMessage('options_user_rules_delete_all')}
            />
        </>
    );
});
