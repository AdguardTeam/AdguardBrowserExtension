import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';
import { useTable } from 'react-table';
import { rootStore } from '../../stores/RootStore';

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const { events } = logStore;

    const columns = useMemo(() => [
        {
            Header: 'URL',
            accessor: 'url',
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

    // FIXME figure out why this is not working
    // const data = useMemo(() => events, []);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data: events });

    return (
        // apply the table props
        <table {...getTableProps()}>
            <thead>
                {// Loop over the header rows
                    headerGroups.map((headerGroup) => (
                        // Apply the header row props
                        <tr {...headerGroup.getHeaderGroupProps()}>
                            {// Loop over the headers in each row
                                headerGroup.headers.map((column) => (
                                // Apply the header cell props
                                    <th {...column.getHeaderProps()}>
                                        {// Render the header
                                            column.render('Header')
                                        }
                                    </th>
                                ))
                            }
                        </tr>
                    ))
                }
            </thead>
            {/* Apply the table body props */}
            <tbody {...getTableBodyProps()}>
                {// Loop over the table rows
                    rows.map((row) => {
                    // Prepare the row for display
                        prepareRow(row);
                        return (
                        // Apply the row props
                            <tr {...row.getRowProps()}>
                                {// Loop over the rows cells
                                    row.cells.map((cell) => {
                                    // Apply the cell props
                                        return (
                                            <td {...cell.getCellProps()}>
                                                {// Render the cell contents
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
