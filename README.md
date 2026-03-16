# Mall Admin Web

## 项目简介

`mall-admin-web` 是一个基于 `Vue 2`、`Webpack 4` 和 `Element UI` 的后台管理前端项目。

当前仓库已提供基于 Docker 的开发运行方式，适用于本地联调与页面开发。

## 运行环境

建议使用以下环境：

- `Node.js 18`
- `npm 8+`
- `Docker`
- `Docker Compose`

## 项目启动方式

### 方式一：使用 Docker Compose 启动（推荐）

该方式适用于日常本地开发，支持源码目录挂载，修改代码后通常无需重新构建镜像。

在项目根目录执行：

```powershell
docker compose up --build -d
```

查看运行日志：

```powershell
docker compose logs -f
```

停止服务：

```powershell
docker compose down
```

服务启动后，访问以下地址：

```text
http://localhost:8090
```

### 方式二：使用 Docker 手动构建并运行

如需手动构建镜像并启动容器，可在项目根目录执行：

```powershell
docker build -t mall-admin-web:latest .
docker run -d --name mall-admin-web -p 8090:8090 mall-admin-web:latest
```

查看容器日志：

```powershell
docker logs -f mall-admin-web
```

停止并删除容器：

```powershell
docker rm -f mall-admin-web
```

### 方式三：使用本地 Node.js 环境启动

如需不依赖 Docker 直接在本机运行，可执行：

```powershell
npm install
npm run dev -- --host 0.0.0.0
```

启动后同样访问：

```text
http://localhost:8090
```

## 修改代码后如何生效

### 使用 Docker Compose 启动时

当前 `docker-compose.yml` 已将项目目录挂载到容器内：

- 修改 `src`、`public` 等源码文件后，开发服务器通常会自动重新编译
- 页面刷新后即可看到最新效果

例如修改以下文件后：

[`src/views/Login.vue`](E:\work\mall_system\mall-admin-web\src\views\Login.vue)

通常只需要刷新浏览器，无需重新执行 `docker build`。

如修改内容未及时生效，可按以下顺序排查：

1. 执行 `docker compose logs -f` 检查是否存在编译错误。
2. 手动刷新浏览器页面。
3. 如仍未生效，重启服务：

```powershell
docker compose down
docker compose up --build -d
```

### 使用 `docker build` 和 `docker run` 启动时

该方式在构建镜像时会将源码复制进镜像，因此宿主机修改代码后，已运行的容器不会自动感知变更。

修改代码后，需要重新构建并重新启动容器：

```powershell
docker rm -f mall-admin-web
docker build -t mall-admin-web:latest .
docker run -d --name mall-admin-web -p 8090:8090 mall-admin-web:latest
```

### 使用本地 Node.js 启动时

在本地直接运行开发服务时，修改源码后通常会自动重新编译，刷新浏览器即可生效。

## 依赖变更说明

如有以下情况：

- 修改了 `package.json`
- 新增或升级了 npm 依赖

建议重新构建并启动服务，以确保容器内依赖与项目配置保持一致：

```powershell
docker compose up --build -d
```

## 目录说明

- [`Dockerfile`](E:\work\mall_system\mall-admin-web\Dockerfile)：定义项目镜像构建方式
- [`docker-compose.yml`](E:\work\mall_system\mall-admin-web\docker-compose.yml)：定义本地开发容器运行方式
- [`src`](E:\work\mall_system\mall-admin-web\src)：项目源码目录
- [`build`](E:\work\mall_system\mall-admin-web\build)：Webpack 构建配置

## 说明

当前 Docker 配置以本地开发为主要目标，容器启动命令实际执行的是开发服务器，而非生产环境静态资源服务。

如需生产部署，建议单独维护生产版镜像构建方案。
