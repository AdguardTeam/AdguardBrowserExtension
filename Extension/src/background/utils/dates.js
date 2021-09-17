/**
 * Util class for dates
 */
export const dates = (function () {
    const DateUtils = {
        isSameHour(a, b) {
            return (
                this.isSameDay(a, b)
                && a.getHours() === b.getHours()
            );
        },
        isSameDay(a, b) {
            return (
                this.isSameMonth(a, b)
                && a.getDate() === b.getDate()
            );
        },
        isSameMonth(a, b) {
            if (!a || !b) {
                return false;
            }

            return (
                a.getYear() === b.getYear()
                && a.getMonth() === b.getMonth()
            );
        },
        getDifferenceInHours(a, b) {
            return (a.getTime() - b.getTime()) / 1000 / 60 / 60;
        },
        getDifferenceInDays(a, b) {
            return this.getDifferenceInHours(a, b) / 24;
        },
        getDifferenceInMonths(a, b) {
            return this.getDifferenceInDays(a, b) / 30;
        },
    };

    return DateUtils;
})();
