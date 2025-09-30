/**
 * 流式响应处理工具
 * 
 * 从 promptHandler 中提取的流式响应处理逻辑
 * 支持完整响应和流式响应两种模式，去除 RCB 依赖
 */

import type { Provider } from '../types/Provider';
import type { ChatMessage } from '../types/ChatMessage';
import type { GenericMessage } from './messageFormatter';
import { formatStream } from './streamController';

/**
 * 流式响应配置
 */
export interface StreamConfig {
  outputType: 'character' | 'chunk' | 'full';
  outputSpeed: number;
  enableAudio?: boolean;
}

/**
 * 流式响应回调函数
 */
export interface StreamCallbacks {
  onStart?: () => void;
  onChunk?: (chunk: string, fullContent: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
  onAudio?: (text: string) => void;
}

/**
 * 音频处理的异步生成器
 * @param stream - 文本流
 * @param speakAudio - 音频播放函数
 */
async function* speakAndForward(
  stream: AsyncGenerator<string>, 
  speakAudio: (text: string) => void
): AsyncGenerator<string> {
  for await (const chunk of stream) {
    speakAudio(chunk);
    yield chunk;
  }
}

/**
 * 流式响应处理器
 */
export class StreamProcessor {
  private provider: Provider;
  private config: StreamConfig;
  private callbacks: StreamCallbacks;

  constructor(provider: Provider, config: StreamConfig, callbacks: StreamCallbacks = {}) {
    this.provider = provider;
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * 处理流式响应
   * @param messages - 要发送的消息
   * @param signal - 中断信号
   * @returns 完整的响应内容
   */
  async processStream(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
    try {
      this.callbacks.onStart?.();

      const rawStream = this.provider.sendMessages(messages);

      if (this.config.outputType === 'full') {
        return await this.processFull(rawStream, signal);
      } else {
        return await this.processStreaming(rawStream, signal);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * 处理完整响应模式
   * @param stream - 原始流
   * @param signal - 中断信号
   * @returns 完整的响应内容
   */
  private async processFull(stream: AsyncGenerator<string>, signal?: AbortSignal): Promise<string> {
    let outputContent = '';

    for await (const part of stream) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }
      outputContent += part;
    }

    this.callbacks.onComplete?.(outputContent);
    return outputContent;
  }

  /**
   * 处理流式响应模式
   * @param stream - 原始流
   * @param signal - 中断信号
   * @returns 完整的响应内容
   */
  private async processStreaming(stream: AsyncGenerator<string>, signal?: AbortSignal): Promise<string> {
    // 添加音频支持（如果启用）
    const audioStream = this.config.enableAudio && this.callbacks.onAudio
      ? speakAndForward(stream, this.callbacks.onAudio)
      : stream;

    // 格式化流（控制输出速度和方式）
    const formattedStream = formatStream(
      audioStream, 
      this.config.outputType, 
      this.config.outputSpeed
    );

    let outputContent = '';
    let hasStarted = false;

    for await (const part of formattedStream) {
      if (signal?.aborted) {
        throw new Error('Request aborted');
      }

      if (!hasStarted) {
        hasStarted = true;
      }

      outputContent += part;
      this.callbacks.onChunk?.(part, outputContent);
    }

    this.callbacks.onComplete?.(outputContent);
    return outputContent;
  }

  /**
   * 更新配置
   * @param config - 新的配置
   */
  updateConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 更新回调函数
   * @param callbacks - 新的回调函数
   */
  updateCallbacks(callbacks: Partial<StreamCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

/**
 * 创建流式处理器的便捷函数
 * @param provider - LLM Provider
 * @param config - 流式配置
 * @param callbacks - 回调函数
 * @returns 流式处理器实例
 */
export const createStreamProcessor = (
  provider: Provider,
  config: StreamConfig,
  callbacks: StreamCallbacks = {}
): StreamProcessor => {
  return new StreamProcessor(provider, config, callbacks);
};

/**
 * 简化的流式处理函数
 * @param provider - LLM Provider
 * @param messages - 消息数组
 * @param onChunk - 接收流式数据的回调
 * @param signal - 中断信号
 * @returns 完整的响应内容
 */
export const processStreamSimple = async (
  provider: Provider,
  messages: ChatMessage[],
  onChunk: (chunk: string, fullContent: string) => void,
  signal?: AbortSignal
): Promise<string> => {
  const processor = createStreamProcessor(
    provider,
    { outputType: 'chunk', outputSpeed: 30 },
    { onChunk }
  );

  return processor.processStream(messages, signal);
};