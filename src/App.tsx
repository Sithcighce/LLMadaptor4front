import { FormEvent, useCallback, useMemo, useState } from 'react';
import ChatBot, { Flow, Message, Params } from 'react-chatbotify';

import './App.css';
import LlmConnector from './components/LlmConnector/LlmConnector';
import type { LlmConnectorBlock } from './types/LlmConnectorBlock';
import type { LlmClient } from './client';
import type { ProviderContext } from './components/LlmConnector/LlmConnector';
import type { ChatMessage } from './types/ChatMessage';

import RcbPlugin from './factory/RcbPluginFactory';
import GeminiProvider from './providers/GeminiProvider';
import OpenaiProvider from './providers/OpenaiProvider';
import WebLlmProvider from './providers/WebLlmProvider';

// Optional: fill in API keys to try the ChatBotify demo out of the box.
const geminiApiKey = '';
const openaiApiKey = '';

type UiMessage = {
	role: 'user' | 'assistant';
	content: string;
};

const App = () => {
	// ---------- Unified client demo ----------
	const [client, setClient] = useState<LlmClient | null>(null);
	const [conversation, setConversation] = useState<ChatMessage[]>([]);
	const [visibleMessages, setVisibleMessages] = useState<UiMessage[]>([]);
	const [streamingMessage, setStreamingMessage] = useState('');
	const [draft, setDraft] = useState('');
	const [isStreaming, setIsStreaming] = useState(false);
	const [connectionInfo, setConnectionInfo] = useState<string | null>(null);
	const [sendError, setSendError] = useState<string | null>(null);

	const handleConnectorReady = useCallback((readyClient: LlmClient, context: ProviderContext) => {
		setClient(readyClient);
		setConversation([]);
		setVisibleMessages([]);
		setStreamingMessage('');
		setDraft('');
		setSendError(null);
		const model = context.rawConfig.model ?? '未指定模型';
		setConnectionInfo(`当前服务商：${context.providerId} · 模型：${model}`);
	}, []);

	const handleSubmit = useCallback(
		async (event?: FormEvent<HTMLFormElement>) => {
			event?.preventDefault();
			if (!client || isStreaming) {
				return;
			}
			const text = draft.trim();
			if (!text) {
				return;
			}

			setDraft('');
			setSendError(null);

			const userMessage: ChatMessage = { role: 'user', content: text };
			const messagesForSend = [...conversation, userMessage];
			setConversation(messagesForSend);
			setVisibleMessages((prev) => [...prev, { role: 'user', content: text }]);
			setStreamingMessage('');
			setIsStreaming(true);

			try {
				const result = await client.chat({ messages: messagesForSend, stream: true });
				let assistantText = '';

				if (result.type === 'stream') {
					for await (const chunk of result.stream) {
						assistantText += chunk;
						setStreamingMessage(assistantText);
					}
				} else {
					assistantText = result.text;
					setStreamingMessage(assistantText);
				}

				if (assistantText) {
					const assistantMessage: ChatMessage = { role: 'assistant', content: assistantText };
					setConversation((prev) => [...prev, assistantMessage]);
					setVisibleMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				setSendError(message);
			} finally {
				setIsStreaming(false);
				setStreamingMessage('');
			}
		},
		[client, conversation, draft, isStreaming]
	);

	const canSend = Boolean(client) && Boolean(draft.trim()) && !isStreaming;

	// ---------- ChatBotify plugin demo (kept for backwards compatibility) ----------
	const plugins = useMemo(
		() => [
			RcbPlugin({
				autoConfig: true,
			}),
		],
		[]
	);

	const onUserMessageCheck = useCallback(async (message: Message) => {
		if (typeof message.content === 'string' && message.content.toUpperCase() === 'RESTART') {
			return 'start';
		}
	}, []);

	const onKeyDownCheck = useCallback(async (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			return 'start';
		}
		return null;
	}, []);

	const flow: Flow = useMemo(
		() => ({
			start: {
				message: async (params: Params) => {
					if (params.prevPath == null) {
						return 'Hello there, pick an LLM provider you would like to try today!';
					}
					return 'Pick another model to try!';
				},
				options: ['WebLlm', 'Gemini', 'OpenAI'],
				chatDisabled: true,
				path: async (params: Params) => {
					if (params.userInput === 'WebLlm') {
						await params.simulateStreamMessage(
							`You selected ${params.userInput}. This model runs in your browser, so responses may be slower and less accurate.`
						);
					} else {
						if (
							(params.userInput === 'Gemini' && !geminiApiKey) ||
							(params.userInput === 'OpenAI' && !openaiApiKey)
						) {
							await params.simulateStreamMessage(
								`You selected ${params.userInput} in 'direct' mode but no API key was set!`
							);
							return 'start';
						} else {
							await params.simulateStreamMessage(`You selected ${params.userInput}, ask away!`);
						}
					}
					await params.simulateStreamMessage("You may type 'RESTART' or hit the 'ESC' key to select another model.");
					return params.userInput.toLowerCase();
				},
			} as LlmConnectorBlock,
			webllm: {
				llmConnector: {
					provider: new WebLlmProvider({
						model: 'Qwen2-0.5B-Instruct-q4f16_1-MLC',
					}),
					outputType: 'character',
					stopConditions: {
						onUserMessage: onUserMessageCheck,
						onKeyDown: onKeyDownCheck,
					},
				},
			} as LlmConnectorBlock,
			gemini: {
				llmConnector: {
					provider: new GeminiProvider({
						mode: 'direct',
						model: 'gemini-1.5-flash',
						responseFormat: 'stream',
						apiKey: geminiApiKey,
					}),
					outputType: 'character',
					stopConditions: {
						onUserMessage: onUserMessageCheck,
						onKeyDown: onKeyDownCheck,
					},
				},
			} as LlmConnectorBlock,
			openai: {
				llmConnector: {
					provider: new OpenaiProvider({
						mode: 'direct',
						model: 'gpt-4.1-nano',
						responseFormat: 'stream',
						apiKey: openaiApiKey,
					}),
					outputType: 'character',
					stopConditions: {
						onUserMessage: onUserMessageCheck,
						onKeyDown: onKeyDownCheck,
					},
				},
			} as LlmConnectorBlock,
		}),
		[
			onKeyDownCheck,
			onUserMessageCheck,
		]
	);

	return (
		<div className="app-container">
			<section className="app-section">
				<div className="app-section-header">
					<h1>LLM Connector Playground</h1>
					<p>选择服务商、输入密钥，立即获得一个统一的前端 LLM 客户端。</p>
				</div>
				<div className="connector-layout">
					<LlmConnector onReady={handleConnectorReady} />
					<div className="chat-preview">
						<h3>即时测试</h3>
						<p className="chat-meta">{connectionInfo ?? '尚未连接，请先在左侧完成配置。'}</p>
						<div className="chat-scroll">
							{visibleMessages.length === 0 && !streamingMessage ? (
								<p className="chat-empty">连接成功后，发送一条消息试试看！</p>
							) : (
								<ul className="chat-list">
									{visibleMessages.map((message, index) => (
										<li key={index} className={`chat-item chat-item-${message.role}`}>
											<span className="chat-item-label">{message.role === 'user' ? '你' : '助手'}</span>
											<p>{message.content}</p>
										</li>
									))}
									{streamingMessage && (
										<li className="chat-item chat-item-assistant chat-item-streaming">
											<span className="chat-item-label">助手</span>
											<p>{streamingMessage}</p>
										</li>
									)}
								</ul>
							)}
						</div>
						{sendError && <p className="chat-error">调用失败：{sendError}</p>}
						<form className="chat-form" onSubmit={handleSubmit}>
							<input
								type="text"
								placeholder={client ? '输入你的问题…' : '请先连接服务商'}
								value={draft}
								onChange={(event) => setDraft(event.target.value)}
								disabled={!client || isStreaming}
							/>
							<button type="submit" disabled={!canSend}>
								{isStreaming ? '生成中…' : '发送'}
							</button>
						</form>
					</div>
				</div>
			</section>

			<section className="app-section">
				<div className="app-section-header">
					<h2>React ChatBotify 插件示例</h2>
					<p>仍然可以像之前一样将 LLM Connector 当作插件使用。</p>
				</div>
				<div className="chatbot-wrapper">
					<ChatBot id="chatbot-id" plugins={plugins} flow={flow} />
				</div>
			</section>
		</div>
	);
};

export default App;


