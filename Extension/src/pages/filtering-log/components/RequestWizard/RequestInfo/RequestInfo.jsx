/* eslint-disable no-bitwise */
import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import { identity } from 'lodash';

import { rootStore } from '../../../stores/RootStore';
import { messenger } from '../../../../services/messenger';
import { RequestImage } from './RequestImage';

// FIXME replace with react translator
import { i18n } from '../../../../../common/i18n';

import './request-info.pcss';
import { getFilterName } from '../utils';

// FIXME provide cookie rules id, otherwise it is impossible to search them,
//  or append all data as data attributes

// FIXME add close button of modal window

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
            data: selectedEvent?.requestRule?.ruleText,
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

    const renderBlockRequest = (event) => {
        if (event.requestRule) {
            return null;
        }

        return (
            <button
                className="control"
                type="button"
                onClick={blockHandler}
            >
                Block
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
