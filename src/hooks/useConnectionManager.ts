import { useLlmConnectorLogic } from './useLlmConnectorLogic';

/**
 * 连接管理专用 Hook
 * 
 * 专门服务于基础连接组件：ConnectionForm, ModelSelect, TokenUsage
 * 只暴露连接相关的状态和方法，不包含聊天、高级配置等业务逻辑
 * 
 * 职责范围：
 * - API Key 和 Provider 配置
 * - 模型选择和获取
 * - 连接状态管理
 * - Token 使用量监控
 */
export const useConnectionManager = () => {
  // 从核心 Hook 获取所有功能
  const { states, handlers } = useLlmConnectorLogic();

  return {
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
  };
};

/**
 * 类型定义 - 连接管理相关的返回类型
 */
export type ConnectionManagerState = ReturnType<typeof useConnectionManager>;