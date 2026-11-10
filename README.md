# dsh-chinese-cot

One line at the very front of every DeepSeek Harness system prompt: `请全程使用中文进行思考！` — "think in Chinese, throughout."

[中文说明](README.zh-CN.md)

The switch and the text live in **Settings → Chinese CoT**.

- First line of the system prompt — main agent, subagents and workflow children all get it
- One fixed line, never appended per turn, so prefix caching stays intact until you edit it
- Plain JS, no dependencies, no build step

## Install

With a DSH agent — paste this into the session:

> Install the DSH plugin from https://github.com/tiny-andr/dsh-chinese-cot and enable it.

It resolves to `plugin_manager` → `install_bundle`, target `github:tiny-andr/dsh-chinese-cot`.

By hand:

```sh
dsh plugin --profile <profile> add github:tiny-andr/dsh-chinese-cot
```

The CLI only installs the package. Add `dsh-chinese-cot` to `dsh.profile.bundles` in the profile's `package.json` so the bundle is selected — the Plugin Manager page does both steps for you.

## Settings

`<DSH_HOME>/dsh-chinese-cot.json`:

```json
{ "enabled": true, "text": "请全程使用中文进行思考！" }
```

Saving in the settings page applies on the next request. A hand edit is read when the plugin loads.

## License

MIT
