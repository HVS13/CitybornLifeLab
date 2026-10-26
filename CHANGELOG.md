# Changes

## 2.6.0

- Update the native engine to `index-ClhJn74m.js`, including Finger mentors/disciples, childhood friends, Great Lake crews and House of Spiders. Catalogue now includes 51 displayed traits and 276 achievements.
- Simulate corridor battles using the native fallback; pause live following for manual play, retain waiting across reload, and replan from the submitted outcome using the original goals. Never submit battle results automatically.
- Record and verify Mentor voice in routes; synchronize worker simulation with the native setting. Keep files without this optional field compatible with the plain setting on the supported client.
- Follow prepared routes through timed Grand Voyage prompts. Block new planning during an active timed choice because the native 10-second wall-clock timer continues while paused.
- Pause for childhood-friend naming; test its random-name RNG effects and automatic continuation planning. Extend paired naming tests to 54 complete native lives.
- Add native and browser regressions for corridor outcomes, reload, timed voyage replay/expiry, and Mentor voice mismatch. Previous-client routes require regeneration.

## 2.5.0

- Add Birthplace to starting settings using the native region list and localized names. Prefix random/specific seeds with the engine’s birthplace encoding; preserve explicit prefixes and reject conflicting selections.
- Save the preference, include it in route exports, restore it on import, and show birthplace explicitly on result cards. Same-client route files without this optional setting remain supported.
- Update compatibility to the newly released client `index-BgAeWoVn.js` and its 225 achievements. Routes from the previous game client require regeneration because its simulation changed.
- Test every native region, prefix handling, conflicting imports, preferences, random-region searching, and a full birthplace-selected replay. Add the browser flow to CI.

## 2.4.0

- Apply the selected preference to intermediate branch scoring, so search pruning reflects the requested stat, lifespan, combat or achievement order. Required goal matches retain priority in completed results.
- Use native implied achievement milestones and Fixer grade/promotion progress to guide unmet achievement and Color targets. Remove the unrelated flat grade/heir bonuses.
- Break achievement rarity ties using counts at each native tier, highest first; add a separate achievement-count sort.
- Add native combat potential for eligible careers, including native age/health adjustments. Keep it separate from the Fixer request rating and label both explicitly. Preserve these differences when deduplicating completed candidates.
- Naming and crafting remain manual: submit in the game, then explicitly resume.

## 2.3.0

- Update the inspected native engine to `index-LvXCymKa.js`, including Workshop careers, weapons and new achievements. Browse all 50 displayed traits and 211 achievements.
- Fix panel startup when a native achievement has no unlock hint. Show that the game provides no hint instead of inventing one.
- Handle crafting prompts in simulation instead of crashing on their missing choice list. Pause for manual naming/crafting, keep Resume disabled during unfinished crafting, and replan from the submitted result using the original targets. Craft predictions use native fallback scores, not a guaranteed minigame score.
- Preserve verified remaining routes after cosmetic weapon naming; extend paired naming tests to eight prompts and 48 complete native lives.
- Use the current native birth options, combat rating (including equipment), and promotion thresholds, including Grade 1-to-Color progress. Older-client routes must be regenerated.

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
