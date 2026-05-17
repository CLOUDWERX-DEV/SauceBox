# Changelog

## [1.3.8] - 2026-05-16

### Fixed
- **Download Spacing Optimization**: Fine-tuned vertical margins, paddings, and child gaps in `DownloadStyles.js`. By shaving 148px of redundant empty height across main card padding, input margin, batch section margins, and tips layout padding, the downloads tab now comfortably fits all default screen heights perfectly without triggering a tiny 1-10px scrollbar.

## [1.3.7] - 2026-05-16

### Fixed
- **Scrollbar Behavior Polish**: Changed the application's layout overflow behaviour. Removed the nested `main-content-wrapper` div inside `DownloadTab.js` to avoid layout nesting bugs and updated `overflow-y: scroll;` to `overflow-y: auto;` in the HTML shell (`public/index.html`) and tab containers (`GalleryTab.js`, `SettingsTab.js`, `BroadcastTab.js`, `QueueStyles.js`). The scrollbar now only appears if content actually exceeds the viewport height, ensuring a smooth, clean, premium UI on all resolutions.

## [1.3.6] - 2026-05-16

### Added
- **Branding Copy Document**: Created `docs/BRANDING_COPY.md` with 10 short descriptions, 10 extended descriptions, and 10 taglines for use in marketing materials.
- **Branding Applied Everywhere**: Deployed chosen branding copy across all surfaces — README header/body, `package.json` description field (appears in `.deb` / NSIS / AppImage installer metadata), HelpModal header subtext (`"Your sauce. Your box. Your rules."`), and HelpContent "Getting Started" subtitle.
- **Source Directory Map**: Added a comprehensive source directory tree to `CONTRIBUTING.md` so new contributors immediately understand the modular file structure and know where to place new components.
- **Interactive Guide Navigation**: Converted reference keywords ("Queue", "Settings", "Gallery", "cast") inside the "How to Use SauceBox" guide card on the Download tab into active clickable links styled in our brand orange color palette, allowing users to instantly jump to target app screens.

### Changed
- **Modular Refactoring (HelpModal)**: Decomposed the 773-line `HelpModal.js` into a 191-line orchestrator. Extracted the switch-case content renderer into `src/components/Help/HelpContent.js` and shared styles into `src/components/Help/HelpStyles.js`.
- **Modular Refactoring (DownloadTab)**: Decomposed the 666-line `DownloadTab.js` into a 270-line orchestrator. Extracted the URL input form into `DownloadInputForm.js`, the batch section into `BatchSection.js`, and the tips card into `HowToUseCard.js` under `src/components/tabs/Download/`.
- **Modular Refactoring (QueueTab)**: Decomposed the 634-line `QueueTab.js` into a 184-line orchestrator. Extracted the download card renderer into `DownloadCard.js` and the empty state UI into `EmptyQueueState.js` under `src/components/tabs/Queue/`.

### Fixed
- **Linux .deb Icon Missing**: Fixed a critical packaging issue where the application icon would not appear in Linux app menus (GNOME, Cinnamon, KDE, etc.) after installing the `.deb` package. Generated a complete set of XDG-compliant icon sizes (16×16 through 512×512) in `build/icons/` and updated the `electron-builder` Linux config to point to the icon directory rather than a single PNG file. Also generated `build/icon.ico` (multi-size embedded) for Windows installers.
- **Frameless Window Minimize Bug (Linux)**: Minimizing the app on Linux desktop environments caused the window to vanish entirely instead of minimizing to the taskbar. Removed the unsupported `titleBarStyle: 'hidden'` property on Linux (macOS-only, conflicts with `frame: false`) and added `skipTaskbar: false` explicitly to the BrowserWindow config.
- **Linux Taskbar Icon Missing in Dev Mode**: Added `app.setIcon(nativeImage.createFromPath(...))` call after `createWindow()` on Linux. `BrowserWindow`'s `icon` option only sets the window decoration icon — `app.setIcon()` is the correct Electron API for the taskbar icon on Linux desktop environments.
- **Logo Missing in Packaged Builds (.deb / AppImage)**: `source={{ uri: 'logo.png' }}` bare string URIs only resolve in dev mode where webpack-dev-server serves `public/` as static files. In packaged builds loading via `file://`, no server exists and paths resolve to nothing. Fixed by adding an `asset/inline` webpack rule for PNG/JPG/GIF/WebP/SVG files and importing `logo.png` directly as a JS module in `TitleBar.js`, `Sidebar.js`, `VideoThumbnail.js`, and `App.js`. Webpack now inlines images as base64 data URIs, working identically in all environments.
- **Help Modal Sidebar Too Wide**: Force-locked the Help panel navigation sidebar to 160px using `flexGrow: 0`, `flexShrink: 0`, `minWidth`, and `maxWidth`. In React Native Web a plain `width` on a `ScrollView` is ignored — the component flexes to fill available space, making the nav panel dominate the layout.


