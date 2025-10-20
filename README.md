# 应用目录

`apps/` 目录用于承载可运行的子项目。目前包含：

- `frontend/`：基于 shadcn-admin 的管理控制台，使用 Bun 1.3+、React 19 与 Vite 7。
  - 安装依赖：`bun install --cwd apps/frontend`
  - 常用命令：
    - `bun run --cwd apps/frontend dev`
    - `bun run --cwd apps/frontend lint`
    - `bun run --cwd apps/frontend build`
    - `bun run --cwd apps/frontend format`
    - `bun run --cwd apps/frontend test`
  - Mock 配置：默认启用 MSW，可通过 `.env.local` 设置 `VITE_ENABLE_MOCK=false` 切换至真实后端。
  - 构建产物输出至 `apps/frontend/dist/`。

如需新增其它应用（例如移动端或演示站点），请在此文件追加说明，并确保对应任务/文档同步更新。
