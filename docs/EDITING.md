# 编辑这个网站

所有内容统一维护在 content/files/，仅展示 Markdown 文件。目录可自由嵌套，其他类型文件不展示，图片放 assets/。

例如 content/files/notes/idea.md 对应 ~/notes/idea.md。
无需文章元数据，没有独立的 posts 体系。

## 阅读与查找

- find notes：匹配全部内容文件路径中的 notes，不查正文。
- less README.md：查看 Markdown 原文。
- view README.md：渲染 Markdown，支持链接和图片。
- clear：清屏并恢复欢迎输出，保留当前目录和历史。

图片独立一行写：

```md
![示例图片](assets/photo.jpg)
![外链图片](https://example.com/photo.jpg)
```

## 欢迎文字

编辑 content/boot.json：lines 定义各行文字，lineDelayMs 定义默认等待，单行 delayMs 可覆盖，范围 0 到 2000 毫秒。
{fileCount} 和 {commandCount} 自动替换。启动结束后才显示并聚焦命令提示符，clear 后立即恢复欢迎文字。

## 本地更新

npm run dev 启动服务，修改后自动重建，手动刷新查看。
npm run build 生成 dist/，将完整产物部署到静态服务器。

完整说明见仓库 README.md。
