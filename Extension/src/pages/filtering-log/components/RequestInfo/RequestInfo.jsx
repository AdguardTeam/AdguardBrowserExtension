/* eslint-disable no-bitwise */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { rootStore } from '../../stores/RootStore';
import { messenger } from '../../../services/messenger';
import { RequestImage } from './RequestImage';

// FIXME replace with react translator
import { i18n } from '../../../../common/i18n';

import './request-info.pcss';

// FIXME provide cookie rules id, otherwise it is impossible to search them,
//  or append all data as data attributes

// TODO move into constants
const STEALTH_ACTIONS = {
    HIDE_REFERRER: 1 << 0,
    HIDE_SEARCH_QUERIES: 1 << 1,
    BLOCK_CHROME_CLIENT_DATA: 1 << 2,
    SEND_DO_NOT_TRACK: 1 << 3,
    STRIPPED_TRACKING_URL: 1 << 4,
    FIRST_PARTY_COOKIES: 1 << 5,
    THIRD_PARTY_COOKIES: 1 << 6,
};

const STEALTH_ACTIONS_NAMES = {
    HIDE_REFERRER: i18n.getMessage('filtering_log_hide_referrer'),
    HIDE_SEARCH_QUERIES: i18n.getMessage('filtering_log_hide_search_queries'),
    BLOCK_CHROME_CLIENT_DATA: i18n.getMessage('filtering_log_remove_client_data'),
    SEND_DO_NOT_TRACK: i18n.getMessage('filtering_log_send_not_track'),
    STRIPPED_TRACKING_URL: i18n.getMessage('options_stripped_tracking_parameters'),
    FIRST_PARTY_COOKIES: i18n.getMessage('options_modified_first_party_cookie'),
    THIRD_PARTY_COOKIES: i18n.getMessage('options_modified_third_party_cookie'),
};

// FIXME move into helpers
const identity = (i) => i;

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

// FIXME move into separate file
const USER_FILTER_ID = 0;

// FIXME rename WHITE_LIST_FILTER_ID to ALLOWLIST_FILTER_ID and move to the constants
const ALLOWLIST_FILTER_ID = 100;

const MESSAGES = {
    OPTIONS_USERFILTER: i18n.getMessage('options_user_filter'),
    OPTIONS_ALLOWLIST: i18n.getMessage('options_allowlist'),
    IN_ALLOWLIST: i18n.getMessage('filtering_log_in_allowlist'),
};

/**
 * Filter's name for filterId
 *
 * @param {Number} filterId
 * @param filtersMetadata
 * @returns {String}
 */
const getFilterName = (filterId, filtersMetadata) => {
    if (filterId === USER_FILTER_ID) {
        return MESSAGES.OPTIONS_USERFILTER;
    }
    if (filterId === ALLOWLIST_FILTER_ID) {
        return MESSAGES.OPTIONS_ALLOWLIST;
    }

    const filterMetadata = filtersMetadata.filter((el) => el.filterId === filterId)[0];

    return filterMetadata ? filterMetadata.name : null;
};

const RequestInfo = observer(() => {
    const { logStore } = useContext(rootStore);

    const { selectedEvent, filtersMetadata } = logStore;

    // FIXME figure out why this could be undefined
    if (!selectedEvent) {
        return null;
    }

    // FIXME render image if available
    const infoElements = [
        {
            title: 'URL:',
            data: selectedEvent.requestUrl,
        },
        {
            title: 'Element:',
            data: selectedEvent.element,
        },
        {
            title: 'Cookie:',
            data: selectedEvent.cookieName,
        },
        {
            title: 'Type:',
            data: selectedEvent.requestType,
        },
        {
            title: 'Source:',
            data: selectedEvent.frameDomain,
        },
        {
            title: 'Rule:',
            data: selectedEvent?.requestRule?.ruleText, // FIXME add info about converted rule
        },
        // TODO add converted rule text
        {
            title: 'Filter:',
            data: getFilterName(selectedEvent.requestRule?.filterId, filtersMetadata),
        },
        {
            title: 'Stealth mode:',
            data: getStealthActionsNames(selectedEvent.stealthActions),
        },
    ];

    const renderImageIfNecessary = (event) => {
        // FIXME magic "IMAGE" to the constants
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

    const shouldRenderOpenInNewTab = !(
        selectedEvent.element
        || selectedEvent.cookieName
        || selectedEvent.script
    );

    const openInNewTabHandler = async (e) => {
        e.preventDefault();

        let url = selectedEvent.requestUrl;

        if (url === 'content-security-policy-check') {
            url = selectedEvent.frameUrl;
        }

        await messenger.openTab(url, { inNewWindow: true });
    };

    return (
        <>
            <div>Request details</div>
            {renderedInfo}
            {renderImageIfNecessary(selectedEvent)}
            <div className="controls">
                {shouldRenderOpenInNewTab
                    && <button className="control" type="button" onClick={openInNewTabHandler}>Open in new tab</button>}
            </div>
        </>
    );
});

export { RequestInfo };
