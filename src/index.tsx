// plugin import
import LlmConnectorPlugin from './factory/RcbPluginFactory';

// react component import
import LlmConnector from './components/LlmConnector/LlmConnector';

// provider imports
import AnthropicProvider from './providers/AnthropicProvider';
import GeminiProvider from './providers/GeminiProvider';
import OpenaiProvider from './providers/OpenaiProvider';
import WebLlmProvider from './providers/WebLlmProvider';

// client utilities
import { createLlmClient } from './client/createLlmClient';

// type imports
import type { ProviderContext } from './components/LlmConnector/LlmConnector';
import type { LlmConnectorBlock } from './types/LlmConnectorBlock';
import type { PluginConfig } from './types/PluginConfig';
import type { Provider } from './types/Provider';
import type { ChatMessage } from './types/ChatMessage';
import type { ChatRequest, ChatResult, StreamChatResult, TextChatResult, LlmClient } from './client/types';

// default provider exports
export { AnthropicProvider, GeminiProvider, OpenaiProvider, WebLlmProvider };

// component & client exports
export { LlmConnector, createLlmClient };

// type exports
export type {
	ProviderContext,
	LlmConnectorBlock,
	PluginConfig,
	Provider,
	ChatMessage,
	ChatRequest,
	ChatResult,
	StreamChatResult,
	TextChatResult,
	LlmClient,
};

// plugin export
export default LlmConnectorPlugin;
