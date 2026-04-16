/**
 * Copyright (c) 2015-2026 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    useCallback,
    useContext,
    useEffect,
    useState,
    useRef,
    forwardRef,
    type CSSProperties,
} from 'react';
import { observer } from 'mobx-react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { throttle } from 'lodash-es';
import cn from 'classnames';

import { type UIFilteringLogEvent } from '../../../../background/api';
import { rootStore } from '../../stores/RootStore';
import { getRequestEventType } from '../RequestWizard/utils';
import { translator } from '../../../../common/translators/translator';
import { AntiBannerFiltersId, SCROLLBAR_WIDTH } from '../../../../common/constants';
import { passiveEventSupported } from '../../../helpers';
import { filteringLogStorage } from '../../filtering-log-storage';
import { StatusMode, getStatusMode } from '../../filteringLogStatus';
import { Status } from '../Status';
import { useIsMobile } from '../../../common/hooks/useIsMobile';

import { FilteringEventsEmpty } from './FilteringEventsEmpty';
import { FilteringEventsRowsMobile } from './Mobile/FilteringEventsRowsMobile';
import { ITEM_HEIGHT_PX } from './Desktop/constants';

import './filtering-events.pcss';

/**
 * Returns filter name for the event.
 *
 * @param props Filtering log event.
 *
 * @returns Filter name string.
 */
const filterNameAccessor = (props: UIFilteringLogEvent): string => {
    const {
        requestRule,
        filterName,
        stealthActions,
    } = props;

    if (requestRule && requestRule.isStealthModeRule) {
        return translator.getMessage('filtering_log_privacy_applied_rules');
    }

    if (!filterName && stealthActions) {
        return translator.getMessage('filtering_log_privacy_applied_rules');
    }

    return props.filterName || '';
};

/**
 * CSS class names for row highlighting.
 */
enum RowClassName {
    Yellow = 'yellow',
    Red = 'red',
    Green = 'green',
    LightGreen = 'light-green',
}

/**
 * Maps status mode to row CSS class name.
 */
const rowClassNameMap = {
    [StatusMode.Regular]: null,
    [StatusMode.Modified]: RowClassName.Yellow,
    [StatusMode.Blocked]: RowClassName.Red,
    [StatusMode.Allowed]: RowClassName.LightGreen,
    [StatusMode.AllowedStealth]: RowClassName.Green,
};

/**
 * Returns CSS class name for event row based on status.
 *
 * @param event Filtering log event.
 *
 * @returns CSS class name or null.
 */
export const getRowClassName = (event: UIFilteringLogEvent): string | null => {
    const mode = getStatusMode(event);
    return rowClassNameMap[mode] ?? null;
};

/**
 * Returns display URL for the event (request URL, cookie, or element).
 *
 * @param props Filtering log event.
 *
 * @returns Display URL string.
 */
export const urlAccessor = (props: UIFilteringLogEvent): string | undefined => {
    const {
        requestUrl,
        cookieName,
        cookieValue,
        element,
    } = props;

    if (cookieName && cookieValue) {
        return `${cookieName} = ${cookieValue}`;
    }

    if (cookieName) {
        return `${cookieName}`;
    }

    if (element) {
        return element;
    }

    return requestUrl;
};

/**
 * Returns request type for the event.
 *
 * @param props Filtering log event.
 *
 * @returns Request type string.
 */
export const typeAccessor = (props: UIFilteringLogEvent): string => {
    return getRequestEventType(props);
};

/**
 * Returns rule text or rules information for the event.
 *
 * @param props Filtering log event.
 *
 * @returns Rule text or React node with rules.
 */
