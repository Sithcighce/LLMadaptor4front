# Silicon Flow Provider

硅基流动（Silicon Flow）中国 LLM 提供商支持。

## 概述

Silicon Flow（硅基流动）是一个中国的 LLM API 提供商，提供多种开源模型的 API 访问，价格实惠，国内访问速度快。

## 特性

- ✅ **国内访问快** - 服务器在中国
- ✅ **价格实惠** - 比国外服务便宜
- ✅ **多模型支持** - Qwen, DeepSeek, Yi 等
- ✅ **OpenAI 兼容** - 使用 OpenAI API 格式
- ✅ **中文支持好** - 针对中文优化的模型

## 注册和获取 API Key

1. 访问 [https://siliconflow.cn](https://siliconflow.cn)
2. 注册账号
3. 充值（支持支付宝、微信）
4. 在控制台获取 API Key

## 使用方法

### 1. 配置 API Key

```typescript
import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';

function MyComponent() {
  const { handlers } = useLlmConnector();
  
  const connect = async () => {
    handlers.setProviderId('siliconflow');
    handlers.setApiKey('your-api-key-here');
    handlers.setBaseUrl('https://api.siliconflow.cn/v1');
    handlers.setModel('Qwen/Qwen2.5-7B-Instruct');
    await handlers.handleConnect();
  };
  
  return <button onClick={connect}>连接 Silicon Flow</button>;
}
```

### 2. 获取模型列表

```typescript
import { fetchSiliconFlowModels } from 'llm-connector';

const models = await fetchSiliconFlowModels('your-api-key', 'https://api.siliconflow.cn/v1');
console.log('可用模型:', models);
```

### 3. 聊天

```typescript
const { llmClient } = useLlmConnector();

const chat = async () => {
  const result = await llmClient.chat({
    messages: [
      { role: 'user', content: '你好，介绍一下你自己' }
    ],
    stream: false
  });
  console.log(result.text);
};
```

## 配置参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `apiKey` | string | ✅ | - | 从 siliconflow.cn 获取 |
| `baseUrl` | string | ✅ | `'https://api.siliconflow.cn/v1'` | API 端点 |
| `model` | string | ✅ | `'Qwen/Qwen2.5-7B-Instruct'` | 模型名称 |

## 推荐模型

### 通用对话
- **Qwen/Qwen2.5-7B-Instruct** - 平衡性能，中文好
- **Qwen/Qwen2.5-14B-Instruct** - 更强能力
- **Qwen/Qwen2.5-72B-Instruct** - 最强性能

### 代码生成
- **Qwen/Qwen2.5-Coder-7B-Instruct**
- **deepseek-ai/DeepSeek-Coder-V2-Instruct**

### 长文本
- **Qwen/Qwen2.5-7B-Instruct** (128K 上下文)

### 多语言
- **Qwen/QwQ-32B-Preview** - 推理能力强

## 价格参考

（价格可能变动，以官网为准）

| 模型系列 | 输入价格 | 输出价格 |
|---------|---------|---------|
| Qwen 7B | ¥0.35/M tokens | ¥0.35/M tokens |
| Qwen 14B | ¥0.7/M tokens | ¥0.7/M tokens |
| Qwen 72B | ¥4.13/M tokens | ¥4.13/M tokens |

## 环境变量配置

```env
# .env
SILICONFLOW_API_KEY=sk-xxxxxxxxxxxxx
```

## 故障排查

### API Key 错误
1. 确认 API Key 正确
2. 检查账户余额
3. 确认 API Key 未过期

### 连接失败
1. 检查网络连接
2. 确认 baseUrl 正确
3. 检查是否被防火墙拦截

### 模型不可用
1. 确认模型名称正确（区分大小写）
2. 检查账户权限
3. 查看官网模型列表

### 速率限制
1. 降低请求频率
2. 升级账户等级
3. 使用多个 API Key 轮换

## 适用场景

- ✅ 中国大陆用户
- ✅ 中文应用
- ✅ 成本敏感项目
- ✅ 快速原型
- ✅ 需要国内服务器的应用

## 对比其他服务

| 特性 | Silicon Flow | OpenAI | 本地模型 |
|------|-------------|--------|---------|
| 价格 | 💰 便宜 | 💰💰 贵 | 🆓 免费 |
| 国内速度 | ⚡ 快 | 🐌 慢 | ⚡⚡ 最快 |
| 模型选择 | 📚 多 | 📚📚 最多 | 📕 有限 |
| 中文能力 | 🇨🇳 优秀 | 🌍 一般 | 🇨🇳 看模型 |
| 配置难度 | 😊 简单 | 😊 简单 | 😰 复杂 |

## 参考资料

- [Silicon Flow 官网](https://siliconflow.cn)
- [API 文档](https://docs.siliconflow.cn)
- [模型列表](https://siliconflow.cn/models)
- [价格说明](https://siliconflow.cn/pricing)
