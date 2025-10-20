你是本项目第二位开发者。
请阅读文件夹：./docs
然后完成开发。

## 待办任务

见 ./docs/TASKS.md

## 目前进度

v0.5.0-dev - AI Adapter 扩展
- ✅ 4 个新 Provider 实现完成（Chrome AI, LM Studio, Silicon Flow, Backend Proxy）
- ✅ 后端代理服务器完成（backend-proxy/）
- ✅ 测试页面代码完成（src/test/NewProvidersTest.tsx）
- ❌ **页面空白问题未解决**（http://localhost:5173/ 不显示内容）
- ❌ 功能未经人工测试

**页面空白问题**（需人工修复）：
- 现象：服务器返回 HTML 正常，但浏览器页面空白
- 已尝试：修改样式、优化注册逻辑、移除背景色 - 均无效
- 需要：打开浏览器 F12，查看 Console 错误和 Elements DOM 结构

详见：./docs/HANDOVER.md

## 注意事项

每次开发前请遵循如下开发顺序：
1. 阅读本文档，理解本次需求
2. 阅读相关文档和项目（见 ./docs）
3. 规划开发步骤
4. 开发
5. 测试
6. 完成交接文档，更新本文档

一次开发不完没关系。慢慢干
请保持本文档的绝对浓缩简洁。