## [1.3.4] - 2026-05-16
### Added
- **4K / 2K Resolution Support**: Extended the quality selector in Settings, VideoPreviewModal (the Preview button), and the download pipeline to support Ultra HD (2160p / 4K) and Quad HD (1440p / 2K) resolutions. yt-dlp format strings are updated to request the correct height, with automatic fallback to the next-closest quality if the site does not offer it.
- **Internet Exposure Mode**: Added a new "Expose Server to the Internet" toggle in the Broadcast tab's Security section. When enabled, the app detects the user's public IP (via ipify), displays a second QR code card styled in a red danger theme, and shows the external URL alongside the local-network URL. A native confirmation dialog warns the user of the security implications before enabling.
- **PIN Reset Instructions**: Added an OS-aware "Forgot your PIN?" hint card below the Vault PIN field. It dynamically computes the exact Local Storage folder path for the current OS (Windows `%APPDATA%\saucebox\...`, macOS `~/Library/Application Support/saucebox/...`, Linux `~/.config/saucebox/...`) and shows the correct shell command or Finder/Explorer tip to delete it and regain access.

### Fixed
- **Phantom Babel Syntax Errors**: Fixed a massive Webpack configuration bug where both `main` and `runtime` chunks were attempting to save as `bundle.js` in development, causing parallel write collisions, corrupting the Babel `.cache`, and throwing phantom syntax errors.
- **Production Packaged Builds**: Fixed a critical issue where the built `.deb` / `.AppImage` binaries would show a blank screen. `electron/main.js` now correctly serves the statically compiled `dist/index.html` via `app.isPackaged` rather than hardcoding the localhost dev server.
- **Dangling Dev Server**: Fixed an issue where closing the Electron window during development left the `webpack serve` instance running invisibly on port 8081 by adding `--kill-others` to the concurrently script.
- **Help Modal sidebar width**: Reduced the sidebar from 260px to 220px and tightened horizontal padding to prevent layout overflow on small windows.

### Changed
- **Quality resolution badges**: Gallery, Queue, and live download cards now display human-readable badges ("4K", "2K") instead of raw resolution strings like "2160p" / "1440p".
- **Settings quality description**: Added an explanatory note above the quality selector explaining the fallback behaviour when a site does not offer the selected resolution.
- **Broadcast Security section renamed**: Renamed "Security" to "Security & Exposure" to reflect the new internet-facing options.
- **Webpack build optimization**: Overhauled `webpack.config.js` to use `SplitChunksPlugin` (separating vendor, common, and app chunks), `TerserPlugin` with 2-pass compression, content-hashed filenames for cache busting, and raised performance budget limits appropriate for an Electron app. Build is now warning-free and produces better-cached output chunks.

## [1.3.3] - 2026-05-16
### Added
- Browser Extension now sends URLs directly to the app when the toolbar icon is clicked.
- System Binaries panel in Settings with auto-detection, browse buttons, and cross-platform installation guides for yt-dlp and ffmpeg.
- Navigation links to the Download tab added to empty states in Queue and Gallery tabs.

### Fixed
- Help Modal layout issues by adding ScrollView wrappers for smaller window sizes.

### Changed
- Broadcast warning card updated with explicit server-side authentication security instructions.
- Removed redundant UI text from the Settings tab maintenance section.

## [1.3.2] - 2026-05-14
### Added
- Added a warning card to the Broadcast Tab to explicitly explain the network sharing implications of the current download directory.
- Added explicit CTAs to the Gallery Tab's empty state to direct users to the Download Tab or Import tool.

### Fixed
- Fixed an issue where copying the server URL to the clipboard on the Broadcast Tab threw a "Document is not focused" runtime error by adding a robust invisible-input fallback mechanism.
- Corrected the branding color scheme of the "SauceBox" text in the main TitleBar and Sidebar to reflect pure white and primary orange.
- Resolved `electron-builder` Linux compilation failures by adding missing `homepage`, `author` (email), and `linux.maintainer` fields to `package.json`, and removing unsupported `rpm` and `pacman` targets.

