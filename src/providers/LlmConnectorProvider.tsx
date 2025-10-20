
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
  
  // Ensure the client is registered synchronously during render so
  // child components that call useLlmConnector(name) during their
  // render won't fail due to registration happening only in an effect.
  // We still keep effects for cleanup and updates.
  try {
    ClientRegistry.register(name, logicRef.current);
  } catch (e) {
    // Defensive: registration should be idempotent; swallow any unexpected errors
    // to avoid breaking the render path.
    // eslint-disable-next-line no-console
    console.warn('[LlmConnectorProvider] synchronous register warning', e);
  }
  
  // 注册表卸载清理：组件卸载时注销
  useEffect(() => {
    return () => {
      console.log(`[LlmConnectorProvider] Unregistering client: "${name}"`);
      ClientRegistry.unregister(name);
    };
  }, [name]);
  
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
