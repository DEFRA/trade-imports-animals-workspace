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

### 4. Keep git fetches light (gh-pages exclusion)

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



