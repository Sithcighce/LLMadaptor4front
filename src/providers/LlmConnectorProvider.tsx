
import React, { ReactNode } from 'react';
import { useLlmConnectorLogic } from '../hooks/useLlmConnectorLogic';
import { LlmConnectorContext } from '../contexts/LlmConnectorContext';

/**
 * The provider component that makes the LLM connector logic available to its children.
 * It should be placed at the root of the component tree that needs access to the connector.
 */
export const LlmConnectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const logic = useLlmConnectorLogic();
  return (
    <LlmConnectorContext.Provider value={logic}>
      {children}
    </LlmConnectorContext.Provider>
  );
};