## [1.3.1] - 2026-05-14
### Fixed
- Fixed an issue where the "Host Stream URL" button did not auto-start the media server.
- Resolved "Live Monitor Log" text truncation, ensuring full paths and IPs are visible.
- Ensured the Playlist URL is hidden appropriately when the server is stopped.
- Prevented Live Monitor log spam by rate-limiting duplicated stream requests (e.g., from VLC HTTP chunk requests) for the same file and IP.

## [1.3.0] - 2026-05-14
### Added
- Integrated `electron-builder` natively into `package.json` to properly support packaging cross-platform binaries across Linux (AppImage, deb, rpm), Windows (NSIS executable, Portable), and macOS (dmg).
- Authored a comprehensive cross-platform compilation and deployment workflow guide in `docs/RELEASES.md`.
- Overhauled the Help Panel (Documentation Modal): Added a detailed guide for manually installing the Chrome web companion extension, integrated deep-dive explanations of advanced settings (maintenance, auto-clear, proxy), and published an explicit `Supported Sites` section detailing `yt-dlp` coverage networks.
- The `GalleryTab` now dynamically unmounts the search and filter bar completely when the local history library is empty to reduce initial UI clutter.

### Changed
- Overhauled the `DownloadTab` UI: the generic "SauceBox Engine" feature card has been replaced with an explicit step-by-step "How to Use" instructional guide.
- Improved the "Feeling Lucky?" action: clicking the app logo now strictly respects the `settings.notifications` state and will quietly launch random videos/sites without triggering desktop notifications if they are disabled.
## [1.2.1] - 2026-05-14
### Fixed
- Resolved Broadcast auto-start persist bug. The media server status now strictly adheres to the active backend instance state rather than persisting falsely across sessions.
- Fixed an issue where the Broadcast "Stop Server" button received an event object instead of correctly issuing the stop command.
- Removed duplicate Quick Cast buttons from the Gallery tab to maintain a cleaner UI interface.
### Added
- Added a centralized dynamic version number badge to the main application Title Bar, mapped directly to the active build version.

## [1.2.0] - 2026-05-13
### Added
- Complete Media Server & VR Broadcast overhaul: added a Live Monitor to intercept network requests and show exactly what devices are streaming which files.
- Quick Cast: Instant one-click streaming directly from video gallery cards. Instantly spawns a 1-item temporary playlist and QR code for TV/VR headsets.
- Auto-Start Server: Added an option in settings to launch the media server headlessly on startup.
- Advanced M3U Metadata: Implemented #EXTART metadata injection into playlists so premium VR players (like Skybox VR) display full cover art thumbnails and group videos by custom tags.
- On-the-Fly Transcoding: Integrated real-time FFmpeg streaming to force-transcode incompatible formats (like .mkv and .webm) to .mp4 instantly while streaming to headsets.
- Completely scrubbed all references to the internal project name, updating all user-facing documentation, logs, and components to SauceBox.

## [1.1.0] - 2026-05-13
### Added
- Implemented robust UI text truncation for long filenames in the Import Wizard.
- Added comprehensive Duplicate Detection & Conflict Resolution workflow in the Import tool. Users can now choose to Skip, Replace, or Duplicate conflicting files with batch "Apply to All" functionality.
- Enhanced the Chrome extension's download pipeline. Extension downloads now properly trigger the primary download flow with immediate metadata fetching, thumbnail generation, and quality resolution.
- Separated the `Queue` page into two visually distinct and beautifully styled "Active Downloads" and "Completed" sections.
- Restyled the `VideoPlayer` to be completely responsive dynamically, perfectly adapting to the window's current dimensions using `vw`/`vh` sizing and flexbox while maintaining the `16:9` aspect ratio.
- Rebuilt the `VideoPlayer` Header to show dynamic metadata identical to the gallery cards rather than generic titles.
- Added `Open Folder` and `Open Player` functionality to the `VideoPlayer` controls for seamless external media management.

### Fixed
- Fixed an issue where the Chrome extension failed to load due to missing `icon.png` in the manifest by correctly migrating the primary logo to the local extension folder.
- Resolved severe application locking and hanging issues when multiple downloads were active. Restructured the `yt-dlp` output capture pipeline in the main process to severely throttle IPC spam (progress, speed, and ETA) into a single 500ms batched payload.
- Fixed overlay background opacity dimming inside `VideoPlayer` and `EditVideoModal` for clearer visual contrast, preserving full title bar visibility.

## [1.0.0] - 2026-05-12
### Initial Release
- Initial stable release of SauceBox Media Manager.
