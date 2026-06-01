# 客户管理系统 (Customer Management App)

支持客户信息上传、检索及多人协作的Web应用。

## 功能特性

- **客户信息管理**: 上传、编辑、删除客户信息（基本资料、联系方式、标签、备注等）
- **信息检索系统**: 按关键词、标签分类快速搜索客户信息
- **多人协作**: 创建团队，通过分享链接或邀请码邀请协作，支持角色权限管理（Owner/Editor/Viewer）
- **活动日志**: 记录所有操作历史，方便审计

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React + Vite + Tailwind CSS + React Query |
| 后端 | Python FastAPI + SQLAlchemy + SQLite |
| 认证 | 手机验证码 + JWT Token |

## 快速开始

### 后端启动

```bash
cd backend
pip install -r requirements.txt
cd ..
python3 scripts/init_db.py
cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端启动

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

## 环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```env
DATABASE_URL=sqlite:///./customer_mgmt.db
JWT_SECRET=your-secret-key
JWT_EXPIRE_HOURS=72
SMS_PROVIDER=mock
```

## API 文档

启动后端后访问 http://localhost:8000/docs 查看 Swagger UI。

## 项目结构

```
customer-mgmt-app/
├── backend/              # Python FastAPI 后端
│   ├── app/
│   │   ├── routers/      # API 路由
│   │   ├── services/     # 业务逻辑
│   │   ├── models.py     # 数据库模型
│   │   └── schemas.py    # 数据验证
│   └── requirements.txt
├── frontend/             # React 前端
│   └── src/
│       ├── api/          # API 调用
│       ├── context/      # 认证上下文
│       ├── pages/        # 页面组件
│       └── components/   # 通用组件
├── docker/               # Docker 配置
└── scripts/              # 工具脚本
```
