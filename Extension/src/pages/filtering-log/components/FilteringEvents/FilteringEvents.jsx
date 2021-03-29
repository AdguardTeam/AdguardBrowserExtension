/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores/RootStore';
import { getRequestType } from '../RequestWizard/utils';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';
import { RequestTypes } from '../../../../background/utils/request-types';
import { FilteringEventsEmpty } from './FilteringEventsEmpty';

import './filtering-events.pcss';

const filterNameAccessor = (props) => {
    const { requestRule, filterName, stealthActions } = props;

    if (requestRule && requestRule.isStealthModeRule) {
        return reactTranslator.getMessage('filtering_log_privacy_applied_rules');
    }

    if (!filterName && stealthActions) {
        return reactTranslator.getMessage('filtering_log_privacy_applied_rules');
    }

    return props.filterName;
};

const getRowClassName = (event) => {
    let className = null;

    if (event.replaceRules) {
        className = 'yellow';
    }

    if (event.requestRule && !event.replaceRules) {
        if (event.requestRule.whitelistRule) {
            className = 'green';
            // eslint-disable-next-line max-len
        } else if (event.requestRule.cssRule || event.requestRule.scriptRule || event.removeParam) {
            className = 'yellow';
        } else if (event.requestRule.cookieRule) {
            if (event.requestRule.isModifyingCookieRule) {
                className = 'yellow';
            } else {
                className = 'red';
            }
        } else {
            className = 'red';
        }
    }

    return className;
};

const urlAccessor = (props) => {
    const {
        requestUrl,
        cookieName,
        cookieValue,
        element,
    } = props;

    if (cookieName) {
        return `${cookieName} = ${cookieValue}`;
    }

    if (element) {
        return element;
    }

    return requestUrl;
};

const typeAccessor = (props) => {
    const { requestType, requestThirdParty, requestRule } = props;

    let formattedRequestType;
    if (requestRule?.isModifyingCookieRule) {
        formattedRequestType = getRequestType(RequestTypes.COOKIE);
    } else {
        formattedRequestType = getRequestType(requestType);
    }

    if (requestThirdParty) {
        return (
            <>
                {formattedRequestType}
                <Icon
                    id="#chain"
                    title="Third party"
                    classname="icon--24 third-party__icon icon--green"
                />
            </>
        );
    }

    return formattedRequestType;
};

const ruleAccessor = (props) => {
    const { requestRule, replaceRules } = props;

    let ruleText = '';
    if (requestRule) {
        if (requestRule.filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
            ruleText = reactTranslator.getMessage('filtering_log_in_allowlist');
        } else {
            ruleText = requestRule.ruleText;
        }
    }

    if (replaceRules) {
        const rulesCount = replaceRules.length;
        ruleText = `${reactTranslator.getMessage('filtering_log_modified_rules')} ${rulesCount}`;
    }

    return ruleText;
};

const Row = observer(({ event, columns, onClick }) => {
    return (
        <tr
            id={event.eventId}
            onClick={onClick}
            className={getRowClassName(event)}
        >
            {
                columns.map((column) => {
                    const { accessor } = column;
                    let cellContent;
                    if (typeof accessor === 'string') {
                        cellContent = event[accessor];
                    } else {
                        cellContent = accessor(event);
                    }

                    return (
                        <td
                            key={column.id}
                        >
                            {cellContent}
                        </td>
                    );
                })
            }
        </tr>
    );
});

const FilteringEventsRows = observer(({ logStore, columns, handleRowClick }) => {
    return logStore.events.map((event) => {
        return (
            <Row
                key={event.eventId}
                event={event}
                columns={columns}
                onClick={handleRowClick}
            />
        );
    });
});

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const handleRowClick = useCallback((e) => {
        const { id } = e.currentTarget;
        logStore.setSelectedEventById(id);
    }, []);

    const columns = [
        {
            id: 'url',
            Header: 'URL',
            accessor: urlAccessor,
        },
        {
            id: 'type',
            Header: `${reactTranslator.getMessage('filtering_table_type')}`,
            accessor: typeAccessor,
        },
        {
            id: 'rule',
            Header: `${reactTranslator.getMessage('filtering_table_rule')}`,
            accessor: ruleAccessor,
        },
        {
            id: 'filter',
            Header: `${reactTranslator.getMessage('filtering_table_filter')}`,
            accessor: filterNameAccessor,
        },
        {
            id: 'source',
            Header: `${reactTranslator.getMessage('filtering_table_source')}`,
            accessor: 'frameDomain',
        },
    ];

    return (
        <div className="filtering-log">
            <table className="filtering-log__inner">
                <thead>
                    <tr>
                        {
                            columns.map((column) => (
                                <th key={column.id}>
                                    {column.Header}
                                </th>
                            ))
                        }
                    </tr>
                </thead>
                <tbody>
                    <FilteringEventsRows
                        logStore={logStore}
                        handleRowClick={handleRowClick}
                        columns={columns}
                    />
                </tbody>
            </table>
            <FilteringEventsEmpty />
        </div>
    );
});

export { FilteringEvents };