const ruleAccessor = (props: UIFilteringLogEvent): string | React.ReactNode => {
    const {
        requestRule,
        replaceRules,
        stealthAllowlistRules,
        declarativeRuleInfo,
    } = props;

    let ruleText = '';
    if (requestRule) {
        if (requestRule.filterId === AntiBannerFiltersId.AllowlistFilterId) {
            ruleText = translator.getMessage('filtering_log_in_allowlist');
        } else {
            ruleText = requestRule.appliedRuleText;
        }
    }

    if (replaceRules) {
        const rulesCount = replaceRules.length;
        ruleText = `${translator.getMessage('filtering_log_modified_rules', {
            rules_count: rulesCount,
        })}`;
    }

    if (stealthAllowlistRules && stealthAllowlistRules.length > 0) {
        const rulesCount = stealthAllowlistRules.length;
        if (rulesCount === 1) {
            return stealthAllowlistRules[0]?.appliedRuleText;
        }

        ruleText = translator.getMessage('filtering_log_stealth_rules', { rules_count: rulesCount });
    }

    // If this is a cosmetic rule - we should not check declarative source rules,
    // because they works only with network part.
    const isCosmeticRule = requestRule?.cssRule || requestRule?.scriptRule;
    if (isCosmeticRule) {
        return ruleText;
    }

    // If we have exact matched rule - show it.
    if (declarativeRuleInfo?.sourceRules?.length && declarativeRuleInfo.sourceRules.length > 0) {
        // But for allowlisted sited we do not needed to show source rule,
        // only show "this site is allowlisted".
        if (declarativeRuleInfo.sourceRules[0]?.filterId === AntiBannerFiltersId.AllowlistFilterId) {
            return translator.getMessage('filtering_log_in_allowlist');
        }

        const exactMatchedRules = declarativeRuleInfo.sourceRules
            .map(({ sourceRule }) => sourceRule)
            .join('; ');
        if (!ruleText) {
            return exactMatchedRules;
        }

        const { sourceRules } = declarativeRuleInfo;

        // Note: source rules contains text from already preprocessed rules,
        // that's why we checked appliedRuleText, but not originalRuleText.
        const matchedRulesContainsAssumed = sourceRules.some(({ sourceRule }) => sourceRule === ruleText);

        // If exactly matched rules do not contain assumed rule - we render
        // attention mark for this request.
        const attention = !matchedRulesContainsAssumed && (
            <span>❗</span>
        );

        return (
            <>
                {attention}
                {exactMatchedRules}
            </>
        );
    }

    // Otherwise show assumed (for MV3, but for MV2 it will be exact) rule,
    // if found any.
    const isAssumedRule = __IS_MV3__ && ruleText && !isCosmeticRule;

    return (
        <>
            {isAssumedRule && <span className="red-dot">*</span>}
            {ruleText}
        </>
    );
};

/**
 * Accessor wrapper for Status component.
 *
 * @param props Filtering log event.
 *
 * @returns Status React component.
 */
const statusAccessor = (props: UIFilteringLogEvent): React.ReactNode => {
    return <Status {...props} />;
};

/**
 * Column configuration for the table.
 */
type Column = {
    id: string;
    Header: string;
    accessor: keyof UIFilteringLogEvent | ((event: UIFilteringLogEvent) => React.ReactNode);
    getWidth: () => string;
    getResizerProps: () => {
        onMouseDown: (e: React.MouseEvent) => void;
        onTouchStart: (e: React.TouchEvent) => void;
    };
};

/**
 * Props for table row component.
 */
type RowProps = {
    index: number;
    event: UIFilteringLogEvent;
    columns: Column[];
    onClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
    style: React.CSSProperties;
};

/**
 * Table row component for filtering log event.
 *
 * @param props Row props.
 *
 * @returns Table row component.
 */
const Row = observer(({
    index,
    event,
    columns,
    onClick,
    style,
}: RowProps) => {
    const { logStore } = useContext(rootStore);

    const className = cn(
        'tr tr--tbody',
        { 'tr--active': event.eventId === logStore.selectedEvent?.eventId },
        getRowClassName(event),
    );

    return (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
        <div
            role="row"
            style={{
                ...style,
                top: `${parseFloat(String(style.top ?? 0)) + ITEM_HEIGHT_PX}px`,
            }}
            id={event.eventId}
            onClick={onClick}
            className={className}
            // Set row index explicitly for screen readers, because table
            // is virtualized and not all of the rows are rendered at the same time.
            // Add 2 to index to include the header row and make it 1-based index.
            aria-rowindex={index + 2}
        >
            {
                columns.map((column) => {
                    const { accessor } = column;
                    let cellContent: React.ReactNode;
                    if (typeof accessor === 'function') {
                        cellContent = accessor(event);
                    } else {
                        cellContent = event[accessor];
                    }

                    return (
                        <div
                            role="cell"
                            className="td"
                            key={column.id}
                            style={{ width: column.getWidth() }}
                        >
                            {cellContent}
                        </div>
                    );
                })
            }
            {/* This cell is available only for screen readers to notify
                users that they can open details of this log with keyboard. */}
            <div role="cell" className="sr-only">
                <button type="button" onClick={onClick}>
                    {translator.getMessage('filtering_table_open_details')}
                </button>
            </div>
        </div>
    );
});

