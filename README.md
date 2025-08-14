## 介绍

这是一个使用cloudflare workers 和 d1 数据库的worker项目，采用hono框架构建的简单示例。

## 本地运行


先安装依赖
```shell
npm install
```

然后建立表结构
```sh
wrangler d1 execute test-db --local --command "
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visited_at TEXT
);
"
```

启动本地服务
```shell
wrangler dev
```
## 部署到 Cloudflare Workers
```shell
wrangler deploy
```
