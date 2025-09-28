import { WebLlmProviderConfig } from '../types/provider-config/WebLlmProviderConfig';
import { Provider } from '../types/Provider';
import { ChatMessage } from '../types/ChatMessage';
import { ChatCompletionChunk, MLCEngine, MLCEngineConfig } from '@mlc-ai/web-llm';
import { WebLlmProviderMessage } from '../types/provider-message/WebLlmProviderMessage';

/**
 * Provider for MLC’s WebLLM runtime, for running models in the browser.
 */
class WebLlmProvider implements Provider {
	private model!: string;
	private systemMessage?: string;
	private responseFormat!: 'stream' | 'json';
	private engineConfig: MLCEngineConfig;
	private chatCompletionOptions: Record<string, unknown>;
	private messageParser?: (messages: ChatMessage[]) => WebLlmProviderMessage[];
	private engine?: MLCEngine;
	private debug: boolean = false;

	/**
	 * Sets default values for the provider based on given configuration. Configuration guide here:
	 * https://github.com/React-ChatBotify-Plugins/llm-connector/blob/main/docs/providers/WebLlm.md
	 *
	 * @param config configuration for setup
	 */
	constructor(config: WebLlmProviderConfig) {
		this.model = config.model;
		this.systemMessage = config.systemMessage;
		this.responseFormat = config.responseFormat ?? 'stream';
		this.messageParser = config.messageParser;
		this.engineConfig = config.engineConfig ?? {};
		this.chatCompletionOptions = config.chatCompletionOptions ?? {};
		this.debug = config.debug ?? false;
		this.createEngine();
	}

	/**
	 * Creates MLC Engine for inferencing.
	 */
	private async createEngine() {
		const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
		this.engine = await CreateMLCEngine(this.model, {
			...this.engineConfig,
		});
	}

	/**
	 * Calls WebLlm and yields each chunk (or the full text).
	 *
	 * @param messages messages to include in the request
	 */
	public async *sendMessages(messages: ChatMessage[]): AsyncGenerator<string> {
		if (!this.engine) {
			await this.createEngine();
		}

		if (this.debug) {
			console.log('[WebLlmProvider] Request:', {
				model: this.model,
				systemMessage: this.systemMessage,
				responseFormat: this.responseFormat,
				engineConfig: this.engineConfig,
				chatCompletionOptions: this.chatCompletionOptions,
				messages: this.constructBodyWithMessages(messages).messages,
			});
		}

		const result = await this.engine?.chat.completions.create(this.constructBodyWithMessages(messages));

		if (this.debug) {
			console.log('[WebLlmProvider] Response:', result);
		}

		if (result && Symbol.asyncIterator in result) {
			for await (const chunk of result as AsyncIterable<ChatCompletionChunk>) {
				const delta = chunk.choices[0]?.delta?.content;
				if (delta) {
					yield delta;
				}
			}
		} else if (result?.choices?.[0]?.message?.content) {
			yield result.choices[0].message.content;
		}
	}

	/**
	 * Ensures provider receives a known role.
	 */
	private toProviderRole = (role: ChatMessage['role']): 'system' | 'user' | 'assistant' => {
		switch (role) {
			case 'assistant':
				return 'assistant';
			case 'system':
				return 'system';
			default:
				return 'user';
		}
	};

	/**
	 * Builds the full request body.
	 *
	 * @param messages messages to parse
	 */
	private constructBodyWithMessages = (messages: ChatMessage[]) => {
		let parsedMessages: WebLlmProviderMessage[];
		if (this.messageParser) {
			parsedMessages = this.messageParser(messages);
		} else {
			parsedMessages = messages
				.filter((message) => typeof message.content === 'string')
				.map((message) => ({
					role: this.toProviderRole(message.role) as 'system' | 'user' | 'assistant',
					content: message.content,
				}));
		}

		if (this.systemMessage) {
			parsedMessages = [
				{
					role: 'system',
					content: this.systemMessage,
				},
				...parsedMessages,
			];
		}

		return {
			messages: parsedMessages,
			stream: this.responseFormat === 'stream',
			...this.chatCompletionOptions,
		};
	};
}

export default WebLlmProvider;
