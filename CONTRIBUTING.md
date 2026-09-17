# Contributing

Thanks for wanting to help. This project is deliberately small, and keeping it that way is
part of the design, so the guidance below is mostly about what *not* to add.

## The rules that shape everything

1. **One file.** The entire app is `index.html`: markup, styles, script, logo. No bundler,
   no framework, no CDN, no web fonts.
2. **Works offline.** Opening the file from disk with a double click must work exactly like
   serving it. Nothing may hit the network at runtime.
3. **Starts empty.** No bundled sites. The list belongs to the person using it.
4. **Their data stays theirs.** Everything lives in `localStorage`. No accounts, no
   telemetry, no analytics, no third-party requests.
5. **Calm by default.** Motion is small and purposeful, and honours
   `prefers-reduced-motion`.

`scripts/check-selfcontained.js` enforces most of this in CI, so a change that breaks rule
one or two will fail the build rather than surprise someone later.

## Getting set up

You do not need a toolchain to work on the app. To edit it:

```bash
git clone https://github.com/whereisxuezugi/Whereto.git
cd Whereto
```

Then open `index.html` in a browser and refresh as you edit. If you prefer a server:

```bash
npm start          # serves the folder on http://localhost:8080
```

To run the checks, you need Node 18 or newer:

```bash
npm install        # installs jsdom, the only dev dependency
npm run verify     # self-contained check plus the test suite
```

## Tests

`test/app.test.js` boots the real `index.html` in a DOM and drives it the way a person
would: clicking buttons, typing into fields, importing files. There is no test framework,
just assertions and a summary.

Add a case when you change behaviour. The existing sections are a good template:

```js
console.log('\n10. My new behaviour');
{
  const { doc, store } = boot(seedState);
  doc.getElementById('someButton').click();
  ok('it does the thing', store._dump().sites[0].thing === true);
}
```

Run a single file with `node test/app.test.js`.

## Working on the code

`index.html` is organised top to bottom: design tokens in `:root`, then component styles
roughly in the order they appear on screen, then the markup, then one IIFE containing the
script. Inside the script the order is: state, dates, persistence, the site model, pinning,
core actions, rendering, drag and drop, dialogs, import and export, events, init.

A few conventions worth matching:

- Colours come from the tokens in `:root`. Do not hard-code a hex value in a component.
- Numbers shown to the reader (counts, streaks, ranks) are set in the monospace face.
- Anything persisted goes through `save()`, and anything read at startup goes through
  `normalizeSite()` so older and imported data stays valid.
- The script targets plain ES5-era syntax for maximum reach; there is no transpiler.

## Commits and pull requests

- Keep pull requests focused on one thing.
- Write commit subjects in the imperative: "add streak tooltip", not "added" or "adds".
- Fill in the pull request checklist honestly; an unchecked box is fine if you explain why.
- Add an entry to `CHANGELOG.md` under Unreleased.

## Reporting bugs

Open an issue using the bug report form. The most useful thing you can include is the
smallest sequence of steps that reproduces the problem, plus your browser version. If the
issue involves your list, an exported config with the personal entries stripped out helps
enormously.

## Security

Please do not open a public issue for a security problem. See [SECURITY.md](SECURITY.md).
