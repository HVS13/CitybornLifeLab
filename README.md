# CitybornLifeLab

Find a life that fits your goals, see its predicted ending, and follow its choices in [Born as an Individual in the City](https://project-moon-life.cityborn.workers.dev/). Version 2 rebuilds the companion interface and route planner around that player workflow. It retains the inspected game's native engine and verified game controls.

[Install page](https://hvs13.github.io/CitybornLifeLab/) · [Install/update userscript](https://raw.githubusercontent.com/HVS13/CitybornLifeLab/main/dist/cityborn-advisor.user.js) · [Changes](CHANGELOG.md)

## Install or update

1. Install [Tampermonkey](https://www.tampermonkey.net/) or a userscript manager supporting page-context scripts and workers.
2. Open the userscript link above and confirm installation/update. If it opens as text, paste the entire file into a userscript and save. Remove any older separately installed local copy.
3. Reload the game. The panel should say **Cityborn Life Lab 2.3.0**. The manager's script name remains **Cityborn Life Advisor** so existing installations can update normally.

No server, credentials, or npm installation is required to use the script. Calculations and saved routes stay in your browser. Its download/update URLs point to this repository.

## Find a life

1. Enter the **minimum final Health, Sanity, Wealth, Network, and Reputation** you want. Blank means unrestricted. These use the rounded whole numbers shown on the game's **Final state** screen, not starting stats or the highest values reached during life.
2. Optionally require a minimum age or an alive ending. Open **Traits & achievements** to select desired traits/achievements or **Avoid** unwanted traits. Every condition is required for a **Match**.
3. Open **Starting settings & search effort** to set a name/gender, check one specific seed, or choose a random-seed count. Begin with 1–3 seeds. **Quick** looks for a matching ending sooner; **Thorough** explores more alternative routes.
4. Click **Find matching lives**. Compare up to five completed outcomes: all five final stats, age, job, traits, and the exact conditions used. **Partial** means some requirements failed; missing requirements are listed. Partial results are never labeled as full matches.
5. Choose a life to open **Play this life**, or save it for later. Search never starts a game automatically. Stop keeps completed candidates, including candidates completed before the current seed's search has finished.

**Use this life's stats/traits** copies values from the current or ended game into new search targets. You can edit them before searching. Editing new targets does not erase an existing route or change what an old result claims to satisfy: every card names its original targets.

**Browse traits & achievements** lists all 50 displayed traits and 211 achievements without a search query. Use **Show** to browse traits, achievements, or both; achievement rows include the game's unlock hints. The selected count describes your targets. The catalogue remains browsable if workers fail or the game updates, while incompatible planning stays disabled. In that case, the catalogue represents the inspected client rather than any uninspected additions.

## Play this life

- **Start from birth & follow** starts a selected seed from the game's home screen and follows its route. Starting again replaces the game's single active save; **Resume** retains saved progress.
- **Resume & follow saved life** continues a saved game when its seed matches the selected route. Following checks the actual state at every choice and stops if it diverges.
- **Plan the rest of this life** searches completed outcomes from your actual current state, using the targets in Find a life. The game pauses while planning and stays paused for review. Click **Follow route** or **Choose next step** when ready.
- A continuation plan starts from an existing life. It cannot be used to start that seed from birth. Its saved starting snapshot is never assigned to the native game.
- Set a following speed (default x32). **Pause & stop following** pauses the game. Manual game interaction stops following without overriding the action you took. Escape cancels a calculation or stops following.
- **Names and reflections are yours to enter.** Following pauses at Color, E.G.O, relic, child, partner, sword, weapon, and reflection prompts. Submit your text in the game's dialog, then click **Resume after typing**. Cosmetic entries retain the remaining choices if a native replay confirms unchanged gameplay state and achievements; all full live fingerprints are rebuilt and still checked. Custom child/partner names skip the game's random-name draw, so they can change future events and require a new search using the original goals. Waiting for input survives saving and reloading.
- **Save & go home** uses the game's own save/quit action. Auto-follow stays off after reload. The companion revalidates its saved route before you resume.
- At the ending, the companion checks the actual conditions and compares the full state fingerprint with the prediction. It follows native post-death voice continuations rather than mistaking them for completed lives.

Let the native game finish its ending flow to save achievement records.

Workshop crafting also pauses for you to name and complete the item. Predictions use the native fallback scores. Finish crafting and submit the result, then resume; the remaining plan is recalculated from your actual score using the original targets.

## Saved lives

Keep up to eight recent selected/saved routes. Export any you want to retain longer. **Validate & choose** replays a saved route in the inspected engine before use. Choosing or restoring a route does not replace your draft search targets.

**Import route** validates legal actions, recomputes final stats and condition results, and loads its targets. **Export selected route** downloads JSON; **Copy seed** copies the seed. Complete v1/v2 route files from the supported client remain importable. Older birth-only results are explicitly labeled **Birth only** and cannot claim to predict the ending.

Route files do not back up or restore game progress. A seed route is checked from birth; a current-life route is checked from its recorded snapshot and can only follow an actual game state that matches. Imported summaries or success claims are not trusted.

Drag the panel header or focus it and use arrow keys (Shift moves farther; Home resets). Position and minimization are remembered and kept within the viewport. The interface fits narrow screens, and typing inside it is isolated from native game shortcuts.

## Accuracy and limits

The route planner explores alternative choices through completed endings, retaining three paths in Quick or eight in Thorough. A route is capped at 600 choices and 5,000 native transitions. Quick stops exploring a seed once it finds a matching ending. Thorough can find routes that Quick discards, but neither exhaustively explores every possible life.

Completed results are ordered by full goal completion, then fulfilled-condition fraction and progress toward missing numeric targets. Recommended breaks ties by alive ending, lifespan, the lower of final Health/Sanity, then total final stats. Explicit sorts can prioritize lifespan, an individual stat, the game's highest achievement tier, or its native Fixer combat rating while keeping goal fit first. Sort preferences affect new searches/plans and reorder the retained candidates and saved lives; they do not exhaustively optimize all possible lives. Comparison details expose native achievement tier, Fixer-only combat rating, and career promotion merit where applicable. An active Distortion is not assigned a Fixer rating.

The bounded search still prunes intermediate branches with a goal-progress heuristic; final ordering is a separate, transparent comparison, not a win probability or a universal lore power ranking. Some conditions conflict; rare achievements or long quests may be missed. No result in a bounded search does not mean a goal is impossible. Following a verified route does not establish a general improvement in win rate.

Naming tests use three fixed seeds, fixed starting options, and eight controlled native typing prompts: 24 paired cases / 48 complete simulated lives. Color, E.G.O, relic, sword, weapon and reflection text preserved event paths, gameplay state and achievements in those cases. Custom child/partner names changed RNG, event paths and outcomes. These are controlled tests, not an exhaustive check of every storyline or a claim that the fixtures earned their titles naturally.

Replay fingerprints include stats, flags, quests, history and RNG state; only the minor-choice countdown and saved UI progress are excluded. They detect accidental divergence and are not cryptographic authenticity guarantees. Changing settings, language, or choices can invalidate a route. The native game pauses progress in hidden tabs; the script does not bypass this. Source updates require an updated companion.

The planner reads the game's saved language (or its native browser-language default), rather than the HTML language attribute. Version 2.0.2 fixes a replay failure when those differed: a continuation could match its starting state, then generate subsequent events in the wrong language and stop after one choice. If you have an affected older route, update, reload, and generate a new current-life plan once.

The supported client is `index-LvXCymKa.js`, inspected on 22 October 2026. Routes from a different client are rejected; search again after a client update. Its formatted snapshot and hash are retained in `analysis/`. Bundled game logic/text remain attributable to their original authors. This is an unofficial companion inspired by [DotaCaptainLab](https://github.com/HVS13/DotaCaptainLab).

## Build and verification

Node.js 22 or newer:

```powershell
npm run build
npm run check
npm test
```

Optional browser checks:

```powershell
npm ci
npx playwright install chromium
npm run test:filter
npm run test:player
npm run test:replay-language
npm run test:typing
npm run test:browser
```

`test:filter` checks actual rendered filtering. `test:player` exercises the new player workflows against the captured native client without network dependence; set `PLAYER_LIVE=1` to use the live site. `test:replay-language` checks a complete current-life replay when the page language conflicts with the native language; set `REPLAY_LIVE=1` to run it live. `test:browser` checks complete native replays on the live site, including resume and current-life plans with all five stat targets. `FILTER_LIVE=1` runs filter checks live. PowerShell environment syntax is `$env:PLAYER_LIVE = '1'`; use `$env:BROWSER_CHANNEL = 'msedge'` for an installed Edge instead of bundled Chromium.

Tests cover final-only stat criteria, displayed rounding, alternate paths, unwanted traits, route purity, legal actions, v1/v2 imports, cancellation, draft/route separation, persistence, numeric-shortcut isolation and mobile layout. Full-life browser tests accelerate native rAF timestamps while retaining the native tick cap and transitions. This does not verify userscript-manager installation itself, hidden/frozen tabs, or every rare storyline. GitHub CI rebuilds the script, checks generated files, and runs engine, filter and player-workflow regressions.
