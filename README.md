<p align="center">
  <img src="public/logo.png" width="256" height="256" alt="SauceBox Logo" />
</p>

<h1 align="center">SauceBox</h1>

<p align="center">
  <strong>Download, organize, and stream adult content — all from one app!</strong><br/>
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

*   ⚡ **Multi-Threaded Download Manager** — Paste single URLs or bulk lists to fetch ultra-high-quality media (up to 4K/2160p). Features a dynamic queue manager to monitor active network streams and track completed items.
*   🎬 **GPU-Accelerated Native Playback & Visual Video Trimmer** — Play offline files instantly in the native GPU-accelerated player, or use the interactive visual timeline trimmer to extract highlight clips losslessly in milliseconds without re-encoding via FFmpeg.
*   🗂️ **Curated Playlists & External Handoff** — Curate custom collections inside a safe drafting workspace. Support auto-advance sequenced playback or delegate the entire playlist queue to external media players (VLC/MPV).
*   🔒 **Vault Security & Deep Stealth Mode** — Lock the application interface behind a secure 4-digit PIN screen on startup. Smash the global Stealth Hotkey (`Ctrl + Shift + H`) to instantly hide the app from the taskbar, pause active downloads, and mute audio.
*   🌐 **"Send to SauceBox" Extension** — Dispatch video URLs directly to your local download queue in one click using the companion Manifest V3 browser extension.
*   📡 **Media Server & VR Broadcast** — Stream your local gallery to Smart TVs and VR headsets (e.g. Skybox VR) using a built-in Express server, featuring dynamic M3U playlists, cover art injection, and HLS Quick Cast transcoding.
*   🤖 **Runtime Provisioning Engine** — Zero-configuration setup. SauceBox automatically downloads, manages, and updates the required `yt-dlp` and `ffmpeg` engine binaries for your OS on startup.
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

SauceBox supports Windows and Linux natively, with macOS support coming very soon!

🎉 **Zero-Configuration Core Engines:** As of version 1.7.0, SauceBox features a native **Runtime Provisioning Engine**. On first launch, the app will automatically download, extract, and auto-update the required `yt-dlp` and `ffmpeg` binaries for your operating system behind the scenes. You do not need to install anything manually! *(Advanced users can override this behavior in the Settings tab).*

### 💿 Method A: Installing Pre-Compiled Releases (For General Users)

Download the latest native installers for Windows and Linux from our GitHub **Releases** page:
*   **Windows:** Download the standard `.exe` installer (NSIS executable) or the standalone portable executable.
*   **Linux:** Download the `.deb` package (Debian/Ubuntu) or the standalone `.AppImage` bundle.
    *   *Note for AppImage users:* Make the AppImage executable before launching:
        ```bash
        chmod +x SauceBox-*.AppImage
        ./SauceBox-*.AppImage
        ```
