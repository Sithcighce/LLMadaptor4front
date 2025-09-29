import React from 'react';
import BaseTokenUsage from './TokenUsage';
import type { TokenUsageProps } from './types';

/**
 * Token Usage Component (Chinese).
 * Consumes logic from LlmConnectorProvider.
 */
export const TokenUsageZh: React.FC<TokenUsageProps> = (props) => {
  const zhLocale = {
    title: '3. Token 使用情况',
    inputLabel: '输入',
    outputLabel: '输出',
  };

  return <BaseTokenUsage {...props} locale={{ ...zhLocale, ...props.locale }} />;
};