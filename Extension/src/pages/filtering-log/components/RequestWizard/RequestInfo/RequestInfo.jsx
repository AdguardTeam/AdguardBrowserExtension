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

/*
eslint-disable no-bitwise,
jsx-a11y/click-events-have-key-events,
jsx-a11y/no-static-element-interactions
*/
import React, {
    useState,
    useContext,
    useRef,
    useLayoutEffect,
} from 'react';
import { observer } from 'mobx-react';
import identity from 'lodash/identity';
import cn from 'classnames';

import { StealthActions } from '@adguard/tswebextension';

import {
    getFilterName,
    getRequestEventType,
    getCookieData,
} from '../utils';
import { rootStore } from '../../../stores/RootStore';
import { ADDED_RULE_STATES } from '../../../stores/WizardStore';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { AntiBannerFiltersId, RequestType } from '../../../../../common/constants';
import { Icon } from '../../../../common/components/ui/Icon';
import { NetworkStatus, FilterStatus } from '../../Status';
import { StatusMode, getStatusMode } from '../../../filteringLogStatus';
import { useOverflowed } from '../../../../common/hooks/useOverflowed';
import { optionsStorage } from '../../../../options/options-storage';
import { DEFAULT_MODAL_WIDTH_PX, LINE_COUNT_LIMIT } from '../constants';
import { TextCollapser } from '../../../../common/components/TextCollapser/TextCollapser';

import './request-info.pcss';

const StealthActionNames = {
    [StealthActions.HIDE_REFERRER]: reactTranslator.getMessage('filtering_log_hide_referrer'),
    [StealthActions.SEND_DO_NOT_TRACK]: reactTranslator.getMessage('filtering_log_send_not_track'),
    [StealthActions.HIDE_SEARCH_QUERIES]: reactTranslator.getMessage('filtering_log_hide_search_queries'),
    [StealthActions.FIRST_PARTY_COOKIES]: reactTranslator.getMessage('options_modified_first_party_cookie'),
    [StealthActions.THIRD_PARTY_COOKIES]: reactTranslator.getMessage('options_modified_third_party_cookie'),
    [StealthActions.BLOCK_CHROME_CLIENT_DATA]: reactTranslator.getMessage('filtering_log_remove_client_data'),
    // TODO: Obsoleted, remove
    StrippedTrackingUrl: reactTranslator.getMessage('options_stripped_tracking_parameters'),
};

/**
 * Returns stealth actions names
 *
 * @param actions
 * @returns {string[]|null}
 */
