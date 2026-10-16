# 于夏之寒 · Everstray UNIX

纯前端模拟 Unix 命令行个人网站。所有可浏览内容来自 `content/files/` 下的 Markdown 文件，不执行真实系统命令，不提供注册、用户发布或后台交互服务。使用 JavaScript / Node.js，零第三方依赖。版权与备案保留在页面底部。

## 本地开发

需要 Node.js 22+，无需 npm install。

```sh
npm run dev
```

访问 http://127.0.0.1:4321 。源文件修改后自动重建，手动刷新浏览器查看。Ctrl+C 停止。端口占用时用 `PORT=4322 npm run dev`。修改开发服务脚本后需重启服务；构建脚本每次通过独立进程执行，不缓存旧版本。

## 内容目录

仅 `content/files/` 是内容来源，递归读取 `.md` 文件（扩展名不区分大小写），除 .kit 工具入口外，其他文件不展示；不含 Markdown 或工具入口的空目录不展示。

```text
content/
  boot.json               启动文字和逐行延迟
  files/
    README.md             个人介绍
    EDITING.md            编辑指南
    journal/              随笔，普通 Markdown，无需元数据
    projects/             项目说明
    poetry/               诗歌
assets/                   图片、样式及脚本
scripts/
  build.mjs               构建静态产物
  dev.mjs                 开发服务器和文件监听
```

`content/files/notes/idea.md` 对应 `~/notes/idea.md`，其中 `~` 为 `/home/guest`。新增文件夹和 Markdown 文件即可更新导航，建议文件名使用英文、数字、连字符，不包含空格。无需 front matter；不存在独立 posts 体系、文章索引或额外文章网页。此前文章已迁入 `content/files/journal/`，当前仍是示例。

## 命令

| 命令 | 功能 |
| --- | --- |
| `ls [路径]` | 列出目录内容；点击目录进入，点击文件用 view 阅读 |
| `cd [路径]` | 切换目录，无参数回到 ~ |
| `pwd` | 当前绝对路径 |
| `tree [路径]` | 递归目录树 |
| `find [关键词]` | 在全部 content/files 文件路径中按关键词匹配，不区分大小写；不带参数列出所有文件路径 |
| `less <文件>` | 在铺满终端区域的阅读器中显示 Markdown 原文 |
| `view <文件>` | 在同样的阅读器中渲染 Markdown 为 HTML |
| `help` | 查看说明 |
| `clear` | 清除命令输出，立即恢复欢迎文字，保留目录和历史 |

`find` 仅检索文件路径，不检索正文，不支持 Unix find 的选项或表达式。支持绝对/相对路径、`~`、`.`、`..`、Tab 补全和 ↑↓ 历史。不支持 cat、选项、管道、重定向或真实系统操作。

```sh
find poetry
view ~/README.md
less ~/poetry/winter.md
```

阅读器保留站点顶栏和合规页脚，覆盖整个终端工作区。Space / PageDown 下一页，b / PageUp 上一页，↑↓ 或 j/k 滚动，g/G 到开头/结尾，q 或 Esc 退出并恢复输入焦点。手机支持滑动和翻页按钮。

## Markdown 与图片

`less` 显示原文；`view` 支持标题、段落、无序列表、引用、独立图片、围栏代码块、链接及行内代码的 Markdown 子集。原始 HTML 被转义，不执行文档脚本；不支持完整 CommonMark、表格或嵌套列表。

图片单独一行书写，支持 assets 路径和 HTTPS 外链：

```md
![本地图片](assets/photo.jpg)

![远程图片](https://example.com/photo.jpg)

[项目链接](https://github.com/sinri)
```

本地 assets 路径以网站首页为基准，而非虚拟 Markdown 目录。外链图片由浏览器向对应站点加载，图片是否可访问取决于来源服务器。文件内容由作者编辑，链接在新标签打开。

## 欢迎输出

编辑 `content/boot.json`：

```json
{
  "lineDelayMs": 180,
  "lines": [
    {"text": "Everstray UNIX — 于夏之寒", "delayMs": 80},
    {"text": ""},
    {"text": "[  OK  ] Loaded {fileCount} files."},
    {"text": "[  OK  ] Ready ({commandCount} commands)."}
  ]
}
```

按顺序逐行输出，每行显示前等待 delayMs，默认使用 lineDelayMs，单位毫秒、范围 0–2000；最多 100 行。空 text 为空行，两个占位符自动替换。启动期间隐藏命令提示符，完成后显示并聚焦；减少动态效果模式下跳过等待。clear 恢复同一份欢迎配置，直接显示，不重播延迟。

## 构建与部署

```sh
npm run build
```

产物 `dist/` 包含首页、assets、boot.json、filesystem.json 和 .nojekyll。不要直接编辑 dist，每次构建会重新生成。部署产物无需 Node.js 服务或数据库。

