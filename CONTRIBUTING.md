# Contributing to SauceBox

Thank you for your interest in contributing to SauceBox! We welcome all developers, designers, and enthusiasts to help build, refine, and secure the ultimate private media manager. 

Please read through this guide to understand our architecture, development guidelines, and coding standards.

---

## 🏗️ Architectural Overview

SauceBox is built as a cross-platform desktop application using **Electron** for the backend process and **React Native Web** (compiled via Webpack) for the frontend interface.

```
+---------------------------------------+
|          React Native Web UI          |
+---------------------------------------+
                   ^
                   | (IPC Channels)
                   v
+---------------------------------------+
|         Electron Main Process         |
+---------------------------------------+
   |              |             |      `-- (Atomic Writes) -> [JSON Storage Engine]
   |              |             `-- (Express App) ------> [Local Media Server]
   | (Spawn)      | (Spawn)
   v              v
[yt-dlp]       [FFmpeg]
```

### 1. State Management (`Zustand` + Physical Storage)
- The frontend state is managed via `zustand` utilizing a custom asynchronous persistence adapter in `src/store.js`.
- All state changes are serialized and sent to the Electron main process via custom IPC channels.
- The storage module (`electron/modules/storage.js`) writes state atomically to two isolated JSON files inside the OS application data directory:
  - `saucebox-settings.json` (Configuration parameters, Vault PINs, proxies, and binary paths)
  - `saucebox-gallery.json` (Gallery library history, ratings, tags, and playlists)
- **Crash Immunity:** State modifications are written to a `.tmp.json` file first, then atomically swapped/renamed to prevent database corruption.

### 2. Core Engines (`yt-dlp` & `ffmpeg`)
- **yt-dlp:** Governs metadata scraping, playlist fetching, and high-performance video extraction.
- **FFmpeg:** Handles real-time video probe commands, frame-by-frame snapshotting for thumbnails, lossless trimmer clipping, and on-the-fly streaming transcoding.

### 3. Media & Broadcast Server
- Exposes an Express-based media server (`electron/modules/mediaServer.js`) serving HLS and raw MP4 streams over the local network or internet.
- Generates dynamic M3U playlists with embedded cover art and `#EXTART` tags for smart TV and VR players (such as Skybox VR).
- Incorporates real-time FFmpeg pipe transcoding to convert unsupported formats (e.g. `.mkv`, `.webm`) into browser-compatible `.mp4` structures.

---

## 📁 Source Directory Map

SauceBox adopts a **feature-as-a-folder** folder design pattern. Keep source files modular and strictly **under 600 lines** when possible.

```
SauceBox/
├── docs/                            # In-depth engineering manuals
├── electron/                        # Electron main process (Node.js backend)
│   ├── main.js                      # Entry point & window controller
│   └── modules/                     # Modular IPC handler modules
├── src/                             # React Native Web frontend
│   ├── components/                  # Reusable UI widgets
│   │   ├── tabs/                    # Orchestrator views
│   │   └── Help/                    # Documentation modal sub-views
│   ├── store.js                     # Global state configuration
│   └── theme.js                     # Design tokens and colors
├── chrome-extension/                # Manifest V3 browser companion
└── package.json                     # Packaging dependencies & targets
```

---

## 💻 Technical Guidelines

### 1. File Length and Modularity
To ensure code maintainability, all source code files (excluding public documentation) should be kept **under 600 lines**. If a tab or modal grows too complex:
- Decompose and extract sub-components into a dedicated feature folder (e.g. `src/components/tabs/Download/`).
- Define styles in a separate stylesheet module inside the same directory (e.g. `DownloadStyles.js`).

### 2. Style Tokens & UI Parity
- Adhere strictly to the design system configured in `src/theme.js`.
- **Primary Color:** `#FF8C00` (Orange). Actionable buttons must utilize this primary color with bold `#000000` (Black) text to ensure readability and contrast.
- **Borders & Backgrounds:** Deep dark surfaces (`#0a0a0a` / `#0f0f0f`) with subtle orange borders (`#FF8C0020`).
- **Tooltips:** Always wrap interactive actions (like delete, edit, reorder buttons) in our modular `<Tooltip>` component. Never use standard native HTML `title` attributes.

### 3. Build & Safety Checks
- Before proposing any edits, always execute `npm run build` to verify Webpack compiles cleanly under production mode with zero errors or warnings.
- Address version warnings, dependency warnings, and lint issues immediately.

---

## 🚀 Step-by-Step Development Setup

1. **Prerequisites:** Ensure you have [Node.js (v18+)](https://nodejs.org/), [Git](https://git-scm.com/), `ffmpeg`, and `yt-dlp` installed.
2. **Clone the Repository:**
   ```bash
   git clone https://github.com/CLOUDWERX-DEV/SauceBox.git
   cd SauceBox
   ```
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```
5. **Compile Binaries (Test-Packaged):**
   ```bash
   npm run build
   npm start
   ```

---

## 🛡️ Pull Request & Contribution Rules

- **Zero Mocks/Placeholders:** We write production-grade code at all times. Do not submit `TODO` statements, mocks, or temporary logic.
- **Privacy First:** Ensure all user metadata, file structures, and histories are strictly confined to the local filesystem. Never introduce analytics tracking, telemetry, or remote collection.
- **Attribution:** All code contributions are governed under the GPL-3.0 software license. Please add your licensing attributions clearly.

*Made with passion and dedication by CLOUDWERX LAB.*
