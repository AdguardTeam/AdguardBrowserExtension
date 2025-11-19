/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
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
} from 'react';
import { observer } from 'mobx-react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { throttle } from 'lodash-es';
import cn from 'classnames';

import { rootStore } from '../../stores/RootStore';
import { getRequestEventType } from '../RequestWizard/utils';
import { translator } from '../../../../common/translators/translator';
import { AntiBannerFiltersId, SCROLLBAR_WIDTH } from '../../../../common/constants';
import { passiveEventSupported } from '../../../helpers';
import { optionsStorage } from '../../../options/options-storage';
import { StatusMode, getStatusMode } from '../../filteringLogStatus';
import { Status } from '../Status';

import { FilteringEventsEmpty } from './FilteringEventsEmpty';

import './filtering-events.pcss';

const ITEM_HEIGHT_PX = 30;

const filterNameAccessor = (props) => {
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

    return props.filterName;
};

/**
 * @typedef {object} RowClassName
 * @property {string} YELLOW
 * @property {string} RED
 * @property {string} GREEN
 * @property {string} LIGHT_GREEN
 */
const RowClassName = {
    YELLOW: 'yellow',
    RED: 'red',
    GREEN: 'green',
    LIGHT_GREEN: 'light-green',
};

const rowClassNameMap = {
    [StatusMode.REGULAR]: null,
    [StatusMode.MODIFIED]: RowClassName.YELLOW,
    [StatusMode.BLOCKED]: RowClassName.RED,
    [StatusMode.ALLOWED]: RowClassName.LIGHT_GREEN,
    [StatusMode.ALLOWED_STEALTH]: RowClassName.GREEN,
};

const getRowClassName = (event) => {
    const mode = getStatusMode(event);
    return rowClassNameMap[mode];
};

const urlAccessor = (props) => {
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

const typeAccessor = (props) => {
    return getRequestEventType(props);
};

const ruleAccessor = (props) => {
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
            return stealthAllowlistRules[0].appliedRuleText;
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
    if (declarativeRuleInfo?.sourceRules.length > 0) {
        // But for allowlisted sited we do not needed to show source rule,
        // only show "this site is allowlisted".
        if (declarativeRuleInfo.sourceRules[0].filterId === AntiBannerFiltersId.AllowlistFilterId) {
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

const statusAccessor = (props) => {
    return (
        <Status {...props} />
    );
};

const Row = observer(({
    index,
    event,
    columns,
    onClick,
    style,
}) => {
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
                top: `${parseFloat(style.top) + ITEM_HEIGHT_PX}px`,
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
                    let cellContent;
                    if (typeof accessor === 'string') {
                        cellContent = event[accessor];
                    } else {
                        cellContent = accessor(event);
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

const VirtualizedRow = ({
    index,
    style,
    data,
}) => {
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

const ColumnsContext = React.createContext({});

const ColumnsProvider = ColumnsContext.Provider;

const TableHeader = ({ style }) => {
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

const TableInnerWrapper = forwardRef(({ children, ...rest }, ref) => {
    return (
        <div ref={ref} {...rest}>
            <TableHeader
                index={0}
                key={0}
                style={{
                    top: 0, left: 0, width: '100%', height: 30,
                }}
            />

            {children}
        </div>
    );
});

const FilteringEventsRows = observer(({
    logStore,
    columns,
    handleRowClick,
}) => {
    const { events } = logStore;
    const isLogEventsEmpty = logStore.events.length === 0;

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
                }) => {
                    return (
                        <FixedSizeList
                            className="list"
                            height={height}
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

const DEFAULT_COLUMN_WIDTH = 200;
const MIN_COLUMN_WIDTH = 50;

const FilteringEvents = observer(() => {
    const { logStore } = useContext(rootStore);

    const isLogEventsEmpty = logStore.events.length === 0;

    const tableRef = useRef(null);

    const handleRowClick = useCallback((e) => {
        const { id } = e.currentTarget;
        logStore.handleSelectEvent(id);
    }, [logStore]);

    const columnsData = [
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

    const [columnsRenderData, setColumnsRenderData] = useState(
        optionsStorage.getItem(optionsStorage.KEYS.COLUMNS_DATA),
    );

    useEffect(() => {
        optionsStorage.setItem(optionsStorage.KEYS.COLUMNS_DATA, columnsRenderData);
    }, [columnsRenderData]);

    let startClientX = null;

    const dispatchMove = throttle((clientX, columnId) => {
        if (!startClientX) {
            return;
        }

        let columnWidth = columnsRenderData[columnId]?.width;

        if (!columnWidth) {
            columnWidth = DEFAULT_COLUMN_WIDTH;
        }

        const deltaX = startClientX - clientX;

        const newColumnWidth = columnWidth - deltaX;

        if (newColumnWidth < MIN_COLUMN_WIDTH) {
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

    const dispatchMovingStarted = (clientX) => {
        startClientX = clientX;
        // fixes cursor blinking and text selection
        document.body.classList.add('col-resize');
    };

    const dispatchEnd = () => {
        startClientX = null;
        // clear after dragging end
        document.body.classList.remove('col-resize');
    };

    const onResizeStart = (e, columnId) => {
        let isTouchEvent = false;
        if (e.type === 'touchstart') {
            // lets not respond to multiple touches (e.g. 2 or 3 fingers)
            if (e.touches && e.touches.length > 1) {
                return;
            }
            isTouchEvent = true;
        }

        const clientX = isTouchEvent ? Math.round(e.touches[0].clientX) : e.clientX;

        const handlersAndEvents = {
            mouse: {
                moveEvent: 'mousemove',
                // eslint-disable-next-line no-shadow
                moveHandler: (e) => dispatchMove(e.clientX, columnId),
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
                moveHandler: (e) => {
                    if (e.cancelable) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    dispatchMove(e.touches[0].clientX, columnId);
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
                        handlersAndEvents.touch.moveHandler,
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

    const getResizerProps = (columnId) => {
        return {
            onMouseDown: (e) => onResizeStart(e, columnId),
            onTouchStart: (e) => onResizeStart(e, columnId),
        };
    };

    const addMethods = (columns) => {
        return columns.map((column) => {
            return {
                ...column,
                getWidth: () => {
                    return `${columnsRenderData[column.id].width}px`;
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
            aria-rowcount={isLogEventsEmpty ? undefined : logStore.events.length + 1}
        >
            <div
                style={{ minWidth: `${minTableWidth}px` }}
                className="table filtering-log__inner"
                ref={tableRef}
            >
                <div className="tbody" style={{ height: '100%' }}>
                    <FilteringEventsRows
                        logStore={logStore}
                        handleRowClick={handleRowClick}
                        columns={columns}
                    />
                    <FilteringEventsEmpty />
                </div>
            </div>
        </div>
    );
});

export { FilteringEvents };
