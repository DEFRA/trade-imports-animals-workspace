# EUDP Live Animals Agents

AI-assisted development workspace for EUDP Live Animals tickets. Provides integration scripts, structured workflows, and best practices for code reviews, ticket planning, and implementation.

## Getting Started

### Prerequisites

- `curl`, `jq`, `gh` (GitHub CLI)

```bash
brew install curl jq gh
```

### 1. Check Authentication

Run the auth script to verify all services are configured:

```bash
./skills/tools/auth.sh
```

This checks Jira, Confluence, and GitHub authentication.

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



