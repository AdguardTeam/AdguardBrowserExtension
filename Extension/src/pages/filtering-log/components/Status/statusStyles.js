import { StatusMode } from '../../filteringLogStatus';

/**
 * @typedef {Object} StatusColor
 * @property {string} GRAY
 * @property {string} ORANGE
 * @property {string} RED
 * @property {string} GREEN
 */
export const StatusColor = {
    GRAY: 'gray',
    ORANGE: 'orange',
    RED: 'red',
    GREEN: 'green',
};

export const colorMap = {
    [StatusMode.REGULAR]: StatusColor.GRAY,
    [StatusMode.MODIFIED]: StatusColor.ORANGE,
    [StatusMode.BLOCKED]: StatusColor.RED,
    [StatusMode.ALLOWED]: StatusColor.GREEN,
};

export const getItemClassName = (color) => {
    return color
        ? `status__item status__item--${color}`
        : 'status__item';
};

export const getBadgeClassNames = (color) => {
    return color
        ? `status__badge status__badge--${color}`
        : 'status__badge';
};
