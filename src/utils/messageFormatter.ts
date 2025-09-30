/**
 * 消息格式转换工具
 * 
 * 从 promptHandler 中提取的消息格式转换逻辑
 * 支持不同消息格式之间的转换，去除 RCB 依赖
 */

import type { ChatMessage } from '../types/ChatMessage';

/**
 * 通用消息接口（替代 RCB Message）
 */
export interface GenericMessage {
  content: string | JSX.Element;
  sender?: string;
  role?: 'user' | 'assistant' | 'system';
  timestamp?: number;
  id?: string;
}

/**
 * 将发送者角色映射到 ChatMessage 角色
 * @param sender - 消息发送者
 * @returns ChatMessage 角色
 */
export const toChatMessageRole = (sender: string): ChatMessage['role'] => {
  switch (sender.toUpperCase()) {
    case 'USER':
      return 'user';
    case 'SYSTEM':
      return 'system';
    case 'ASSISTANT':
    case 'BOT':
      return 'assistant';
    default:
      return 'assistant';
  }
};

/**
 * 将通用消息转换为 ChatMessage 格式
 * @param messages - 通用消息数组
 * @returns ChatMessage 数组
 */
export const toChatMessages = (messages: GenericMessage[]): ChatMessage[] =>
  messages
    .filter((message) => typeof message.content === 'string')
    .map((message) => ({
      role: message.role || toChatMessageRole(message.sender ?? 'user'),
      content: String(message.content),
    }));

/**
 * 创建用户消息
 * @param content - 消息内容
 * @returns 用户消息对象
 */
export const createUserMessage = (content: string): GenericMessage => ({
  content,
  sender: 'user',
  role: 'user',
  timestamp: Date.now(),
  id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

/**
 * 创建助手消息
 * @param content - 消息内容
 * @returns 助手消息对象
 */
export const createAssistantMessage = (content: string): GenericMessage => ({
  content,
  sender: 'assistant',
  role: 'assistant',
  timestamp: Date.now(),
  id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

/**
 * 创建系统消息
 * @param content - 消息内容
 * @returns 系统消息对象
 */
export const createSystemMessage = (content: string): GenericMessage => ({
  content,
  sender: 'system',
  role: 'system',
  timestamp: Date.now(),
  id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
});

/**
 * 管理消息历史的工具函数
 */
export class MessageHistory {
  /**
   * 根据历史大小限制截取消息数组
   * @param messages - 消息数组
   * @param historySize - 历史大小限制（0 表示无限制）
   * @param includeLatest - 是否包含最新消息
   * @returns 截取后的消息数组
   */
  static slice(
    messages: GenericMessage[], 
    historySize: number, 
    includeLatest: boolean = true
  ): GenericMessage[] {
    if (!historySize || historySize <= 0) {
      return messages;
    }

    if (includeLatest && messages.length > 0) {
      // 保留最新消息 + 之前的 n-1 条
      const latest = messages[messages.length - 1];
      const previous = messages.slice(0, -1).slice(-(historySize - 1));
      return [...previous, latest];
    }

    // 只保留最后 n 条消息
    return messages.slice(-historySize);
  }

  /**
   * 过滤出指定角色的消息
   * @param messages - 消息数组
   * @param role - 要过滤的角色
   * @returns 过滤后的消息数组
   */
  static filterByRole(messages: GenericMessage[], role: ChatMessage['role']): GenericMessage[] {
    return messages.filter(msg => (msg.role || toChatMessageRole(msg.sender ?? '')) === role);
  }

  /**
   * 获取最后一条指定角色的消息
   * @param messages - 消息数组
   * @param role - 要查找的角色
   * @returns 最后一条指定角色的消息，如果没有则返回 undefined
   */
  static getLastByRole(messages: GenericMessage[], role: ChatMessage['role']): GenericMessage | undefined {
    const filtered = MessageHistory.filterByRole(messages, role);
    return filtered[filtered.length - 1];
  }
}