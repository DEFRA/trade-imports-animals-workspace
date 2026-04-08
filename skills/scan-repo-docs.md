# Skill: scan-repo-docs

Scan a repository and write (or update) a tech overview doc for it.

## Usage

Invoke with two arguments:
1. Path to the repo to scan
2. Path to the output markdown file to write

Example:
```
claude -p "$(cat skills/scan-repo-docs.md)" -- repos/trade-imports-animals-frontend docs/frontend.md
```

Or via `make scan-docs` which runs this for all repos.

---

## Instructions for the agent

You are scanning a single repository to produce a concise, high-level tech overview document.

**Do not** record specific library versions — the goal is a durable description that won't become stale after a routine dependency bump. Write at the level of "Spring Boot REST API" not "Spring Boot 3.5.5".

### Step 1 — Explore the repo

Read the following, in order, stopping once you have enough to fill the template:

1. Any `README.md` or `README` at the repo root
2. The primary dependency manifest: `package.json`, `pom.xml`, `build.gradle`, `go.mod`, `requirements.txt`, `Cargo.toml` — whichever exists
3. Top-level directory listing (`src/`, `app/`, `tests/`, `docker-compose.yml`, `Dockerfile`, etc.)
4. Any `.nvmrc`, `.tool-versions`, or similar runtime version files
5. Dip into `src/` only if needed to understand the service's purpose or key routes

### Step 2 — Write the doc

Write the output file using exactly this structure:

```markdown
# <repo-name>

**Repo:** DEFRA/<repo-name>

## Purpose

<One paragraph: what does this service do? Who uses it? What problem does it solve?>

## Stack

- **Runtime:** <language + runtime, e.g. Node.js, Java (Amazon Corretto), Python>
- **Framework:** <primary framework, e.g. Hapi, Spring Boot, Django>
- **Templating:** <if applicable>
- **Frontend build:** <if applicable, e.g. Webpack, Vite>
- **UI:** <design system if applicable, e.g. GOV.UK Frontend>
- **Auth:** <auth mechanism, e.g. OIDC/JWT, session cookies>
- **Session/Cache:** <e.g. Redis, in-memory>
- **Database:** <if applicable>
- **Messaging:** <if applicable, e.g. SQS, RabbitMQ>
- **Logging:** <logging library/format>
- **Unit tests:** <test framework>
- **E2E tests:** <if applicable, or note if handled by another repo>
- **Linting:** <linting tools>

(Omit any bullet that doesn't apply.)

## Infrastructure dependencies

| Dependency | Purpose |
|-----------|---------|
| <name> | <one-line purpose> |

(Omit section entirely if there are no external runtime dependencies.)

## How to run

```bash
<key development start command>
```

<Add Docker instructions only if a docker-compose.yml or Dockerfile exists.>

Port: **<port number if determinable>**
```

### Step 3 — Output

Write the completed doc to the output file path provided. Overwrite any existing content.
