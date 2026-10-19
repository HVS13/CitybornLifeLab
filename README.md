# CitybornLifeLab — Cityborn Life Advisor

Userscript for [Born as an Individual in the City](https://project-moon-life.cityborn.workers.dev/), inspected on 19 October 2026. Inspired by [DotaCaptainLab](https://github.com/HVS13/DotaCaptainLab)'s native-engine advisor and opt-in automation approach.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or another userscript manager supporting page-context scripts and workers.
2. Open [Install userscript](https://raw.githubusercontent.com/HVS13/CitybornLifeLab/main/dist/cityborn-advisor.user.js) and confirm installation in your manager. If it opens as text, copy its **entire contents** into a new userscript and save. Remove the earlier local script first if you installed that version. The file includes the inspected game's simulation and data, so it is about 4.7 MB.
3. Reload the game. The **Cityborn Life Advisor** panel appears at the top right.

No npm installation, server, account credentials, or external script dependencies are required to use the built script. The advisor sends no data to a server. Game-origin local storage and normal game actions are still managed by the game.

The script includes GitHub download/update URLs for userscript-manager updates. The install page source is in `docs/index.html`; GitHub Pages can serve it from `main` / `docs`.

## Use

- **Evaluate choices** pauses the active simulation while a local worker ranks unlocked choices. The recommendation shows the projected age, ended/alive status, and number of matched goals. It restores the prior pause state when finished.
- **Start Auto** applies recommendations during the current life, including blank/default names and reflections. Use the native **x32** speed control to advance faster. Auto stops at death, leaving the game, Escape, Stop, or manual game interaction. It does not start another life. Native Auto is turned off when advisor Auto starts.
- Select achievements and/or traits using the searchable goal list. Hover a goal for the game's achievement requirement. All selected goals must match; traits must still be present at the checked state.
- **At birth** searches random seeds against their initial state. Use this for birth conditions and starting traits.
- **At end of simulated life** plays each candidate locally using the advisor policy, checking native achievements and final traits. Start with 1–5 candidates: this is substantially more expensive than birth filtering. Stop cancels the worker immediately.
- A successful full-life search stores its exact choice route. From the game's home screen, click **Start found seed**, then **Start Auto** to follow it. Name, gender, language, and choice sequence matter. The script verifies each prompt and random state before replay; a mismatch stops Auto.
- **Export seed & route** downloads the matched seed, settings, goals, route, and simulated state as JSON. Export is a report/backup; this version does not import route files. Keep the page open to replay a found route.
- Minimize the panel with **−** and reopen it with **Life Advisor**.

## What the source establishes

- Birth uses a string seed hashed into an FNV-style 32-bit state and a Mulberry32-style generator. Gender and whether a name is supplied change random-number consumption; seed alone is insufficient to reproduce all settings.
- Events and choices update that same state. Choices can change future event eligibility, jobs, grades, traits, and death risks. There is no single universally best choice for every objective.
- The game's native Auto policy includes random selections, dream preferences, and special rules for requests and minigames. The advisor evaluates the native outcomes instead.
- Achievements are computed by the native record evaluator, including implied lower achievements. Some require death or a particular ending. Several desired outcomes cannot coexist in a single life.
- The UI is React. The adapter reads the committed React tree to find the active simulation ref and native callbacks. Choices and starting a seed use those callbacks; the advisor does not replace save data, assign traits, or fabricate achievement records.

## Accuracy and limits

“Best” means the highest score among evaluated choices, **not a proven optimal life**. Each candidate uses up to three years, twelve future choices, and 160 simulation steps of lookahead; future choices inside that window use an immediate-score policy. Selected goals dominate the score, followed by survival, age, health, sanity, wealth, network, reputation, heir progress, and Fixer grade. Long quest prerequisites beyond the window can be missed.

Seed filtering accepts only a complete native simulation satisfying every selected goal, or an initial state satisfying birth filters. Unsuccessful bounded search does not establish impossibility. Full-life routes stop when the native `dead` state is set, including a pending post-death voice; the advisor does not automatically accept that continuation. The game must finish its native ending flow to persist records.

Timing-only fields such as a minor choice's remaining milliseconds are excluded from replay identity; event content, choices, age, cursor, and RNG state are still verified. Changing language or starting settings, making different choices, native timeout choices, game updates, and a hidden/frozen tab can prevent replay. The game pauses its normal progress when hidden; this script does not bypass that behavior.

The script supports the inspected `index-C_XxXzM6.js` bundle and disables actions on another bundle version. The distributable contains the game's publicly delivered client logic and text; that material remains attributable to its original authors. This is an unofficial local companion.

## Build and checks

The workspace retains the formatted inspected source in `analysis/game.bundle.js` and its URL/hash in `analysis/source.json`.

```powershell
node build.cjs
node --check dist/cityborn-advisor.user.js
node tests/engine.cjs
```

For the optional live browser test:

```powershell
npm ci
npx playwright install chromium
npm run test:browser
```

To use an installed Microsoft Edge instead, set `BROWSER_CHANNEL=msedge` (PowerShell: `$env:BROWSER_CHANNEL = 'msedge'`) before running the browser test. Build and engine tests require only Node.js 22 or newer. GitHub Actions rebuilds the distribution, checks for stale generated files, and runs the engine test on pushes and pull requests.

`tests/engine.cjs` checks deterministic full-life replay, recommendation purity, matching birth records, locked choices, and replay identity across countdown changes. `tests/browser.cjs` exercises the live site in an isolated headless browser session through Playwright. It checks the panel, worker, birth search, starting a found seed, Auto advice, and Stop, then compares three native timed prompts against an offline route. It does not install or test the userscript manager itself.
