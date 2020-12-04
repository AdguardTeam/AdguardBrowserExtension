import React from 'react';

export const Icon = ({
    id,
    extraClassnames,
}) => {
    return (
        <svg className={`icon ${extraClassnames}`}>
            <use xlinkHref={id} />
        </svg>
    );
};
