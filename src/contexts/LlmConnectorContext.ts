import { createContext } from 'react';
import type { useLlmConnectorLogic } from '../hooks/useLlmConnectorLogic';

// Define the shape of the context data
export type LlmConnectorContextType = ReturnType<typeof useLlmConnectorLogic>;

// Create the context
export const LlmConnectorContext = createContext<LlmConnectorContextType | undefined>(undefined);