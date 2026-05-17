<p align="center">
  <img src="public/logo.png" width="256" height="256" alt="SauceBox Logo" />
</p>

<h1 align="center">SauceBox</h1>

<p align="center">
  <strong>Download, organize, and stream adult content — all from one app! SauceBox.</strong><br/>
  <em>Your sauce. Your box. Your rules.</em><br/><br/>
  <a href="https://saucebox.app">saucebox.app</a>
</p>

<p align="center">
  <img src="docs/assets/saucebox-main-ui.png" width="100%" alt="SauceBox Main UI" />
</p>

<p align="center">
  SauceBox combines the raw power of <code>yt-dlp</code> with a high-performance desktop interface to give adult content enthusiasts a fully private, locally-hosted media empire — with VR broadcasting, playlist curating, batch downloading, and a panic-button stealth mode built right in.
</p>

---

## 🔞 Designed Proudly for Adult Media Curation

SauceBox is built from the ground up to handle, archive, and organize adult media. We believe your private collections should stay **100% private, locally-hosted, and free from corporate surveillance, cloud subscriptions, or tracking.** SauceBox natively supports thousands of video platforms via `yt-dlp` integration, allowing you to build a local media library from your favorite adult tube networks.

---

## 🚀 Core Features

*   🎬 **Native Playback & Visual Video Trimmer** — Play offline files instantly in-app, or use the interactive visual timeline trimmer to extract highlight clips losslessly in milliseconds without re-encoding via FFmpeg.
*   🗂️ **Curated Playlists & External Handoff** — Curate custom collections inside a safe drafting workspace. Support auto-advance sequenced playback or delegate the entire playlist queue to external media players (VLC/MPV).
*   🔒 **Vault Security & Deep Stealth Mode** — Lock the application interface behind a secure 4-digit PIN screen on startup. Smash the global Stealth Hotkey (`Ctrl + Shift + H`) to instantly hide the app from the taskbar, pause active downloads, and mute audio.
*   🌐 **"Send to SauceBox" Extension** — Dispatch video URLs directly to your local download queue in one click using the companion Manifest V3 browser extension.
*   📡 **Media Server & VR Broadcast** — Stream your local gallery to Smart TVs and VR headsets (e.g. Skybox VR) using a built-in Express server, featuring dynamic M3U playlists, cover art injection, and HLS Quick Cast transcoding.
*   ⚙️ **System Configuration & Safeguards** — Limit download speeds to throttle bandwidth usage, configure network proxies to bypass ISP blocks, and prevent storage issues with automated free-space safety monitoring.

---

## 🔞 Supported Sites

SauceBox natively integrates with `yt-dlp` to fetch and extract media from over 1,000+ online video networks. Explicitly supported and tested adult platforms include:

*   **Pornhub** & **Xvideos**
*   **SpankBang** & **RedTube**
*   **YouPorn** & **Eporner**
*   **Stripchat**, **Chaturbate**, & **CAM4**
*   **Camsoda** & **Beeg**
*   **Motherless**, **Nuvid**, **4tube**, & **ThisVid**
*   **... and over 1,000+ more!**

---

## 📦 Setup & Installation

SauceBox is fully cross-platform, supporting Windows, Linux, and macOS.

### 💿 Method A: Installing Pre-Compiled Releases (For General Users)

Download the latest native installers for your operating system from our GitHub **Releases** page:
*   **Windows:** Download the standard `.exe` installer (NSIS executable) or the standalone portable executable.
*   **macOS:** Download the `.dmg` disk image.
*   **Linux:** Download the `.deb` package (Debian/Ubuntu) or the standalone `.AppImage` bundle.
    *   *Note for AppImage users:* Make the AppImage executable before launching:
        ```bash
        chmod +x SauceBox-*.AppImage
        ./SauceBox-*.AppImage
        ```

### 💻 Method B: Compiling & Running from Source (For Developers & Enthusiasts)

#### 1. Install System Dependencies
SauceBox requires both `yt-dlp` and `ffmpeg` to be installed and available in your system's PATH.

*   **Windows:** Run in PowerShell:
    ```powershell
    winget install yt-dlp
    winget install ffmpeg
    ```
*   **Linux (Debian/Ubuntu):** Run in terminal:
    ```bash
    sudo apt update
    sudo apt install ffmpeg
    sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
    sudo chmod a+rx /usr/local/bin/yt-dlp
    ```
*   **macOS:** Run in terminal (requires Homebrew):
    ```bash
    brew install ffmpeg yt-dlp
    ```
*(Alternatively, you can place portable binaries in any directory and map their paths under the **Settings > System Binaries** tab inside SauceBox.)*

#### 2. Get the Source Code
```bash
git clone https://github.com/CLOUDWERX-DEV/SauceBox.git
cd SauceBox
npm install
```

#### 3. Run the Application
*   **Running the Desktop Electron App:**
    ```bash
    npm run dev
    ```
*   **Accessing via a Web Browser:**
    If you want to browse your collection or stream media on another device, start the media server in the **Broadcast** tab, and enter the local network address (`http://<your-local-ip>:<port>`) in any mobile, desktop, or headset web browser.

---

## 🧩 Installing the Browser Companion Extension

1. Open Google Chrome, Brave, Edge, or any Chromium-based browser.
2. Navigate to your browser's extension settings (e.g. `chrome://extensions/`).
3. Enable **Developer mode** (top right corner toggle).
4. Click **Load unpacked** in the top left and select the `chrome-extension/` directory located inside your SauceBox project folder.

---

## 🤝 Contributing & Developer Guidelines

We welcome community contributions, bug fixes, and feature requests! To keep the README user-friendly, we have compiled all deep-dive engineering details, structural maps, and code style protocols into a dedicated developer guide. 

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) in the root of the project to get started with our Electron + React Native Web development workflow.

---

## 💖 Support the Developer

If you love using SauceBox and want to support our ongoing open-source development, server costs, and build infrastructure, please consider buying us a coffee!

<a href="https://buymeacoffee.com/cloudwerxl3" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" >
</a>

---

## 📄 Software License

SauceBox is licensed under the **GNU General Public License version 3 (GPL-3.0-only)**. 

SauceBox is and will always remain **100% free and open-source software**. You are free to redistribute, modify, and inspect it under the terms of the GNU General Public License as published by the Free Software Foundation. See the official [LICENSE](LICENSE) file in the root of this repository for full terms.

---

<p align="center">
  Made with 🔥 and React Native by <a href="http://cloudwerxlab.com">CLOUDWERX LAB</a>
</p>
