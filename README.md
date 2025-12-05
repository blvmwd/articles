# 文章系统使用说明

## 项目概述
这是一个基于GitHub Pages和Supabase的完整文章系统，支持用户注册、文章发布、Markdown编辑、数学公式渲染等功能。

## 功能特性
- 📝 文章发布和管理（支持Markdown和LaTeX）
- 👥 用户注册和登录（SHA256哈希加密）
- ⚙️ 管理员后台管理
- 🔍 文章搜索功能
- 📱 响应式设计
- 🚀 部署在GitHub Pages

## 部署步骤

### 1. 创建GitHub仓库
1. 登录GitHub
2. 创建新仓库：`your-username.github.io`
3. 克隆仓库到本地

### 2. 上传文件
将所有HTML、CSS、JS文件上传到仓库根目录

### 3. 启用GitHub Pages
1. 进入仓库Settings
2. 找到Pages选项
3. Source选择"main branch"
4. 保存

### 4. 配置Supabase
1. 访问 https://supabase.com/
2. 使用提供的项目URL和anon key
3. 在SQL编辑器中运行提供的SQL语句创建表

### 5. 管理员账户
- 用户名：bilibilivmware
- 密码：wd40xxxx
- 已预设在SQL中创建

## 文件结构