/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useTable } from 'react-table';
import { rootStore } from '../../stores/RootStore';

import { getRequestType } from '../RequestWizard/utils';
import { reactTranslator } from '../../../reactCommon/reactTranslator';
import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';

import './filtering-events.pcss';

const Messages = {
    OPTIONS_USERFILTER: reactTranslator.translate('options_userfilter'),
    OPTIONS_WHITELIST: reactTranslator.translate('options_whitelist'),
    IN_ALLOWLIST: reactTranslator.translate('filtering_log_in_whitelist'),
};

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const handleEventClick = (row) => (e) => {
        e.preventDefault();
        logStore.setSelectedEventById(row.eventId);
    };

    // FIXME display element escaped, waits when css hits counter would be fixed
    const columns = useMemo(() => [
        {
            Header: 'URL',
            accessor: (props) => {
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
            },
        },
        {
            Header: `${reactTranslator.translate('filtering_table_type')}`,
            accessor: (props) => {
                const { requestType, requestThirdParty } = props;

                const formattedRequestType = getRequestType(requestType);

                if (requestThirdParty) {
                    return (
                        <>
                            {formattedRequestType}
                            <svg className="icon--24 third-party__icon icon--green">
                                <use xlinkHref="#chain" />
                            </svg>
                            <span className="third-party__label">Third party</span>
                        </>
                    );
                }

                return formattedRequestType;
            },
        },
        {
            Header: `${reactTranslator.translate('filtering_table_rule')}`,
            accessor: (props) => {
                const { requestRule, replaceRules } = props;

                let ruleText = '';
                if (requestRule) {
                    if (requestRule.filterId === ANTIBANNER_FILTERS_ID.ALLOWLIST_FILTER_ID) {
                        ruleText = Messages.IN_ALLOWLIST;
                    } else {
                        ruleText = requestRule.ruleText;
                    }
                }

                if (replaceRules) {
                    const rulesCount = replaceRules.length;
                    ruleText = `${reactTranslator.translate('filtering_log_modified_rules')} ${rulesCount}`;
                }
                return ruleText;
            },
        },
        {
            Header: `${reactTranslator.translate('filtering_table_filter')}`,
            accessor: 'filterName',
        },
        {
            Header: `${reactTranslator.translate('filtering_table_source')}`,
            accessor: 'frameDomain',
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: logStore.events });

    const getRowProps = (row) => {
        const event = row.original;

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

        return ({
            className,
        });
    };

    return (
        <table {...getTableProps()} className="filtering-log">
            <thead>
                {
                    headerGroups.map((headerGroup) => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {
                                headerGroup.headers.map((column) => (
                                    <th {...column.getHeaderProps()}>
                                        {
                                            column.render('Header')
                                        }
                                    </th>
                                ))
                            }
                        </tr>
                    ))
                }
            </thead>
            <tbody {...getTableBodyProps()}>
                {
                    rows.map((row) => {
                        prepareRow(row);
                        return (
                            <tr
                                {...row.getRowProps(getRowProps(row))}
                                onClick={handleEventClick(row.original)}
                            >
                                {
                                    row.cells.map((cell) => {
                                        return (
                                            <td {...cell.getCellProps()}>
                                                {
                                                    cell.render('Cell')
                                                }
                                            </td>
                                        );
                                    })
                                }
                            </tr>
                        );
                    })
                }
            </tbody>
        </table>
    );
});

export { FilteringEvents };
