/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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

// it is okay to import directly from `@adguard/tswebextension/mv3` without using manifest-dependant alias,
// because checkUserRulesRegexpErrors use only in engine-mv3
import { type ConfigurationResult, UnsupportedRegexpError } from '@adguard/tswebextension/mv3';
import { RuleGenerator } from '@adguard/agtree/generator';

import { type Engine } from 'engine';

import {
    type AddUserRuleMessage,
    MessageType,
    type RemoveUserRuleMessage,
    type ResetUserRulesForPageMessage,
    type SaveUserRulesMessage,
    type SetEditorStorageContentMessage,
} from '../../common/messages';
import { messageHandler } from '../message-handler';
import { SettingOption } from '../schema';
import {
    SettingsApi,
    type SettingsData,
    UserRulesApi,
    TabsApi,
} from '../api';
import { settingsEvents } from '../events';
import { Prefs } from '../prefs';
import { logger } from '../../common/logger';

import {
    Telemetry,
    TelemetryEventName,
    TelemetryScreenName,
} from './telemetry';

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
export class UserRulesService {
    private static engine: Engine;

    /**
     * Initializes UserRulesService: creates handlers for operations on user rules.
     *
     * @param engine Engine instance.
     */
    public static async init(engine: Engine): Promise<void> {
        UserRulesService.engine = engine;

        messageHandler.addListener(MessageType.GetUserRules, UserRulesService.getUserRules);
        messageHandler.addListener(MessageType.GetUserRulesEditorData, UserRulesService.getUserRulesEditorData);
        messageHandler.addListener(MessageType.SaveUserRules, UserRulesService.handleUserRulesSave);
        messageHandler.addListener(MessageType.AddUserRule, UserRulesService.handleUserRuleAdd);
        messageHandler.addListener(MessageType.RemoveUserRule, UserRulesService.handleUserRuleRemove);
        messageHandler.addListener(MessageType.GetEditorStorageContent, UserRulesService.getEditorStorageContent);
        messageHandler.addListener(MessageType.SetEditorStorageContent, UserRulesService.setEditorStorageContent);
        messageHandler.addListener(MessageType.ResetUserRulesForPage, UserRulesService.resetUserRulesForPage);

        UserRulesService.engine.api.onAssistantCreateRule.subscribe(UserRulesService.handleAssistantCreateRule);
        UserRulesService.engine.api.onAssistantCreateRule.subscribe(UserRulesService.addUserRule);

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
     * Handles rule creation from assistant.
     * Sends telemetry event for block element action.
     *
     * @note Telemetry event is sent from the background because the assistant
     *   lives in a separate repository and is not directly accessible from the extension UI code.
     */
    private static async handleAssistantCreateRule(): Promise<void> {
        await Telemetry.sendCustomEvent(
            TelemetryScreenName.BlockElementScreen,
            TelemetryEventName.BlockElementClick,
        );
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
            UserRulesService.engine.debounceUpdate();
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
            await UserRulesService.engine.update();
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
            UserRulesService.engine.debounceUpdate();
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
            UserRulesService.engine.debounceUpdate();
        }
    }

    /**
     * Updates the tswebextension engine on {@link SettingOption.UserFilterEnabled} setting change.
     * This setting can be changed by the switch ui element, so it is important to update the engine config
     * via debounce function for MV2, as this is a heavyweight call.
     * For MV3 we should wait for the engine to be ready and then check for
     * possible exceeding the limits.
     */
    private static async handleEnableStateChange(): Promise<void> {
        if (__IS_MV3__) {
            await UserRulesService.engine.update();
        } else {
            UserRulesService.engine.debounceUpdate();
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
        await UserRulesService.engine.update();
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

    /**
     * Checks for user rules parsing errors in the configuration result.
     *
     * @param result Configuration result from the engine.
     */
    public static checkUserRulesRegexpErrors(result: ConfigurationResult): void {
        if (!UserRulesApi.isEnabled()) {
            return;
        }

        const errors = result.dynamicRules?.errors?.filter((error) => error instanceof UnsupportedRegexpError) || [];

        if (errors.length > 0) {
            errors.forEach((error) => {
                logger.error(
                    '[ext.UserRulesService.checkUserRulesRegexpErrors]: User rule parsing error:',
                    `\nRule: ${RuleGenerator.generate(error.networkRule.node)}`,
                    '\nReason:',
                    error,
                );
            });
        }
    }
}
