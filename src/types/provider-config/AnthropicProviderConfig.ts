import { ChatMessage } from '../ChatMessage';
import { AnthropicProviderMessage } from '../provider-message/AnthropicProviderMessage';

type BaseConfig = {
	model: string;
	method?: string;
	headers?: Record<string, string>;
	body?: Record<string, unknown>;
	responseFormat?: 'stream' | 'json';
	systemMessage?: string;
	maxOutputTokens?: number;
	anthropicVersion?: string;
	messageParser?: (messages: ChatMessage[]) => AnthropicProviderMessage[];
	debug?: boolean;
};

type DirectConfig = BaseConfig & {
	mode: 'direct';
	apiKey: string;
	baseUrl?: string;
};

type ProxyConfig = BaseConfig & {
	mode: 'proxy';
	baseUrl: string;
};

type AnthropicProviderConfig = DirectConfig | ProxyConfig;

export type { AnthropicProviderConfig };
