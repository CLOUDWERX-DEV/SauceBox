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

*   🎬 **Native Playback & Visual Video Trimmer**
    *   **In-App Player:** Play your offline archive directly inside the high-performance integrated player.
    *   **Visual Trimmer:** Slice custom highlights without losing quality. Grab the dual-slider handles to drag frame-by-frame on a timeline scrubbing track with real-time video feedback, or snap handles instantly using `[ Set Start ]` and `[ Set End ]` buttons. Slices are saved as fresh standalone gallery cards using lossless FFmpeg extraction in milliseconds without re-encoding.
*   🗂️ **Curated Playlists & Drafts System**
    *   **Localized Draft States:** Add, remove, rename, set cover art, or drag-and-drop tracks to reorder in a localized scratch workspace. Changes are only saved when explicitly clicking the orange **Save & Return** button, keeping your library database unpolluted.
    *   **Auto-Advance Playback:** Sequences automatically advance to the next video when the active one ends.
    *   **External Player Support:** Enable an external player (e.g. VLC or MPV) in Settings, and SauceBox passes the entire sequence directly to your preferred video player.
*   🔒 **Vault Security & Deep Stealth Mode**
    *   **Vault PIN Lock:** Protect your offline collection behind a secure 4-digit PIN lock screen on startup.
    *   **Panic Stealth Hotkey:** Hit the customizable global stealth hotkey (`Ctrl + Shift + H` by default) to instantly hide the application window from the desktop and OS taskbar, pause all active download streams, and mute any active video playback instantly.
*   🌐 **"Send to SauceBox" Browser Extension**
    *   **One-Click Dispatch:** Install the included companion Manifest V3 browser extension to right-click any video on supported tube sites or click the extension icon to instantly send target page URLs directly to your local SauceBox background queue.
*   📡 **Media Server & VR Broadcast (Quick Cast)**
    *   **Local Network Server:** Run the built-in Express-based media server to stream your gallery.
    *   **TV & VR Streaming:** Generate dynamic M3U playlists with embedded cover art and `#EXTART` tags for players like Skybox VR.
    *   **Quick Cast:** Single-click a QR code or connection URL on any video card to stream it instantly to your Smart TV, smartphone, or VR headset with real-time FFmpeg HLS transcoding.
*   ⚙️ **Advanced Layout & System Configuration**
    *   **Bandwidth Control:** Throttle download speeds (KB/s) to prevent network congestion.
    *   **Atomic Storage Engine:** Writes state to human-readable `saucebox-settings.json` and `saucebox-gallery.json` files in your OS application data folder using crash-immune atomic writes.
    *   **Safety Thresholds:** Prevent disk-full errors with free-space safety monitoring.

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
