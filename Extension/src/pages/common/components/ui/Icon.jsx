/**
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

import React from 'react';

import cn from 'classnames';

const Svg = ({
    id,
    classname,
    title,
}) => (
    <svg className={classname}>
        {title && <title>{title}</title>}
        <use xlinkHref={id} />
    </svg>
);

/**
 * Wrapper removes animation stuttering and makes icon resetting on animation end smooth
 */
const AnimatedWrapper = ({ children, className }) => <div className={className}>{children}</div>;

export const Icon = ({
    id,
    classname,
    title,
    animationCondition,
    animationClassname,
}) => {
    const iconClassname = cn('icon', classname);

    const icon = <Svg id={id} classname={iconClassname} title={title} />;

    return animationCondition && animationClassname ? (
        <AnimatedWrapper className={animationClassname}>
            {icon}
        </AnimatedWrapper>
    ) : icon;
};
