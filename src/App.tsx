import React, { FormEvent, useCallback, useState } from 'react';
import './App.css';
import { LlmConnectorProvider } from './providers/LlmConnectorProvider';
import { useLlmConnector } from './hooks/useLlmConnector';
import { ConnectionFormZh } from './components/ConnectionForm/index.zh';
import { ModelSelectZh } from './components/ModelSelect/index.zh';
import { TokenUsageZh } from './components/TokenUsage/index.zh';
import type { ChatMessage } from './types/ChatMessage';

// The chat UI component
const ChatPanel = () => {
  const { llmClient, states } = useLlmConnector();
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [draft, setDraft] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!llmClient || isStreaming) return;
      const text = draft.trim();
      if (!text) return;

      setDraft('');
      setSendError(null);

      const userMessage: ChatMessage = { role: 'user', content: text };
      const messagesForSend = [...conversation, userMessage];
      setConversation(messagesForSend);
      setVisibleMessages((prev) => [...prev, userMessage]);
      setStreamingMessage('');
      setIsStreaming(true);

      try {
        const result = await llmClient.chat({ messages: messagesForSend, stream: true });
        let assistantText = '';

        if ('stream' in result) {
          for await (const chunk of result.stream) {
            assistantText += chunk.text;
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
    [llmClient, conversation, draft, isStreaming]
  );

  const canSend = llmClient && draft.trim() && !isStreaming;
  const connectionInfo = llmClient ? `当前服务商：${states.providerId} · 模型：${states.model}` : '尚未连接，请先在左侧完成配置。';

  return (
    <div className="chat-preview">
      <h3>即时测试</h3>
      <p className="chat-meta">{connectionInfo}</p>
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
          placeholder={llmClient ? '输入你的问题…' : '请先连接服务商'}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!llmClient || isStreaming}
        />
        <button type="submit" disabled={!canSend}>
          {isStreaming ? '生成中…' : '发送'}
        </button>
      </form>
    </div>
  );
};

// The main App component that lays out the playground
const App = () => {
  return (
    <LlmConnectorProvider>
      <div className="w-full max-w-md mx-auto p-4 space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-200">中文版组件</h1>
          <div>
            <ModelSelectZh />
            <ConnectionFormZh />
            <TokenUsageZh />
          </div>
        </div>
        <ChatPanel />
      </div>
    </LlmConnectorProvider>
  );
};

export default App;