# 布料记录工具 - 用户认证功能 设计规格说明

**日期：** 2026-06-03
**状态：** 已批准

---

## 1. 项目概述

为现有布料记录工具添加邮箱+密码注册登录功能，实现多用户数据隔离。

## 2. 认证机制

- 密码使用 bcrypt 哈希存储
- 登录后签发 JWT，存储在 httpOnly cookie 中
- 每次请求通过 cookie 验证身份、注入用户上下文
- 依赖：`bcryptjs` + `jose`

## 3. 数据模型

### 新增表：`users`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTOINCREMENT | 自增主键 |
| `email` | TEXT | UNIQUE, NOT NULL | 邮箱 |
| `password_hash` | TEXT | NOT NULL | bcrypt 哈希 |
| `created_at` | TEXT | NOT NULL | 注册时间 |

### 修改表：`fabrics`

新增列：`user_id INTEGER NOT NULL REFERENCES users(id)`

所有查询自动带上 `WHERE user_id = ?` 实现数据隔离。

## 4. 路由设计

### 新增页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录页 | 邮箱 + 密码表单，底部"去注册"链接 |
| `/register` | 注册页 | 邮箱 + 密码 + 确认密码，底部"去登录"链接 |

### 新增 API

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register` | 注册 |
| `POST` | `/api/auth/login` | 登录，种 cookie |
| `POST` | `/api/auth/logout` | 登出，清 cookie |
| `GET` | `/api/auth/me` | 获取当前用户 |

### 改造现有路由

- 所有 `/api/fabrics/*` 加认证校验，从 cookie 解析 user_id
- 现有页面移入 `app/(auth)/` 路由组，由保护布局统一检查登录状态
- 首页 header 新增用户邮箱显示和退出按钮

### 新文件结构

```
app/
├── (auth)/
│   ├── layout.tsx       # 保护组布局（检查登录）
│   ├── page.tsx          # 原首页移入
│   └── fabrics/
│       ├── [id]/
│       │   ├── page.tsx
│       │   └── edit/page.tsx
│       └── new/page.tsx
├── login/
│   └── page.tsx          # 登录页
├── register/
│   └── page.tsx          # 注册页
└── api/
    └── auth/
        ├── register/route.ts
        ├── login/route.ts
        ├── logout/route.ts
        └── me/route.ts
lib/
├── auth.ts               # 认证工具：hash、JWT 签发/验证、获取当前用户
├── db.ts                 # 修改：users 表初始化
└── fabrics.ts            # 修改：所有操作加 user_id
```

## 5. 前端改动

- `app/layout.tsx` — 保持不变，登录/注册页可公开访问
- `app/(auth)/layout.tsx` — 新增，服务端组件，读取 cookie 验证登录，未登录跳 `/login`
- 原相册首页、详情、添加/编辑页移入 `(auth)/` 路由组
- 首页 header 增加 `📧 user@email.com` 和退出按钮
- 登录页和注册页使用简洁移动端表单，与现有风格一致

## 6. 错误处理

- 注册：邮箱已存在 → 400；邮箱格式无效 → 400；密码少于 6 位 → 400
- 登录：邮箱不存在 → 401；密码错误 → 401
- 未登录访问保护页 → 302 跳转 `/login`
- Cookie 过期/被篡改 → 清除 cookie，302 跳转 `/login`
- API 无有效 cookie → 401

## 7. 测试策略

| 层级 | 范围 | 工具 |
|------|------|------|
| 单元测试 | auth 工具函数（hash、JWT） | vitest |
| 集成测试 | 注册/登录 API 端点 | vitest |
| 组件测试 | 登录页、注册页表单 | vitest + RTL |
| 回归测试 | 现有 20 个 Fabrics 测试适配 user_id | vitest |
| 不在范围 | E2E、邮件验证、密码重置 | - |

## 8. 不在范围（YAGNI）

- 邮箱验证
- 密码重置
- OAuth / 第三方登录
- 会话管理（多设备踢下线等）
- 用户头像/昵称
- 角色权限
- 记住我功能
