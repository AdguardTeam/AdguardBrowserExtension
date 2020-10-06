/**
 * We collect here all workarounds and ugly hacks:)
 */
export const workaround = (function () {
    const WorkaroundUtils = {
        /**
         * Converts blocked counter to the badge text.
         * Workaround for FF - make 99 max.
         *
         * @param blocked Blocked requests count
         */
        getBlockedCountText(blocked) {
            let blockedText = blocked === '0' ? '' : blocked;
            if (blocked - 0 > 99) {
                blockedText = '\u221E';
            }

            return blockedText;
        },
    };

    return WorkaroundUtils;
})();
