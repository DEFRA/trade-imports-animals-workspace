# tim — Trade Imports CLI

Node.js Ink/React CLI for the [trade-imports-animals](../) workspace. Dual-runs alongside the bash tooling in [`../tools/`](../tools/) — start here when you want a tested, library-backed alternative to a `tools/*.sh` script or a `Makefile` target.

## Install

```bash
cd tim
npm install
npm i -g .
```

`tim` is now on your PATH. To uninstall:

```bash
npm un -g tim
```

For active CLI development (edits visible immediately, no reinstall):

```bash
cd tim
npm link
```

## Usage

### Interactive menu

Run with no arguments in a terminal to open the Ink menu:

```bash
tim
```

Arrow keys navigate, Enter selects, Enter on an empty input goes back. Every top-level entry is wired to the same library code the direct CLI uses — pick whichever you prefer.

#### Menu quick reference

| Menu path                                                    | CLI equivalent                    |
| ------------------------------------------------------------ | --------------------------------- |
| Workspace → Status                                           | `tim workspace status`            |
| Workspace → Install                                          | `tim workspace install`           |
| Workspace → Lint                                             | `tim workspace lint`              |
| Workspace → Test                                             | `tim workspace test`              |
| Workspace → Clean                                            | `tim workspace clean`             |
| Workspace → Setup                                            | `tim workspace setup`             |
| Workspace → Update                                           | `tim workspace update`            |
| Workspace → Reset                                            | `tim workspace reset`             |
| Docker → Start the stack (run-stack.sh)                      | `tim docker up`                   |
| Docker → Start the stack from local source (run-stack.sh -d) | `tim docker dev`                  |
| Docker → Stop the stack (stop-stack.sh)                      | `tim docker down`                 |
| Docker → Restart the whole stack (restart-stack.sh)          | `tim docker restart`              |
| Docker → Bounce backend (bounce-backend.sh)                  | `tim docker bounce-backend`       |
| Docker → Bounce mongo (bounce-mongo.sh)                      | `tim docker bounce-mongo`         |
| Start → Frontend (npm run dev)                               | `tim start frontend`              |
| Start → Backend (mvn spring-boot:run)                        | `tim start backend`               |
| Start → Admin (npm run dev)                                  | `tim start admin`                 |
| Auth                                                         | `tim auth`                        |
| Jira → Look up a ticket                                      | `tim jira ticket <id>`            |
| Jira → Read comments on a ticket                             | `tim jira comments <id>`          |
| GitHub → Find pull requests for a ticket                     | `tim github prs <ticketId>`       |
| GitHub → Open a single PR                                    | `tim github pr <repo> <number>`   |
| GitHub → Show a PR diff                                      | `tim github diff <repo> <number>` |
| Confluence → Look up a page                                  | `tim confluence page <id>`        |
| GitHub Actions → Recent workflow runs for a repo             | `tim gha runs <repo>`             |
| GitHub Actions → Status of a single run                      | `tim gha status <repo> <runId>`   |
| GitHub Actions → Wait for a run to finish                    | `tim gha wait <repo> <runId>`     |
| Quit                                                         | exits the menu                    |

### Direct CLI

Pass a subcommand to skip the menu and run a command in one shot:

```bash
tim hello
tim hello --json
tim --version
tim workspace status
tim workspace status --json | jq
```

Every command supports:

- `--json` — emit one structured JSON line on stdout (suppresses Ink)
- `--no-ui` — plain text on stdout (suppresses Ink; auto-set when stdout is not a TTY)
- `--verbose` — structured logs to stderr
- `--workspace <path>` — override the resolved workspace root

### Bypassing the interactive menu

The menu only opens when stdout is a TTY and the user has not asked for plain text. In any of the following situations tim falls back to printing `--help` to stdout, so pipes, CI and skill scripts keep working unchanged:

- A subcommand was given (`tim workspace status`)
- Stdout is not a TTY (`tim | cat`, CI runs)
- `--no-ui` is on the command line
- `--json` is on the command line

## Auth

`tim` reuses the same environment variables as the bash tooling in [`../tools/`](../tools/) — anyone with the bash tools working gets seamless pickup with no new setup:

| Variable                                   | Used for                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `JIRA_USER`, `JIRA_TOKEN`, `JIRA_BASE_URL` | Jira and Confluence (Confluence sits at `${JIRA_BASE_URL}/wiki` with the same Atlassian token)                                                    |
| `GITHUB_TOKEN`                             | GitHub and GitHub Actions. If unset, `tim` falls back to one `gh auth token` call at startup                                                      |
| `TIM_WORKSPACE`                            | Workspace root override (same as `--workspace`)                                                                                                   |
| `TIM_GITHUB_BASE_URL`                      | Clone URL prefix override for `workspace setup` (default `https://github.com/DEFRA`) — used by the behavioural tests to clone from local fixtures |

Run [`../tools/auth.sh`](../tools/auth.sh) to verify your setup against the bash side. `tim auth` (when it lands) does the same via library clients.

## Smoke checklist

After install, confirm:

```bash
tim --version              # prints a semver
tim hello                  # prints "Hello from tim"
tim hello --json | jq      # parses as JSON with ok, schema_version, tim_version, message
```

## Developing

```bash
npm test                   # vitest, coverage
npm run test:watch
npm run lint               # eslint + neostandard
npm run lint:fix
npm run format
npm run coverage
```

## Project rules

Project conventions live in [`CLAUDE.md`](CLAUDE.md) and `.claude/rules/`. Highlights:

- **Test on input/output.** No `toHaveBeenCalled[With]` — render the component, spawn the CLI, or call the function and assert on what comes back. Pre-commit hook (`forbid-spy-assertions.sh`) enforces this.
- **Library-first integrations.** External services go through typed clients under `src/clients/`. No shelling out to `gh`, `jq`, `curl`, or `../tools/*.sh`.
- **Mock at the network boundary.** `undici` MockAgent for HTTP; never `vi.mock()` your own client modules.
- **Code and tests ship together.** Every new `src/**/*.js` lands with a sibling `*.test.js`.
- **GDS plain English** for all user-facing strings.
