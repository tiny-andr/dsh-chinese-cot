# dsh-chinese-cot

在 DeepSeek Harness 每个系统提示词的**最前面**插入一行：`请全程使用中文进行思考！`

[English](README.md)

开关和注入内容都在 **设置 → 中文思考注入**。

- 插在系统提示词第一行，主会话、子代理、workflow 子任务都生效
- 固定一行、不随轮次追加，前缀缓存因此不会被反复破坏
- 纯 JS，无依赖，无构建步骤

## 安装

让 DSH 里的 agent 装 —— 直接把这句发给它：

> 安装并启用这个 DSH 插件：https://github.com/tiny-andr/dsh-chinese-cot

它会自己走到 `plugin_manager` → `install_bundle`，target `github:tiny-andr/dsh-chinese-cot`。

手工装：

```sh
dsh plugin --profile <profile> add github:tiny-andr/dsh-chinese-cot
```

CLI 只负责装包。还要把 `dsh-chinese-cot` 加进 profile `package.json` 的 `dsh.profile.bundles`，bundle 才会被选中 —— 插件管理页面两步都会替你做。

## 设置

`<DSH_HOME>/dsh-chinese-cot.json`：

```json
{ "enabled": true, "text": "请全程使用中文进行思考！" }
```

设置页保存后下一次请求即生效；直接改文件则在插件加载时被读取。

## License

MIT
