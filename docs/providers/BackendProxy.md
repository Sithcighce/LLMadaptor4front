# Backend Proxy Provider

**模式 3: 后端代理** - 通过后端服务器统一管理 API Keys。

## 概述

Backend Proxy 是本库支持的三种推理模式之一,与前端 BYOK 和端侧推理同等重要。

### 三种推理模式对比

| 模式 | API Key 位置 | 适用场景 |
|------|-------------|----------|
| **前端 BYOK** | 用户浏览器 | 个人项目、用户自己管理密钥 |
| **端侧推理** | 无需 Key | Chrome AI、WebLLM 本地运行 |
| **后端代理** | 后端服务器 | 企业统一管理、本地模型服务器 |

### Backend Proxy 适用场景

**适合使用**:
- ✅ 企业内部工具，需要统一管理 API Key
- ✅ 不想让员工接触真实密钥
- ✅ 需要集中控制和审计 AI 调用
- ✅ 使用本地模型服务器(如 LM Studio)

**架构说明**:

Backend Proxy 模式允许您将 API Keys 存储在后端服务器上,前端不需要接触密钥。

## 架构

```
前端 (React)
    ↓ HTTP Request (无需 API Key)
后端代理服务器 (Express.js)
    ↓ 添加统一管理的 API Key
AI Provider (OpenAI/Silicon Flow/etc)
```

## 特性

- ✅ **企业管理** - 公司统一管理 API Keys
- ✅ **员工隔离** - 员工不接触真实密钥
- ✅ **集中控制** - 统一配置多个 Provider
- ✅ **SSE 流式** - 支持流式响应
- ✅ **格式转换** - 自动转换不同 Provider 的格式

## 服务器实现

### 1. 安装依赖

```bash
cd backend-proxy
npm install
```

### 2. 配置环境变量

创建 `backend-proxy/.env`:

```env
PORT=3003

# AI Provider API Keys
SILICONFLOW_API_KEY=sk-xxxxx
OPENAI_API_KEY=sk-xxxxx
GEMINI_API_KEY=AIxxxxx

# LM Studio (本地)
LMSTUDIO_BASE_URL=http://127.0.0.1:1234
```

### 3. 启动服务器

```bash
cd backend-proxy
node server.js
```

服务器将运行在 `http://localhost:3003`

## 前端使用

### 1. 配置连接

```typescript
import { LlmConnectorProvider, useLlmConnector } from 'llm-connector';

function MyComponent() {
  const { handlers } = useLlmConnector();
  
  const connect = async () => {
    handlers.setProviderId('backend-proxy');
    handlers.setBaseUrl('http://localhost:3003/api/ai/proxy');
    handlers.setModel('siliconflow'); // 或 'openai', 'gemini', 'lmstudio'
    await handlers.handleConnect();
  };
  
  return <button onClick={connect}>连接后端代理</button>;
}
```

### 2. 发送请求

```typescript
const { llmClient } = useLlmConnector();

// 非流式
const result = await llmClient.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: false
});
console.log(result.text);

// 流式
const stream = await llmClient.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.text) {
    process.stdout.write(chunk.text);
  }
}
```

## API 端点

### POST /api/ai/proxy

代理 AI 请求到实际的 Provider。

**请求格式**:
```json
{
  "provider": "siliconflow",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "stream": false
}
```

**响应格式（非流式）**:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      }
    }
  ]
}
```

**响应格式（流式）**: SSE 事件流

```
data: {"choices":[{"delta":{"content":"Hello"}}]}

data: {"choices":[{"delta":{"content":"!"}}]}

data: [DONE]
```

### GET /api/ai/proxy/health

健康检查端点。

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

## 支持的 Provider

| Provider | Model 值 | 说明 |
|----------|----------|------|
| Silicon Flow | `siliconflow` | 使用 SILICONFLOW_API_KEY |
| OpenAI | `openai` | 使用 OPENAI_API_KEY |
| Gemini | `gemini` | 使用 GEMINI_API_KEY |
| LM Studio | `lmstudio` | 转发到本地 LM Studio |

## 配置参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `baseUrl` | string | ✅ | `'http://localhost:3003/api/ai/proxy'` | 代理端点 |
| `model` | string | ✅ | - | Provider 类型 |
| `apiKey` | string | ❌ | - | 前端不需要 |

## 安全考虑

### ✅ 优点
- API Keys 存储在服务器上
- 不会暴露在前端代码中
- 可以添加访问控制
- 可以记录和限制使用量

### ⚠️ 注意事项
- 需要部署后端服务器
- 后端服务器需要妥善保护
- 建议添加身份验证
- 建议使用 HTTPS

## 生产部署

### 添加身份验证

```javascript
// server.js
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  
  if (!token || token !== `Bearer ${process.env.API_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
};

app.post('/api/ai/proxy', authenticateToken, async (req, res) => {
  // ... 处理请求
});
```

### 添加速率限制

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100 // 限制 100 个请求
});

app.use('/api/ai/proxy', limiter);
```

### 使用 HTTPS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

https.createServer(options, app).listen(3003);
```

## 故障排查

### 连接失败
1. 确认后端服务器正在运行
2. 检查 baseUrl 是否正确
3. 检查网络和防火墙

### API Key 错误
1. 检查 .env 文件配置
2. 确认环境变量已加载
3. 验证 API Keys 有效

### 流式响应不工作
1. 确认使用 SSE
2. 检查浏览器支持
3. 查看服务器日志

## 适用场景

- ✅ 生产环境部署
- ✅ 需要保护 API Keys
- ✅ 多用户应用
- ✅ 需要使用量统计
- ✅ 需要访问控制

## 参考资料

- [Express.js 文档](https://expressjs.com/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [后端代理 README](../../backend-proxy/README.md)
