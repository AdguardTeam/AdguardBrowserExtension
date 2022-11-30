import browser from 'webextension-polyfill';
import {
    MessageType,
    ExtractedMessage,
    APP_MESSAGE_HANDLER_NAME,
} from './constants';

/**
 * {@link sendMessage} sends app message via {@link browser.runtime.sendMessage} and
 * gets response from another extension page message handler
 *
 * @param message - partial {@link Message} record without {@link Message.handlerName} field
 *
 * @returns message handler response
 */
export async function sendMessage<T extends MessageType>(
    message: Omit<ExtractedMessage<T>, 'handlerName'>,
): Promise<unknown> {
    try {
        return await browser.runtime.sendMessage({ handlerName: APP_MESSAGE_HANDLER_NAME, ...message });
    } catch (e) {
        // do nothing
    }
}
