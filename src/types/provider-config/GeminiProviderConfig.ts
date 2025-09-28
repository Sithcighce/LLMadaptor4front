import { ChatMessage } from '../ChatMessage';
import { GeminiProviderMessage } from '../provider-message/GeminiProviderMessage';

/**
 * Configurations for GeminiProvider in direct mode.
 */
type DirectConfig = {
	mode: 'direct';
	model: string;
	apiKey: string;
	systemMessage?: string;
	responseFormat?: 'stream' | 'json';
	baseUrl?: string;
	method?: string;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	messageParser?: (messages: ChatMessage[]) => GeminiProviderMessage[];
	debug?: boolean;
};

/**
 * Configurations for GeminiProvider in proxy mode.
 */
type ProxyConfig = {
	mode: 'proxy';
	model: string;
	baseUrl: string;
	systemMessage?: string;
	responseFormat?: 'stream' | 'json';
	method?: string;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	messageParser?: (messages: ChatMessage[]) => GeminiProviderMessage[];
	debug?: boolean;
};

/**
 * Combined gemini provider configurations.
 */
type GeminiProviderConfig = DirectConfig | ProxyConfig;

export type { GeminiProviderConfig };
