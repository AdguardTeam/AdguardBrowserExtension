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

import React, { type ReactNode, type AriaAttributes } from 'react';

import cn from 'classnames';

type SvgParams = Pick<AriaAttributes, 'aria-hidden'> & {
    /**
     * SVG id.
     */
    id: string;

    /**
     * SVG class name.
     */
    className: string;

    /**
     * SVG title.
     */
    title?: string;
};

const Svg = ({
    id,
    className,
    title,
    'aria-hidden': ariaHidden,
}: SvgParams) => (
    <svg className={className} aria-hidden={ariaHidden}>
        {title && <title>{title}</title>}
        <use xlinkHref={id} />
    </svg>
);

type AnimatedWrapperParams = Pick<AriaAttributes, 'aria-hidden'> & {
    /**
     * Wrapper children.
     */
    children: ReactNode;

    /**
     * Wrapper class name.
     */
    className: string;
};

/**
 * Wrapper removes animation stuttering and makes icon resetting on animation end smooth
 */
const AnimatedWrapper = ({
    children,
    className,
    'aria-hidden': ariaHidden,
}: AnimatedWrapperParams) => (
    <div className={className} aria-hidden={ariaHidden}>
        {children}
    </div>
);

type IconParams = Pick<AriaAttributes, 'aria-hidden'> & {
    /**
     * Icon id.
     */
    id: string;

    /**
     * Icon class name.
     */
    className?: string;

    /**
     * Icon title.
     */
    title?: string;

    /**
     * Animation condition.
     */
    animationCondition?: boolean;

    /**
     * Animation class name.
     */
    animationClassName?: string;
};

export const Icon = ({
    id,
    className,
    title,
    animationCondition,
    animationClassName,
    'aria-hidden': ariaHidden,
}: IconParams) => {
    const iconClassname = cn('icon', className);

    const icon = (
        <Svg
            id={id}
            className={iconClassname}
            title={title}
            aria-hidden={ariaHidden}
        />
    );

    if (animationCondition && animationClassName) {
        return (
            <AnimatedWrapper className={animationClassName} aria-hidden={ariaHidden}>
                {icon}
            </AnimatedWrapper>
        );
    }

    return icon;
};
