<div align="center">

# glyph（GitHub Pages 版）

一个 ASCII 风格的个人网站，顶部的像素花园会跟着真实的天空变化。

[English](README.md) · **简体中文**

</div>

这是 [franvy 的 glyph](https://github.com/Franvy/glyph) 的静态版本。原版跑在 Cloudflare Worker 上，要用数据库；
这个版本构建出来就是普通的 HTML 文件，可以免费放在 GitHub Pages 上。

## 有什么

- **会变的横幅。** 像素花园跟着月相和中国节日变化；设置了城市的话，还会跟着那里的实时天气变化。深色主题是夜晚的花园，浅色主题是白天的花园。
- **一只猫。** 煤球在花园和页脚里走来走去，鼠标移上去或点一下就是摸它。
- **你的 GitHub 数据。** 头像和贡献日历取自你的 GitHub 账号。
- **对 Agent 友好。** `/index.md` 以 Markdown 格式输出首页。

## 和原版的区别

| 原版 | 这个版本 |
|---|---|
| 内容存在数据库里，在 `/admin` 后台编辑 | 内容写在 `src/lib/site.ts` 里 |
| 天气由 Worker 向彩云天气或 Open-Meteo 请求 | 天气由访客的浏览器直接向 Open-Meteo 请求 |
| 贡献日历由 Worker 定时刷新 | 贡献日历在构建时拉取，网站每天自动重新构建一次 |
| 统计所有访客的访问量和摸猫次数 | 没有访问量；摸猫次数只记在每个访客自己的浏览器里 |
| 项目插图（等距小机器）和 Duolingo 连续天数 | 已删除：它们展示的是原作者的项目和账号 |

## 改成你自己的

1. 新建一个名为 `<你的用户名>.github.io` 的仓库，把这份代码推到它的 `main` 分支。
2. 修改 `src/lib/site.ts`：GitHub 用户名、名字、邮箱、自我介绍、项目、技能。
   城市和实时天气是可选的；不填的话，页面上不显示任何地点。
3. 在仓库里打开 **Settings > Pages**，把 **Source** 设为 **GitHub Actions**。
4. 推送到 `main`。工作流 `.github/workflows/deploy.yml` 会检查、构建并发布网站。
   网址是 `https://<你的用户名>.github.io`。

仓库用别的名字也可以，网址就变成 `https://<你的用户名>.github.io/<仓库名>`。
这时把 `src/lib/site.ts` 里的 `repo` 改成对应的地址。

如果贡献日历一直是空的，在 **Settings > Secrets and variables > Actions** 里加一个名为
`CONTRIBUTIONS_TOKEN` 的 secret。一个不勾任何权限的 fine-grained token 就够了。
用你自己的 token，私有仓库的贡献也会计入。

公开仓库 60 天没有任何活动，GitHub 会停掉定时工作流，贡献日历就不再更新。
再推送一次，或在 **Actions** 页手动运行工作流，就能恢复。

## 本地运行

需要 Node.js 24 和 pnpm（运行 `corepack enable` 会自动用上项目锁定的版本）。

```sh
pnpm install
pnpm dev        # http://localhost:4321
```

想在本地看到贡献日历，把 `.env.example` 复制成 `.env`，填上 `GITHUB_TOKEN`。

推送之前，先跑一遍 `pnpm check && pnpm test`。

## 许可

代码使用 [MIT 许可](LICENSE)。复制代码时保留 `LICENSE` 文件和其中的版权行。
Paper Mono 字体使用 [SIL Open Font License](src/assets/fonts/PaperMono-OFL.txt)。
原作者的头像、个人内容和第三方 logo 不在许可范围内，这个版本里也没有它们。
