# DataGrout for GitHub Copilot

DataGrout MCP puts every integration you connect in DataGrout (issue trackers, docs,
chat, support desks, CRM, data and other SaaS tools) behind one OAuth-secured
endpoint. This plugin connects GitHub Copilot to DataGrout MCP and teaches it to
discover the right tool, plan multi-step work, and confirm before it changes
anything.

The plugin adds:

| Component | Name | Purpose |
| --- | --- | --- |
| MCP server | `datagrout` | `https://gateway.datagrout.ai/connect` over Streamable HTTP |
| Skill | `datagrout-mcp` | The discover → plan → perform workflow, and when to reach for DataGrout |

## Install

GitHub Copilot CLI 1.0.74 or later:

```shell
copilot plugin install DataGrout/datagrout-copilot-plugin:plugins/datagrout
```

## Connect

You need a DataGrout account with at least one integration connected. Accounts
include 5,000 free credits a month. The
[Quick Start](https://library.datagrout.ai/quick-start) covers creating an account
and connecting an integration.

In Copilot CLI, run `/mcp`, select `datagrout` and choose to authenticate. Your
browser opens the DataGrout sign-in and consent page (OAuth 2.1 with automatic client
registration and PKCE). Approve it, and the DataGrout tools become available. No API
key or server ID is needed; DataGrout identifies your account from the OAuth token.

The plugin's MCP configuration (`mcp.json`):

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
  "mcpServers": {
    "datagrout": {
      "type": "streamable-http",
      "url": "https://gateway.datagrout.ai/connect"
    }
  }
}
```

## Use it

Ask for something that lives in a connected system. While coding, for example:

- "Read Jira issue ENG-142 and list the acceptance criteria before we start."
- "Find Zendesk tickets that mention `ERR_TOKEN_EXPIRED` and summarise what customers
  saw."
- "Post a summary of the changes on this branch to #eng-releases in Slack." Copilot
  asks before sending.

Each example needs that integration connected in DataGrout. Copilot finds the
matching DataGrout tool and runs it.

DataGrout MCP exposes five tools. Every other integration tool is reached through
them, so the list stays the same no matter how many integrations you connect.

| Tool | What it does | Returns |
| --- | --- | --- |
| `discovery_discover` | Semantic search for tools that fit a goal | Ranked tool names with input schemas and side-effect flags |
| `discovery_perform` | Runs a tool (or a planned `skill_handle`); `head: true` previews large lists, `refract` summarises | The tool's result plus execution ID and credits used |
| `discovery_plan` | Plans a goal that needs several tools | Ranked plans, required inputs, and a `skill_handle` to run the plan |
| `discovery_summary` | Overview of what is connected | Integrations with tool counts; `focus` drills into one |
| `discovery_guide` | Step-by-step decision tree when the goal is unclear | Options to choose from at each step |

## Data access and privacy

- The plugin contains only configuration and Markdown. No code runs on your machine,
  and the plugin makes no network requests of its own.
- Copilot talks to one service, DataGrout, at `https://gateway.datagrout.ai/connect`.
  It sends the goals and arguments it puts in each tool call and receives the
  results. Nothing else from your conversation, files or codebase is sent unless
  Copilot includes it in a tool argument.
- DataGrout can reach only the integrations you connected, with the permissions you
  granted each one. Disconnect an integration in DataGrout and it is gone from
  Copilot too.
- Read and write tools are both available. The skill tells Copilot to ask you before
  any tool that creates, updates, sends or deletes, and Copilot asks you to approve
  tool calls according to your permission settings.
- Tool calls use DataGrout credits from your account (5,000 free each month, then
  paid); each result reports the credits charged.
- [Privacy policy](https://datagrout.ai/legal#privacy) and
  [terms of use](https://datagrout.ai/legal#terms).

## Troubleshooting

- **Copilot says it has no DataGrout tools:** the server isn't connected yet. Follow
  [Connect](#connect).
- **No `datagrout` server after installing:** update Copilot CLI to 1.0.74 or later,
  which reads the plugin's `plugin.json` and `mcp.json`.
- **"Authentication required" or tools stop working:** run `/mcp`, select
  `datagrout` and authenticate again.
- **Connected but no tools:** check that your DataGrout account has at least one
  integration connected.
- **Two sets of DataGrout tools:** you also added DataGrout as an MCP server with a
  different name or URL. Remove one of them.
- **Revoke access:** run `copilot plugin uninstall datagrout`, then revoke the
  client's authorization in your DataGrout account at
  [app.datagrout.ai](https://app.datagrout.ai).

## Support

Email [support@datagrout.ai](mailto:support@datagrout.ai). Documentation:
[library.datagrout.ai](https://library.datagrout.ai/).

## License

MIT. See [LICENSE](LICENSE).
