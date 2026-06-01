# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- App version surfaced in the navigation modal and at `/api/health`.
- Self-hosting deploy scripts (`scripts/deploy.sh`, `scripts/poll.sh`).

### Changed

- Canonical site URL centralized in `SITE_URL` and pointed at `confessio.fr`
  (overridable via `NEXT_PUBLIC_SITE_URL`).
- Node version pinned via `.nvmrc` (22); CI reads it.

## [0.1.0]

- Initial release.
