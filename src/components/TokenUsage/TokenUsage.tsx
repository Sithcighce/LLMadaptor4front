import React from 'react';
import { useConnectionManager } from '../../hooks/useConnectionManager';
import type { TokenUsageLocale } from './types';

// 内嵌样式，确保开箱即用
const styles = {
  container: {
    marginBottom: '2rem',
  },
  title: {
    fontSize: '1.125rem',
    fontWeight: '600',
    marginBottom: '0.75rem',
    color: '#9CA3AF', /* text-gray-400 */
  },
  card: {
    padding: '1rem',
    backgroundColor: '#111827', /* bg-gray-900 */
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'space-around',
    textAlign: 'center' as const,
  },
  divider: {
    borderLeft: '1px solid #374151', /* border-gray-700 */
  },
  label: {
    fontSize: '0.75rem',
    color: '#9CA3AF', /* text-gray-400 */
    marginBottom: '0.25rem',
  },
  value: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#E5E7EB', /* text-gray-200 */
  },
};

// Redefined props for the new architecture
interface TokenUsageProps {
  className?: string;
  locale?: Partial<TokenUsageLocale>;
  /** 可选的Client名称，用于显式查找Client实例 */
  clientName?: string;
}

const TokenUsage: React.FC<TokenUsageProps> = ({ className, locale: localeOverride, clientName }) => {
  const { tokenUsage } = useConnectionManager(clientName);

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
    <div style={{ ...styles.container }} className={className}>
      <h2 style={styles.title}>{locale.title}</h2>
      <div style={styles.card}>
        <div>
          <div style={styles.label}>{locale.inputLabel}</div>
          <div style={styles.value}>
            {tokenUsage ? formatNumber(tokenUsage.inputTokens) : '-'}
          </div>
        </div>
        <div style={styles.divider}></div>
        <div>
          <div style={styles.label}>{locale.outputLabel}</div>
          <div style={styles.value}>
            {tokenUsage ? formatNumber(tokenUsage.outputTokens) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenUsage;