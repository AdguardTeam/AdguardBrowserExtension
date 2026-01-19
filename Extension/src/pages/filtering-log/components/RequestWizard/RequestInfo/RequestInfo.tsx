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

/*
eslint-disable no-bitwise,
jsx-a11y/click-events-have-key-events,
jsx-a11y/no-static-element-interactions
*/

import { observer } from 'mobx-react';
import React, {
    useState,
    useContext,
    useRef,
    useLayoutEffect,
} from 'react';

import { identity } from 'lodash-es';
import cn from 'classnames';

import { StealthActions, ContentType as RequestType } from 'tswebextension';

import { FILTERING_LOG_ASSUMED_RULE_URL } from '../../../../options/constants';
import { translator } from '../../../../../common/translators/translator';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import {
    getRequestEventType,
    getCookieData,
    getRuleFilterName,
} from '../utils';
import { rootStore } from '../../../stores/RootStore';
import { WindowsApi } from '../../../../../common/api/extension/windows';
import { AntiBannerFiltersId } from '../../../../../common/constants';
import { Icon } from '../../../../common/components/ui/Icon';
import { NetworkStatus, FilterStatus } from '../../Status';
import { StatusMode, getStatusMode } from '../../../filteringLogStatus';
import { useOverflowed } from '../../../../common/hooks/useOverflowed';
import { optionsStorage } from '../../../../options/options-storage';
import { DEFAULT_MODAL_WIDTH_PX, LINE_COUNT_LIMIT } from '../constants';
import { TextCollapser } from '../../../../common/components/TextCollapser/TextCollapser';
import { AddedRuleState } from '../../../constants';
import { type FilteringLogEvent, type FilteringEventRuleData } from '../../../../../background/api/filtering-log';
import { type FilterMetadata } from '../../../../../background/api';
import { Popover } from '../../../../common/components/ui/Popover/Popover';
import { getFilterName } from '../../../../helpers';

import './request-info.pcss';

/**
 * Stealth actions names.
 */
type StealthActionNamesType = {
    [key: number]: string;
};

const StealthActionNames: StealthActionNamesType = {
    [StealthActions.HideReferrer]: translator.getMessage('filtering_log_hide_referrer'),
    [StealthActions.SendDoNotTrack]: translator.getMessage('filtering_log_send_not_track'),
    [StealthActions.HideSearchQueries]: translator.getMessage('filtering_log_hide_search_queries'),
    [StealthActions.FirstPartyCookies]: translator.getMessage('options_modified_first_party_cookie'),
    [StealthActions.ThirdPartyCookies]: translator.getMessage('options_modified_third_party_cookie'),
    [StealthActions.BlockChromeClientData]: translator.getMessage('filtering_log_remove_client_data'),
};

/**
 * Button properties.
 */
type ButtonProps = {
    /**
     * Button title key for translation.
     */
    title: string;

    /**
     * Button click handler.
     */
    onClick: () => void;

    /**
     * Additional class name.
     */
    className?: string;
};

/**
 * Single event part data.
 */
type EventPartData = {
    /**
     * Part title.
     */
    title: string;

    /**
     * Part data.
     */
    data?: string | string[] | null;
};

/**
 * Event parts map.
 */
type EventPartMap = {
    [key: string]: EventPartData;
};

/**
 * Returns stealth actions names.
 *
 * @param actions Stealth actions.
 *
 * @returns Stealth actions names or null.
 */
const getStealthActionNames = (actions: number | undefined): string | null => {
    if (!actions) {
        return null;
    }

    const result = Object.values(StealthActions)
        .filter((value): value is number => typeof value === 'number')
        .map((action) => {
            if ((actions & action) === action) {
                return StealthActionNames[action];
            }
            return null;
        })
        .filter(identity);

    return result.length > 0 ? result.join(', ') : null;
};

/**
 * Returns type of the event
 *
 * @param selectedEvent
 *
 * @returns {string}
 */
const getType = (selectedEvent: FilteringLogEvent) => {
    return getRequestEventType(selectedEvent);
};

/**
 * Gets rules text data for the selected event.
 *
 * @param {FilteringEvent} event Event object to get the rule(s) from.
 * @param {RegularFilterMetadata} filtersMetadata Filters metadata.
 *
 * @returns An object with the following properties:
 * - `appliedRuleTexts` - an array of rule texts that were applied to the request.
 *   If there are multiple rules, each rule text is followed by the filter name in parentheses.
 * - `originalRuleTexts` - an array of original rule texts that were converted to the applied rule texts (if any)
 *   If the rule was not converted, `appliedRuleTexts` contains the original rule text and `originalRuleTexts` is empty.
 *   If there are multiple rules, each rule text is followed by the filter name in parentheses.
 */
const getRulesData = (event: FilteringLogEvent, filtersMetadata: FilterMetadata[] | null) => {
    const {
        requestRule,
        replaceRules,
        stealthAllowlistRules,
    } = event;

    const result = {
        appliedRuleTexts: [] as string[],
        originalRuleTexts: [] as string[],
    };

    const addRule = (rule: FilteringEventRuleData, filterName?: string | null) => {
        const { appliedRuleText, originalRuleText } = rule;

        if (appliedRuleText) {
            result.appliedRuleTexts.push(filterName ? `${appliedRuleText} (${filterName})` : appliedRuleText);
        }

        if (originalRuleText) {
            result.originalRuleTexts.push(filterName ? `${originalRuleText} (${filterName})` : originalRuleText);
        }
    };

    const addRuleGroup = (rules: FilteringEventRuleData[]) => {
        if (!rules) {
            return;
        }

        if (rules.length === 1 && rules[0]) {
            addRule(rules[0]);
            return;
        }

        // in this case add rule texts with filter name
        rules.forEach((rule) => {
            const filterName = filtersMetadata
                ? getFilterName(rule.filterId, filtersMetadata)
                : null;

            addRule(rule, filterName);
        });
    };

    if (replaceRules) {
        addRuleGroup(replaceRules);
        return result;
    }

    if (stealthAllowlistRules) {
        addRuleGroup(stealthAllowlistRules);
        return result;
    }

    if (!requestRule) {
        return result;
    }

    // Handle allowlist rules
    if (
        requestRule?.allowlistRule
        && requestRule?.documentLevelRule
        && requestRule?.filterId === AntiBannerFiltersId.AllowlistFilterId
    ) {
        // Empty result
        return result;
    }

    addRule(requestRule);

    return result;
};

const PARTS = {
    URL: 'URL',
    ELEMENT: 'ELEMENT',
    COOKIE: 'COOKIE',
    TYPE: 'TYPE',
    SOURCE: 'SOURCE',
    ASSUMED_RULE: 'ASSUMED_RULE',
    ORIGINAL_RULE: 'ORIGINAL_RULE',
    APPLIED_RULES: 'APPLIED_RULES',
    FILTER: 'FILTER',
    STEALTH: 'STEALTH',
    DECLARATIVE_RULE: 'DECLARATIVE_RULE',
};

