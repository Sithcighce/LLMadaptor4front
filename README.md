<p align="center">
  <img width="200px" src="https://raw.githubusercontent.com/react-chatbotify-plugins/llm-connector/main/src/assets/logo.webp" />
  <h1 align="center">LLM Connector</h1>
</p>

<p align="center">
  <a href="https://github.com/react-chatbotify-plugins/llm-connector/actions/workflows/ci-cd-pipeline.yml"> <img src="https://github.com/react-chatbotify-plugins/llm-connector/actions/workflows/ci-cd-pipeline.yml/badge.svg" /> </a>
  <a href="https://www.npmjs.com/package/@rcb-plugins/llm-connector"> <img src="https://img.shields.io/npm/v/@rcb-plugins/llm-connector?logo=semver&label=version&color=%2331c854" /> </a>
  <a href="https://www.npmjs.com/package/@rcb-plugins/llm-connector"> <img src="https://img.shields.io/badge/react-16--19-orange?logo=react&label=react" /> </a>
</p>

## 简介

`LLM Connector` is a React library designed to solve the "bring your own API key" problem in front-end applications. It provides a powerful logic core and a set of beautiful, independent UI components to let your users connect to hundreds of LLM providers securely and easily, without needing a backend.

## The Problem

In the world of AI applications, developers face a dilemma. End-users often have their own API keys from various sources:
- Official providers like OpenAI and Anthropic.
- Third-party proxy services that are cheaper or offer special models.
- Self-hosted models with custom URLs.

Forcing users to re-configure these keys in every new app is tedious. Building a UI for this is repetitive for developers. Most existing solutions (like Vercel AI SDK) require a backend to manage keys, which doesn't fit the "user-provided key" model.

## Our Solution

`LLM Connector` solves this by providing a **purely front-end** solution with two primary ways to use it:

1.  **The Plug-and-Play Components**: A set of pre-built, independent React components for model selection, connection settings, and token usage display.
2.  **The Logic Core**: A powerful set of React Hooks that handle all the state management, configuration persistence, and client creation, allowing you to build a completely custom UI.

At its heart, `LLM Connector` uses [Token.js](https://github.com/token-js/token.js) as its engine, enabling it to connect to over 200 LLM providers directly from the browser.

## Quick Start

Install the library:
```bash
npm install @rcb-plugins/llm-connector
```

### Option 1: The Plug-and-Play Way

This is the easiest way to get started. Wrap your application with `LlmConnectorProvider`, then place the independent UI components anywhere you like. They will work together automatically.

```tsx
import React from 'react';
import {
  LlmConnectorProvider,
  ConnectionFormEn,
  ModelSelectEn,
  TokenUsageEn,
  useLlmConnector
} from '@rcb-plugins/llm-connector';

// A component to test the chat functionality
const ChatButton = () => {
  const { llmClient } = useLlmConnector();

  if (!llmClient) return null;

  return (
    <button onClick={async () => {
      const result = await llmClient.chat({ messages: [{ role: 'user', content: 'Hello!' }] });
      alert(result.text);
    }}>
      Say Hello
    </button>
  );
}

// Your main application
function App() {
  return (
    <LlmConnectorProvider>
      <header>
        <h2>My App</h2>
        <ModelSelectEn />
      </header>
      <main>
        <p>Main content of my application...</p>
        <ChatButton />
      </main>
      <aside>
        <ConnectionFormEn />
        <TokenUsageEn />
      </aside>
    </LlmConnectorProvider>
  );
}
```

### Option 2: The Custom UI Way

If you want to build your own UI from scratch, you can use the `useLlmConnector` hook, which provides all the states and handlers you need.

```tsx
import React from 'react';
import { LlmConnectorProvider, useLlmConnector } from '@rcb-plugins/llm-connector';

const MyCustomConnectorUI = () => {
  const { states, handlers, llmClient } = useLlmConnector();

  return (
    <div>
      <p>Status: {states.status}</p>
      <input
        type="password"
        placeholder="Enter your API Key"
        value={states.apiKey}
        onChange={(e) => handlers.setApiKey(e.target.value)}
        disabled={states.status === 'connected'}
      />
      <button onClick={handlers.handleConnect} disabled={states.status !== 'disconnected'}>
        Connect
      </button>
      {llmClient && <p>Connected!</p>}
    </div>
  );
}

function App() {
  return (
    <LlmConnectorProvider>
      <MyCustomConnectorUI />
    </LlmConnectorProvider>
  );
}
```

## API Reference

### Providers

-   **`<LlmConnectorProvider>`**: The root provider component that must wrap your application.

### Hooks

-   **`useLlmConnector()`**: The primary hook to access the connector's state and handlers from within the `LlmConnectorProvider`.
-   **`useLlmConnectorLogic()`**: The core logic hook. Use this only if you need to manage the logic outside of the provided context.

### UI Components

Each component comes in an English (`...En`) and Chinese (`...Zh`) version. They accept `className` and `locale` props for customization.

-   **`<ConnectionFormEn />` / `<ConnectionFormZh />`**: A form for setting the provider, API key, and base URL.
-   **`<ModelSelectEn />` / `<ModelSelectZh />`**: A dropdown for selecting the model.
-   **`<TokenUsageEn />` / `<TokenUsageZh />`**: A display for input and output token usage.

### Main Client

-   **`LlmClient`**: The standardized client object returned by the hook after a successful connection. Its main method is `chat(request)`.

## Known Issues

### UI Alignment with Demo
- **Issue**: Default UI components do not perfectly match the UIdemo.html styling and layout
- **Status**: ⚠️ Pending resolution
- **Details**: The current React components should be aligned with the static UIdemo.html design for consistent visual appearance
- **Impact**: Visual inconsistencies between demo and actual component rendering

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.