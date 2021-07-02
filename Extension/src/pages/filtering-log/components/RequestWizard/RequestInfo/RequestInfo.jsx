/* eslint-disable no-bitwise */
import React, { useContext, useRef } from 'react';
import { observer } from 'mobx-react';
import identity from 'lodash/identity';
import cn from 'classnames';

import { getFilterName, getRequestType } from '../utils';
import { rootStore } from '../../../stores/RootStore';
import { ADDED_RULE_STATES } from '../../../stores/WizardStore';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../../common/translators/reactTranslator';
import { ANTIBANNER_FILTERS_ID, STEALTH_ACTIONS } from '../../../../../common/constants';
import { Icon } from '../../../../common/components/ui/Icon';
import { CopyToClipboard } from '../../../../common/components/CopyToClipboard';
import { NetworkStatus, FilterStatus } from '../../Status';
import { StatusMode, getStatusMode } from '../../../filteringLogStatus';
import { RequestTypes } from '../../../../../background/utils/request-types';
import { useOverflowed } from '../../../../common/hooks/useOverflowed';

import './request-info.pcss';

const STEALTH_ACTIONS_NAMES = {
    HIDE_REFERRER: reactTranslator.getMessage('filtering_log_hide_referrer'),
    SEND_DO_NOT_TRACK: reactTranslator.getMessage('filtering_log_send_not_track'),
    HIDE_SEARCH_QUERIES: reactTranslator.getMessage('filtering_log_hide_search_queries'),
    FIRST_PARTY_COOKIES: reactTranslator.getMessage('options_modified_first_party_cookie'),
    THIRD_PARTY_COOKIES: reactTranslator.getMessage('options_modified_third_party_cookie'),
    BLOCK_CHROME_CLIENT_DATA: reactTranslator.getMessage('filtering_log_remove_client_data'),
    STRIPPED_TRACKING_URL: reactTranslator.getMessage('options_stripped_tracking_parameters'),
};

/**
 * Returns stealth actions names
 * @param actions
 * @returns {string[]|null}
 */
const getStealthActionsNames = (actions) => {
    const result = Object.keys(STEALTH_ACTIONS)
        .map((key) => {
            const action = STEALTH_ACTIONS[key];
            if ((actions & action) === action) {
                return STEALTH_ACTIONS_NAMES[key];
            }
            return null;
        })
        .filter(identity);

    return result.length > 0 ? result.join(', ') : null;
};

/**
 * Returns type of the event
 * @param selectedEvent
 * @return {String}
 */
const getType = (selectedEvent) => {
    return getRequestType(selectedEvent);
};

/**
 * Returns rule text
 * @param selectedEvent
 * @return {string|null}
 */
const getRule = (selectedEvent) => {
    const replaceRules = selectedEvent?.replaceRules;
    if (replaceRules && replaceRules.length > 0) {
        return replaceRules.map((rule) => rule.ruleText).join('\n');
    }

    const requestRule = selectedEvent?.requestRule;
    if (requestRule?.whitelistRule && requestRule?.documentLevelRule) {
        return null;
    }
    return requestRule?.ruleText || null;
};

/**
 * Returns field title for one rule or many rules
 * @param selectedEvent
 * @return {string}
 */
const getRuleFieldTitle = (selectedEvent) => {
    const replaceRules = selectedEvent?.replaceRules;
    if (replaceRules && replaceRules.length > 0) {
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
    const ref = useRef();
    const contentOverflowed = useOverflowed(ref);

    const { logStore, wizardStore } = useContext(rootStore);

    const { closeModal, addedRuleState } = wizardStore;

    const { selectedEvent, filtersMetadata } = logStore;

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
            data: selectedEvent.cookieName,
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
            data: getStealthActionsNames(selectedEvent.stealthActions),
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
            PARTS.STEALTH, // FIXME determine first/third-party
            PARTS.RULE,
            PARTS.FILTER,
        ];
    }

    const openInNewTabHandler = async () => {
        let url = selectedEvent.requestUrl;

        if (url === 'content-security-policy-check') {
            url = selectedEvent.frameUrl;
        }

        await messenger.openTab(url, { inNewWindow: true });
    };

    const renderOpenInNewTab = (event) => {
        // there is nothing to open if log event reveals blocked element or cookie
        const showButton = !(
            event.element
            || event.cookieName
            || event.script
        );

        if (!showButton) {
            return null;
        }

        return (
            <button
                className="request-modal__navigation request-modal__navigation--new-tab"
                type="button"
                onClick={openInNewTabHandler}
                title={reactTranslator.getMessage('filtering_modal_open_in_new_tab')}
            >
                <Icon id="#link" classname="icon--link" />
            </button>
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

            const canCopyToClipboard = isRequestUrl || isRule || isFilterName;

            return (
                <div key={title} className="request-info">
                    <div className="request-info__key">{title}</div>
                    <div className="request-info__value">
                        {canCopyToClipboard
                            ? (
                                <>
                                    <CopyToClipboard
                                        wrapperClassName="request-info__copy-to-clipboard-wrapper"
                                        className="request-info__copy-to-clipboard"
                                    >
                                        {data}
                                    </CopyToClipboard>
                                    {isRequestUrl && (
                                        renderOpenInNewTab(selectedEvent)
                                    )}
                                </>
                            )
                            : data}
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
            RequestTypes.IMAGE,
            RequestTypes.DOCUMENT,
            RequestTypes.SUBDOCUMENT,
            RequestTypes.SCRIPT,
            RequestTypes.STYLESHEET,
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
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.USER_FILTER_ID) {
            buttonProps = BUTTON_MAP.USER_FILTER;
            if (requestRule.isStealthModeRule) {
                buttonProps = BUTTON_MAP.UNBLOCK;
            }
            if (requestRule.whitelistRule) {
                return (
                    <>
                        {renderButton(BUTTON_MAP.BLOCK)}
                        {renderButton(buttonProps)}
                        {showPreviewButton && renderButton(BUTTON_MAP.PREVIEW)}
                    </>
                );
            }
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
            buttonProps = BUTTON_MAP.ALLOWLIST;
        } else if (!requestRule.whitelistRule) {
            buttonProps = BUTTON_MAP.UNBLOCK;
        } else if (requestRule.whitelistRule) {
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
                    className="request-modal__navigation request-modal__navigation--close"
                >
                    <Icon id="#cross" classname="icon--contain" />
                </button>
                <span className="request-modal__header">{reactTranslator.getMessage('filtering_modal_info_title')}</span>
            </div>
            <div ref={ref} className="request-modal__content">
                {selectedEvent.method && (
                    <div className="request-info">
                        <div className="request-info__key">
                            {reactTranslator.getMessage('filtering_modal_status_text_desc')}
                        </div>
                        <NetworkStatus
                            method={selectedEvent.method}
                            statusCode={selectedEvent.statusCode}
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