/**
 * Virtualized row wrapper component.
 *
 * @param props List child component props from react-window.
 * @param props.index Row index.
 * @param props.style Row style.
 * @param props.data Row data containing events, columns, and handleRowClick.
 *
 * @returns Virtualized row component.
 */
const VirtualizedRow = ({
    index,
    style,
    data,
}: ListChildComponentProps) => {
    const { events, columns, handleRowClick } = data;
    const event = events[index];

    return (
        <Row
            index={index}
            event={event}
            columns={columns}
            onClick={handleRowClick}
            style={style}
        />
    );
};

/**
 * Context type for columns configuration.
 */
type ColumnsContextType = {
    columns: Column[];
    isLogEventsEmpty: boolean;
};

const ColumnsContext = React.createContext<ColumnsContextType>({
    columns: [],
    isLogEventsEmpty: true,
});

const ColumnsProvider = ColumnsContext.Provider;

/**
 * Table header component with column headers and resizers.
 *
 * @param props Table header props.
 * @param props.style CSS properties for header positioning.
 *
 * @returns Table header component.
 */
const TableHeader = ({ style }: {
    style: CSSProperties;
}) => {
    const { columns, isLogEventsEmpty } = useContext(ColumnsContext);

    /**
     * WAI ARIA attributes are hidden if the table is empty, this needed
     * to properly announce FilteringEventsEmpty component, otherwise
     * screen readers will ignore this block.
     */
    return (
        <div
            role="row"
            className="thead"
            style={style}
            aria-hidden={isLogEventsEmpty}
            // Set row index explicitly for screen readers, because table
            // is virtualized and not all of the rows are rendered at the same time.
            // Header row is always first row in the table (1-based index).
            aria-rowindex={isLogEventsEmpty ? undefined : 1}
        >
            <div className="tr">
                {
                    columns.map((column) => (
                        <div
                            role="columnheader"
                            className="th"
                            key={column.id}
                            style={{ width: column.getWidth() }}
                        >
                            {column.Header}
                            <div
                                aria-hidden="true"
                                className="resizer"
                                key={column.id}
                                style={{ cursor: 'col-resize' }}
                                {...column.getResizerProps()}
                            />
                        </div>
                    ))
                }
                {/* This column is available only for screen readers to notify
                    users that they can open details of this log with keyboard. */}
                <div role="columnheader" className="sr-only">
                    {translator.getMessage('filtering_table_action')}
                </div>
            </div>
        </div>
    );
};

/**
 * Inner wrapper for virtualized table with header.
 */
const TableInnerWrapper = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    (props, ref) => {
        const { children, ...rest } = props;
        return (
            <div ref={ref} {...rest}>
                <TableHeader
                    style={{
                        top: 0, left: 0, width: '100%', height: ITEM_HEIGHT_PX,
                    }}
                />

                {children}
            </div>
        );
    },
);

/**
 * Props for FilteringEventsRows component.
 */
type FilteringEventsRowsProps = {
    events: UIFilteringLogEvent[];
    columns: Column[];
    handleRowClick: (e: React.MouseEvent | React.KeyboardEvent) => void;
};

/**
 * Desktop virtualized table of filtering log events.
 *
 * @param props Component props.
 *
 * @returns Virtualized events table.
 */
