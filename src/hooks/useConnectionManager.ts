import { useMemo } from 'react';
import { useLlmConnector } from './useLlmConnector';

/**
 * ✅ 连接管理专用 Hook - 推荐的公共接口
 * 
 * 专门服务于基础连接组件：ConnectionForm, ModelSelect, TokenUsage
 * 只暴露连接相关的状态和方法，不包含聊天、高级配置等业务逻辑
 * 
 * 使用示例：
 * ```tsx
 * const MyComponent = () => {
 *   const { status, apiKey, handleConnect } = useConnectionManager();
 *   return <button onClick={handleConnect}>连接</button>;
 * };
 * ```
 * 
 * 职责范围：
 * - API Key 和 Provider 配置
 * - 模型选择和获取
 * - 连接状态管理
 * - Token 使用量监控
 * 
 * @public 推荐的外部使用方式
 * @requires LlmConnectorProvider 确保在 Provider 包裹下使用
 */
export const useConnectionManager = () => {
  // 🔥 修复：使用 Context 中的共享状态，而不是创建新实例
  const { states, handlers } = useLlmConnector();

  // 🔥 关键修复：用 useMemo 稳定返回对象的引用
  return useMemo(() => ({
    // 🔧 连接配置状态
    providerId: states.providerId,
    apiKey: states.apiKey,
    baseUrl: states.baseUrl,
    model: states.model,
    
    // 🌐 连接状态
    status: states.status,
    error: states.error,
    
    // 📊 数据状态
    modelOptions: states.modelOptions,
    tokenUsage: states.tokenUsage,
    
    // 🎛️ 配置方法
    setProviderId: handlers.setProviderId,
    setApiKey: handlers.setApiKey,
    setBaseUrl: handlers.setBaseUrl,
    setModel: handlers.setModel,
    
    // 🔌 连接操作
    handleConnect: handlers.handleConnect,
    handleDisconnect: handlers.handleDisconnect,
    fetchModels: handlers.fetchModels,
    
    // 📈 使用量管理
    setTokenUsage: handlers.setTokenUsage,
  }), [
    // 只有这些值真正变化时才重新创建对象
    states.providerId, states.apiKey, states.baseUrl, states.model,
    states.status, states.error, states.modelOptions, states.tokenUsage,
    handlers.setProviderId, handlers.setApiKey, handlers.setBaseUrl, handlers.setModel,
    handlers.handleConnect, handlers.handleDisconnect, handlers.fetchModels, handlers.setTokenUsage
  ]);
};

/**
 * 类型定义 - 连接管理相关的返回类型
 */
export type ConnectionManagerState = ReturnType<typeof useConnectionManager>;