const RequestInfo = observer(() => {
    const contentRef = useRef(null);
    const contentOverflowed = useOverflowed(contentRef);

    const requestTextRef = useRef(null);

    const { logStore, wizardStore } = useContext(rootStore);

    const { closeModal, addedRuleState } = wizardStore;

    const { selectedEvent, filtersMetadata } = logStore;

    if (!selectedEvent) {
        return null;
    }

    const [textMaxWidth, setTextMaxWidth] = useState(DEFAULT_MODAL_WIDTH_PX);

    useLayoutEffect(() => {
        const MODAL_PADDINGS_PX = 70;
        const startModalWidth = optionsStorage.getItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH)
            || DEFAULT_MODAL_WIDTH_PX;

        setTextMaxWidth(startModalWidth - MODAL_PADDINGS_PX);
    }, [selectedEvent.eventId]);

    // Handle rule texts
    const rulesData = getRulesData(selectedEvent, filtersMetadata);

    const appliedRulesData = __IS_MV3__
        ? {
            title: translator.getPlural(
                'filtering_modal_applied_rules',
                selectedEvent.declarativeRuleInfo?.sourceRules.length || 0,
            ),
            data: selectedEvent.declarativeRuleInfo?.sourceRules.map((r) => r.sourceRule),
        }
        : {
            title: translator.getPlural(
                'filtering_modal_applied_rules',
                Math.max(rulesData.appliedRuleTexts.length, 1),
            ),
            data: rulesData.appliedRuleTexts.length > 0
                ? rulesData.appliedRuleTexts.join('\n')
                : null,
        };

    const eventPartsMap: EventPartMap = {
        [PARTS.URL]: {
            title: translator.getMessage('options_popup_filter_url'),
            data: selectedEvent.requestUrl,
        },
        [PARTS.ELEMENT]: {
            title: translator.getMessage('filtering_modal_element'),
            data: selectedEvent.element,
        },
        [PARTS.COOKIE]: {
            title: translator.getMessage('filtering_modal_cookie'),
            data: getCookieData(selectedEvent),
        },
        [PARTS.TYPE]: {
            title: translator.getMessage('filtering_modal_type'),
            data: getType(selectedEvent),
        },
        [PARTS.SOURCE]: {
            title: translator.getMessage('filtering_modal_source'),
            data: selectedEvent.frameDomain,
        },
        // TODO add converted rule text
        [PARTS.FILTER]: {
            title: translator.getMessage('filtering_modal_filter'),
            data: getRuleFilterName(selectedEvent, filtersMetadata),
        },
        // TODO: determine first/third-party
        [PARTS.STEALTH]: {
            title: translator.getMessage('filtering_modal_privacy'),
            data: getStealthActionNames(selectedEvent.stealthActions),
        },
        [PARTS.APPLIED_RULES]: appliedRulesData,
        [PARTS.DECLARATIVE_RULE]: {
            title: translator.getMessage('filtering_modal_declarative_rule'),
            data: selectedEvent.declarativeRuleInfo?.declarativeRuleJson,
        },
    };

    const isCosmeticRule = selectedEvent.requestRule?.cssRule
        || selectedEvent.requestRule?.scriptRule;

    const ruleTitle = isCosmeticRule
        ? translator.getPlural('filtering_modal_applied_rules', Math.max(rulesData.appliedRuleTexts.length, 1))
        : translator.getPlural('filtering_modal_assumed_rules', Math.max(rulesData.appliedRuleTexts.length, 1));

    eventPartsMap[PARTS.ASSUMED_RULE] = {
        title: ruleTitle,
        data: rulesData.appliedRuleTexts.length > 0
            ? rulesData.appliedRuleTexts
            : null,
    };

    // Original rule texts contains elements only if the rule was converted
    if (rulesData.originalRuleTexts.length > 0) {
        eventPartsMap[PARTS.ORIGINAL_RULE] = {
            title: translator.getPlural(
                'filtering_modal_original_rules',
                Math.max(rulesData.originalRuleTexts.length, 1),
            ),
            data: rulesData.originalRuleTexts.join('\n'),
        };
    }

    let infoElementsToShow = Object.values(PARTS);

    if (selectedEvent.requestRule?.cookieRule) {
        infoElementsToShow = infoElementsToShow.filter((p) => p !== PARTS.ELEMENT && p !== PARTS.URL);
    }

    // Note: source rules contains text from already preprocessed rules,
    // that's why we checked appliedRuleText, but not originalRuleText.
    const matchedRulesContainsAssumed = !__IS_MV3__
        || selectedEvent.declarativeRuleInfo?.sourceRules.some(({ sourceRule }) => {
            return sourceRule === selectedEvent.appliedRuleText;
        });

    // If assumed and applied rules are the same - show only applied.
    if (selectedEvent.appliedRuleText && matchedRulesContainsAssumed) {
        // Hide assume rule and it's original (not preprocessed) version
        infoElementsToShow = infoElementsToShow.filter((p) => p !== PARTS.ASSUMED_RULE && p !== PARTS.ORIGINAL_RULE);
    }

    const openInNewTabHandler = async () => {
        const url = selectedEvent.requestUrl;
        await WindowsApi.create({ url, focused: true });
    };

    const renderInfoUrlButtons = (event: FilteringLogEvent) => {
        // there is nothing to open if log event reveals blocked element or cookie
        const showOpenInNewTabButton = !(
            event.element
            || event.cookieName
            || event.script
        );

        return showOpenInNewTabButton && (
            <div
                role="button"
                tabIndex={0}
                className="button button--link--green request-modal__url-button"
                onClick={openInNewTabHandler}
            >
                {translator.getMessage('filtering_modal_open_in_new_tab')}
            </div>
        );
    };

    const renderedInfo = infoElementsToShow
        .map((elementId) => eventPartsMap[elementId])
        // original rule text can be undefined which cause runtime error while destructuring
        .filter((el) => !!el)
        .map((eventPart) => {
            if (!eventPart) {
                return null;
            }

            const { data, title } = eventPart;
            if (!data) {
                return null;
            }

            const isRequestUrl = data === selectedEvent.requestUrl;
            const isRule = data === selectedEvent.appliedRuleText || data === rulesData.appliedRuleTexts;
            const isDeclarativeRule = data === selectedEvent.declarativeRuleInfo?.declarativeRuleJson;
            const isFilterName = data === selectedEvent.filterName;
            const isElement = data === selectedEvent.element;
            const canCopyToClipboard = isRequestUrl || isRule || isFilterName;

            let lineCountLimit = LINE_COUNT_LIMIT.REQUEST_URL;
            if (isRule) {
                lineCountLimit = LINE_COUNT_LIMIT.RULE;
            }

            let showMessage;
            let hideMessage;
            if (isRequestUrl) {
                showMessage = translator.getMessage('filtering_modal_show_full_url');
                hideMessage = translator.getMessage('filtering_modal_hide_full_url');
            } else if (isRule) {
                showMessage = translator.getMessage('filtering_modal_show_full_rule');
                hideMessage = translator.getMessage('filtering_modal_hide_full_rule');
            } else if (isElement) {
                showMessage = translator.getMessage('filtering_modal_show_full_element');
                hideMessage = translator.getMessage('filtering_modal_hide_full_element');
            }
            const collapserButtonMessages = {
                showMessage,
                hideMessage,
            };

            const texts = Array.isArray(data)
                ? data
                : [data];

            const textsWithCollapsers = texts.map((text) => {
                return (
                    <div className="text" key="text">
                        {(__IS_MV3__ && isRule && !isCosmeticRule) && <span className="red-dot">*</span>}
                        <TextCollapser
                            text={text}
                            ref={isRequestUrl || isRule ? requestTextRef : null}
                            width={textMaxWidth}
                            lineCountLimit={lineCountLimit}
                            collapserButtonMessages={collapserButtonMessages}
                            canCopy={canCopyToClipboard}
                        >
                            {isRequestUrl && renderInfoUrlButtons(selectedEvent)}
                        </TextCollapser>
                    </div>
                );
            });

            const infoAboutAssumedRule = () => {
                const text = reactTranslator.getMessage('filtering_log_assumed_rule_description', {
                    a: (text: string) => (
                        <a
                            href={FILTERING_LOG_ASSUMED_RULE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="button button--link button--link--underlined button--link--green"
                        >
                            {text}
                        </a>
                    ),
                });

                return (
                    <Popover text={text}>
                        <Icon
                            id="#question"
                            className="icon icon--24 icon--green-default"
                            aria-hidden="true"
                        />
                    </Popover>
                );
            };

            const content = isDeclarativeRule && selectedEvent.declarativeRuleInfo?.declarativeRuleJson
                ? (
                    <pre>
                        {JSON.stringify(JSON.parse(selectedEvent.declarativeRuleInfo.declarativeRuleJson), null, 2)}
                    </pre>
                )
                : textsWithCollapsers;

            const classNames = isDeclarativeRule && selectedEvent.declarativeRuleInfo?.declarativeRuleJson
                ? cn('request-info__value', 'scrollable', 'thin-scrollbar')
                : cn('request-info__value');

            return (
                <div key={title} className="request-info">
                    <div className="request-info__main">
                        <div className="request-info__key">{title}</div>
                        <div className={classNames}>
                            {content}
                        </div>
                    </div>
                    {(__IS_MV3__ && isRule && !isCosmeticRule) && (
                        <div className="request-info__details">
                            {infoAboutAssumedRule()}
                        </div>
                    )}
                </div>
            );
        });

    const blockHandler = () => {
        wizardStore.setBlockState();
    };

    const unblockHandler = () => {
        wizardStore.setUnblockState();
    };

    const removeFromUserFilterHandler = (event: FilteringLogEvent) => {
        wizardStore.removeFromUserFilterHandler(event);
    };

    const removeFromAllowlistHandler = () => {
        wizardStore.removeFromAllowlistHandler();
    };

    const previewClickHandler = () => {
        wizardStore.setPreviewState();
    };

    const renderButton = ({ title, onClick, className }: ButtonProps): JSX.Element => {
        const buttonClass = cn('button button--l request-modal__button', className);

        return (
            <button
                disabled={wizardStore.isActionSubmitted}
                className={buttonClass}
                type="button"
                onClick={onClick}
                title={title}
            >
                {title}
            </button>
        );
    };

    const renderControlButtons = (event: FilteringLogEvent) => {
        const { requestRule } = event;

        const BUTTON_MAP = {
            BLOCK: {
                title: translator.getMessage('filtering_modal_block'),
                onClick: blockHandler,
                className: 'button--red-bg',
            },
            UNBLOCK: {
                title: translator.getMessage('filtering_modal_unblock'),
                onClick: unblockHandler,
                className: 'button--green-bg',
            },
            ALLOWLIST: {
                title: translator.getMessage('filtering_modal_remove_allowlist'),
                onClick: removeFromAllowlistHandler,
                className: 'button--green-bg',
            },
            USER_FILTER: {
                title: translator.getMessage('filtering_modal_remove_user'),
                onClick: () => removeFromUserFilterHandler(event),
                className: 'button--red-bg',
            },
            REMOVE_ADDED_BLOCK_RULE: {
                title: translator.getMessage('filtering_modal_remove_user'),
                onClick: () => {
                    wizardStore.removeAddedRuleFromUserFilter();
                },
                className: 'button--red-bg',
            },
            REMOVE_ADDED_UNBLOCK_RULE: {
                title: translator.getMessage('filtering_modal_block_again'),
                onClick: () => {
                    wizardStore.removeAddedRuleFromUserFilter();
                },
                className: 'button--red-bg',
            },
            PREVIEW: {
                title: translator.getMessage('filtering_modal_preview_request_button'),
                onClick: previewClickHandler,
                className: 'button--transparent',
            },
        };

        let buttonProps: ButtonProps = BUTTON_MAP.BLOCK;

        const previewableTypes = [
            RequestType.Image,
            RequestType.Document,
            RequestType.Subdocument,
            RequestType.Script,
            RequestType.Stylesheet,
        ];

        const showPreviewButton = event.requestType
            && previewableTypes.includes(event.requestType)
            && !event?.element
            && !event?.script
            && !event?.cookieName
            && !(getStatusMode(event) === StatusMode.BLOCKED);

        if (addedRuleState === AddedRuleState.Block) {
            return renderButton(BUTTON_MAP.REMOVE_ADDED_BLOCK_RULE);
        }

        if (addedRuleState === AddedRuleState.Unblock) {
            return renderButton(BUTTON_MAP.REMOVE_ADDED_UNBLOCK_RULE);
        }

        if (!requestRule) {
            buttonProps = BUTTON_MAP.BLOCK;
        } else if (requestRule.filterId === AntiBannerFiltersId.UserFilterId) {
            buttonProps = BUTTON_MAP.USER_FILTER;
            if (requestRule.isStealthModeRule) {
                buttonProps = BUTTON_MAP.UNBLOCK;
            }
            if (requestRule.allowlistRule) {
                return (
                    <>
                        {renderButton(BUTTON_MAP.BLOCK)}
                        {renderButton(buttonProps)}
                        {showPreviewButton && renderButton(BUTTON_MAP.PREVIEW)}
                    </>
                );
            }
        } else if (requestRule.filterId === AntiBannerFiltersId.AllowlistFilterId) {
            buttonProps = BUTTON_MAP.ALLOWLIST;
        } else if (!requestRule.allowlistRule) {
            buttonProps = BUTTON_MAP.UNBLOCK;
        } else if (requestRule.allowlistRule) {
            buttonProps = BUTTON_MAP.BLOCK;
        }

        return (
            <>
                {renderButton(buttonProps)}
                {showPreviewButton && renderButton(BUTTON_MAP.PREVIEW)}
            </>
        );
    };

    const getFilterStatusMode = () => {
        if (addedRuleState === AddedRuleState.Block) {
            return StatusMode.BLOCKED;
        }

        if (addedRuleState === AddedRuleState.Unblock) {
            return StatusMode.ALLOWED;
        }

        return getStatusMode(selectedEvent);
    };

    return (
        <>
            <div className={cn('request-modal__title', { 'request-modal__title_fixed': contentOverflowed })}>
                <button
                    type="button"
                    onClick={closeModal}
                    className="request-modal__navigation"
                    aria-label={translator.getMessage('close_button_title')}
                >
                    <Icon
                        id="#cross"
                        className="icon--24 icon--gray-default"
                        aria-hidden="true"
                    />
                </button>
                <span className="request-modal__header">
                    {translator.getMessage('filtering_modal_info_title')}
                </span>
            </div>
            <div ref={contentRef} className="request-modal__content thin-scrollbar">
                {selectedEvent.method && (
                    <div className="request-info">
                        <div className="request-info__main">
                            <div className="request-info__key">
                                {translator.getMessage('filtering_modal_status_text_desc')}
                            </div>
                            <NetworkStatus
                                method={selectedEvent.method}
                                statusCode={selectedEvent.statusCode}
                                isThirdParty={selectedEvent.requestThirdParty}
                            />
                        </div>
                    </div>
                )}
                <div className="request-info">
                    <div className="request-info__main">
                        <div className="request-info__key">
                            {translator.getMessage('filtering_modal_filtering_status_text_desc')}
                        </div>
                        <FilterStatus
                            mode={getFilterStatusMode()}
                            statusCode={selectedEvent.statusCode}
                            method={selectedEvent.method}
                        />
                    </div>
                </div>
                {renderedInfo}
            </div>
            <div className={cn('request-modal__controls', { 'request-modal__controls_fixed': contentOverflowed })}>
                {renderControlButtons(selectedEvent)}
            </div>
        </>
    );
});

export { RequestInfo };
