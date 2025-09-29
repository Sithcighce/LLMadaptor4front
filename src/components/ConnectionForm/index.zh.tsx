import React from 'react';
import BaseConnectionForm from './ConnectionForm';
import type { ConnectionFormProps } from './types';

/**
 * Connection Form Component (Chinese).
 * Consumes logic from LlmConnectorProvider.
 */
export const ConnectionFormZh: React.FC<ConnectionFormProps> = (props) => {
  const zhLocale = {
    title: '2. 连接设置',
    statusLabel: '状态',
    statusConnected: '已连接',
    statusNotConnected: '未连接',
    statusConnecting: '连接中...',
    providerLabel: '服务商',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: '在此输入您的 API Key',
    connectButton: '连接',
    disconnectButton: '断开',
  };

  return <BaseConnectionForm {...props} locale={{ ...zhLocale, ...props.locale }} />;
};