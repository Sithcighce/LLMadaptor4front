/**
 * 流式响应中断控制工具
 * 
 * 从 useMessageHandler 中提取的 AbortController 管理逻辑
 * 用于控制 LLM 流式响应的中断和清理
 */

import { useRef, useCallback } from 'react';

/**
 * 中断控制器 Hook
 * 管理 AbortController 的创建、使用和清理
 */
export const useAbortController = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 创建新的中断控制器
   * @returns AbortController 实例
   */
  const createController = useCallback((): AbortController => {
    // 清理旧的控制器
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 创建新的控制器
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    return controller;
  }, []);

  /**
   * 中断当前请求
   */
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * 清理控制器（不触发中断）
   */
  const cleanup = useCallback(() => {
    abortControllerRef.current = null;
  }, []);

  /**
   * 获取当前控制器的 signal
   */
  const getSignal = useCallback((): AbortSignal | undefined => {
    return abortControllerRef.current?.signal;
  }, []);

  /**
   * 检查是否已被中断
   */
  const isAborted = useCallback((): boolean => {
    return abortControllerRef.current?.signal.aborted ?? false;
  }, []);

  return {
    createController,
    abort,
    cleanup,
    getSignal,
    isAborted,
    current: abortControllerRef.current,
  };
};