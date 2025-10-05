import { useContext } from 'react';
import { LlmConnectorContext, LlmConnectorContextType } from '../contexts/LlmConnectorContext';
import { ClientRegistry } from '../registry/ClientRegistry';

/**
 * The hook that allows any child component to access the connector's states and handlers.
 * 
 * @param clientName - 可选的Client名称，用于显式查找指定的Client实例
 * @returns LLM Connector的状态和操作函数
 * 
 * @example
 * // 使用Context查找（默认行为）
 * const { llmClient, states, handlers } = useLlmConnector();
 * 
 * @example  
 * // 显式指定Client名称
 * const { llmClient } = useLlmConnector('chat');
 */
export const useLlmConnector = (clientName?: string): LlmConnectorContextType => {
  if (clientName) {
    // 显式指定Client名称，从注册中心获取
    return ClientRegistry.getOrThrow(clientName);
  }
  
  // 默认行为：使用Context查找
  const context = useContext(LlmConnectorContext);
  if (context === undefined) {
    throw new Error('useLlmConnector must be used within a LlmConnectorProvider or specify a clientName');
  }
  return context;
};