const FilteringEventsRows = observer(({
    events,
    columns,
    handleRowClick,
}: FilteringEventsRowsProps) => {
    const isLogEventsEmpty = events.length === 0;

    return (
        /**
         * FixedSizeList does not support passing props to innerElementType component.
         * We use React Context API to bypass this limitation.
         *
         * @see {@link https://github.com/bvaughn/react-window/issues/404}
         */
        <ColumnsProvider value={{ columns, isLogEventsEmpty }}>
            <AutoSizer>
                {({
                    height,
                    width,
                }) => {
                    return (
                        <FixedSizeList
                            className="list"
                            height={height || 0}
                            width={width || 0}
                            itemCount={events.length}
                            itemData={{
                                events,
                                columns,
                                handleRowClick,
                            }}
                            innerElementType={TableInnerWrapper}
                            itemSize={ITEM_HEIGHT_PX}
                        >
                            {VirtualizedRow}
                        </FixedSizeList>
                    );
                }}
            </AutoSizer>
        </ColumnsProvider>
    );
});

/**
 * Default width for table columns in pixels.
 */
const DEFAULT_COLUMN_WIDTH_PX = 200;

/**
 * Minimum width for table columns in pixels.
 */
const MIN_COLUMN_WIDTH_PX = 50;

/**
 * Column render data with width in pixels.
 */
type ColumnRenderData = {
    width: number;
};

/**
 * Map of column IDs to their render data.
 */
type ColumnsRenderData = Record<string, ColumnRenderData>;

/**
 * Main filtering events component with table or mobile view.
 *
 * @returns Filtering events component.
 */