*   **macOS:** *Coming very soon!* We do not currently publish pre-compiled macOS installers due to Apple Silicon hardware testing and developer licensing requirements. If you want to accelerate official macOS builds, please consider supporting development via a [donation](https://buymeacoffee.com/cloudwerxl3)! In the meantime, advanced users can compile and run from source (see below).

### 💻 Method B: Compiling & Running from Source (For Developers & Enthusiasts)

#### 1. Get the Source Code
```bash
git clone https://github.com/CLOUDWERX-DEV/SauceBox.git
cd SauceBox
npm install
```

#### 2. Run the Application
```bash
npm run dev
```

### 🐳 Method C: Deploy via Docker (For Servers & NAS)

SauceBox can be run headlessly via Docker, providing a full Web UI perfect for home servers and Raspberry Pis (`linux/amd64` and `linux/arm64` supported).

The Docker image uses a Debian base, meaning the **Zero-Configuration Runtime Provisioning Engine** and the **in-app yt-dlp Updater** work exactly the same as the desktop version!

Run with Docker Compose:
```yaml
services:
  saucebox:
    image: cloudwerxlabs/saucebox:latest
    container_name: saucebox
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./saucebox_data:/data
```

For full details on configuring the headless Web UI and persistent storage, see the [Docker Deployment Guide](docs/DOCKER_DEPLOYMENT.md).

---

## 🧩 Installing the Browser Companion Extension

The "Send to SauceBox" extension allows you to dispatch video URLs directly to your local desktop queue in one click.

### Step 1: Download the Extension Files
If you installed SauceBox via an installer (`.exe`, `.deb`, etc.), you will need to download the extension directory from this repository:
*   **Windows / Standard Users:** Go to the [Releases](https://github.com/CLOUDWERX-DEV/SauceBox/releases) page and download the `Source code (zip)` file for the latest release. Extract the ZIP file anywhere on your PC.
*   **Linux / Mac / Advanced Users:** Clone the repository via terminal:
    ```bash
    git clone https://github.com/CLOUDWERX-DEV/SauceBox.git
    ```

### Step 2: Load into Your Browser
1. Open Google Chrome, Brave, Edge, or any Chromium-based browser.
2. Navigate to your browser's extension settings (e.g. `chrome://extensions/` or `brave://extensions/`).
3. Enable **Developer mode** (usually a toggle in the top right corner).
4. Click **Load unpacked** in the top left.
5. Navigate to and select the `chrome-extension` directory located inside the SauceBox folder you downloaded/cloned.

### Step 3: Pin the Extension to Your Toolbar
Once loaded, the extension will appear in your browser's Extensions menu (the puzzle piece icon in the top right). Click it, find **Send to SauceBox** in the list, and click the **pin icon** next to it. This will anchor the SauceBox icon directly into your toolbar so it's always one click away.

### How to Use It

There are two ways to send a URL to SauceBox:

**Option A: Right-click any page or link**
Right-click anywhere on a video page, or right-click a video link directly in the page, and select **"Send to SauceBox"** from the context menu. The URL will be dispatched instantly to your local SauceBox download queue.

**Option B: Click the toolbar icon**
While viewing any page you want to download, click the SauceBox icon in your browser toolbar. It will automatically grab the current page's URL and send it straight to the queue. No copying and pasting required.

### Step 4: Configure for Docker (Optional)
If you are running SauceBox headlessly in a Docker container (like on a NAS or Raspberry Pi), you need to tell the extension where to find it.
1. Right-click the SauceBox icon in your browser toolbar and click **Options**.
2. Change the Server URL from the default `http://127.0.0.1:13337` to your Docker server's IP (e.g., `http://192.168.1.100:8080`).
3. Click Save.

> **Note:** SauceBox must be running (either the desktop app or the Docker container) for the extension to work. If the app is closed, the extension will log a connection error to the browser console.

## 🤝 Contributing & Developer Guidelines

We welcome community contributions, bug fixes, and feature requests! To keep the README user-friendly, we have compiled all deep-dive engineering details, structural maps, and code style protocols into a dedicated developer guide. 

Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) in the root of the project to get started with our Electron + React Native Web development workflow.

---

## 💖 Support the Developer

If you love using SauceBox and want to support our ongoing open-source development, server costs, and build infrastructure, please consider buying us a coffee!


<p align="center">
  <a href="https://buymeacoffee.com/cloudwerxl3" target="_blank">
    <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee" height="40" />
  </a>
  &nbsp;&nbsp;
  <a href="https://github.com/sponsors/CLOUDWERX-DEV" target="_blank">
    <img src="https://img.shields.io/badge/Sponsor%20on%20GitHub-EA4AAA?style=for-the-badge&logo=github-sponsors&logoColor=white" alt="Sponsor on GitHub" height="40" />
  </a>
</p>

---

## 📄 Software License

SauceBox is licensed under the **GNU General Public License version 3 (GPL-3.0-only)**. 

SauceBox is and will always remain **100% free and open-source software**. You are free to redistribute, modify, and inspect it under the terms of the GNU General Public License as published by the Free Software Foundation. See the official [LICENSE](LICENSE) file in the root of this repository for full terms.

---

<p align="center">
  Made with 🔥 and React Native by <a href="http://cloudwerxlab.com">CLOUDWERX LAB</a>
</p>
