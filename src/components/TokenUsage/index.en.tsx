import React from 'react';
import BaseTokenUsage from './TokenUsage';
import type { TokenUsageProps } from './types';

/**
 * Token Usage Component (English).
 * Consumes logic from LlmConnectorProvider.
 */
export const TokenUsageEn: React.FC<TokenUsageProps> = (props) => {
  return <BaseTokenUsage {...props} />;
};