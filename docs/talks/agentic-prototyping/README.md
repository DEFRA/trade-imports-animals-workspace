# Talk: Two of us, one agent, four prototypes in a week

A 10–15 minute DEFRA show-and-tell on the agentic way of working behind the
`spike/EUDPA-249-prototype-layouts` frontend prototype — leading with what
was built (four competing journey-model paradigms, scored head-to-head) and
revealing the way of working underneath.

- `slides.md` — the deck (Marp markdown, source of truth)
- `theme.css` — Marp theme matching `docs/onboarding/slide-theme.md`
- `assets/hub.png` — the task-list hub screenshot (Spike A)

Speaker notes live in `<!-- ... -->` comments under each slide and show in
Marp's presenter view / export.

## Render

Marp picks up the local theme via the `--theme-set` flag (scoped npx name
per workspace convention):

```bash
# PDF (with speaker notes appended)
npx @marp-team/marp-cli slides.md --theme-set theme.css --pdf --pdf-notes -o /tmp/talk.pdf

# PowerPoint
npx @marp-team/marp-cli slides.md --theme-set theme.css --pptx -o /tmp/talk.pptx

# Live preview while editing
npx @marp-team/marp-cli slides.md --theme-set theme.css -w --preview
```

## Source facts (for fact-checking before you present)

- Branch `spike/EUDPA-249-prototype-layouts`: 50 commits over 6 active days,
  49 co-authored with Claude (Opus 4.7 → 4.8), 421 files / ~30k insertions,
  788 unit tests across 85 files + 45 E2E specs.
- Four paradigms + scored 13-dimension rubric (A 58, C 55, B 54, D 53):
  `repos/trade-imports-animals-frontend/prototypes/model-spikes/README.md`.
- House slide theme: `docs/onboarding/slide-theme.md`.
