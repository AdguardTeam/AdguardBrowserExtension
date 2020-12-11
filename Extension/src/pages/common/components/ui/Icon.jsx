import React from 'react';
import cn from 'classnames';

export const Icon = ({
    id,
    classname,
}) => {
    const iconClassname = cn('icon', classname);
    return <svg className={iconClassname}>
        <use xlinkHref={id} />
    </svg>;
};
