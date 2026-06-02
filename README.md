# 客户管理系统 (Customer Management App)

支持客户信息管理、关系网络可视化、多人协作的 Web 应用。

**在线演示**: https://customer-mgmt-app.onrender.com

## 功能特性

- **客户信息管理**: 创建、编辑、删除客户（基本资料、联系方式、标签、备注等）
- **关系网络图谱**: 可视化展示客户间的关联关系（合作伙伴、转介绍、同行业等），支持关系强度展示
- **信息检索**: 按关键词、标签分类快速搜索客户，支持搜索建议
- **仪表盘**: 数据概览，展示客户总数、本周新增、最近操作等
- **多人协作**: 创建团队，通过邀请链接邀请成员，支持角色权限管理（拥有者/编辑者/查看者）
- **操作日志**: 记录所有创建、更新、删除操作，展示变更详情
- **重复检测**: 创建和编辑客户时自动检测可能的重复记录

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Vite + React Query + React Router + React Hook Form + Zod + Lucide Icons |
| 后端 | Python FastAPI + SQLAlchemy + Pydantic + SQLite |
| 认证 | 手机号登录 + JWT Token（首次登录自动创建账户） |
| 部署 | Render.com 免费层 |

## 快速开始

### 1. 后端启动

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

启动后会自动创建数据库表并注入演示数据。访问 http://localhost:8000/docs 查看 API 文档。

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### Docker 部署

```bash
cd docker
docker-compose up -d
```

## 演示账号

首次启动时自动注入以下演示数据：

| 角色 | 手机号 | 姓名 |
|------|--------|------|
| 管理员 | 13800000001 | 张三（管理员） |
| 成员 | 13800000002 | 小明 |
| 成员 | 13800000003 | 二黄 |
| 成员 | 13800000004 | 李四 |

也可以使用任意手机号登录，系统会自动创建新账户。

## 项目结构

```
customer-mgmt-app/
├── backend/
│   ├── app/
│   │   ├── routers/          # API 路由
│   │   │   ├── auth.py       # 登录认证
│   │   │   ├── customers.py  # 客户 CRUD
│   │   │   ├── teams.py      # 团队管理
│   │   │   ├── invitations.py# 邀请管理
│   │   │   ├── relations.py  # 客户关系
│   │   │   └── activity.py   # 操作日志
│   │   ├── services/         # 业务逻辑
│   │   ├── models.py         # 数据库模型
│   │   ├── schemas.py        # 数据验证
│   │   ├── database.py       # 数据库初始化 + 种子数据
│   │   ├── main.py           # FastAPI 入口
│   │   └── config.py         # 配置管理
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── api/              # API 调用封装
│       ├── context/          # AuthContext
│       ├── pages/            # 页面组件
│       │   ├── LoginPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── CustomerListPage.jsx
│       │   ├── CustomerDetailPage.jsx
│       │   ├── CustomerEditPage.jsx
│       │   ├── NetworkPage.jsx
│       │   ├── TeamPage.jsx
│       │   └── ActivityPage.jsx
│       └── components/       # 通用组件
├── docker/                   # Docker 配置
├── render-build.sh           # Render 构建脚本
├── render.yaml               # Render 部署配置
└── .python-version           # Python 版本锁定 (3.13.0)
```

## 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```env
DATABASE_URL=sqlite:///./data/app.db
JWT_SECRET=your-secret-key
JWT_EXPIRE_HOURS=72
```

## 部署到 Render

1. 创建 GitHub 仓库并推送代码
2. 在 Render 创建 Web Service，关联 GitHub 仓库
3. 配置：
   - **Runtime**: Python
   - **Build Command**: `bash render-build.sh`
   - **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. 添加 `.python-version` 文件指定 Python 版本
