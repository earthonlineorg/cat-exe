# 猫.EXE / CAT.EXE

> 地球Online 运维测试：把中文屎山代码插进猫咪，观察它如何优雅地宕机。

CAT.EXE 是一个移动端友好的浏览器小游戏。玩家可以向一只简笔画猫咪插入行为代码，观察并行线程、优先级覆盖、代码冲突、动作链、音效和崩溃倒计时如何把一只猫运行成终极屎山。

## 本仓库包含什么

- `index.html`：猫.EXE 说明页入口
- `cat-kernel-play.html`：运行终端
- `cat-kernel-rules.html`：已解锁事故规则
- `assets/cat-kernel.js`：运行时、代码库、动作和冲突逻辑
- `assets/cat-kernel-rules-data.js`：规则与代码数据
- `assets/cat-kernel.css`：猫内核界面和动画样式
- `intercept.html`：官网登录/注册回跳页的前端壳

官网后端、排行榜数据库、账号服务、生产环境配置和任何密钥不在本仓库中。

## 本地运行

直接双击 HTML 可能让登录、接口和部分浏览器能力行为不一致，建议在仓库根目录启动静态服务器：

```bash
python -m http.server 8080
```

然后打开 <http://localhost:8080/index.html>。

纯本地体验主要依赖浏览器 `localStorage`；登录、全服排行榜和成绩提交需要把 `EO_API_BASE` 指向兼容的 Earth Online 后端，不能把生产密钥写进前端。

## 参与添砖加瓦

欢迎提交新的中文屎山代码、动作链、冲突规则、音效和移动端优化。请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)，尤其不要提交账号、密码、Token、生产数据库信息或整站后端文件。

## 许可证

本项目使用 [PolyForm Noncommercial License 1.0.0](LICENSE)。允许个人、教育、研究、业余项目以及其他非商业用途修改和分发；禁止商业使用。严格来说，这是一份允许修改和分发的“非商业源码许可”，不是 OSI 定义的传统 Open Source license。

Copyright 2026 earthonlineorg / EARTH.ONLINE
