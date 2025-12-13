# 轻量 HTML 开发（工作区配置）

已为当前工作区添加了 VS Code 的轻量级配置，目标是只用于编写纯 HTML（可包含基础 CSS/JS），并尽量减少不必要的编辑器开销。

- 已添加文件：
  - [.vscode/settings.json](.vscode/settings.json) — 关闭或降低影响性能的功能（Git、JS/TS 验证、minimap、codeLens、遥测等）。
  - [.vscode/extensions.json](.vscode/extensions.json) — 清空推荐，避免弹出安装建议。

- 使用说明：
  - 直接在此工作区打开并编辑 `index.html` 即可获得更轻量的编辑体验。
  - 如果需要热重载，可手动安装 Live Server（可选）。

- 恢复或撤销更改：
  - 删除工作区的 `.vscode` 文件夹，或编辑相应的设置项恢复为默认。

如需我替你启用某个特定小功能（例如临时开启 Live Server、或允许内置 HTML 校验），告诉我我会帮你调整。
