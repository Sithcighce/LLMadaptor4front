import { useContext } from 'react';
import { LlmConnectorContext, LlmConnectorContextType } from '../contexts/LlmConnectorContext';

/**
 * The hook that allows any child component to access the connector's states and handlers.
 */
export const useLlmConnector = (): LlmConnectorContextType => {
  const context = useContext(LlmConnectorContext);
  if (context === undefined) {
    throw new Error('useLlmConnector must be used within a LlmConnectorProvider');
  }
  return context;
};