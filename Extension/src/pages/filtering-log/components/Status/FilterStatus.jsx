import React from 'react';
import { Icon } from '../../../common/components/ui/Icon';
import './status.pcss';
import { StatusMode } from '../../filteringLogStatus';
import { reactTranslator } from '../../../../common/translators/reactTranslator';
import { colorMap, getItemClassName } from './statusStyles';

/**
 * @typedef {Object} StatusTitle
 * @property {string} PROCESSED
 * @property {string} BLOCKED
 * @property {string} MODIFIED
 * @property {string} UNBLOCKED
 */
const StatusTitle = {
    PROCESSED: 'filtering_log_filter_processed',
    BLOCKED: 'filtering_log_filter_blocked',
    MODIFIED: 'filtering_log_filter_modified',
    UNBLOCKED: 'filtering_log_filter_allowlisted',
};

const titleMap = {
    [StatusMode.REGULAR]: StatusTitle.PROCESSED,
    [StatusMode.MODIFIED]: StatusTitle.MODIFIED,
    [StatusMode.BLOCKED]: StatusTitle.BLOCKED,
    [StatusMode.ALLOWED]: StatusTitle.UNBLOCKED,
};

export const FilterStatus = ({ statusCode, method, mode }) => {
    const color = colorMap[mode];
    const title = reactTranslator.getMessage(titleMap[mode]);
    const itemClassNames = getItemClassName(color);
    const isBlocked = mode === StatusMode.BLOCKED;

    return (
        <div className="status">
            <div className={itemClassNames}>
                {title}
            </div>
            <div className={itemClassNames}>
                {isBlocked ? (
                    <Icon id="#ban" classname="status__icon" />
                ) : (
                    method && <Icon id={statusCode ? '#transfer-status' : '#arrow-status'} classname="status__icon" />
                )}
            </div>
        </div>
    );
};
