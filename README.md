# CitybornLifeLab — Cityborn Life Advisor

Userscript for [Born as an Individual in the City](https://project-moon-life.cityborn.workers.dev/), inspected on 19 October 2026. Inspired by [DotaCaptainLab](https://github.com/HVS13/DotaCaptainLab)'s native-engine advisor and opt-in automation approach.

## Install

1. Install [Tampermonkey](https://www.tampermonkey.net/) or another userscript manager supporting page-context scripts and workers.
2. Open [Install userscript](https://raw.githubusercontent.com/HVS13/CitybornLifeLab/main/dist/cityborn-advisor.user.js) and confirm installation in your manager. If it opens as text, copy its **entire contents** into a new userscript and save. Remove the earlier local script first if you installed that version. The file includes the inspected game's simulation and data, so it is about 4.7 MB.
3. Reload the game. The **Cityborn Life Advisor** panel appears at the top right.

No npm installation, server, account credentials, or external script dependencies are required to use the built script. The advisor sends no data to a server. Game-origin local storage and normal game actions are still managed by the game.

The script includes GitHub download/update URLs for userscript-manager updates. The [install page](https://hvs13.github.io/CitybornLifeLab/) is served from `docs/index.html`.

## Use

- **Evaluate choices** pauses the active simulation while a local worker ranks unlocked choices. Recommendations show projected age, ended/alive status, matched goals, health, sanity, and wealth. **Apply recommended choice** lets you act once without enabling Auto. The prior pause state is preserved.
- **Evaluation depth** offers Balanced (3 years / 12 future choices), Deep (10 years / 40), and Life rollout (up to 600 future choices or the terminal state). Deeper evaluation costs more time and does not guarantee a better result. The same selected depth is used for seed searching.
- **Start Auto** applies recommendations during the current life, including blank/default names and reflections. It also follows the native post-death voice continuation, which is not yet a completed life. Use native **x32** to advance faster. Auto stops at a terminal ending, leaving the game, Escape, Stop, or manual game interaction. It never starts another life. Native Auto is turned off when advisor Auto starts.
- Select achievements and/or traits using the searchable goal list. Requirements are displayed below each goal; **Selected only** and **Clear goals** simplify managing selections. All selected goals must match; traits must still be present at the checked state. Goals and search settings are saved locally.
- **At birth** searches random seeds against their initial state. Use this for birth conditions and starting traits.
- **At end of simulated life** plays each candidate locally using the advisor policy, checking native achievements and final traits. Start with 1–5 candidates: this is substantially more expensive than birth filtering. Progress includes the current age and decision count. Stop cancels immediately and retains the best completed partial result. A partial result is explicitly labeled and lists missing goals; it is not a full match.
- A full-life result stores its exact choice route. From the game's home screen, click **Start found seed**, then **Start Auto**. Replay checks a fingerprint covering the entire simulation state, including stats, history, quest progress and RNG. At the ending, the script checks live goals and whether the final fingerprint matches the saved simulation.
- The latest route and replay position survive reloads. Auto remains off after reload. Resume the life through the game, then enable Auto: the advisor rejoins only if the current state matches a saved route step. This does not back up or restore the game's save itself.
- **Export route** downloads compact JSON. **Import route** replays that file through the inspected engine, checking every legal action and recomputing summaries and goals; supplied success claims are not trusted. Existing v1 exports are accepted when they contain a complete reproducible route. **Copy seed** copies the seed for manual use.
- Drag the panel header to move it, or focus the header and use arrow keys (Shift moves farther; Home resets). Its position is clamped to the viewport and remembered. Minimize with **−** and reopen with **Life Advisor**; this preference is saved too.

## What the source establishes

- Birth uses a string seed hashed into an FNV-style 32-bit state and a Mulberry32-style generator. Gender and whether a name is supplied change random-number consumption; seed alone is insufficient to reproduce all settings.
- Events and choices update that same state. Choices can change future event eligibility, jobs, grades, traits, and death risks. There is no single universally best choice for every objective.
- The game's native Auto policy includes random selections, dream preferences, and special rules for requests and minigames. The advisor evaluates the native outcomes instead.
- Achievements are computed by the native record evaluator, including implied lower achievements. Some require death or a particular ending. Several desired outcomes cannot coexist in a single life.
- The UI is React. The adapter reads the committed React tree to find the active simulation ref and native callbacks. Choices and starting a seed use those callbacks; the advisor does not replace save data, assign traits, or fabricate achievement records.

## Accuracy and limits

“Best” means the highest score among evaluated choices, **not a proven optimal life**. Balanced uses up to three years, twelve future choices and 160 simulation steps; Deep uses ten years, forty future choices and 480 steps; Life rollout uses up to 600 future choices and 5,000 steps. Future choices inside each candidate trajectory use an immediate-score policy, not an exhaustive branching search. A longer trajectory can detect delayed consequences, but it can still miss complex quests or choose a worse long-term plan. Selected goals dominate the score, followed by survival, age, health, sanity, wealth, network, reputation, heir progress, and Fixer grade. No calibrated win probability or measured general success-rate improvement is claimed.

Seed filtering labels a result a complete match only when every selected goal is satisfied at the checked state. Full-life matches must reach a terminal state within 5,000 simulation steps, including any post-death voice continuation. Unsuccessful bounded search does not establish impossibility. Achievement persistence still belongs to the native game ending flow.

Only the minor-choice countdown and saved UI progress are excluded from replay identity; the remaining simulation state is represented by a compact two-part fingerprint. This is an accidental-divergence check, not a cryptographic authenticity mechanism. Imports are independently re-simulated. Changing language or starting settings, making different choices, native timeout choices, game updates, and a hidden/frozen tab can prevent replay. The game pauses its normal progress when hidden; this script does not bypass that behavior. Stored routes cannot migrate across unsupported game bundles.

The script supports the inspected `index-C_XxXzM6.js` bundle and disables actions on another bundle version. The distributable contains the game's publicly delivered client logic and text; that material remains attributable to its original authors. This is an unofficial local companion.

## Validation of 1.1.0

Complete browser replays were checked against the live game's native state and achievement evaluator:

| Seed | Starting settings | Final age | Replayed choices | Result |
| --- | --- | --- | --- | --- |
| `123456` | English, male, seeded name | 97 | 188 | Terminal fingerprint and records matched, including save/reload/resume |
| `42` | Japanese, female, name `Kai` | 68 | 123 | Terminal fingerprint and records matched |

These tests use accelerated native animation-frame timestamps with the game's tick cap and state transitions retained. UI tests cover imports, persistence, partial matches, cancellation, native pause preservation, panel position, manual apply, unsupported versions, and a forced native post-death voice fixture. Engine tests also cover complete legacy v1 imports. The deeper evaluator catches a delayed death missed by Balanced in a controlled regression scenario. These checks establish functionality in the tested cases, not a measured win-rate improvement or coverage of every rare quest. Userscript-manager installation itself remains untested.

## Build and checks

The workspace retains the formatted inspected source in `analysis/game.bundle.js` and its URL/hash in `analysis/source.json`.

```powershell
node build.cjs
node --check dist/cityborn-advisor.user.js
npm test
```

For the optional live browser test:

```powershell
npm ci
npx playwright install chromium
npm run test:browser
```

To use an installed Microsoft Edge instead, set `BROWSER_CHANNEL=msedge` (PowerShell: `$env:BROWSER_CHANNEL = 'msedge'`) before running the browser test. Build and engine tests require only Node.js 22 or newer. GitHub Actions rebuilds the distribution, checks for stale generated files, and runs the engine test on pushes and pull requests.

`tests/planner.cjs` checks a controlled delayed-consequence scenario across all evaluation depths. `tests/engine.cjs` checks full-life determinism, purity, native voice continuation, legal actions, import validation, and full-state fingerprints. `tests/browser.cjs` checks the UI, export/import, persistence, partial results, cancellation, and pause ownership, then runs complete native replays with different languages/genders and save/reload/resume. Browser full-life tests accelerate rAF timestamps while retaining the native tick cap, events and RNG; this is not evidence that hidden/frozen tabs or userscript-manager installation work. The test writes local results to `analysis/browser-results.json`.
