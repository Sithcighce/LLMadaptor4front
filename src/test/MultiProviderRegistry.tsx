import React from 'react';
import { LlmConnectorProvider } from '../providers/LlmConnectorProvider';

/**
 * 多Provider注册器组件
 * 用于在不影响UI结构的情况下注册多个Client实例
 */
interface MultiProviderRegistryProps {
  providers: Array<{
    name: string;
    storageKey?: string;
  }>;
  children?: React.ReactNode;
}

export const MultiProviderRegistry: React.FC<MultiProviderRegistryProps> = ({ 
  providers, 
  children 
}) => {
  // 递归嵌套所有Provider
  const renderProviders = (index: number): React.ReactNode => {
    if (index >= providers.length) {
      return children || <div style={{ display: 'none' }} />;
    }

    const { name, storageKey } = providers[index];
    return (
      <LlmConnectorProvider name={name} storageKey={storageKey}>
        {renderProviders(index + 1)}
      </LlmConnectorProvider>
    );
  };

  return <>{renderProviders(0)}</>;
};