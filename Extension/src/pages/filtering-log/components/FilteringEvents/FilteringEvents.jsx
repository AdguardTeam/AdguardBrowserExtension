/* eslint-disable react/jsx-props-no-spreading */
import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useTable } from 'react-table';
import { rootStore } from '../../stores/RootStore';

import './filtering-events.pcss';

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const handleEventClick = (row) => (e) => {
        e.preventDefault();
        logStore.setSelectedEventById(row.eventId);
    };

    const columns = useMemo(() => [
        {
            Header: 'URL',
            // TODO display elements, scripts
            accessor: (props) => {
                const { url, cookieName, cookieValue } = props;
                if (url) {
                    return url;
                }
                if (cookieName) {
                    return `${cookieName} = ${cookieValue}`;
                }
                return null;
            },
        },
        {
            Header: 'Type',
            accessor: 'type',
        },
        {
            Header: 'Filtering  rule',
            accessor: 'rule',
        },
        {
            Header: 'Filter',
            accessor: 'filter',
        },
        {
            Header: 'Source',
            accessor: 'source',
        },
    ], []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: logStore.events });

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
                            <tr {...row.getRowProps()} onClick={handleEventClick(row.original)}>
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
