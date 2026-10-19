# Changes

## 1.1.0

- Check the full simulation state during replay and verify the final live outcome.
- Treat the post-death voice as a continuation, with native actions in simulation and Auto.
- Keep cancelled work from changing subsequent jobs, and preserve native pause ownership.
- Add Balanced, Deep and Life rollout evaluation depths, projected stats, and one-click manual application.
- Save goals, settings, routes and replay progress locally; revalidate routes after reload.
- Import/export compact routes, including complete compatible v1 exports. Recompute imported results instead of trusting file claims.
- Preserve completed partial search results, list missing goals, show within-life progress, and add goal requirements, selected-only filtering and copy-seed.
- Move the panel by dragging or keyboard, with remembered position and viewport clamping.
- Extend regression tests to delayed consequences, import/cancellation/persistence, and complete native replays.
