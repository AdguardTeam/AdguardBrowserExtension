import { vi } from 'vitest';

// EventChannelInterface is compatible with both MV2 and MV3
import { type EventChannelInterface } from '@adguard/tswebextension';

export class MockedEventCannel<T> implements EventChannelInterface<T> {
    dispatch = vi.fn();

    subscribe = vi.fn();

    unsubscribe = vi.fn();
}