const getStealthActionNames = (actions) => {
    const result = Object.keys(StealthActions)
        .map((key) => {
            const action = StealthActions[key];
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
 * @returns {string}
 */
const getType = (selectedEvent) => {
    return getRequestEventType(selectedEvent);
};

/**
 * Returns rule text with conversion info
 *
 * @param rule
 */
const getRuleText = (rule) => {
    if (!rule) {
        return null;
    }

    if (!rule.appliedRuleText) {
        return rule.ruleText;
    }

    return `${rule.ruleText} (${reactTranslator.getMessage('filtering_modal_converted_to')} ${rule.appliedRuleText})`;
};

/**
 * Returns rule text
 *
 * @param selectedEvent
 * @returns {string|null}
 */
const getRule = (selectedEvent) => {
    const replaceRules = selectedEvent?.replaceRules;
    if (replaceRules && replaceRules.length > 0) {
        return replaceRules.map((rule) => getRuleText(rule)).join('\n');
    }

    const requestRule = selectedEvent?.requestRule;
    if (
        requestRule?.allowlistRule
        && requestRule?.documentLevelRule
        && requestRule?.filterId === AntiBannerFiltersId.AllowlistFilterId
    ) {
        return null;
    }
    return getRuleText(requestRule);
};

/**
 * Returns field title for one rule or many rules
 *
 * @param selectedEvent
 * @returns {string}
 */
const getRuleFieldTitle = (selectedEvent) => {
    const replaceRules = selectedEvent?.replaceRules;
    if (replaceRules && replaceRules.length > 1) {
        return reactTranslator.getMessage('filtering_modal_rules');
    }
    return reactTranslator.getMessage('filtering_modal_rule');
};

const PARTS = {
    URL: 'URL',
    ELEMENT: 'ELEMENT',
    COOKIE: 'COOKIE',
    TYPE: 'TYPE',
    SOURCE: 'SOURCE',
    RULE: 'RULE',
    FILTER: 'FILTER',
    STEALTH: 'STEALTH',
};

const RequestInfo = observer(() => {
    const contentRef = useRef();
    const contentOverflowed = useOverflowed(contentRef);

    const requestTextRef = useRef(null);

    const { logStore, wizardStore } = useContext(rootStore);

    const { closeModal, addedRuleState } = wizardStore;

    const { selectedEvent, filtersMetadata } = logStore;

    const [textMaxWidth, setTextMaxWidth] = useState(DEFAULT_MODAL_WIDTH_PX);

    useLayoutEffect(() => {
        const MODAL_PADDINGS_PX = 70;
        const startModalWidth = optionsStorage.getItem(optionsStorage.KEYS.REQUEST_INFO_MODAL_WIDTH)
            || DEFAULT_MODAL_WIDTH_PX;

        setTextMaxWidth(startModalWidth - MODAL_PADDINGS_PX);
    }, [selectedEvent.eventId]);

    const eventPartsMap = {
        [PARTS.URL]: {
            title: reactTranslator.getMessage('options_popup_filter_url'),
            data: selectedEvent.requestUrl,
        },
        [PARTS.ELEMENT]: {
            title: reactTranslator.getMessage('filtering_modal_element'),
            data: selectedEvent.element,
        },
        [PARTS.COOKIE]: {
            title: reactTranslator.getMessage('filtering_modal_cookie'),
            data: getCookieData(selectedEvent),
        },
        [PARTS.TYPE]: {
            title: reactTranslator.getMessage('filtering_modal_type'),
            data: getType(selectedEvent),
        },
        [PARTS.SOURCE]: {
            title: reactTranslator.getMessage('filtering_modal_source'),
            data: selectedEvent.frameDomain,
        },
        [PARTS.RULE]: {
            title: getRuleFieldTitle(selectedEvent),
            data: getRule(selectedEvent),
        },
        // TODO add converted rule text
        [PARTS.FILTER]: {
            title: reactTranslator.getMessage('filtering_modal_filter'),
            data: getFilterName(selectedEvent.requestRule?.filterId, filtersMetadata),
        },
        [PARTS.STEALTH]: {
            title: reactTranslator.getMessage('filtering_modal_privacy'),
            data: getStealthActionNames(selectedEvent.stealthActions),
        },
    };

    let infoElements = [
        PARTS.URL,
        PARTS.ELEMENT,
        PARTS.COOKIE,
        PARTS.TYPE,
        PARTS.SOURCE,
        PARTS.RULE,
        PARTS.FILTER,
        PARTS.STEALTH,
    ];

    if (selectedEvent.requestRule?.cookieRule) {
        infoElements = [
            PARTS.COOKIE,
            PARTS.TYPE,
            PARTS.SOURCE,
            // TODO: determine first/third-party
            PARTS.STEALTH,
            PARTS.RULE,
            PARTS.FILTER,
        ];
    }

    const openInNewTabHandler = async () => {
        const url = selectedEvent.requestUrl;
        await messenger.openTab(url, { inNewWindow: true });
    };

    const renderInfoUrlButtons = (event) => {
        // there is nothing to open if log event reveals blocked element or cookie
        const showOpenInNewTabButton = !(
            event.element
            || event.cookieName
            || event.script
        );

        return (
            <>
                {showOpenInNewTabButton && (
                    <div
                        className="request-modal__url-button"
                        type="button"
                        onClick={openInNewTabHandler}
                    >
                        {reactTranslator.getMessage('filtering_modal_open_in_new_tab')}
                    </div>
                )}
            </>
        );
    };

    const renderedInfo = infoElements
        .map((elementId) => eventPartsMap[elementId])
        .map(({ data, title }) => {
            if (!data) {
                return null;
            }

            const isRequestUrl = data === selectedEvent.requestUrl;
            const isRule = data === selectedEvent.ruleText;
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
                showMessage = 'filtering_modal_show_full_url';
                hideMessage = 'filtering_modal_hide_full_url';
            } else if (isRule) {
                showMessage = 'filtering_modal_show_full_rule';
                hideMessage = 'filtering_modal_hide_full_rule';
            } else if (isElement) {
                showMessage = 'filtering_modal_show_full_element';
                hideMessage = 'filtering_modal_hide_full_element';
            }
            const collapserButtonMessages = {
                showMessage,
                hideMessage,
            };

            return (
                <div key={title} className="request-info">
                    <div className="request-info__key">{title}</div>
                    <div className="request-info__value">
                        <TextCollapser
                            text={data}
                            ref={isRequestUrl || isRule ? requestTextRef : null}
                            width={textMaxWidth}
                            lineCountLimit={lineCountLimit}
                            collapserButtonMessages={collapserButtonMessages}
                            collapsed
                            canCopy={canCopyToClipboard}
                        >
                            {isRequestUrl && renderInfoUrlButtons(selectedEvent)}
                        </TextCollapser>
                    </div>
                </div>
            );
        });

    const blockHandler = () => {
        wizardStore.setBlockState();
    };

    const unblockHandler = () => {
        wizardStore.setUnblockState();
    };

    const removeFromUserFilterHandler = (requestInfo) => {
        wizardStore.removeFromUserFilterHandler(requestInfo);
    };

    const removeFromAllowlistHandler = () => {
        wizardStore.removeFromAllowlistHandler();
    };

    const previewClickHandler = () => {
        wizardStore.setPreviewState();
    };

    const renderButton = ({ buttonTitleKey, onClick, className }) => {
        const buttonClass = cn('request-modal__button', className);

        const title = reactTranslator.getMessage(buttonTitleKey);

        return (
            <button
                className={buttonClass}
                type="button"
                onClick={onClick}
                title={title}
            >
                {title}
            </button>
        );
    };

    const renderControlButtons = (event) => {
        const { requestRule } = event;

        const BUTTON_MAP = {
            BLOCK: {
                buttonTitleKey: 'filtering_modal_block',
                className: 'request-modal__button--red',
                onClick: blockHandler,
            },
            UNBLOCK: {
                buttonTitleKey: 'filtering_modal_unblock',
                onClick: unblockHandler,
            },
            ALLOWLIST: {
                buttonTitleKey: 'filtering_modal_remove_allowlist',
                onClick: removeFromAllowlistHandler,
            },
            USER_FILTER: {
                buttonTitleKey: 'filtering_modal_remove_user',
                onClick: () => removeFromUserFilterHandler(event),
            },
            REMOVE_ADDED_BLOCK_RULE: {
                buttonTitleKey: 'filtering_modal_remove_user',
                onClick: () => {
                    wizardStore.removeAddedRuleFromUserFilter();
                },
            },
            REMOVE_ADDED_UNBLOCK_RULE: {
                buttonTitleKey: 'filtering_modal_block_again',
                className: 'request-modal__button--red',
                onClick: () => {
                    wizardStore.removeAddedRuleFromUserFilter();
                },
            },
            PREVIEW: {
                buttonTitleKey: 'filtering_modal_preview_request_button',
                className: 'request-modal__button--white',
                onClick: previewClickHandler,
            },
        };

        let buttonProps = BUTTON_MAP.BLOCK;

        const previewableTypes = [
            RequestType.Image,
            RequestType.Document,
            RequestType.Subdocument,
            RequestType.Script,
            RequestType.Stylesheet,
        ];

        const showPreviewButton = previewableTypes.includes(event.requestType)
            && !event?.element
            && !event?.script
            && !event?.cookieName
            && !(getStatusMode(event) === StatusMode.BLOCKED);

        if (addedRuleState === ADDED_RULE_STATES.BLOCK) {
            return renderButton(BUTTON_MAP.REMOVE_ADDED_BLOCK_RULE);
        }

        if (addedRuleState === ADDED_RULE_STATES.UNBLOCK) {
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
        if (addedRuleState === ADDED_RULE_STATES.BLOCK) {
            return StatusMode.BLOCKED;
        }

        if (addedRuleState === ADDED_RULE_STATES.UNBLOCK) {
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
                    className="request-modal__navigation request-modal__navigation--button"
                    aria-label={reactTranslator.getMessage('close_button_title')}
                >
                    <Icon id="#cross" classname="icon--24" />
                </button>
                <span className="request-modal__header">
                    {reactTranslator.getMessage('filtering_modal_info_title')}
                </span>
            </div>
            <div ref={contentRef} className="request-modal__content">
                {selectedEvent.method && (
                    <div className="request-info">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_status_text_desc')}
                        </div>
                        <NetworkStatus
                            method={selectedEvent.method}
                            statusCode={selectedEvent.statusCode}
                            isThirdParty={selectedEvent.requestThirdParty}
                        />
                    </div>
                )}
                <div className="request-info">
                    <div className="request-info__key">
                        {reactTranslator.getMessage('filtering_modal_filtering_status_text_desc')}
                    </div>
                    <FilterStatus
                        mode={getFilterStatusMode()}
                        statusCode={selectedEvent.statusCode}
                        method={selectedEvent.method}
                    />
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
