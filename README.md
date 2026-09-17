<div align="center">

<img src="docs/assets/logo.webp" alt="Where to?" width="320">

<h3>A calm launcher that sends you to a random site from your own list.</h3>

<p>
  No accounts. No tracking. No build step. One HTML file that works offline.
</p>

<p>
  <a href="#quick-start"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-E0851A?style=flat-square"></a>
  <a href="https://github.com/whereisxuezugi/Whereto/actions/workflows/ci.yml"><img alt="CI status" src="https://img.shields.io/github/actions/workflow/status/whereisxuezugi/Whereto/ci.yml?branch=main&style=flat-square&label=CI"></a>
  <img alt="Dependencies: none" src="https://img.shields.io/badge/runtime%20dependencies-none-3C6A5F?style=flat-square">
  <img alt="Single file" src="https://img.shields.io/badge/app-1%20file-3C6A5F?style=flat-square">
  <img alt="Works offline" src="https://img.shields.io/badge/works-offline-3C6A5F?style=flat-square">
  <a href="https://github.com/whereisxuezugi/Whereto/stargazers"><img alt="Stars" src="https://img.shields.io/github/stars/whereisxuezugi/Whereto?style=flat-square&color=E0851A"></a>
</p>

</div>

---

You have a folder of bookmarks you never open. Practice sites, half-finished courses, CTF
platforms, puzzle archives. The problem was never finding something to do, it was deciding.

**Where to?** removes the deciding. Press one button and it picks somewhere for you, biased
towards the things you said matter and the things you actually keep coming back to.

## Contents

