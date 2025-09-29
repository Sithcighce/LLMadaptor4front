import React from 'react';
import BaseConnectionForm from './ConnectionForm';
import type { ConnectionFormProps } from './types';

/**
 * Connection Form Component (English).
 * Consumes logic from LlmConnectorProvider.
 */
export const ConnectionFormEn: React.FC<ConnectionFormProps> = (props) => {
  return <BaseConnectionForm {...props} />;
};