# Changes

## 2.2.0

- Add paired naming tests: 42 complete native simulations across three seeds and seven controlled typing prompts. Cosmetic titles/reflections preserve paths and outcomes; custom child/partner names change RNG and can change endings.
- Preserve remaining choices after cosmetic entries when native replays verify the same gameplay state and achievements. Rebuild full fingerprints; fall back to a new search for gameplay changes.
- Add goal-first result/planning order: recommended survival and wellbeing, lifespan, individual stats, native achievement tier, or Fixer-only combat rating. Apply the preference while retaining search candidates and completed plans, not just when displaying cards.
- Show comparison details, including applicable native promotion merit. Preserve the original route's goals and order preference after personal input.
- Update the snapshot for client `index-BujUmHjK.js`, including corporate event-age changes and the native Wing-executive inquisition exclusion.

## 2.1.0

- Pause following and native time before all naming and reflection prompts. Never submit them automatically, including through Choose next step.
- Add Resume after typing: continue the original route when the submitted state matches its prediction; otherwise recalculate the remaining route using the original route's goals and follow it.
- Persist waiting-for-input state across save, reload, and resume. Keep input pauses paused after resuming a saved life.
- Update native engine compatibility to game client `index-BXsC1-XS.js`.
- Test all seven text-entry dialogs, custom names/reflections, waiting across reload, original-goal preservation, and verified full replays with explicit blank submissions.

## 2.0.2

- Fix a reproduced current-life replay failure after one choice when the page's HTML language differs from the native game language. Use the game's saved language and native browser-language fallback for simulation, validation, and following.
- Show following-stop reasons in the top status as well as below the selected route, replacing stale search messages.
- Add a full native replay regression from seed `1289324438` at age 1 with an English game and a conflicting Korean page attribute, plus coverage for the browser-language fallback.

## 2.0.1

- Fix the empty catalogue when the game updates or a simulation worker cannot start. Bundle the inspected catalogue separately so browsing and target selection remain available.
- List all 50 displayed traits before the 169 achievements, show available totals separately from selected targets, and add All / Traits / Achievements browsing filters. Keep native achievement hints searchable.
- Update the extracted native engine and game compatibility check for client `index-DNffUPHt.js`. Routes from a different client must be searched again.
- Add rendered-list regressions for an updated client, blocked and pending workers, catalogue counts, type filters, and hints.

## 2.0.0

- Rebuild the companion around Find a life, Play this life, and Saved lives.
- Filter on all five displayed final stats, minimum age, alive endings, desired traits/achievements, and avoided traits. Copy targets from the actual current or ended life.
- Replace the short-horizon seed policy with a bounded search across complete alternative routes. Compare multiple completed outcomes, each showing the targets it was checked against.
- Plan a continuation from the current state without pretending it can start from birth. Keep draft targets independent of selected and active routes.
- Add explicit start-from-birth and resume actions, verify native controls before following, and retain completed partial candidates when stopping a search.
- Save up to eight routes, validate v1/v2 imports, preserve drafts across reload, isolate typed inputs from game shortcuts, and support compact/mobile layouts.
- Add player-workflow regressions and native replay checks with five final-stat targets.

## 1.1.1

- Fix goal filtering: the label display rule was overriding the browser's hidden-element styling, leaving nonmatching goals visible.
- Trim filter whitespace and display the visible goal count or an explicit no-match message.
- Add browser regressions for actual rendered visibility, exact IDs, case/whitespace, unmatched queries, clearing, selected-only intersections, requirements and minimizing. Run the captured-client filter regression in GitHub CI.

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
