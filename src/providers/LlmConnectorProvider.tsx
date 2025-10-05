
import React, { ReactNode, useEffect } from 'react';
import { useLlmConnectorLogic } from '../hooks/useLlmConnectorLogic';
import { LlmConnectorContext } from '../contexts/LlmConnectorContext';
import { ClientRegistry } from '../registry/ClientRegistry';

/**
 * Props for LlmConnectorProvider
 */
interface LlmConnectorProviderProps {
  children: ReactNode;
  /** 实例名称，用于显式查找Client */
  name?: string;
  /** localStorage存储键，用于配置隔离 */
  storageKey?: string;
}

/**
 * The provider component that makes the LLM connector logic available to its children.
 * It should be placed at the root of the component tree that needs access to the connector.
 * 
 * @param name - 可选的实例名称，用于显式Client查找
 * @param storageKey - 可选的存储键，用于配置隔离
 */
export const LlmConnectorProvider: React.FC<LlmConnectorProviderProps> = ({ 
  children, 
  name = 'default',
  storageKey 
}) => {
  const finalStorageKey = storageKey || `llm-connector-${name}`;
  const logic = useLlmConnectorLogic(finalStorageKey);
  
  // 注册到全局Client注册中心
  useEffect(() => {
    ClientRegistry.register(name, logic);
    
    // 返回清理函数
    return () => {
      ClientRegistry.unregister(name);
    };
  }, [name, logic]);

  return (
    <LlmConnectorContext.Provider value={logic}>
      {children}
    </LlmConnectorContext.Provider>
  );
};
