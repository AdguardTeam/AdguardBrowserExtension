/* eslint-disable no-bitwise */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { identity } from 'lodash';
import classnames from 'classnames';

import { getFilterName, getRequestType } from '../utils';
import { RequestImage } from './RequestImage';
import { rootStore } from '../../../stores/RootStore';
import { messenger } from '../../../../services/messenger';
import { reactTranslator } from '../../../../reactCommon/reactTranslator';
import { ANTIBANNER_FILTERS_ID, STEALTH_ACTIONS } from '../../../../../common/constants';

import './request-info.pcss';

const STEALTH_ACTIONS_NAMES = {
    HIDE_REFERRER: reactTranslator.translate('filtering_log_hide_referrer'),
    SEND_DO_NOT_TRACK: reactTranslator.translate('filtering_log_send_not_track'),
    HIDE_SEARCH_QUERIES: reactTranslator.translate('filtering_log_hide_search_queries'),
    FIRST_PARTY_COOKIES: reactTranslator.translate('options_modified_first_party_cookie'),
    THIRD_PARTY_COOKIES: reactTranslator.translate('options_modified_third_party_cookie'),
    BLOCK_CHROME_CLIENT_DATA: reactTranslator.translate('filtering_log_remove_client_data'),
    STRIPPED_TRACKING_URL: reactTranslator.translate('options_stripped_tracking_parameters'),
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

const RequestInfo = observer(() => {
    const { logStore, wizardStore } = useContext(rootStore);

    const { closeModal } = wizardStore;

    const { selectedEvent, filtersMetadata } = logStore;

    const infoElements = [
        {
            title: reactTranslator.translate('options_popup_filter_url'),
            data: selectedEvent.requestUrl,
        },
        {
            title: reactTranslator.translate('filtering_modal_element'),
            data: selectedEvent.element,
        },
        {
            title: reactTranslator.translate('filtering_modal_cookie'),
            data: selectedEvent.cookieName,
        },
        {
            title: reactTranslator.translate('filtering_modal_type'),
            data: getRequestType(selectedEvent.requestType),
        },
        {
            title: reactTranslator.translate('filtering_modal_source'),
            data: selectedEvent.frameDomain,
        },
        {
            title: reactTranslator.translate('filtering_modal_rule'),
            data: selectedEvent?.requestRule?.ruleText,
        },
        // TODO add converted rule text
        {
            title: reactTranslator.translate('filtering_modal_filter'),
            data: getFilterName(selectedEvent.requestRule?.filterId, filtersMetadata),
        },
        {
            title: reactTranslator.translate('filtering_modal_privacy'),
            data: getStealthActionsNames(selectedEvent.stealthActions),
        },
    ];

    const renderImageIfNecessary = (event) => {
        if (event.requestType !== 'IMAGE') {
            return null;
        }
        return <RequestImage url={event.requestUrl} />;
    };

    const renderedInfo = infoElements.map(({ data, title }) => {
        if (!data) {
            return null;
        }
        return (
            <div key={title} className="request-info">
                <div className="request-info__key">{title}</div>
                <div className="request-info__value">{data}</div>
            </div>
        );
    });

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
                className="request-modal__button request-modal__button--white"
                type="button"
                onClick={openInNewTabHandler}
                title={reactTranslator.translate('filtering_modal_open_in_new_tab')}
            >
                {reactTranslator.translate('filtering_modal_open_in_new_tab')}
            </button>
        );
    };

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

    const renderBlockRequest = (event) => {
        const { requestRule } = event;

        const BUTTON_MAP = {
            BLOCK: {
                buttonTitleKey: 'filtering_modal_block',
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
        };

        let props = BUTTON_MAP.BLOCK;

        if (!requestRule) {
            props = BUTTON_MAP.BLOCK;
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.USER_FILTER_ID) {
            props = BUTTON_MAP.USER_FILTER;
            if (requestRule.whitelistRule) {
                props = BUTTON_MAP.BLOCK;
            }
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
            props = BUTTON_MAP.ALLOWLIST;
        } else if (!requestRule.whitelistRule) {
            props = BUTTON_MAP.UNBLOCK;
        } else if (requestRule.whitelistRule) {
            props = BUTTON_MAP.BLOCK;
        }

        const { buttonTitleKey, onClick } = props;

        const buttonClass = classnames('request-modal__button', {
            'request-modal__button--red': buttonTitleKey === BUTTON_MAP.BLOCK.buttonTitleKey,
        });

        return (
            <button
                className={buttonClass}
                type="button"
                onClick={onClick}
                title={reactTranslator.translate(buttonTitleKey)}
            >
                {reactTranslator.translate(buttonTitleKey)}
            </button>
        );
    };

    return (
        <>
            <div className="request-modal__title">
                <button
                    type="button"
                    onClick={closeModal}
                    className="request-modal__navigation request-modal__navigation--close"
                >
                    <svg className="icon">
                        <use xlinkHref="#cross" />
                    </svg>
                </button>
                <span className="request-modal__header">{reactTranslator.translate('filtering_modal_info_title')}</span>
            </div>
            <div className="request-modal__content">
                {renderedInfo}
                {renderImageIfNecessary(selectedEvent)}
                <div className="request-modal__controls">
                    {renderOpenInNewTab(selectedEvent)}
                    {renderBlockRequest(selectedEvent)}
                </div>
            </div>
        </>
    );
});

export { RequestInfo };
