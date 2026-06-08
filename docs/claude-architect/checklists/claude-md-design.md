# Checklist — Authoring or reviewing a CLAUDE.md file

Run this checklist when you are creating a new `CLAUDE.md` at any tier
(user, project, or directory), when you are reviewing a teammate's
proposed configuration change, or when an existing file has grown
unwieldy and you want to confirm it still earns its place in every
session's context. The questions cut across the rules in the leaves
below; tick each one off before declaring the file done.

## Checklist

1. Is every rule in this file required for the work to be **correct**, so
   that a fresh clone behaves the same way for any teammate? If the rule
   is a personal preference, it belongs in `~/.claude/CLAUDE.md`, not
   here — see [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
2. Have you placed the file at the **lowest tier that owns the rules**
   (user vs project vs directory), rather than defaulting to the root?
   See [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
3. If the rules vary by sub-package (Java service vs Node frontend vs
   tests), is the variation expressed via a directory-level
   `CLAUDE.md`, not via paragraph headings inside the root file? See
   [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
4. Once the file would carry **three or more distinct topics**, have you
   split it into `.claude/rules/` topic files and used `@import` to pull
   in only the subset that this package needs? See
   [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
5. For any convention that follows a **file type** spread across the
   tree (test files, migrations, client stubs), have you preferred a
   `.claude/rules/` file with a `paths:` glob over duplicating the rule
   in every subdirectory's `CLAUDE.md`? See
   [[../domain-3-claude-code/3.3-path-specific-rules]].
6. For each path-scoped rule, is the `paths:` glob **narrow enough** to
   keep irrelevant context out, yet **broad enough** to survive
   foreseeable directory renames (e.g. `**/*.sql` rather than
   `db/migrations/**/*.sql` for migration rules)? See
   [[../domain-3-claude-code/3.3-path-specific-rules]].
7. Is each rule file scoped to **one concern** (test conventions, API
   client patterns, module boundaries), rather than a catch-all
   `typescript.md` that loads everything whenever any `.ts` file is
   touched? See [[../domain-3-claude-code/3.3-path-specific-rules]].
8. For workflow-shaped guidance ("when doing X, follow steps A, B, C"),
   have you moved it into a **skill** instead of expanding `CLAUDE.md`,
   reserving the always-loaded `CLAUDE.md` for standards-shaped rules
   ("we always do X, never Y")? See
   [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
9. If the file accumulates structured per-ticket or per-issue facts
   (order IDs, repo names, branch names), have you kept those out of
   `CLAUDE.md` itself and routed them to a per-session **case-facts**
   block or structured issue layer? See
   [[../domain-5-context-reliability/5.1-conversation-context]].
10. Does the top of the file lead with the rules most likely to be
    breached or queried (repo map, branch naming, banned actions), so
    that the most load-bearing content sits in the model's prime
    attention zone rather than buried mid-file? See
    [[../domain-5-context-reliability/5.1-conversation-context]].
11. Have you verified the file is **actually loaded** in a fresh session
    by running `/memory` — and confirmed that any `@import` paths
    resolve from this file's location? See
    [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
12. When a teammate reports the agent ignoring a rule, is your first
    step to ask them to run `/memory` (to diff against your loaded set),
    rather than rewriting the rule more emphatically? See
    [[../domain-3-claude-code/3.1-claude-md-hierarchy]].

## Common failure modes

- **User-level rules masquerading as team rules.** Maintainers stash
  conventions in `~/.claude/CLAUDE.md` and it works for them; new clones
  silently misbehave. Walk the user-level file and demote anything
  required for correctness — see
  [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
- **Monolithic CLAUDE.md that outgrows its tier.** A file with eight
  topics costs every session the full token spend even when one topic
  is in play, and rules become hard to locate for editors. Split into
  `.claude/rules/` once you cross three topics — see
  [[../domain-3-claude-code/3.1-claude-md-hierarchy]].
- **Subdirectory `CLAUDE.md` used for cross-cutting concerns.** Test
  conventions or migration patterns get duplicated into every package's
  subdirectory file; the copies drift and the drift becomes a silent
  bug. Use a path-scoped `.claude/rules/` file instead — see
  [[../domain-3-claude-code/3.3-path-specific-rules]].
- **`paths:` globs that miss a new directory.** A new migrations folder
  or a renamed services tree escapes the rule's coverage with no
  warning; the agent edits the files as if the rule did not exist.
  Audit `paths:` whenever the directory layout changes — see
  [[../domain-3-claude-code/3.3-path-specific-rules]].
- **Load-bearing facts buried in the middle of a long file.** Repo
  maps, banned actions, and credential paths placed at section 7 of 12
  get attended to in theory and ignored in practice. Hoist the
  load-bearing content to the top — see
  [[../domain-5-context-reliability/5.1-conversation-context]].
