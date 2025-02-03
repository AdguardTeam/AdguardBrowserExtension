import { vi } from 'vitest';

// TODO: Use 'tswebextension' alias to work with mv3 version. AG-37302
import type { EventChannelInterface } from '@adguard/tswebextension';

export class MockedEventCannel<T> implements EventChannelInterface<T> {
    dispatch = vi.fn();

    subscribe = vi.fn();

    unsubscribe = vi.fn();
}
