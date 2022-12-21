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
import browser from 'webextension-polyfill';

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
export class UserRulesService {
    public static async init(): Promise<void> {
        await UserRulesApi.init();

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

    private static async getUserRules(): Promise<GetUserRulesResponse> {
        const userRules = await UserRulesApi.getUserRules();

        const content = userRules.join('\n');

        return { content, appVersion: Prefs.version };
    }

    private static async getUserRulesEditorData(): Promise<GetUserRulesEditorDataResponse> {
        const userRules = await UserRulesApi.getUserRules();

        const content = userRules.join('\n');

        return {
            userRules: content,
            settings: SettingsApi.getData(),
        };
    }

    private static async addUserRule(rule: string): Promise<void> {
        await UserRulesApi.addUserRule(rule);
        await Engine.update();
    }

    private static async handleUserRulesSave(message: SaveUserRulesMessage): Promise<void> {
        const { value } = message.data;

        await UserRulesApi.setUserRules(value.split('\n'));
        await Engine.update();
    }

    private static async handleUserRuleAdd(message: AddUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.addUserRule(ruleText);
        await Engine.update();
    }

    private static async handleUserRuleRemove(message: RemoveUserRuleMessage): Promise<void> {
        const { ruleText } = message.data;

        await UserRulesApi.removeUserRule(ruleText);
        await Engine.update();
    }

    private static async handleEnableStateChange(): Promise<void> {
        await Engine.update();
    }

    private static async resetCustomRulesForPage(message: ResetCustomRulesForPageMessage): Promise<void> {
        const { url, tabId } = message.data;

        await UserRulesApi.removeRulesByUrl(url);
        await Engine.update();

        await browser.tabs.reload(tabId);
    }

    private static getEditorStorageContent(): string | undefined {
        return UserRulesApi.getEditorStorageData();
    }

    private static setEditorStorageContent(message: SetEditorStorageContentMessage): void {
        const { content } = message.data;

        UserRulesApi.setEditorStorageData(content);
    }
}
