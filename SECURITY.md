# Security policy

## Supported versions

The latest release on `main` is the only supported version. Because the app is a single
static file, updating means replacing `index.html`.

| Version | Supported |
| ------- | --------- |
| Latest `main` | Yes |
| Older tags | No |

## Reporting a vulnerability

Please report privately rather than opening a public issue.

Use GitHub's [private vulnerability reporting](https://github.com/whereisxuezugi/Whereto/security/advisories/new)
on this repository. Include what you found, how to reproduce it, and what an attacker
could do with it.

You can expect an acknowledgement within a few days. If the report is valid, a fix will
be prepared before any public disclosure, and you will be credited unless you prefer not
to be.

## What is in scope

The app runs entirely in the browser with no backend, so the interesting surface is small
but real:

- Script injection through a site name, URL, or category, including via an imported
  config file.
- Anything that causes an imported config to execute code or exfiltrate data.
- A crafted URL that escapes the intended `window.open` behaviour, for example a
  `javascript:` payload reaching a link or navigation.
- Reverse tabnabbing or similar attacks on the pages the launcher opens.
- Flaws in the Docker image or `nginx.conf` that expose more than the static files.

## What is out of scope

- The security of the third-party sites you add to your own list.
- Anyone with physical or console access to your browser reading `localStorage`. The app
  documents that your list is stored unencrypted on your device.
- Missing hardening that has no exploit path, reported with no proof of concept.
- Findings from automated scanners without a demonstrated impact.

## Design notes relevant to security

- The app makes no network requests at runtime and loads no third-party code. The CI guard
  in `scripts/check-selfcontained.js` fails the build if that changes.
- Site names, URLs, and categories are written to the DOM with `textContent`, never with
  `innerHTML`, so list content is treated as text.
- URLs are parsed with the `URL` constructor and rejected if invalid; sites open in a new
  tab with `noopener`.
- The served `nginx.conf` sets a restrictive Content-Security-Policy along with
  `X-Content-Type-Options`, `Referrer-Policy`, and a deny on framing.
