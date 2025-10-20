/**
 * 聊天界面组件
 * 
 * 基于useChatManager Hook的完整聊天UI实现
 * 支持消息显示、输入、流式响应等功能
 */

import React, { useState, useRef, useEffect } from 'react';
import { useChatManager, type ChatManagerConfig } from '../../hooks/useChatManager';
import type { ChatMessage } from '../../types/ChatMessage';

/**
 * 聊天界面组件属性
 */
export interface ChatInterfaceProps extends ChatManagerConfig {
  /** 组件样式类名 */
  className?: string;
  /** 占位符文本 */
  placeholder?: string;
  /** 发送按钮文本 */
  sendButtonText?: string;
  /** 清空按钮文本 */
  clearButtonText?: string;
  /** 是否显示清空按钮 */
  showClearButton?: boolean;
  /** 是否显示Token使用统计 */
  showTokenUsage?: boolean;
}

/**
 * 消息气泡组件
 */
const MessageBubble: React.FC<{ message: ChatMessage; isStreaming?: boolean }> = ({ 
  message, 
  isStreaming = false 
}) => {
  const isUser = message.role === 'user';
  
  return (
    <div 
      className={`message-bubble ${isUser ? 'user' : 'assistant'} ${isStreaming ? 'streaming' : ''}`}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: '12px 16px',
          borderRadius: '18px',
          backgroundColor: isUser ? '#007AFF' : '#f1f1f1',
          color: isUser ? 'white' : '#333',
          wordWrap: 'break-word',
          position: 'relative',
          ...(isStreaming && {
            '::after': {
              content: '"..."',
              animation: 'blink 1s infinite',
            }
          })
        }}
      >
        {message.content}
        {isStreaming && (
          <span style={{ 
            marginLeft: '4px',
            animation: 'pulse 1.5s ease-in-out infinite' 
          }}>
            ●
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 消息输入框组件
 */
const MessageInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
  sendButtonText?: string;
}> = ({ value, onChange, onSend, disabled, placeholder, sendButtonText }) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      padding: '16px',
      borderTop: '1px solid #e1e1e1',
      backgroundColor: '#fafafa'
    }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder || '输入你的消息...'}
        disabled={disabled}
        style={{
          flex: 1,
          minHeight: '40px',
          maxHeight: '120px',
          padding: '10px 12px',
          border: '1px solid #ddd',
          borderRadius: '20px',
          resize: 'none',
          outline: 'none',
          fontFamily: 'inherit',
          fontSize: '14px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
        }}
        rows={1}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          padding: '10px 20px',
          backgroundColor: disabled || !value.trim() ? '#ccc' : '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: disabled || !value.trim() ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          minWidth: '60px',
        }}
      >
        {sendButtonText || '发送'}
      </button>
    </div>
  );
};

/**
 * 聊天界面主组件
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  placeholder,
  sendButtonText,
  clearButtonText,
  showClearButton = true,
  showTokenUsage = true,
  ...chatManagerConfig
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    isStreaming,
    error,
    tokenUsage,
    sendMessage,
    clearMessages,
    abortResponse,
    canSend,
    messageCount,
  } = useChatManager(chatManagerConfig);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!inputValue.trim() || !canSend) return;
    
    const message = inputValue.trim();
    setInputValue('');
    await sendMessage(message);
  };

  const handleAbort = () => {
    abortResponse();
  };

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '500px',
        border: '1px solid #e1e1e1',
        borderRadius: '12px',
        backgroundColor: 'white',
        overflow: 'hidden',
      }}
    >
      {/* 头部工具栏 */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#f8f8f8',
        borderBottom: '1px solid #e1e1e1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: '500', fontSize: '14px' }}>
            聊天 ({messageCount} 条消息)
          </span>
          {showTokenUsage && tokenUsage && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              Tokens: {tokenUsage.inputTokens + tokenUsage.outputTokens}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {isStreaming && (
            <button
              onClick={handleAbort}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              停止
            </button>
          )}
          {showClearButton && (
            <button
              onClick={clearMessages}
              disabled={messageCount === 0}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                backgroundColor: messageCount === 0 ? '#ccc' : '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: messageCount === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {clearButtonText || '清空'}
            </button>
          )}
        </div>
      </div>

      {/* 消息列表 */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        backgroundColor: '#fff',
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
            fontSize: '14px',
          }}>
            开始对话吧！发送一条消息来测试AI助手。
          </div>
        ) : (
          messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isStreamingMessage = isStreaming && isLastMessage && message.role === 'assistant';
            
            return (
              <MessageBubble
                key={index}
                message={message}
                isStreaming={isStreamingMessage}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#ffe6e6',
          borderTop: '1px solid #ffcccc',
          color: '#cc0000',
          fontSize: '14px',
        }}>
          ❌ {error.message}
        </div>
      )}

      {/* 输入区域 */}
      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        disabled={!canSend}
        placeholder={placeholder}
        sendButtonText={sendButtonText}
      />
      
      {/* 添加CSS动画样式 */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};