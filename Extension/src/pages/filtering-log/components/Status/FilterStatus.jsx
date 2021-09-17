import React from 'react';
import { Icon } from '../../../common/components/ui/Icon';
import './status.pcss';
import { StatusMode } from '../../filteringLogStatus';
import { getStatusTitle } from './statusTitles';
import { colorMap, getItemClassName } from './statusStyles';

export const FilterStatus = ({ statusCode, method, mode }) => {
    const title = getStatusTitle(mode);
    const color = colorMap[mode];
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