const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const isLogEventsEmpty = logStore.events.length === 0;

    const tableRef = useRef(null);

    const handleRowClick = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
        const { id } = e.currentTarget;
        logStore.handleSelectEvent(id);
    }, [logStore]);

    const columnsData: Omit<Column, 'getWidth' | 'getResizerProps'>[] = [
        {
            id: 'status',
            Header: `${translator.getMessage('filtering_table_status')}`,
            accessor: statusAccessor,
        },
        {
            id: 'url',
            Header: 'URL',
            accessor: urlAccessor,
        },
        {
            id: 'type',
            Header: `${translator.getMessage('filtering_table_type')}`,
            accessor: typeAccessor,
        },
        {
            id: 'rule',
            Header: `${translator.getMessage('filtering_table_rule')}`,
            accessor: ruleAccessor,
        },
        {
            id: 'filter',
            Header: `${translator.getMessage('filtering_table_filter')}`,
            accessor: filterNameAccessor,
        },
        {
            id: 'source',
            Header: `${translator.getMessage('filtering_table_source')}`,
            accessor: 'frameDomain',
        },
    ];

    const [columnsRenderData, setColumnsRenderData] = useState<ColumnsRenderData>(
        filteringLogStorage.getItem(filteringLogStorage.KEYS.COLUMNS_DATA),
    );

    useEffect(() => {
        filteringLogStorage.setItem(filteringLogStorage.KEYS.COLUMNS_DATA, columnsRenderData);
    }, [columnsRenderData]);

    let startClientX: number | null = null;

    const dispatchMove = throttle((clientX: number, columnId: string) => {
        if (!startClientX) {
            return;
        }

        let columnWidth = columnsRenderData[columnId]?.width;

        if (!columnWidth) {
            columnWidth = DEFAULT_COLUMN_WIDTH_PX;
        }

        const deltaX = startClientX - clientX;

        const newColumnWidth = columnWidth - deltaX;

        if (newColumnWidth < MIN_COLUMN_WIDTH_PX) {
            return;
        }

        setColumnsRenderData({
            ...columnsRenderData,
            [columnId]: {
                ...columnsRenderData[columnId],
                width: newColumnWidth,
            },
        });
    }, 20);

    const dispatchMovingStarted = (clientX: number) => {
        startClientX = clientX;
        // fixes cursor blinking and text selection
        document.body.classList.add('col-resize');
    };

    const dispatchEnd = () => {
        startClientX = null;
        // clear after dragging end
        document.body.classList.remove('col-resize');
    };

    const onResizeStart = (e: React.MouseEvent | React.TouchEvent, columnId: string) => {
        let isTouchEvent = false;
        let clientX: number;

        if ('touches' in e) {
            // lets not respond to multiple touches (e.g. 2 or 3 fingers)
            if (e.touches.length > 1) {
                return;
            }

            isTouchEvent = true;
            const touch = e.touches[0];
            if (!touch) {
                return;
            }

            clientX = Math.round(touch.clientX);
        } else {
            clientX = e.clientX;
        }

        const handlersAndEvents = {
            mouse: {
                moveEvent: 'mousemove',
                // eslint-disable-next-line no-shadow
                moveHandler: (e: Event) => {
                    if (e instanceof MouseEvent) {
                        dispatchMove(e.clientX, columnId);
                    }
                },
                upEvent: 'mouseup',
                upHandler: () => {
                    document.removeEventListener(
                        'mousemove',
                        handlersAndEvents.mouse.moveHandler,
                    );
                    document.removeEventListener(
                        'mouseup',
                        handlersAndEvents.mouse.upHandler,
                    );
                    dispatchEnd();
                },
            },
            touch: {
                moveEvent: 'touchmove',
                // eslint-disable-next-line no-shadow
                moveHandler: (e: Event) => {
                    if (!(e instanceof TouchEvent)) {
                        return false;
                    }
                    const touch = e.touches[0];
                    if (!touch) {
                        return false;
                    }
                    if (e.cancelable) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    dispatchMove(touch.clientX, columnId);
                    return false;
                },
                upEvent: 'touchend',
                upHandler: () => {
                    document.removeEventListener(
                        handlersAndEvents.touch.moveEvent,
                        handlersAndEvents.touch.moveHandler,
                    );
                    document.removeEventListener(
                        handlersAndEvents.touch.upEvent,
                        handlersAndEvents.touch.upHandler,
                    );
                    dispatchEnd();
                },
            },
        };

        const events = isTouchEvent
            ? handlersAndEvents.touch
            : handlersAndEvents.mouse;
        const passiveIfSupported = passiveEventSupported()
            ? { passive: false }
            : false;
        document.addEventListener(
            events.moveEvent,
            events.moveHandler,
            passiveIfSupported,
        );
        document.addEventListener(
            events.upEvent,
            events.upHandler,
            passiveIfSupported,
        );

        dispatchMovingStarted(clientX);
    };

    const getResizerProps = (columnId: string) => {
        return {
            onMouseDown: (e: React.MouseEvent) => onResizeStart(e, columnId),
            onTouchStart: (e: React.TouchEvent) => onResizeStart(e, columnId),
        };
    };

    const addMethods = (columns: Omit<Column, 'getWidth' | 'getResizerProps'>[]): Column[] => {
        return columns.map((column) => {
            return {
                ...column,
                getWidth: () => {
                    const width = columnsRenderData[column.id]?.width ?? DEFAULT_COLUMN_WIDTH_PX;
                    return `${width}px`;
                },
                getResizerProps: () => {
                    return getResizerProps(column.id);
                },
            };
        });
    };

    const minTableWidth = Object.values(columnsRenderData)
        .reduce((acc, { width }) => acc + width + SCROLLBAR_WIDTH, 0);

    const columns = addMethods(columnsData);

    const isMobile = useIsMobile();

    const { events } = logStore;

    /**
     * WAI ARIA attributes are hidden if the table is empty, this needed
     * to properly announce FilteringEventsEmpty component, otherwise
     * screen readers will ignore this block.
     */
    return (
        <div
            role={isLogEventsEmpty ? undefined : 'table'}
            className="filtering-log"
            aria-label={isLogEventsEmpty ? undefined : translator.getMessage('filtering_log_title')}
            // Set number of rows explicitly for screen readers, because table
            // is virtualized and not all of the rows are rendered at the same time.
            // Add 1 to the number of rows to include the header row.
            aria-rowcount={isLogEventsEmpty ? undefined : events.length + 1}
        >
            <div
                style={{ minWidth: `${minTableWidth}px` }}
                className="table filtering-log__inner"
                ref={tableRef}
            >
                <div className="tbody" style={{ height: '100%' }}>
                    {isMobile
                        ? <FilteringEventsRowsMobile handleRowClick={handleRowClick} />
                        : (
                            <FilteringEventsRows
                                events={events}
                                handleRowClick={handleRowClick}
                                columns={columns}
                            />
                        )}
                    <FilteringEventsEmpty />
                </div>
            </div>
        </div>
    );
});

export { FilteringEvents };
