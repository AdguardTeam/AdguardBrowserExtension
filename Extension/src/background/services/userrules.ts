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
import {
    AddUserRuleMessage,
    MessageType,
    RemoveUserRuleMessage,
    ResetCustomRulesForPageMessage,
    SaveUserRulesMessage,
    SetEditorStorageContentMessage,
} from '../../common/messages';
import { messageHandler } from '../message-handler';
import { Engine } from '../engine';
import { SettingOption } from '../schema';
import {
    SettingsApi,
    SettingsData,
    UserRulesApi,
    TabsApi,
} from '../api';
import { settingsEvents } from '../events';
import { Prefs } from '../prefs';

export type GetUserRulesResponse = {
    content: string,
    appVersion: string,
};

export type GetUserRulesEditorDataResponse = {
    userRules: string,
    settings: SettingsData,
};

/**
 * Service for handling user rules: reading, adding, deleting.
 */
export class UserRulesService {
    /**
     * Initializes UserRulesService: creates handlers for operations on user rules.
     */
    public static async init(): Promise<void> {
        messageHandler.addListener(MessageType.GetUserRules, UserRulesService.getUserRules);
        messageHandler.addListener(MessageType.GetUserRulesEditorData, UserRulesService.getUserRulesEditorData);
        messageHandler.addListener(MessageType.SaveUserRules, UserRulesService.handleUserRulesSave);
        messageHandler.addListener(MessageType.AddUserRule, UserRulesService.handleUserRuleAdd);
        messageHandler.addListener(MessageType.RemoveUserRule, UserRulesService.handleUserRuleRemove);
        messageHandler.addListener(MessageType.GetEditorStorageContent, UserRulesService.getEditorStorageContent);
        messageHandler.addListener(MessageType.SetEditorStorageContent, UserRulesService.setEditorStorageContent);
        messageHandler.addListener(MessageType.ResetCustomRulesForPage, UserRulesService.resetCustomRulesForPage);

        Engine.api.onAssistantCreateRule.subscribe(UserRulesService.addUserRule);

        settingsEvents.addListener(
            SettingOption.UserFilterEnabled,
            UserRulesService.handleEnableStateChange,
        );
    }

    /**
     * Returns all user rules concatenated via '\n' divider.
     *
     * @returns All user rules concatenated via '\n' divider.
     */
    private static async getUserRules(): Promise<GetUserRulesResponse> {
        const userRules = await UserRulesApi.getOriginalUserRules();

        const content = userRules.join('\n');

        return { content, appVersion: Prefs.version };
    }

    /**
     * Returns all user rules concatenated via '\n' divider for the editor.
     */
    private static async getUserRulesEditorData(): Promise<GetUserRulesEditorDataResponse> {
        const userRules = await UserRulesApi.getOriginalUserRules();

        const content = userRules.join('\n');

        return {
            userRules: content,
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
        Engine.debounceUpdate();
    }

    /**
     * Saves new rules and updates the engine.
     *
     * @param message Message of type {@link SaveUserRulesMessage} with new user rules.
     */
    private static async handleUserRulesSave(message: SaveUserRulesMessage): Promise<void> {
        const { value } = message.data;

        await UserRulesApi.setUserRules(value.split('\n'));
        await Engine.update();
    }

    /**
     * Adds new rule and updates the tswebextension engine.
     *
     * @param message Message of type {@link AddUserRuleMessage} with new user rule.
     */
    private static async handleUserRuleAdd(message: AddUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.addUserRule(ruleText);
        Engine.debounceUpdate();
    }

    /**
     * Removes specified rule and updates the tswebextension engine.
     *
     * @param message Message of type {@link RemoveUserRuleMessage} with user rule to delete.
     */
    private static async handleUserRuleRemove(message: RemoveUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.removeUserRule(ruleText);
        Engine.debounceUpdate();
    }

    /**
     * Updates the tswebextension engine on {@link SettingOption.UserFilterEnabled} setting change.
     * This setting can be changed by the switch ui element, so it is important to update the engine config
     * via debounce function, as this is a heavyweight call.
     */
    private static handleEnableStateChange(): void {
        Engine.debounceUpdate();
    }

    /**
     * Removes user rules for provided url on the specified tab.
     *
     * @param message Message of type {@link ResetCustomRulesForPageMessage} with url and tab info.
     */
    private static async resetCustomRulesForPage(message: ResetCustomRulesForPageMessage): Promise<void> {
        const { url, tabId } = message.data;

        await UserRulesApi.removeRulesByUrl(url);
        await Engine.update();
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
