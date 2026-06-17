# Agent skills onboarding

Onboarding for the AI-assisted skills in this workspace. The skills live
under `.claude/skills/` at the workspace root; the shared shell tools
they call live at `tools/`; the format itself is documented in
[`agent-skills.md`](agent-skills.md).

## Getting Started

### Prerequisites

- `curl`, `jq`, `gh` (GitHub CLI)

Install any that aren't already on your `PATH`:

```bash
for cmd in curl jq gh; do command -v "$cmd" >/dev/null || brew install "$cmd"; done
```

### 1. Canonical clone location

This workspace expects to live at
`~/git/defra/trade-imports-animals-workspace`. Every LLM-typed Bash
command, every helper script, and the `.claude/settings.json` allowlist
patterns hardcode that path. No env var to set.

If your checkout is elsewhere, symlink it:

```bash
ln -s "$(pwd)" ~/git/defra/trade-imports-animals-workspace
```

(run from your checkout root). `git -C <symlink>` and
`git -C <symlink>/repos/<repo>` both resolve correctly — the symlink is
transparent for everything `tools/` touches.

### 2. Get Your Credentials

#### Jira & Confluence (same credentials)

Both use Atlassian Cloud API tokens:

1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click **Create API token**
3. Give it a name (e.g., "Claude Code")
4. Copy the token

Add credentials to `~/.zshrc` or `~/.bashrc`:

```bash
# Atlassian credentials and config 
export JIRA_USER="your.email@equalexperts.com"
export JIRA_TOKEN="your-jira-api-token"
export JIRA_BASE_URL="https://your-org.atlassian.net"
export JIRA_PROJECT_KEY="YOUR-PROJECT"
```

`JIRA_BASE_URL` — your Atlassian instance root URL (used for both Jira and Confluence). No trailing slash.

`JIRA_PROJECT_KEY` — your Jira project key (e.g. `MYPROJ`). Used when creating tickets and subtasks.

#### GitHub

Authenticate via GitHub CLI:

```bash
gh auth login
```

### 3. Check Authentication

Run the auth script (from the workspace root) to verify all services
are configured:

```bash
./tools/auth.sh
```

This checks Jira, Confluence, and GitHub authentication.

### 4. SonarCloud (Claude Code integration)

The four main repos (`frontend`, `admin`, `backend`, `dynamics-gateway`) have a SonarCloud Claude Code integration committed to `.claude/`. It provides secrets-scanning hooks, an MCP server for querying SonarCloud, and an end-of-turn analysis hook that surfaces BLOCKER/CRITICAL findings automatically.

#### Install the `sonar` CLI

```bash
curl -o- https://raw.githubusercontent.com/SonarSource/sonarqube-cli/refs/heads/master/user-scripts/install.sh | bash
```

Then restart your terminal (or `source ~/.zshrc`) so `sonar` is on your `PATH`.

#### Authenticate

```bash
sonar auth login
```

Sign in with your SonarCloud account when prompted. Authentication is stored in `~/.sonar/` — no env vars needed.

Once done, the hooks activate automatically when you open Claude Code in any of the four repos.

#### Workspace-level MCP (running Claude Code from the workspace root)

Each repo's `.mcp.json` is only loaded when Claude Code runs **inside that repo**. When you
launch from the **workspace root** (the usual case here), those per-repo files aren't read, so
the SonarCloud MCP tools don't appear. The committed **workspace-root `.mcp.json`** closes that
gap — it registers all four projects as separate servers, so a root session can query any of
them:

| server name | SonarCloud project key |
|---|---|
| `sonar-frontend` | `DEFRA_trade-imports-animals-frontend` |
| `sonar-admin` | `DEFRA_trade-imports-animals-admin` |
| `sonar-backend` | `DEFRA_trade-imports-animals-backend` |
| `sonar-gateway` | `DEFRA_trade-imports-dynamics-gateway` |

Tools are namespaced per server, e.g. `mcp__sonar-frontend__*`. The only prerequisite is the
`sonar` CLI installed + authed (above) so bare `sonar` is on your `PATH` — there's no
machine-specific path in the config, so it's portable.

Because `.mcp.json` is committed (a shared/project-scope MCP config), Claude Code asks you to
approve each server the first time you launch — approve them at the startup prompt or via
`/mcp`. To skip that prompt for everyone, commit an approval allowlist to
`.claude/settings.json`:

```json
"enabledMcpjsonServers": ["sonar-frontend", "sonar-admin", "sonar-backend", "sonar-gateway"]
```

Verify with `claude mcp list` — all four `sonar-*` servers should show **Connected**.

### 5. Keep git fetches light (gh-pages exclusion)

The product repos' `gh-pages` branches hold published artifacts and are
enormous (17 GB object graph on the frontend vs 7 MB for main), and the
workspace repo's own `gh-pages` is ~1 GiB. Any clone still on the
default `+refs/heads/*` fetch refspec drags them in on a bare
`git fetch` / `git pull`.

Pin your workspace clone once:

```bash
bash tools/git/light-remote.sh --exclude-gh-pages ~/git/defra/trade-imports-animals-workspace
git -C ~/git/defra/trade-imports-animals-workspace gc --prune=now   # reclaims ~1 GiB if gh-pages was ever fetched
```

Per-ticket review clones under `workareas/` are pinned automatically by
`tools/review/prepare-review.sh` (and self-healed on refresh by
`tools/review/refresh/pull-repos.sh`).

The dev repos under `repos/` are handled for you: `make setup` /
`tim workspace setup` clone with the exclusion in place
(`--single-branch`, pin the refspec, then a widening fetch), and
`make update` / `tim workspace update` heal any clone still on the
default refspec exactly once — pin, refetch, then `git gc --prune=now`
to reclaim the gh-pages packs already on disk. Expect that first update
to take a few minutes per large clone; every later run skips the heal.
Local branches, stashes and uncommitted files are untouched. The
tooling also copes with `gh-pages` being absent on the remote (the
truncate job deletes and re-creates it).



