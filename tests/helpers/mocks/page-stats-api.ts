import { vi } from 'vitest';

export class PageStatsApi {
    init = vi.fn();

    static getTotalBlocked = vi.fn();

    incrementTotalBlocked = vi.fn();

    reset = vi.fn();

    updateStats = vi.fn();

    getStatisticsData = vi.fn();

    getGroups = vi.fn();
}
