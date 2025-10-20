# 📚 项目文档# 📚 LLM Connector 文档中心



## 🔥 核心文档（必读）## 🔥 必读文档



1. **[HANDOVER.md](./HANDOVER.md)** - 项目交接文档### [HANDOVER.md](./HANDOVER.md) ⭐

   - 当前状态和已知问题**项目交接文档** - 当前状态、关键问题、下一步行动

   - 环境配置和调试方法

   - 下一步行动指南### [TASKS.md](./TASKS.md)

**开发任务清单** - 待办任务和优先级

2. **[TASKS.md](./TASKS.md)** - 开发任务清单

   - 优先级排序的待办任务### [AI-Adapter-Architecture.md](./AI-Adapter-Architecture.md)

   - 已完成和未完成功能**架构设计** - 整体架构和技术选型

   - 进度跟踪

### [AI-Adapter-Implementation.md](./AI-Adapter-Implementation.md)

## 📖 技术文档**实现细节** - 代码结构和核心模块



### 架构与实现---

- [AI-Adapter-Architecture.md](./AI-Adapter-Architecture.md) - 整体架构设计

- [AI-Adapter-Implementation.md](./AI-Adapter-Implementation.md) - 实现细节## 📖 详细文档

- [项目定位与边界.md](./项目定位与边界.md) - 项目范围

### Provider 文档

### Provider 文档`docs/providers/` - 8 个 AI Provider 的配置和使用说明

[providers/](./providers/) - 8 个 AI Provider 配置说明

- OpenAI, Anthropic, Gemini, WebLLM (原有)### API 文档

- Chrome AI, LM Studio, Silicon Flow, Backend Proxy (新增)`docs/api/` - Hooks 和组件 API 参考



### API 参考### 开发记录

- [api/hooks.md](./api/hooks.md) - React Hooks API`docs/开发记录/` - 版本历史和开发报告

- [features/](./features/) - 功能特性文档

### 需求文档

## 📝 历史记录`docs/最新需求/` - 当前需求和规划



- [开发记录/](./开发记录/) - 版本历史、架构演进---

- [经验教训/](./经验教训/) - 开发经验总结

- [其他/](./其他/) - 技术分析和讨论**快速开始**: 阅读 `HANDOVER.md` 和 `TASKS.md`

- [现状和目标/](./现状和目标/) - 项目介绍和目标

## 📖 文档导航

## 🎯 需求与规划

### 🎯 项目概览

- [最新需求/](./最新需求/) - 当前开发需求- [项目规划](./PROJECT_ROADMAP.md) - 发展方向和技术路线图 ⭐

- [PROJECT_ROADMAP.md](./PROJECT_ROADMAP.md) - 项目路线图- [项目介绍](./现状和目标/项目介绍.md) - 项目简介和API参考（英文版）

- [NEXT_STEPS.md](./NEXT_STEPS.md) - 下一步计划- [项目介绍_中文](./现状和目标/项目介绍_中文.md) - 项目简介和API参考（中文版）

- [项目目标](./现状和目标/项目目标.md) - 核心功能目标和开发计划

---- [项目现状分析](./现状和目标/项目现状分析.md) - 项目进展对比和完成度分析



**快速导航**：### 🚀 核心功能

- 接手项目 → [HANDOVER.md](./HANDOVER.md)- [显式Client名称传入](./features/explicit-client-naming.md) - 多实例管理解决方案 ⭐⭐⭐

- 看任务 → [TASKS.md](./TASKS.md)- [Provider系统](./providers/) - 支持的LLM提供商配置指南

- 懂架构 → [AI-Adapter-Architecture.md](./AI-Adapter-Architecture.md)

- 用 Provider → [providers/](./providers/)### 📖 API文档

- [Hooks API](./api/hooks.md) - React Hooks详细说明
- [组件API](./components/) - UI组件属性和用法（待补充）
- [Client API](./client/) - LlmClient接口说明（待补充）

### 🛠️ 开发指南
- [核心架构设计](./开发记录/核心架构设计.md) - LlmConnector 与统一客户端的架构说明
- [Hooks架构设计](./开发记录/Hooks架构设计.md) - React Hooks 的设计原则和使用规范
- [版本更新记录](./开发记录/版本更新记录.md) - 版本发布历史和更新内容

### 💡 技术深度分析
- [Context最近上级机制可靠性分析](./其他/Context最近上级机制可靠性分析.md) - React Context查找机制深度分析
- [多实例支持分析](./其他/多实例支持分析.md) - 多实例需求分析和技术实现方案
- [显式Client名称传入方案](./其他/显式Client名称传入方案.md) - 通过显式传参解决组件绑定不确定性
- [前端组件实例绑定机制](./其他/前端组件实例绑定机制.md) - 三个基础UI组件的自动绑定机制分析

### 📝 开发经验
- [显式Client名称传入功能实现报告](./开发记录/显式Client名称传入功能实现报告.md) - 多实例支持的完整技术实现
- [显式Client名称传入功能验证报告](./开发记录/显式Client名称传入功能验证报告.md) - 功能测试验证和生产就绪确认
- [组件提取经验](./经验教训/组件提取经验.md) - 从 useConnectorController 中提取组件的经验
- [聊天工具提取经验](./经验教训/聊天工具提取经验.md) - 核心聊天管理工具的提取和重构经验
- [多实例客户端绑定问题](./经验教训/多实例客户端绑定问题.md) - 多实例场景下的用户体验问题和解决方案

### � 实用资源
- [使用场景分析](./其他/使用场景分析.md) - 不同使用场景的路径选择指南
- [命名实例管理示例](./其他/命名实例管理示例.md) - 通过名字管理多实例的具体实现示例
- [跨页面组件绑定问题分析](./其他/跨页面组件绑定问题分析.md) - 开发中可能遇到的Provider作用域问题
- [开发待办事项](./其他/开发待办事项.md) - 详细的开发计划和优先级

---

## 🏆 项目核心亮点

### ✅ 已完成的重大功能
- **显式Client名称传入功能** ⭐⭐⭐ - 彻底解决React Context"最近的上级"可靠性问题
- **多实例配置隔离** - 每个Client实例独立存储和管理
- **跨组件树访问** - 不受React组件树结构限制的Client访问
- **完整Provider生态** - OpenAI、Anthropic、Gemini、WebLLM全覆盖
- **双语UI组件** - 中英文界面完整支持

### 🚧 正在完善
- UI组件样式对齐
- 测试覆盖增强
- 文档体系完善

### 📋 规划中
- 高级配置选项
- 开发者工具集成
- 性能优化

---

## 🎯 快速导航建议

### 👨‍💻 开发者首次了解
1. [项目规划](./PROJECT_ROADMAP.md) - 了解项目定位和技术创新点
2. [显式Client名称传入](./features/explicit-client-naming.md) - 了解核心技术突破
3. [Hooks API](./api/hooks.md) - 掌握使用方法

### 🔧 集成到项目
1. [项目介绍](./现状和目标/项目介绍.md) - 快速开始指南
2. [Provider配置](./providers/) - 配置你需要的LLM服务商
3. [使用场景分析](./其他/使用场景分析.md) - 选择合适的使用模式

### 🧠 深入理解技术
1. [Context可靠性分析](./其他/Context最近上级机制可靠性分析.md) - 理解问题本质
2. [多实例支持分析](./其他/多实例支持分析.md) - 理解解决方案
3. [架构设计文档](./开发记录/核心架构设计.md) - 理解整体架构

---

*最后更新：2025年10月1日*