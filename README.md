# Nexus Messenger

One window for all the web apps you keep open all day.

[![Latest release](https://img.shields.io/github/v/release/MrJOYEN/nexus-messenger)](https://github.com/MrJOYEN/nexus-messenger/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/MrJOYEN/nexus-messenger/total)](https://github.com/MrJOYEN/nexus-messenger/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

<a href="https://apps.microsoft.com/detail/9PBW3G2B60J6">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://get.microsoft.com/images/en-us%20light.svg">
    <img alt="Get it from Microsoft" src="https://get.microsoft.com/images/en-us%20dark.svg" height="48">
  </picture>
</a>

Nexus is a lightweight desktop hub for Windows. Each service runs in its own
isolated session, side by side in a single window, with native notifications
and unread counters.

![The Nexus window: services in the sidebar with unread badges, a messaging service and a calendar side by side in split view](docs/hero.png)

## Why

Two problems, one tool.

**Tab overload.** The apps you live in (WhatsApp, Discord, your mail, your
calendar) end up scattered across fifty browser tabs, and you hunt for the
right one every time. Nexus pins them in a sidebar. One click, or `Ctrl+1` to
`Ctrl+9`, and you are there.

**One account per browser.** A browser only keeps one WhatsApp Web session
alive at a time. Nexus gives every service its own isolated session, so three
WhatsApp accounts on three numbers stay signed in together, next to two
Discord accounts and anything else. They never sign each other out.

## Features

- Isolated session per service: cookies, storage and logins never mix
- Native Windows notifications, with per-service mute (sound included)
- Do not disturb: silence everything for 30 minutes, 1 hour, until tomorrow
  morning or until you turn it off — unread badges keep counting
- A volume level per service, with a mixer panel and a master level. Scroll over
  an icon to adjust it; the sidebar shows which services are turned down
- Unread badges in the sidebar, on the taskbar icon and on the tray icon
- A catalogue of popular services with their real logos, plus any custom URL
- Split view: two services side by side or stacked, with a draggable divider
- App lock with a code, plus a personal code per service, asked at every opening
- Drag and drop ordering, keyboard shortcuts, close to tray
- Per-service sleep to free memory, manual or automatic
- Spell checking as you type, following the interface language
- Start with Windows, optionally hidden in the tray
- Automatic updates through GitHub Releases
- English, French and Spanish interface

## Install

1. Download the latest `Nexus-Setup-x.y.z.exe` from the
   [Releases page](https://github.com/MrJOYEN/nexus-messenger/releases).
2. Run it. Windows SmartScreen will warn about an unknown publisher because
   the installer is not code signed: choose "More info", then "Run anyway".
3. On first launch, pick your language and the services you use. Everything
   can be changed later.

To add a service afterwards, click the `+` button at the bottom of the
sidebar. Right click any icon in the sidebar to edit, reorder, mute or
remove it.

## Shortcuts

| Keys | Action |
| ---- | ------ |
| `Ctrl+1` to `Ctrl+9` | Switch to the Nth service |
| `Ctrl+N` | Add a service |
| `Ctrl+R` | Reload the active service |
| `Ctrl+M` | Open the volume mixer |
| `Ctrl+D` | Toggle do not disturb |
| `Ctrl+L` | Lock Nexus (once a code is set) |
| `Ctrl+Q` | Quit (the close button only hides to the tray) |
| `Alt` | Show the menu bar |

## Build from source

Requires Node.js 20 or newer.

```bash
npm install
npm start            # run in development
npm run build        # build the Windows installer into dist/
npm run build:store  # build the MSIX package for the Microsoft Store
```

The two channels never cross: the installer updates itself through GitHub
Releases, the Store package leaves that to the Store. See
[docs/MICROSOFT-STORE.md](docs/MICROSOFT-STORE.md).

Architecture notes, design decisions and troubleshooting live in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md). Issues and pull requests are
welcome.

## License

[MIT](LICENSE)
