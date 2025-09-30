/**
 * 错误处理和状态恢复工具
 * 
 * 从 useMessageHandler 中提取的错误处理逻辑
 * 提供统一的错误处理和 UI 状态恢复机制
 */

/**
 * 聊天状态接口
 */
export interface ChatState {
  isTyping: boolean;
  isDisabled: boolean;
  isStreaming: boolean;
  error: string | null;
}

/**
 * 状态控制函数类型
 */
export interface StateControllers {
  setTyping: (typing: boolean) => void;
  setDisabled: (disabled: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  focusInput?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 错误处理工具类
 */
export class ChatErrorHandler {
  private controllers: StateControllers;

  constructor(controllers: StateControllers) {
    this.controllers = controllers;
  }

  /**
   * 处理聊天错误
   * @param error - 错误对象
   * @param context - 错误上下文信息
   */
  handleError(error: Error | string, context?: string): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage;

    console.error('[ChatManager]', fullMessage, error instanceof Error ? error : new Error(errorMessage));

    // 恢复 UI 状态
    this.resetState();

    // 设置错误消息
    this.controllers.setError(fullMessage);

    // 调用自定义错误处理器
    if (this.controllers.onError && error instanceof Error) {
      this.controllers.onError(error);
    }
  }

  /**
   * 重置聊天状态到正常状态
   */
  resetState(): void {
    this.controllers.setTyping(false);
    this.controllers.setDisabled(false);
    this.controllers.setStreaming(false);

    // 延迟聚焦输入框，避免与其他状态更新冲突
    setTimeout(() => {
      if (this.controllers.focusInput) {
        this.controllers.focusInput();
      }
    }, 100);
  }

  /**
   * 清除错误状态
   */
  clearError(): void {
    this.controllers.setError(null);
  }

  /**
   * 处理网络错误
   * @param error - 网络错误
   */
  handleNetworkError(error: Error): void {
    if (error.name === 'AbortError') {
      this.handleError('请求已取消', '用户中断');
    } else if (error.message.includes('fetch')) {
      this.handleError('网络连接失败，请检查网络设置', '网络错误');
    } else {
      this.handleError(error, '网络请求');
    }
  }

  /**
   * 处理 LLM 服务错误
   * @param error - LLM 服务错误
   */
  handleLLMError(error: Error): void {
    if (error.message.includes('401') || error.message.includes('API key')) {
      this.handleError('API 密钥无效或已过期', 'LLM 服务');
    } else if (error.message.includes('429')) {
      this.handleError('请求频率过高，请稍后再试', 'LLM 服务');
    } else if (error.message.includes('quota')) {
      this.handleError('API 配额已用完', 'LLM 服务');
    } else {
      this.handleError(error, 'LLM 服务');
    }
  }

  /**
   * 处理流式响应错误
   * @param error - 流式响应错误
   */
  handleStreamError(error: Error): void {
    this.handleError(error, '流式响应');
    
    // 确保流式状态被正确清理
    this.controllers.setStreaming(false);
  }
}

/**
 * 创建错误处理器的便捷函数
 * @param controllers - 状态控制器
 * @returns 错误处理器实例
 */
export const createErrorHandler = (controllers: StateControllers): ChatErrorHandler => {
  return new ChatErrorHandler(controllers);
};

/**
 * 默认错误消息
 */
export const DEFAULT_ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  API_KEY_ERROR: 'API 密钥无效或已过期',
  QUOTA_ERROR: 'API 配额已用完',
  RATE_LIMIT_ERROR: '请求频率过高，请稍后再试',
  STREAM_ERROR: '流式响应中断',
  GENERIC_ERROR: '处理请求时发生错误，请重试',
  ABORT_ERROR: '请求已取消',
} as const;