# DataGrout plugin for GitHub Copilot

Connects GitHub Copilot to DataGrout's hosted MCP server, so Copilot can find and run
tools in the systems you connect in DataGrout (issue trackers, docs, chat, support
desks and more). Sign-in is OAuth; a DataGrout account is required.

```shell
copilot plugin install DataGrout/datagrout-copilot-plugin:plugins/datagrout
```

Requires GitHub Copilot CLI 1.0.74 or later. Setup, tools, privacy and
troubleshooting: [plugins/datagrout/README.md](plugins/datagrout/README.md).

## Layout

```text
plugins/datagrout/
  plugin.json                     Agent Plugins 1.0 manifest
  mcp.json                        the datagrout server (Streamable HTTP, OAuth)
  skills/datagrout-mcp/SKILL.md   when to use DataGrout; discover → plan → perform
  assets/logo.png                 listing icon (256×256)
  README.md                       listing page: install, connect, tools, privacy, support
  CHANGELOG.md                    release notes per version
  LICENSE                         MIT
scripts/check-plugin.mjs          manifest, server and skill checks (npm run validate)
```

## Releasing

1. Bump `version` in `plugins/datagrout/plugin.json` and `package.json`, and add a
   `CHANGELOG.md` entry.
2. Run `npm run validate`.
3. Tag the release (`vX.Y.Z`) and push the tag. Never move a published tag.

The DataGrout plugins for Claude and Cursor live in
[datagrout-claude-plugin](https://github.com/DataGrout/datagrout-claude-plugin) and
[datagrout-cursor-plugin](https://github.com/DataGrout/datagrout-cursor-plugin).

## License

MIT. See [LICENSE](LICENSE).
