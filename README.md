# VeDock

**Cloudflare. At your fingertips.**

A Windows desktop workspace for Cloudflare D1 databases, R2 storage, and Workers logs. Connect your accounts through Cloudflare OAuth and keep everyday development work in one place.

**[Visit vedock.com](https://vedock.com)** · [Report an issue](https://github.com/ampaee8-alt/vedock-public/issues) · [Contact support](mailto:support@vedock.com)

## Status

VeDock is **in development and not yet publicly released**. There is no public download available. The live website introduces the product through illustrative demos with sample data.

The desktop application is being built for Windows 10 and Windows 11 on x64. Using it requires your own Cloudflare account and the permissions needed for the modules you authorize.

## The workspace

- **D1:** browse tables, stage and review edits, detect conflicting changes, run SQL, and export results.
- **R2:** browse objects and folders, upload and download files, review collisions before overwriting, and confirm deletion after lock and Data Catalog checks.
- **Workers logs:** follow live events, query available log history, and bring a selected value into D1 to investigate further.
- **Accounts and jobs:** switch account context, track operations, and reconcile uncertain results before retrying a write.

Cloudflare’s service limits, permissions, charges, and log retention rules still apply.

## Local by design

The desktop application connects directly to Cloudflare using OAuth; you do not paste an API token into VeDock. Credentials are protected by Windows, and sensitive fields in the local workspace store are encrypted. Cache, query history, and job records stay on your device. Viewed Worker log events remain in memory rather than being saved as a log archive.

VeDock has no application backend, account sync service, or application telemetry. The public website is hosted on Cloudflare Pages. See the [Privacy policy](https://vedock.com/privacy) for the distinction between the desktop application, website hosting, and support correspondence.

## About this repository

This is VeDock’s public website, documentation, and issue hub. The static website lives in [`site/`](site/). This repository does **not** contain the desktop application source code and does not present the desktop application as open source.

Bug reports and feature suggestions are welcome in [Issues](https://github.com/ampaee8-alt/vedock-public/issues). Include the steps you took and what you expected to happen. Do not post access tokens, passwords, private logs, or sensitive production data. For private support, email [support@vedock.com](mailto:support@vedock.com).

## Links

- [Website](https://vedock.com)
- [Privacy policy](https://vedock.com/privacy)
- [Terms of use](https://vedock.com/terms)
- [Third-party notices](https://vedock.com/licenses)
- [Support](mailto:support@vedock.com)

## Trademark notice

VeDock is an independent application and is not affiliated with, endorsed by, or sponsored by Cloudflare, Inc. Cloudflare® is a registered trademark of Cloudflare, Inc.
