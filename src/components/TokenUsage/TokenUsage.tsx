import React from 'react';
import { useLlmConnector } from '../../hooks/useLlmConnector';
import type { TokenUsageLocale } from './types';

// Redefined props for the new architecture
interface TokenUsageProps {
  className?: string;
  locale?: Partial<TokenUsageLocale>;
}

const TokenUsage: React.FC<TokenUsageProps> = ({ className, locale: localeOverride }) => {
  const { states } = useLlmConnector();

  // Default locale setup
  const defaultLocale: TokenUsageLocale = {
    title: '3. Token Usage',
    inputLabel: 'Input',
    outputLabel: 'Output',
  };

  const locale = { ...defaultLocale, ...localeOverride };

  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString('en-US');

  return (
    <div className={`mb-8 ${className || ''}`}>
      <h2 className="text-lg font-semibold mb-3 text-gray-400">{locale.title}</h2>
      <div className="p-4 bg-gray-900 rounded-lg flex justify-around text-center">
        <div>
          <div className="text-xs text-gray-400 mb-1">{locale.inputLabel}</div>
          <div className="text-lg font-semibold text-gray-200">
            {states.tokenUsage ? formatNumber(states.tokenUsage.input) : '-'}
          </div>
        </div>
        <div className="border-l border-gray-700"></div>
        <div>
          <div className="text-xs text-gray-400 mb-1">{locale.outputLabel}</div>
          <div className="text-lg font-semibold text-gray-200">
            {states.tokenUsage ? formatNumber(states.tokenUsage.output) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenUsage;