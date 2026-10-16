<img align="right" width="150" src="https://raw.githubusercontent.com/ChurchApps/FreePlayAdmin/main/public/images/logo.png">

# FreePlayAdmin

[![License](https://img.shields.io/github/license/ChurchApps/FreePlayAdmin?style=flat-square)](https://github.com/ChurchApps/FreePlayAdmin/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/ChurchApps/FreePlayAdmin?style=flat-square&color=yellow)](https://github.com/ChurchApps/FreePlayAdmin/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/ChurchApps/FreePlayAdmin?style=flat-square)](https://github.com/ChurchApps/FreePlayAdmin/commits)
[![Sponsor](https://img.shields.io/badge/Sponsor-ea4aaa?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/ChurchApps)
[![Slack](https://img.shields.io/badge/Slack-4A154B?style=flat-square&logo=slack&logoColor=white)](https://join.slack.com/t/livechurchsolutions/shared_invite/zt-i88etpo5-ZZhYsQwQLVclW12DKtVflg)

> **FreePlayAdmin** is the free, open-source admin site for [FreePlay](https://freeplay.church/), the church TV app. Build playlists from any connected content provider (Lessons.church, Dropbox, Google Drive, OneDrive, The Bible Project, Jesus Film and more), put them on a calendar per screen group, pair your TVs with a four-letter code, and let them play on their own all week — or present a playlist straight from your browser. It runs at <a href="https://admin.freeplay.church/">https://admin.freeplay.church/</a> and shares your ChurchApps login with B1 Admin.

## How it fits together

- **FreePlayAdmin** (this repo) — screens, playlists, calendar and provider connections.
- **[FreePlay](https://github.com/ChurchApps/FreePlay)** — the TV app for Android TV, Fire TV and Apple TV. Pair it from *Settings → Pair to a calendar*; it downloads the week ahead and plays by the clock, even offline.
- **[Api](https://github.com/ChurchApps/Api)** — the shared ChurchApps API (`doing` module) that stores playlists, schedules and screen groups and resolves each screen's manifest.

## Get Involved

### 🤝 Help Support Us

The only reason this program is free is because of the generous support from users. If you want to support us to keep this free, please head over to [ChurchApps](https://churchapps.org/partner) or [sponsor us on GitHub](https://github.com/sponsors/ChurchApps/). Thank you so much!

### 🏘️ Join the Community

We have a great community for end-users on [Facebook](https://www.facebook.com/churchapps.org). It's a good way to ask questions, get tips and follow new updates. Come join us!

### ⚠️ Report an Issue

If you discover an issue or have a feature request, simply submit it to our [issues log](https://github.com/ChurchApps/ChurchAppsSupport/issues). Don't be shy, that's how the program gets better.

### 💬 Join us on Slack

If you would like to contribute in any way, head over to our [Slack Channel](https://join.slack.com/t/livechurchsolutions/shared_invite/zt-i88etpo5-ZZhYsQwQLVclW12DKtVflg) and introduce yourself. We'd love to hear from you.

### 🏗️ Start Coding

If you'd like to set up the project locally, see our [development guide](https://churchapps.org/dev). The short version is:

1. Copy `.env.sample` to `.env` and point it at your API (the defaults target a local [Api](https://github.com/ChurchApps/Api) on port 8084).
2. Install the dependencies with `yarn install` (this also copies the shared locale and CSS files).
3. Run `yarn start` and open http://localhost:3105.
4. Run `yarn test` for the Playwright suite — it needs the local Api with demo data (`npm run reset-demo` in the Api repo).

### 🚀 Deploying

Pushes to `main` build the site and publish it to https://admin.freeplay.church through the `Deploy Prod` GitHub Action.
