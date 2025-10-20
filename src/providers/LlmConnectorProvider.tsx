
import React, { ReactNode, useEffect, useRef } from 'react';
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
  
  // 使用 ref 存储 logic 的最新引用
  const logicRef = useRef(logic);
  logicRef.current = logic;
  
  // 注册到全局Client注册中心
  // 只在组件挂载时注册一次，避免因 logic 引用变化导致重复注册
  useEffect(() => {
    console.log(`[LlmConnectorProvider] Registering client: "${name}"`);
    
    // 注册时使用一个函数来获取最新的 logic
    ClientRegistry.register(name, logicRef.current);
    
    // 返回清理函数，只在组件卸载时执行
    return () => {
      console.log(`[LlmConnectorProvider] Unregistering client: "${name}"`);
      ClientRegistry.unregister(name);
    };
  }, [name]); // 只依赖 name
  
  // 每当 logic 更新时，更新注册表中的引用
  useEffect(() => {
    console.log(`[LlmConnectorProvider] Updating client logic: "${name}"`);
    ClientRegistry.register(name, logicRef.current);
  }, [name, logic]);

  return (
    <LlmConnectorContext.Provider value={logic}>
      {children}
    </LlmConnectorContext.Provider>
  );
};
