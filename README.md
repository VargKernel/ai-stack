# AI-Stack

**Unified AI workspace — all your neural agents in one place**

AI-Stack is a beautiful, cross‑platform desktop application that bundles your favourite AI assistants into a single, persistent workspace.
Chat with ChatGPT, Claude, DeepSeek, Gemini, and Grok side‑by‑side, each keeping its own login session.

## Features

- **Multiple AI agents** – ChatGPT, Claude, DeepSeek, Gemini, Grok.
- **Tabbed interface** – open several agents at once, switch with one click.
- **Six built‑in themes** – Dark, Light, Nord, Catppuccin, Solarized, Gruvbox (with official colour palettes).
- **Persistent sessions** – each agent stores its own cookies and local data; stays logged in after restart.
- **Custom context menu** – Cut, Copy, Paste, Reload, Select All (right‑click inside any webview).
- **Loading spinner** – a centered, circular progress indicator while pages load.
- **Collapsible sidebar** – search agents, toggle visibility, remember state.
- **Offline detection** – friendly banner and screen when the internet drops.
- **Clear sessions** – wipe individual agent data directly from Settings.
- **Cross‑platform** – runs on Linux (AppImage) and Windows (NSIS installer).
- **Portable & light** – built with Electron, around 100 MB compressed.

## Installation & Development

Make sure you have **Node.js 18+** and **npm** installed.

```bash
git clone https://github.com/VargKernel/ai-stack
cd ai-stack
npm install
npm start          # run the app in development mode
```

If you prefer to inspect the main process:

```bash
npm run dev
```

## Building installers

Build both Linux and Windows packages at once:

```bash
npm run build
```

Or build them separately:

```bash
npm run build:linux   # AppImage
npm run build:win     # Windows NSIS installer (.exe)
```

The output will be placed in the `dist/` folder:

- `AI-Stack-1.1.0.AppImage`
- `AI-Stack Setup 1.1.0.exe`

> **Note**: To build a Windows installer you need to provide an icon file (`assets/icon.ico`).

## Project structure

```
ai-stack/
├── assets/
│   ├── icon.svg
│   └── icon.ico
├── renderer/
│   ├── app.js          # UI logic, webview handling, themes, etc.
│   ├── index.html      # main window markup
│   └── styles.css      # full theme system & layout
├── main.js             # Electron main process, IPC handlers, session management
├── preload.js          # context bridge for secure renderer-main communication
├── package.json
└── README.md
```

## Themes

Cycle through the themes via the palette button at the bottom of the sidebar.
Each theme uses official colour palettes:

- **Dark** – modern, eye‑friendly dark scheme.
- **Light** – clean and bright.
- **Nord** – arctic, bluish colours.
- **Catppuccin** – warm pastel Mocha flavour.
- **Solarized** – carefully balanced light theme.
- **Gruvbox** – retro groove, dark medium variant.

## Context menu & keyboard shortcuts

Right‑click inside any agent’s page to access:

- **Cut** / **Copy** / **Paste**
- **Reload Agent**
- **Select All**

Keyboard shortcuts in the main window:

| Shortcut               | Action                |
|------------------------|-----------------------|
| `Ctrl` + `F`           | Focus agent search    |
| `Ctrl` + `R`           | Reload active agent   |
| `Escape`               | Close modal dialogs   |

## Where data is stored

- **Linux**: `~/.config/ai-stack/`
- **Windows**: `%APPDATA%\ai-stack\`

Inside, you’ll find:

- `ai-stack-config.json` – theme, open tabs, sidebar state.
- `Partitions/` – persistent sessions for each AI agent.

To reset the app, simply delete the `ai-stack` folder while the application is closed.