- [Why you might want this](#why-you-might-want-this)
- [Features](#features)
- [Quick start](#quick-start)
- [Docker](#docker)
- [How the weighting works](#how-the-weighting-works)
- [Configuration](#configuration)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Privacy](#privacy)
- [Layout](#layout)
- [Development](#development)
- [Design notes](#design-notes)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Why you might want this

| If you | Where to? does this |
| --- | --- |
| Keep a long list of practice sites and open none of them | Picks one and opens it, in one keystroke |
| Want some sites to come up more than others | Weighted picking with a manual 1 to 5 priority |
| Want your habits to matter, not just your intentions | Adds an automatic boost based on where you actually go |
| Have three or four daily regulars | Pin them to the left rail, ordered how you like |
| Want to see whether you are keeping it up | Tracks visits and consecutive-day streaks |
| Distrust web apps that want an account | Stores everything locally, requests nothing, works offline |

## Features

**Launching**

- One button picks a random site from your list and opens it in a new tab.
- The site you just visited is excluded from the next draw, so you are not sent straight back.
- A next-stop preview shows where you are about to land, so you can reroll before committing.

**Deciding what comes up**

- **Priority**, 1 to 5 per site, set by hand. A priority 5 site is drawn five times as often
  as a priority 1 site.
- **Visit boost**, automatic and not editable. The more you open something, the more weight
  it quietly earns on top of its priority. It grows on a logarithmic curve and is capped, so
  one busy site never crowds out the rest. It can be switched off.

**Organising**

- **Pinned column** on the left for your regulars, reordered by dragging, or with the move
  controls on each row for touch and keyboard.
- **Most visited** panel on the right, ranked by visit count, each with a consecutive-day
  streak.
- **Directory** dialog to add, remove, re-prioritise and pin everything in one place.

**Living with it**

- Starts completely empty. No bundled sites, no suggestions, no clutter.
- Import and export your list as plain JSON to move between browsers or machines.
- Full keyboard control.
- Respects `prefers-reduced-motion`.

## Quick start

The app is a single file. There is nothing to install and nothing to build.

```bash
git clone https://github.com/whereisxuezugi/Whereto.git
cd Whereto
```

Then open `index.html` in your browser. That is the whole setup. It works from the file
system, with no server involved.

<details>
<summary><strong>Prefer to serve it locally</strong></summary>

<br>

```bash
# any static server will do
python3 -m http.server 8080
# or
npx serve .
```

Then visit `http://localhost:8080`.

</details>

<details>
<summary><strong>Prefer to host it</strong></summary>

<br>

Copy `index.html` anywhere that serves static files: GitHub Pages, Netlify, Cloudflare
Pages, an S3 bucket, a folder on your own box. There is no backend to deploy.

This repository includes a GitHub Pages workflow. Enable Pages in the repository settings
with "GitHub Actions" as the source, and every push to `main` that touches the app
publishes it.

</details>

**Adding your first site.** Press **Add**, paste a URL, and optionally give it a name,
a category, a priority, and a pin. Repeat for anything you want in the rotation. Or press
**Import** and load a JSON config, such as the `sample-config.json` in this repository,
which has ten well-known puzzle, course and CTF sites to start from.

## Docker

```bash
docker build -t whereto .
docker run --rm -p 8080:80 whereto
```

Then visit `http://localhost:8080`.

With Compose:

```bash
docker compose up -d
```

The image is `nginx:1.27-alpine` with the app copied in. There is no build stage and
nothing to install, so it stays small and starts instantly.

| Detail | Value |
| --- | --- |
| Base image | `nginx:1.27-alpine` |
| Exposed port | `80` |
| Health endpoint | `/healthz` |
| Health check | Built in, via `wget` |
| Compose hardening | Read-only root filesystem, tmpfs for runtime paths, `no-new-privileges` |
| Headers | Content-Security-Policy, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame denial |

## How the weighting works

Each site has a **weight**. Higher weight means it comes up more often:

```
weight = priority + visitBoost
```

`priority` is yours, from 1 to 5, and defaults to 3.

`visitBoost` is derived from your visit count and cannot be set by hand:

```
visitBoost = min(5, floor(log2(visits + 1)))
```

That curve means the boost climbs quickly at first and then flattens out, so a site you
have opened three times gets a nudge while one you have opened two hundred times does not
dominate the entire list.

| Visits | 0 | 1 | 3 | 7 | 15 | 31 | 63+ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Boost | +0 | +1 | +2 | +3 | +4 | +5 | +5 (capped) |

A site is then chosen at random in proportion to its weight, with the previously visited
site left out of the draw. Turning the boost off in the directory falls back to priority
alone.

## Configuration

Import and export from the top bar. The format is plain JSON, safe to hand-edit and to
keep in a private repository or a password manager.

```json
{
  "version": 1,
  "settings": {
    "boost": true
  },
  "sites": [
    {
      "id": "unique-id",
      "name": "picoCTF",
      "url": "https://picoctf.org/",
      "category": "ctf",
      "priority": 4,
      "pinned": true,
      "pinRank": 1,
      "visits": 0,
      "streak": 0,
      "lastVisited": null
    }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `url` | string | Yes | The only required field. `https://` is added if you leave it off. Only `http` and `https` are accepted. |
| `name` | string | No | Defaults to the domain |
| `id` | string | No | Generated if absent |
| `category` | string | No | Free text, such as `ctf` or `course`. Shown as a tag |
| `priority` | number | No | 1 to 5, defaults to 3 |
| `pinned` | boolean | No | Puts the site in the left rail |
| `pinRank` | number | No | Order within the pinned rail. Normalised to 1..n on load |
| `visits` | number | No | Defaults to 0 |
| `streak` | number | No | Defaults to 0 |
| `lastVisited` | string | No | `YYYY-MM-DD`, or `null` |
| `settings.boost` | boolean | No | Whether the automatic visit boost is applied |

**Importing merges rather than replaces.** Entries are matched by URL. For a site you
already have, the higher visit count and streak win, an incoming priority is applied, and
pinning is additive. Entries without a usable URL are skipped. Exports include your visit
history, so your streaks survive the move.

The visit boost is never stored: it is recomputed from `visits` every time, so it cannot
drift out of sync or be faked by editing the file.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| <kbd>Space</kbd> | Reroll the next-stop preview |
| <kbd>Enter</kbd> | Go to the previewed site |
| <kbd>Esc</kbd> | Close a dialog |
| <kbd>Tab</kbd> | Move through the interface |

Pinned sites can be dragged to reorder. Every pinned row also has move up and move down
controls, so reordering works on touchscreens and by keyboard, where native drag and drop
does not.

## Privacy

There is no backend, so there is nothing to opt out of.

- Your list lives in `localStorage` under the key `whereto.v1`, on your device only.
- No analytics, no telemetry, no cookies, no accounts, no third-party requests.
- The app makes no network calls at runtime. A CI check fails the build if that ever
  changes.
- Sites open with `noopener`, so the page you land on cannot reach back into the launcher.

The practical consequences: clearing site data clears your list, so export a config if you
care about it, and your list is not encrypted, so anyone with access to your browser
profile can read it.

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Where to?          Directory  Import  Export  Add   GitHub  │
├───────────────┬──────────────────────────────┬───────────────┤
│               │                              │               │
│   PINNED      │          [ logo ]            │ MOST VISITED  │
│               │                              │               │
│  ⠿ picoCTF    │        next stop             │ 1  picoCTF    │
│  ⠿ Euler      │   ┌──────────────────┐       │       x12  5d │
│  ⠿ Exercism   │   │  Project Euler   │       │ 2  Euler      │
│               │   └──────────────────┘       │       x9   2d │
│  drag to      │                              │ 3  Codewars   │
│  reorder      │           ( Go )             │       x4      │
│               │                              │               │
└───────────────┴──────────────────────────────┴───────────────┘
```

On narrower screens the pinned rail moves below the launcher and becomes a horizontal
row; on phones everything stacks into one column.

## Development

No toolchain is needed to change the app: edit `index.html` and refresh. Node 18 or newer
is only required to run the checks.

```bash
npm install     # jsdom, the single dev dependency
npm run verify  # self-contained check plus the test suite
```

| Command | What it does |
| --- | --- |
| `npm test` | Boots the real `index.html` in a DOM and drives it like a person would |
| `npm run check` | Fails if the app stops being self-contained or busts its size budget |
| `npm run verify` | Both of the above |
| `npm start` | Serves the folder on port 8080 |
| `npm run docker:build` | Builds the container image |
| `npm run docker:run` | Runs it on port 8080 |

**The tests are real.** `test/app.test.js` loads the actual page, clicks the actual
buttons, and asserts on what ends up in storage: adding and rejecting sites, streak
arithmetic across day boundaries, the weighted draw over thousands of samples, boost maths,
pin reordering, and config import merging.

**The guard is real too.** `scripts/check-selfcontained.js` fails CI on an external script
or stylesheet, a remote resource, a runtime network call, an image without intrinsic
dimensions, or an `index.html` over its size budget. The promise on the tin stays true by
construction.

```
Whereto
├── index.html                 the entire app
├── sample-config.json         ten starter sites, opt-in only
├── Dockerfile                 nginx alpine, no build stage
├── docker-compose.yml         hardened run configuration
├── nginx.conf                 headers, gzip, health endpoint
├── scripts/                   the self-contained guard
├── test/                      runtime test suite
├── docs/assets/               logo used by this README
└── .github/                   CI, Pages, issue forms, Dependabot
```

## Design notes

The interface is built around one idea: a **warm analog wayfinding board**, closer to a
printed transit timetable than to a dashboard.

- Manila paper, warm brown-black ink, a marigold accent, and a pine green secondary.
- Hairline rules divide the columns instead of floating cards. No soft shadows anywhere.
- The Go button is a flat enamel key with a hard offset edge that presses down when clicked.
- Counts, streaks and ranks are set in a monospace face with tabular figures, the way real
  timetables print numbers.
- The logo is hand-brushed lettering, recoloured to the palette and knocked out so the page
  itself shows through the letters.

Everything, including the logo, is inline. There are no web fonts and no image requests, so
the page renders identically offline and on first paint.

## FAQ

<details>
<summary><strong>Why is my list empty after clearing browser data?</strong></summary>

<br>

Because that is where it lives. The app stores your list in `localStorage` rather than on a
server, so clearing site data removes it. Use **Export** to keep a copy, and **Import** to
restore it.

</details>

<details>
<summary><strong>Can I sync between machines?</strong></summary>

<br>

Not automatically, by design. Export a config and import it on the other machine. Since it
is plain JSON, a private git repository or any file sync tool handles this well.

</details>

<details>
<summary><strong>Why did the same site come up twice in a row?</strong></summary>

<br>

It should not, unless you only have one site. The previous pick is removed from the pool
before the next draw. If you have two sites and press Go repeatedly you will alternate.
If you can reproduce a genuine repeat with three or more sites, please open an issue.

</details>

<details>
<summary><strong>Can I edit the visit boost directly?</strong></summary>

<br>

No, and that is deliberate. It is a measure of what you actually do, so letting you type a
number into it would defeat the point. Change the manual priority instead, or switch the
boost off in the directory.

</details>

<details>
<summary><strong>Why does drag and drop not work on my phone?</strong></summary>

<br>

Native HTML drag and drop is not implemented on most touch browsers. Every pinned row has
move up and move down controls for exactly this reason, and they work with a keyboard too.

</details>

<details>
<summary><strong>Nothing happens when I press Go.</strong></summary>

<br>

Your browser is probably blocking the new tab. The app shows a message when it detects
this. Allow pop-ups for the page, since opening a new tab is the whole point of the button.

</details>

<details>
<summary><strong>Can I change the colours?</strong></summary>

<br>

Yes. Every colour is a custom property in the `:root` block at the top of `index.html`.
Change `--bg`, `--flag`, `--pin` and the rest, and the entire interface follows.

</details>

## Contributing

Issues and pull requests are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the setup,
the test suite, and the handful of rules that keep the project small: one file, no
dependencies, works offline, starts empty.

Please report security problems privately. See [SECURITY.md](SECURITY.md).

- [Contributing guide](CONTRIBUTING.md)
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

[MIT](LICENSE) © whereisxuezugi

<div align="center">
<br>
<sub>Built to be opened, used for five seconds, and closed.</sub>
</div>
