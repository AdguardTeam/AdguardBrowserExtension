// FIXME: Use 'tswebextension' alias to work with mv3 version.
import type { EventChannelInterface } from '@adguard/tswebextension';

export class MockedEventCannel<T> implements EventChannelInterface<T> {
    dispatch = jest.fn();

    subscribe = jest.fn();

    unsubscribe = jest.fn();
}
