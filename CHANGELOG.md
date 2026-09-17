# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

## [1.0.0] - 2026-09-17

First public release.

### Added

- Weighted random launch from your own list, with the previously visited site excluded
  from the next draw.
- Next-stop preview so you can reroll before committing.
- Manual priority from 1 to 5 per site, edited as a row of blocks.
- Automatic visit boost, derived from visit counts on a logarithmic curve and capped, with
  a toggle to switch it off. It cannot be edited by hand.
- Pinned column on the left, reorderable by dragging or with per-row move controls.
- Most-visited panel on the right, ranked by visits with a consecutive-day streak.
- Directory dialog to add, remove, re-prioritise and pin places.
- Config import and export as JSON, merging by URL and keeping the higher visit counts,
  streaks and priorities.
- Keyboard shortcuts: Space to reroll, Enter to go, Escape to close dialogs.
- Docker image based on nginx alpine, with a health endpoint, gzip and security headers.
- GitHub Pages deployment workflow.
- Runtime test suite driving the real page in a DOM, plus a CI guard that fails the build
  if the app stops being self-contained.

### Security

- URLs are restricted to http and https with an explicit allow-list, so `javascript:` and
  `data:` payloads cannot be stored or opened.
- All list content is written to the DOM as text, never as markup.
- A restrictive Content-Security-Policy and related headers are served by the bundled
  nginx config.

[Unreleased]: https://github.com/whereisxuezugi/Whereto/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/whereisxuezugi/Whereto/releases/tag/v1.0.0
