import { ChatMessage } from './ChatMessage';

/**
 * Interface that all LLM providers must implement.
 */
export type Provider = {
	/**
	 * Sends a series of messages to the LLM to get a reply.
	 *
	 * @param messages messages to send
	 */
	sendMessages(messages: ChatMessage[]): AsyncGenerator<string>;
};

