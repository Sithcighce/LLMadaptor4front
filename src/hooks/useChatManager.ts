/**
 * 聊天管理 Hook
 * 
 * 基于现有基础设施构建的完整聊天管理解决方案
 * 提供消息历史、流式响应、错误处理等完整功能
 */

import { useState, useCallback, useEffect } from 'react';
import { useLlmConnector } from './useLlmConnector';
import { useAbortController } from '../utils/abortController';
import type { ChatMessage } from '../types/ChatMessage';
import type { TokenUsage } from '../types';

/**
 * 创建用户消息
 */
const createUserMessage = (content: string): ChatMessage => ({
  role: 'user',
  content,
});

/**
 * 创建助手消息
 */
const createAssistantMessage = (content: string): ChatMessage => ({
  role: 'assistant',
  content,
});

/**
 * 聊天管理配置
 */
export interface ChatManagerConfig {
  /** 显式指定Client名称 */
  clientName?: string;
  /** 存储键，用于持久化消息历史 */
  storageKey?: string;
  /** 最大消息历史数量 */
  maxMessages?: number;
}

/**
 * 聊天管理返回值
 */
export interface ChatManagerReturn {
  // 📝 核心状态
  messages: ChatMessage[];
  isStreaming: boolean;
  error: Error | null;
  tokenUsage: TokenUsage | null;
  
  // 🎛️ 核心操作
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
  abortResponse: () => void;
  
  //  状态查询
  canSend: boolean;
  lastMessage: ChatMessage | null;
  messageCount: number;
}

/**
 * 默认配置
 */
const defaultConfig: Required<Omit<ChatManagerConfig, 'clientName'>> = {
  storageKey: 'chat-messages',
  maxMessages: 100,
};

/**
 * 聊天管理 Hook
 */
export const useChatManager = (config: ChatManagerConfig = {}): ChatManagerReturn => {
  // 只使用明确提供的 clientName，忽略 defaultConfig 中不存在的属性
  const clientName = config.clientName;
  const storageKey = config.storageKey || defaultConfig.storageKey;
  const maxMessages = config.maxMessages || defaultConfig.maxMessages;
  
  // 获取LLM客户端 - 只有在明确指定时才传递 clientName
  const { llmClient, states } = useLlmConnector(clientName);
  
  // 状态管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  
  // 中断控制
  const { createController, abort, cleanup } = useAbortController();
  
  // 从localStorage加载消息历史
  useEffect(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const savedMessages: ChatMessage[] = JSON.parse(saved);
          setMessages(savedMessages.slice(-maxMessages));
        }
      } catch (error) {
        console.warn('Failed to load message history:', error);
      }
    }
  }, [storageKey, maxMessages]);
  
  // 保存消息历史到localStorage
  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
      } catch (error) {
        console.warn('Failed to save message history:', error);
      }
    }
  }, [storageKey]);
  
  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!llmClient || isStreaming || !content.trim()) {
      return;
    }
    
    setError(null);
    setIsStreaming(true);
    setCurrentStreamingMessage('');
    
    // 创建用户消息
    const userMessage = createUserMessage(content);
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    try {
      // 创建中断控制器
      const controller = createController();
      
      // 准备消息历史
      const chatMessages = newMessages;
      
      // 调用LLM
      const result = await llmClient.chat({
        messages: newMessages,
        stream: true,
      });
      
      if ('stream' in result) {
        // 流式响应处理
        let fullResponse = '';
        
        for await (const chunk of result.stream) {
          // 检查是否被中断
          if (controller.signal.aborted) {
            break;
          }
          
          fullResponse += chunk.text;
          setCurrentStreamingMessage(fullResponse);
        }
        
        // 完成流式响应
        if (!controller.signal.aborted) {
          const assistantMessage = createAssistantMessage(fullResponse);
          const finalMessages = [...newMessages, assistantMessage];
          setMessages(finalMessages);
          saveMessages(finalMessages);
        }
      } else {
        // 非流式响应
        const assistantMessage = createAssistantMessage(result.text);
        const finalMessages = [...newMessages, assistantMessage];
        setMessages(finalMessages);
        saveMessages(finalMessages);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted by user');
      } else {
        setError(error instanceof Error ? error : new Error(String(error)));
      }
      setIsStreaming(false);
      setCurrentStreamingMessage('');
    }
  }, [llmClient, messages, isStreaming, createController, saveMessages]);
  
  // 清空消息
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);
  
  // 重试最后一条消息
  const retryLastMessage = useCallback(async () => {
    if (messages.length === 0) return;
    
    // 找到最后一条用户消息
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // 移除最后一条助手消息（如果存在）
      const messagesWithoutLastAssistant = messages.filter((msg, index) => {
        if (index === messages.length - 1 && msg.role === 'assistant') {
          return false;
        }
        return true;
      });
      setMessages(messagesWithoutLastAssistant);
      
      // 重新发送最后一条用户消息
      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);
  
  // 中断响应
  const abortResponse = useCallback(() => {
    abort();
    setIsStreaming(false);
    setCurrentStreamingMessage('');
  }, [abort]);
  
  // 清理函数
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  // 计算派生状态
  const canSend = !!llmClient && !isStreaming;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const messageCount = messages.length;
  
  // 如果正在流式响应，添加临时消息到显示列表
  const displayMessages = currentStreamingMessage
    ? [...messages, createAssistantMessage(currentStreamingMessage)]
    : messages;
  
  return {
    // 核心状态
    messages: displayMessages,
    isStreaming,
    error,
    tokenUsage: states.tokenUsage,
    
    // 核心操作
    sendMessage,
    clearMessages,
    retryLastMessage,
    abortResponse,
    
    // 状态查询
    canSend,
    lastMessage,
    messageCount,
  };
};