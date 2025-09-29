import React from 'react';
import BaseModalSelect from './ModelSelect';
import type { ModelSelectProps } from './types';

/**
 * Model Selector Component (Chinese).
 * Consumes logic from LlmConnectorProvider.
 */
export const ModelSelectZh: React.FC<ModelSelectProps> = (props) => {
  const zhLocale = {
    title: '1. 模型选择器',
    placeholder: '选择一个模型',
    fetchButton: '刷新',
    fetching: '获取中...',
    empty: '无可用模型',
  };

  return <BaseModalSelect {...props} locale={{ ...zhLocale, ...props.locale }} />;
};