GitHub Pages：仓库 Settings → Pages 选择 GitHub Actions，工作流在 push main 时用 Node.js 22 构建部署；分支不同需调整 `.github/workflows/pages.yml`。也可把整个 dist 放到静态服务器，启用默认 index.html，支持根域名和仓库子路径。域名、DNS、HTTPS 和备案接入按实际托管配置。

## 调试

启动失败时查看浏览器 Console 的具体错误与 Network 的 boot.json / filesystem.json 状态码。确保通过 HTTP 访问并部署完整产物；停止旧进程后重新 npm run dev，再刷新页面。Chrome ⌘⌥J 打开控制台，⌘⇧R 强制刷新。

右上角显示设备本地时间和浏览器时区，不代表实际地理位置，不调用 IP 查询或定位服务。备案保持为浙ICP备14032362号、浙公网安备 33010902000030号；页脚功能说明不替代实际备案要求核对。

## 终端字体

终端与 less 使用 Fusion Pixel Font 12px 等宽简体字形版（官方发布 2026.09.25），WOFF2 随站点本地托管；view 正文与版权备案保留普通易读字体。字体及上游许可保存在 assets/fonts/fusion-pixel/，构建时一起复制至 dist。采用 SIL OFL 1.1，不修改原字体文件，保留完整版权和许可证。

## 移动端与补全

触屏设备提供 Tab、↑、↓、Enter 按钮。输入框使用至少 16px 字号，避免 iOS 聚焦时自动缩放；布局跟随 visualViewport 的可见高度，在软键盘出现时保持终端可滚动，版权备案保留底部。阅读器高度也随可见窗口变化。

输入框中的 Tab 始终拦截浏览器默认焦点跳转：单个候选直接补全（目录保留斜线、文件或命令追加空格），多个候选先补公共前缀，无可扩展前缀时连续按两次 Tab 列出可点击候选；没有匹配时保留原输入与焦点。补全作用于光标之前的内容，保留光标后文字。其他页面控件仍使用正常 Tab 导航。

## 内置程序 clock.kit

在 ~ 下执行 `./clock.kit`（或任意目录执行 `~/clock.kit`），字符表盘铺满模拟器工作区，时针、分针、秒针每秒更新，显示设备本地时间。按 q / Esc 或点击退出关闭并恢复输入焦点。`ls` 可看到并点击 clock.kit，Tab 可补全程序路径；它由 content/files/clock.kit 声明，构建时自动发现。

## .kit 工具入口机制

在 content/files/ 下创建真实 .kit 文件，可置于任意子目录：

```json
{
  "version": 1,
  "title": "字符时钟",
  "entry": "clock.js"
}
```

entry 是 assets/tools/ 下的 JavaScript 文件名，只允许本地单层 .js 文件名，不允许 URL 或路径跳转。构建校验配置及模块文件存在，输出 kits.json。入口自动出现在 ls/tree/find，支持 Tab 补全、点击启动、相对路径 ./clock.kit 和绝对路径 ~/clock.kit。删除或移动 .kit 后重建会同步移除或变更入口。

新增工具：创建 assets/tools/example.js，导出 mount({container, exit})，在 container 中绘制界面；可返回清理函数，退出时释放定时器、事件监听等资源。创建 content/files/example.kit 并将 entry 设为 example.js。终端宿主统一提供全区域显示、q/Esc/退出按钮及输入焦点恢复。

```js
export function mount({container, exit}) {
  const label = document.createElement('p');
  label.textContent = 'Hello from a kit';
  container.append(label);
  return () => { /* 清理工具创建的资源 */ };
}
```

.kit 是作者维护的工具清单，不是任意脚本内容；真实执行的是站点内的受信任 JS 模块。它们以普通网页权限运行，并非沙箱插件。less/view 只读取 Markdown，不渲染 .kit。工具异常在阅读区显示，退出可返回终端。

## 打砖块 breakout.kit

执行 `./breakout.kit`。每次开局随机生成砖堆，← / → 移动挡板，Space 或“发球 / 暂停”按钮开始或暂停。触屏可在画面上左右拖动。共有三条生命，清空砖堆获胜，可点击“重新开局”重新随机生成。窗口失焦或切换标签会暂停；q / Esc 退出，宿主释放动画和事件监听。

打砖块入口设置 `hideTerminalControls: true`，运行期间隐藏终端 Tab/↑/↓/Enter 栏，退出后恢复。其他 .kit 可复用此布尔选项。

游戏使用 Canvas 2D、120Hz 固定物理步长，球速恒定，挡板键盘/按住按钮/拖动追踪统一限制为固定速度。拖动不再瞬移，松手立即停止。超过 250ms 的卡顿会暂停，而非突然追赶大量时间；网格背景预绘制，计分仅在变化时更新。
