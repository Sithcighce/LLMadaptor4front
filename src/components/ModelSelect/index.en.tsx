import React from 'react';
import BaseModalSelect from './ModelSelect';
import type { ModelSelectProps } from './types';

/**
 * Model Selector Component (English).
 * Consumes logic from LlmConnectorProvider.
 */
export const ModelSelectEn: React.FC<ModelSelectProps> = (props) => {
  return <BaseModalSelect {...props} />;
};