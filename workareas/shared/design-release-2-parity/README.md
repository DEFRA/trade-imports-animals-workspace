# Design release 2 → real frontend parity

Spot-the-difference between **DESIGN RELEASE 2** of the designer prototype
(`~/git/defra/defra-design/GB-notification-service`, `/design-release-2/*`) and
the real frontend on `spike/EUDPA-288-model-retrofit`
(`repos/trade-imports-animals-frontend/src/server/live-animals`).

| File | What it holds |
|---|---|
| [`evidence.md`](evidence.md) | How both sides were captured, and what is / is not verified |
| [`screen-map.md`](screen-map.md) | Every DR2 screen mapped to its real-frontend counterpart, with a verdict |
| [`spec.md`](spec.md) | The retrofit spec — what has to change, screen by screen |
| [`open-questions.md`](open-questions.md) | Decisions needed before build |

Both sides are captured from a **live render** and diffed model-to-model — DR2
on a kit dev server (port 3010), the frontend on the workspace stack's
test target (port 3100). `evidence.md` lists the handful of screens that are
still source-derived, and the five claims the live capture corrected.

Page models for both sides are in `capture-model/` (`dr2-*`, `fe-*`); the
harness that produced them is in `harness/` and is re-runnable.
