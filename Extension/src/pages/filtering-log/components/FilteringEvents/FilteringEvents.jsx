/* eslint-disable react/jsx-props-no-spreading */
import React, { useCallback, useContext } from 'react';
import { observer } from 'mobx-react';
import cn from 'classnames';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { rootStore } from '../../stores/RootStore';
import { getRequestType } from '../RequestWizard/utils';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';
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

    if (event.cspReportBlocked) {
        className = 'red';
        return className;
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
    const formattedRequestType = getRequestType(props);

    if (props.requestThirdParty) {
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

const Row = observer(({
    event, columns, onClick, style,
}) => {
    return (
        <div
            style={style}
            id={event.eventId}
            onClick={onClick}
            className={cn('tr', getRowClassName(event))}
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
                        <div
                            className="td"
                            key={column.id}
                        >
                            {cellContent}
                        </div>
                    );
                })
            }
        </div>
    );
});

const ITEM_SIZE = 30;
const FilteringEventsRows = observer(({ logStore, columns, handleRowClick }) => {
    const { events } = logStore;
    return (
        <AutoSizer>
            {({ height, width }) => {
                return (
                    <FixedSizeList
                        className="list"
                        height={height}
                        itemCount={events.length}
                        itemData={events}
                        itemSize={ITEM_SIZE}
                        width={width}
                    >
                        {({ index, style, data }) => (
                            <Row
                                event={data[index]}
                                columns={columns}
                                onClick={handleRowClick}
                                style={style}
                            />
                        )}
                    </FixedSizeList>
                );
            }}
        </AutoSizer>
    );
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
            <div className="table filtering-log__inner">
                <div className="thead">
                    <div className="tr">
                        {
                            columns.map((column) => (
                                <div className="th" key={column.id}>
                                    {column.Header}
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className="tbody" style={{ height: '100%' }}>
                    <FilteringEventsRows
                        logStore={logStore}
                        handleRowClick={handleRowClick}
                        columns={columns}
                    />
                </div>
            </div>
            <FilteringEventsEmpty />
        </div>
    );
});

export { FilteringEvents };
