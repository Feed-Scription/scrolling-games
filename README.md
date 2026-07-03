# 🎮 AI游戏世界 - Scrolling Games

一个AI互动游戏平台：AI实时生成的H5小游戏。

## 功能特点

- **AI实时生成** - 每个游戏由AI实时生成，永不重复
- **智能推荐** - 根据你的游玩行为推荐更合适的游戏
- **异步预加载** - 提前生成游戏缓存，滑动即玩
- **一键导出** - 将所有生成的游戏打包为ZIP下载
- **纯静态部署** - 无需后端，支持GitHub Pages

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173/scrolling-games/`

### 构建生产版本

```bash
npm run build
```

## 使用说明

1. **首次使用** - 选择你感兴趣的游戏类型标签
2. **配置API** - 前往设置页面配置API Key（首次会使用内置测试Key）
3. **开始游戏** - 在游戏页面点击底部箭头切换不同的AI生成的小游戏
4. **查看记忆** - 在记忆页面查看AI对你偏好的分析
5. **导出游戏** - 在导出页面将所有游戏打包下载

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **AI接口**: OpenAI 兼容 API（默认 xiaomi/mimo-v2.5-pro-ultraspeed）

## 部署

推送到 `main` 分支后，GitHub Actions 会自动构建并部署到 GitHub Pages。

需要在仓库设置中启用 Pages，Source 选择 "GitHub Actions"。

## 项目结构

```
src/
├── components/          # Vue组件
│   ├── pages/          # 页面组件
│   └── ...             # 通用组件
├── composables/        # 组合式函数
├── pregames/           # 预置游戏（缓存种子）
├── prompts/            # AI提示词模板
├── stores/             # 状态管理
├── types/              # TypeScript类型定义
└── utils/              # 工具函数
```

## 许可证

[Apache-2.0](LICENSE)
