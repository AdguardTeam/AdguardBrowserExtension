/* eslint-disable no-bitwise */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { identity } from 'lodash';

import { getFilterName } from '../utils';
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
            title: 'Cookie:', // TODO add to locale messages
            data: selectedEvent.cookieName,
        },
        {
            title: reactTranslator.translate('filtering_modal_type'),
            data: selectedEvent.requestType,
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
                <div>{title}</div>
                <div>{data}</div>
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
                className="control"
                type="button"
                onClick={openInNewTabHandler}
            >
                Open in new tab
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

    /* TODO: refactor */
    const renderBlockRequest = (event) => {
        const { requestRule } = event;

        let type;
        let onClick;

        if (!requestRule) {
            type = 'Block';
            onClick = blockHandler;
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.USER_FILTER_ID) {
            type = 'Remove from User Filter';
            onClick = () => removeFromUserFilterHandler(event);
            if (requestRule.whitelistRule) {
                type = 'Block';
                onClick = blockHandler;
            }
        } else if (requestRule.filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
            type = 'Remove from Allowlist';
            onClick = removeFromAllowlistHandler;
        } else if (!requestRule.whitelistRule) {
            type = 'Unblock';
            onClick = unblockHandler;
        } else if (requestRule.whitelistRule) {
            type = 'Block';
            onClick = blockHandler;
        }

        return (
            <button
                className="control"
                type="button"
                onClick={onClick}
            >
                {type}
            </button>
        );
    };

    return (
        <>
            <div>Request details</div>
            {renderedInfo}
            {renderImageIfNecessary(selectedEvent)}
            <div className="controls">
                {renderOpenInNewTab(selectedEvent)}
                {renderBlockRequest(selectedEvent)}
            </div>
        </>
    );
});

export { RequestInfo };
