/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useTable } from 'react-table';

import { rootStore } from '../../stores/RootStore';
import { getRequestType } from '../RequestWizard/utils';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { ANTIBANNER_FILTERS_ID } from '../../../../common/constants';
import { Icon } from '../../../common/components/ui/Icon';

import './filtering-events.pcss';

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const refreshPage = async (e) => {
        e.preventDefault();
        await logStore.refreshPage();
    };

    // TODO display element escaped, waits when css hits counter would be fixed
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
            Header: `${reactTranslator.getMessage('filtering_table_type')}`,
            accessor: (props) => {
                const { requestType, requestThirdParty } = props;

                const formattedRequestType = getRequestType(requestType);

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
            },
        },
        {
            Header: `${reactTranslator.getMessage('filtering_table_rule')}`,
            accessor: (props) => {
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
            },
        },
        {
            Header: `${reactTranslator.getMessage('filtering_table_filter')}`,
            accessor: 'filterName',
        },
        {
            Header: `${reactTranslator.getMessage('filtering_table_source')}`,
            accessor: 'frameDomain',
        },
    ], []);

    const data = useMemo(() => logStore.events, [logStore.events]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({
        columns,
        data,
        getRowId: (row) => row.eventId,
    });

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
            onClick: () => {
                logStore.setSelectedEventById(event.eventId);
            },
        });
    };

    return (
        <div className="filtering-log">
            <table {...getTableProps()} className="filtering-log__inner">
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
            {rows.length <= 0 && (
                <div className="filtering-log__empty">
                    <div className="filtering-log__empty-in">
                        <Icon id="#magnifying" classname="filtering-log__empty-img" />
                        <div className="filtering-log__desc">
                            {reactTranslator.getMessage('filtering_table_empty_reload_page_desc', {
                                a: (chunks) => (
                                    <button
                                        className="filtering-log__refresh"
                                        type="button"
                                        onClick={refreshPage}
                                    >
                                        {chunks}
                                    </button>
                                ),
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

export { FilteringEvents };
