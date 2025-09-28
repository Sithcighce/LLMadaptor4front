import { ChatMessage } from '../ChatMessage';
import { WebLlmProviderMessage } from '../provider-message/WebLlmProviderMessage';
import { MLCEngineConfig } from '@mlc-ai/web-llm';

/**
 * Configurations for WebLlmProvider.
 */
type WebLlmProviderConfig = {
	model: string;
	systemMessage?: string;
	responseFormat?: 'stream' | 'json';
	engineConfig?: MLCEngineConfig;
	chatCompletionOptions?: Record<string, unknown>;
	messageParser?: (messages: ChatMessage[]) => WebLlmProviderMessage[];
	debug?: boolean;
};

export type { WebLlmProviderConfig };
