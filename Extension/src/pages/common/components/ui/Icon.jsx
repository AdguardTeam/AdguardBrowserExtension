import React from 'react';
import cn from 'classnames';

export const Icon = ({
    id,
    classname,
    title,
}) => {
    const iconClassname = cn('icon', classname);
    return (
        <svg className={iconClassname}>
            {title && <title>{title}</title>}
            <use xlinkHref={id} />
        </svg>
    );
};
