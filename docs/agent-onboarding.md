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

### 1. Workspace location

The skills and `tools/` scripts reference `$TRADE_IMPORTS_WORKSPACE`
directly. Set it in `~/.zshrc` or `~/.bashrc`:

```bash
export TRADE_IMPORTS_WORKSPACE="$HOME/path/to/trade-imports-animals-workspace"
```

Scripts bail with `TRADE_IMPORTS_WORKSPACE not set — see docs/agent-onboarding.md`
if it's missing. No fallback — this is by design so the workspace path is
explicit on every machine.

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



