import React from 'react';
import cn from 'classnames';

export const Icon = ({
    id,
    className,
}) => {
    return (
        <svg className={cn('icon', className)}>
            <use xlinkHref={id} />
        </svg>
    );
};
