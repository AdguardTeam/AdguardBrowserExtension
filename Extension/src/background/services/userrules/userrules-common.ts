/**
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

import { type Engine } from 'engine';

import {
    type AddUserRuleMessage,
    MessageType,
    type RemoveUserRuleMessage,
    type ResetUserRulesForPageMessage,
    type SaveUserRulesMessage,
    type SetEditorStorageContentMessage,
} from '../../../common/messages';
import { messageHandler } from '../../message-handler';
import {
    SettingsApi,
    type SettingsData,
    UserRulesApi,
    TabsApi,
} from '../../api';
import { Prefs } from '../../prefs';

export type GetUserRulesResponse = {
    content: string;
    appVersion: string;
};

export type GetUserRulesEditorDataResponse = {
    userRules: string;
    settings: SettingsData;
};

/**
 * Service for handling user rules: reading, adding, deleting.
 */
export class UserRulesServiceCommon {
    protected static engine: Engine;

    /**
     * Initializes UserRulesService: creates handlers for operations on user rules.
     *
     * @param engine Engine instance.
     */
    public static async init(engine: Engine): Promise<void> {
        UserRulesServiceCommon.engine = engine;

        messageHandler.addListener(MessageType.GetUserRules, UserRulesServiceCommon.getUserRules);
        messageHandler.addListener(MessageType.GetUserRulesEditorData, UserRulesServiceCommon.getUserRulesEditorData);
        messageHandler.addListener(MessageType.SaveUserRules, UserRulesServiceCommon.handleUserRulesSave);
        messageHandler.addListener(MessageType.AddUserRule, UserRulesServiceCommon.handleUserRuleAdd);
        messageHandler.addListener(MessageType.RemoveUserRule, UserRulesServiceCommon.handleUserRuleRemove);
        messageHandler.addListener(MessageType.GetEditorStorageContent, UserRulesServiceCommon.getEditorStorageContent);
        messageHandler.addListener(MessageType.SetEditorStorageContent, UserRulesServiceCommon.setEditorStorageContent);
        messageHandler.addListener(MessageType.ResetUserRulesForPage, UserRulesServiceCommon.resetUserRulesForPage);

        UserRulesServiceCommon.engine.api.onAssistantCreateRule.subscribe(UserRulesServiceCommon.addUserRule);
    }

    /**
     * Returns all user rules concatenated via '\n' divider.
     *
     * @returns All user rules concatenated via '\n' divider.
     */
    private static async getUserRules(): Promise<GetUserRulesResponse> {
        return {
            content: await UserRulesApi.getOriginalUserRules(),
            appVersion: Prefs.version,
        };
    }

    /**
     * Returns all user rules concatenated via '\n' divider for the editor.
     *
     * @returns User rules editor content and settings.
     */
    private static async getUserRulesEditorData(): Promise<GetUserRulesEditorDataResponse> {
        return {
            userRules: await UserRulesApi.getOriginalUserRules(),
            settings: SettingsApi.getData(),
        };
    }

    /**
     * Adds one new user rule.
     *
     * @param rule New user rule.
     */
    private static async addUserRule(rule: string): Promise<void> {
        await UserRulesApi.addUserRule(rule);

        // update the engine only if the module is enabled
        if (UserRulesApi.isEnabled()) {
            UserRulesServiceCommon.engine.debounceUpdate();
        }
    }

    /**
     * Saves new rules and updates the engine.
     *
     * @param message Message of type {@link SaveUserRulesMessage} with new user rules.
     */
    private static async handleUserRulesSave(message: SaveUserRulesMessage): Promise<void> {
        const { value } = message.data;

        await UserRulesApi.setUserRules(value);
        // update the engine only if the module is enabled
        if (UserRulesApi.isEnabled()) {
            await UserRulesServiceCommon.engine.update();
        }
    }

    /**
     * Adds new rule and updates the tswebextension engine.
     *
     * @param message Message of type {@link AddUserRuleMessage} with new user rule.
     */
    private static async handleUserRuleAdd(message: AddUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.addUserRule(ruleText);

        // update the engine only if the module is enabled
        if (UserRulesApi.isEnabled()) {
            UserRulesServiceCommon.engine.debounceUpdate();
        }
    }

    /**
     * Removes specified rule and updates the tswebextension engine.
     *
     * @param message Message of type {@link RemoveUserRuleMessage} with user rule to delete.
     */
    private static async handleUserRuleRemove(message: RemoveUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.removeUserRule(ruleText);

        // update the engine only if the module is enabled
        if (UserRulesApi.isEnabled()) {
            UserRulesServiceCommon.engine.debounceUpdate();
        }
    }

    /**
     * Removes user rules for provided url on the specified tab.
     *
     * @param message Message of type {@link ResetUserRulesForPageMessage} with url and tab info.
     */
    private static async resetUserRulesForPage(message: ResetUserRulesForPageMessage): Promise<void> {
        const { url, tabId } = message.data;

        await UserRulesApi.removeRulesByUrl(url);
        await UserRulesServiceCommon.engine.update();
        await TabsApi.reload(tabId);
    }

    /**
     * Returns persisted rules during switches between common and fullscreen modes.
     *
     * @returns User rules editor content or undefined if not found.
     */
    private static getEditorStorageContent(): string | undefined {
        return UserRulesApi.getEditorStorageData();
    }

    /**
     * Sets persisted rules during switches between common and fullscreen modes.
     *
     * @param message Message of type {@link SetEditorStorageContentMessage} with content of editor.
     */
    private static setEditorStorageContent(message: SetEditorStorageContentMessage): void {
        const { content } = message.data;

        UserRulesApi.setEditorStorageData(content);
    }
}
