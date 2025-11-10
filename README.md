# 代码库知识图谱平台

<div align="center">

**企业级代码库知识管理与智能问答系统**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)

</div>

## 📖 项目简介

代码库知识图谱平台是一个企业级的智能代码知识管理系统，通过自动化索引代码仓库，构建代码知识图谱，并提供基于 RAG（检索增强生成）的智能问答能力。帮助开发团队快速理解代码库结构、查询代码逻辑、提升开发效率。

### 核心价值

- 🔍 **智能代码理解**：自动分析代码仓库，提取函数、类、模块等代码实体及其关系
- 💡 **智能问答系统**：基于 RAG 技术，提供准确的代码问答和知识检索
- 📊 **知识图谱可视化**：直观展示代码结构和依赖关系
- 🔐 **企业级权限管理**：完善的 RBAC 权限体系和审计日志
- 🚀 **高效索引引擎**：支持增量索引和全量索引，快速更新代码知识库

## ✨ 主要功能

### 知识源管理

- **代码仓库管理**：支持 GitHub、GitLab 等代码托管平台
- **多分支支持**：可配置索引特定分支
- **智能过滤**：自定义包含/排除文件模式
- **访问控制**：支持 Token 认证方式访问私有仓库

### RAG 智能问答

- **上下文感知**：基于代码知识图谱提供精准答案
- **证据追溯**：答案附带源代码片段和文件位置
- **实时流式输出**：流畅的问答交互体验
- **多轮对话**：支持连续对话，保持上下文

### 知识管理

- **知识库浏览**：探索和浏览已索引的代码知识
- **知识笔记**：保存重要的代码片段和发现
- **全文搜索**：快速检索代码和文档内容

### 管理控制台

- **仓库监控**：查看索引状态、任务进度
- **用户管理**：用户账号、角色和权限配置
- **策略管理**：配置系统策略和规则
- **审计日志**：完整的操作审计追踪

## 🏗️ 技术架构

### 前端技术栈

- **框架**：React 19 - 最新的 React 版本，性能优化
- **构建工具**：Vite 7 - 极速的开发服务器和构建工具
- **运行时**：Bun 1.3+ - 高性能 JavaScript 运行时
- **路由**：TanStack Router - 类型安全的路由系统
- **状态管理**：TanStack Query + Zustand - 服务端状态和客户端状态管理
- **UI 组件**：Radix UI + Tailwind CSS - 无障碍、可定制的组件库
- **表单处理**：React Hook Form + Zod - 类型安全的表单验证
- **图表可视化**：Recharts - 数据可视化
- **Markdown 渲染**：React Markdown + Rehype Pretty Code - 代码高亮展示

### 代码质量工具

- **代码检查**：ESLint + Oxlint - 双重代码质量保障
- **代码格式化**：Prettier - 统一代码风格
- **类型检查**：TypeScript 5.9 - 类型安全
- **测试框架**：Vitest - 单元测试

## 🚀 快速开始

### 环境要求

- Node.js 18+ 或 Bun 1.3+
- Git

### 安装依赖

```bash
cd frontend
bun install
```

### 环境配置

创建 `.env.local` 文件：

```bash
# Clerk 认证配置（如使用 Clerk）
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

### 开发模式

```bash
bun run dev
```

访问 http://localhost:5173 查看应用

### 构建生产版本

```bash
bun run build
```

构建产物将输出到 `frontend/dist/` 目录

### 代码检查与格式化

```bash
# 运行 ESLint 检查
bun run lint

# 自动修复代码问题
bun run lint:fix

# 格式化代码
bun run format

# 检查代码格式
bun run format:check
```

### 运行测试

```bash
# 运行测试
bun run test

# 监听模式运行测试
bun run test:watch
```

## 📁 项目结构

```
codebase-knowledge/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── pages/           # 页面组件
│   │   ├── routes/          # 路由配置
│   │   ├── stores/          # 状态管理
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── lib/             # 工具库和服务
│   │   ├── types/           # TypeScript 类型定义
│   │   └── styles/          # 样式文件
│   ├── public/              # 静态资源
│   ├── tests/               # 测试文件
│   └── package.json
├── LICENSE
└── README.md
```

## 🔧 开发指南

### 代码规范

项目使用 ESLint 和 Prettier 确保代码质量和一致性。提交代码前请确保：

1. 代码通过 `bun run lint` 检查
2. 代码已通过 `bun run format` 格式化
3. 所有测试通过 `bun run test`

### 组件开发

- 使用 shadcn/ui 组件库进行 UI 开发
- 遵循 React 最佳实践和 Hooks 使用规范
- 保持组件的单一职责和可复用性

### 状态管理

- 服务端数据使用 TanStack Query 管理
- 客户端状态使用 Zustand 管理
- 表单状态使用 React Hook Form

### 类型安全

- 所有 API 请求和响应需定义 TypeScript 类型
- 使用 Zod 进行运行时数据验证
- 避免使用 `any` 类型

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 👥 作者

Copyright (c) 2025 Roy Zhu

## 🙏 致谢

感谢所有开源项目和贡献者，让这个项目得以实现。
