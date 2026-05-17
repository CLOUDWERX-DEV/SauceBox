# Changelog

## [1.6.1] - 2026-05-17

### Changed
- **Maintenance & Cleanup Button Layout**: Fixed and overhauled the styling of all buttons in the "Maintenance & Cleanup" section under Settings. Replaced variable horizontal paddings with a clean, uniform fixed width of `150px` and aligned elements perfectly, establishing consistent, premium button sizing and typography across all rows.
- **Stealth Mode Hotkey UI Alignment**: Aligned the "Record" button inside the Security & Vault settings section to match the standard `150px` width of other settings buttons. Added clean UI formatting to the hotkey string (converting verbose Electron symbols like `CommandOrControl` to a sleek, compact `Ctrl` or `Cmd` format) to prevent layout text wrapping.
- **Advanced Numerical Settings Inputs Overhaul**: Refactored the numerical text inputs for "Safety Disk Threshold", "Concurrent Downloads", and "Speed Limit". Overhauled their width to a consistent `100px` and removed inline padding overrides so they match the height and styling of other input fields. Added uniform trailing labels with fixed-width layout styling (`width: 80px`), ensuring perfect vertical alignment on the right.
- **Redesigned About Tab**: Completely overhauled the About section inside settings, turning it into a gorgeous premium dashboard. Added a bold, stylish logo header, brand tagline, and project description. Included a real-time library statistics grid showing total videos, total disk size, and combined playtime (natively compiled from the Zustand gallery state). Added organized sections for system specifications (OS, App version, local storage scheme) and core engine details (yt-dlp, FFmpeg, React Native + Electron). Integrated symmetrical resource buttons with primary/outlined styles for Buy Me A Coffee support, official site, company website, and GitHub repository.
- **Help Modal Branding Upgrades**: Replaced the placeholder question mark icon in the top-left of the Help documentation modal with our official, webpack-inlined base64 SauceBox logo. Overhauled the header title's color formatting to display "Sauce" in white and "Box" in our primary orange brand color, matching the sidebar logo section's premium styling.
- **Expanded Supported Sites Documentation**: Added YouPorn to the list of core explicitly tested and supported adult networks in both `README.md` and the Help panel documentation (`HelpContent.js`), and updated both references to prominently note the broader support for over 1,000+ online video networks.
- **Core Engine Resource Linking**: Integrated external link actions on the `yt-dlp` and `FFmpeg` spec tags inside the Settings About dashboard. Clicking either key opens their official website or GitHub repository cleanly in the host browser.
- **Database Storage Label Refinement**: Changed the system specification label for the database format inside the Settings About tab from "Split Physical JSON" to "JSON" for cleaner and sleeker information display.
- **Automated Release Script & Comprehensive Documentation**: Developed a highly automated, fully interactive release shell script (`release.sh`) in the project root to handle local compile, cross-compilation (Windows & Linux via Wine), tag validation, changelog parsing, and secure direct publication to GitHub Releases via `gh` CLI. Overhauled `docs/RELEASES.md` into an extensive cross-platform release engineering manual featuring detailed prerequisites, strategic guidance on minor vs major version cycles, and a step-by-step interactive manual.
- **Development Guidelines & Release Safety Protocol**: Added a new foundational ruleset `## 9. Production Release Protocol` inside `CONTRIBUTING.md` establishing a strict execution guard requiring manual execution of `release.sh` and outlining a chronological release staging process for maintainers to safely execute native builds and tags.
- **Workspace Ignore Refinement**: Added `dist-bin/` to `.gitignore` to prevent massive compiled binary installers and standalone executables (AppImages, DEBs, and Windows EXEs) from bloating the Git repository and history.
- **GPLv3 Licensing**: Created and customized a formal, production-grade `LICENSE` file in the root directory under the GNU General Public License version 3, configured explicitly with CLOUDWERX LAB copyright attributions, SauceBox details, official `https://saucebox.app` product links, and 2026 dates to guarantee SauceBox remains 100% free and open-source forever. Integrated a dedicated Software License row linking to our license on the Settings About page, added a developer attribution row linking to CLOUDWERX LAB to perfectly balance the layout, and added a detailed License section to `README.md`.

## [1.6.0] - 2026-05-16

### Added
- **Playlists System**: Introduced a fully functional, cross-platform Playlists ecosystem. Playlists are natively persisted inside the `saucebox-gallery.json` storage engine. 
- **Playlists Tab Orchestrator**: Added a new dedicated Playlists tab to the main sidebar. It features a stunning grid-based gallery view showing playlist stats (video count, total duration, total disk size) and custom cover images.
- **Playlist Editor UI**: Built a premium split-pane UI for playlist management. The left pane provides full search/sort/filter access to the user's gallery library. The right pane serves as the builder, allowing users to rename the playlist, add/remove videos, set custom cover artwork, and natively drag-and-drop tracks to reorder them perfectly.
- **Video Player Integration**: Upgraded the core `VideoPlayer.js` overlay to fully support Playlist context. When "Play All" is triggered, the player automatically tracks the current `playlistIndex`, displaying "Track X of Y" in the subtitle header.
- **Playback Navigation**: Added `[⏭ Next]` and `[⏮ Prev]` navigation buttons directly into the VideoPlayer UI.
- **Auto-Advance Playback**: Implemented HTML5 `onEnded` detection in the VideoPlayer. When a clip or video finishes naturally, SauceBox will automatically load and play the next video in the active playlist.
- **External Player Support**: Fully wired the Playlists ecosystem to the custom external video player handoff. Hitting "Play All" while using an external player (like VLC) passes the file paths correctly.
- **Playlist UI Refinements**: Added a large quick-play button on playlist cards, a new "Save & Return" exit pattern in the editor, and a large custom cover art selector. Drag-and-drop was refined to perfectly match the Broadcast tab with manual numbering overrides and up/down quick keys. Left pane now displays video ratings.
- **Broadcast Tab Playlist Builder UI Overhaul**: Revamped search input, available videos count, sort buttons, and layout to match the PlaylistEditor exactly.
- **Unified Added State Styling**: Refactored the "Added" status across both PlaylistEditor and Broadcast tab to show clean, bold orange text instead of a grey badge.
- **Broadcast Playlist Items Refinement**: Reverted items in the current playlist list back to the premium card layout with exact borders, margins, padding, and drop shadow styles, mirroring the PlaylistEditor.
- **Drag-and-Drop Parity**: Fully matched the drag-and-drop scale, opacity, border transitions, and dark-tinted highlight visual effects of the PlaylistEditor.
- **Full-Bleed Spacing Alignment**: Removed the inner padding from the right-hand column container, wrapped the header section in a padded header with a bottom border, and placed bottom buttons inside a toolbar to allow draggable video cards to bleed fully to the edge of the panel container, matching the exact spacing of the PlaylistEditor.
- **Empty State Alignment**: Aligned the Broadcast current playlist's empty state to use the mailbox emoji (`📬`) and styled placeholder text matching the PlaylistEditor.
- **Middle Dot Character Alignment**: Replaced all bullet dot characters (`•`) between video duration and resolution/quality in both available and current playlist panels inside the Broadcast tab with the exact thin middle dot character (`·`) used in the PlaylistEditor.
- **Available Videos Empty States Overhaul**: Aligned both the Broadcast playlist builder and the PlaylistEditor available videos lists to handle empty states elegantly. Showcases a premium, highly colorful `🍿` popcorn emoji when the gallery library is completely empty, and a `🔍` emoji when search filtering yields no results.
- **Vertical Centering Alignment**: Removed the `opacity: 0.5` washed-out style from empty state icons to ensure they look vibrant and rich. Added `contentContainerStyle={{ flexGrow: 1 }}` to both available videos ScrollViews (left panels) and the current playlist ScrollView (right panel) inside the PlaylistEditor so they stretch and center the empty state components perfectly vertically in their containers, matching the Broadcast tab.
- **Local Playlist Draft Refactoring**: Completely refactored the Playlist Editor state flow to use a localized draft state. Creating a new playlist now opens a temporary unsaved draft instead of immediately committing it to the global store/file system. Edits (adding, removing, reordering, renaming, cover art updates) are held safely in a local React state and are only saved to the gallery when explicitly clicking "Save & Return". Clicking "Discard" or exiting does not pollute the gallery database.
- **Conditional Delete Button**: Configured the "🗑 Delete Playlist" button to render conditionally based on whether the playlist actually exists on disk/database. It is hidden for brand-new unsaved drafts since there is nothing to delete, reducing user UI confusion.
- **Playlist Gallery Header & Stats Overhaul**: Completely redesigned the Playlist Gallery header layout to match the main Video Gallery layout. Shifted the "➕ NEW PLAYLIST" button to the top-right corner with a primary orange aesthetic, and implemented three beautiful, high-contrast stats badges on the top-left showing the total count of playlists, combined disk storage space, and total playtime of all unique items across your playlists. Hides both the stats row and the top-right action buttons when the playlist database is empty to prevent visual redundancy with the central call-to-action button, and removed the legacy "New Playlist" grid card for a premium, clean look.
- **Playlist Gallery "Clear All" Button**: Added a **"🗑️ Clear All"** button to the top-right corner of the Playlist tab, positioned right next to the "➕ NEW PLAYLIST" button. Styled it to match the main Video Gallery's Clear All button, and integrated a modular `ConfirmModal` popup dialog. When triggered, it prompts the user to confirm clearing the entire playlist collection before executing, ensuring crash immunity and safe bulk operations.
- **Centered Playlist Empty State**: Aligned and centered the "No playlists yet" empty state container vertically and horizontally. Configured `alignSelf: 'stretch'` to guarantee full width, and overhauled margins/sizes to perfectly match `GalleryEmptyState.js`. Added a beautiful primary orange **"➕ CREATE FIRST PLAYLIST"** call-to-action button inside the empty state itself and set `paddingVertical: 120` to push it down further, balancing the center of mass beautifully on the screen. Wrapped the galleryGrid view so it does not render when empty to prevent blank space pollution.
- **Top-Right Import Button Hiding**: Refactored the `GalleryHeader.js` layout to hide the stats badges block, "📥 IMPORT VIDEOS", and "🗑️ Clear All" top-right buttons when the main Video Gallery database is completely empty. This removes the visually redundant button and stat double-up since the central empty state already communicates the empty state.
- **Queue Subtitle Hiding**: Updated the `QueueTab.js` layout to conditionally render the active download count subtitle *only* when there are actual active items in the queue. When the active queue is empty, the redundant "No downloads in queue" subtitle is completely hidden, removing visual clutter and keeping the interface incredibly clean and focused.
- **Help Panel Overhaul**: Extensively updated the built-in Help Modal panel components (`HelpModal.js` and `HelpContent.js`) to align with all recent releases:
  - Added a complete, dedicated **Playlists Collection** tab documenting the isolated draft system, dual-pane real-time curation layout, sequence index reordering, automatic player sequence auto-advance, and high-contrast header statistics badges.
  - Fully refactored the **Playback & Clipping** section to accurately describe the interactive Visual Dual-Slider trimmer scrubbing track and Quick-Cut snapping features.
  - Thoroughly modernized the **Troubleshooting** section to detail the offline local storage split files (`saucebox-settings.json` and `saucebox-gallery.json`) in native OS app data directories (`~/.config/saucebox` on Linux, etc.), providing clean, precise steps to reset or change Vault PINs directly in a text editor without requiring browser DevTools.
- **README Documentation Modernization**: Overhauled the central `README.md` to cleanly integrate professional feature descriptions for the Visual Trimmer and the Curated Playlists engine, matching all features documented in the built-in Help Panel.
- **Playlist Editor Dynamic Window Sizing**: Redesigned the Edit Playlist page layout to stretch and size dynamically with the window using pure flexbox integration. Replaced hardcoded dimensions with `height: '100%'` and `overflow: 'hidden'` on the root wrapper, while utilizing `flex: 1` auto-stretching for the dual-pane workspace. This guarantees zero vertical scrollbar generation on the far-right side of the viewport, aligning panels perfectly scroll-free in any window height or resolution.
- **Taller Cover Art Preview**: Substantially increased the height of the playlist cover thumbnail preview inside the editor panel header from `120` to `280`. This expands it to a gorgeous, high-fidelity landscape aspect ratio, showcasing cover art choices with dramatic, professional impact.
- **50/50 Equal-Width Columns Overhaul**: Reconfigured the main dual-pane layout columns in both the **Edit Playlist** page and the **Broadcast Tab** playlist builder to split container space perfectly equally. Replaced fixed pane widths (`width: 420` on the right side) with `flex: 1` columns on both sides, letting left and right panels expand evenly in unison when scaling window sizes.
- **Fix: Live Playlist Cover Art Preview**: Fixed an issue in `PlaylistEditor.js` where selecting a video thumbnail or custom cover art image did not update the larger cover thumbnail preview in real time. Swapped the preview binding from the original static `playlist.coverImage` prop to the mutable local `draftPlaylist.coverImage` state, enabling instant visual feedback as soon as a new cover is chosen.
- **Fix: Resolved ReferenceError**: Fixed an uncaught runtime error in `PlaylistEditor.js` where accessing `videos` was causing a crash when opening the editor with an empty gallery; corrected it to correctly reference the `history` prop.


## [1.5.0] - 2026-05-16

### Added
- **Visual Video Trimmer**: Completely overhauled the clipping tool in the Video Player. Removed the clunky manual time-input fields and replaced them with a premium, fully interactive dual-slider scrubbing track. Users can now grab the `Start` and `End` handles and visually scrub the video frame-by-frame to see exactly where their cuts will be placed.
- **Quick-Cut Snapping**: Added `[ Set Start` and `Set End ]` buttons to the trimmer UI, allowing users to instantly snap the trim handles to the exact millisecond of the player's current playback position.

### Fixed
- **Clip Metadata Precision Bug**: Fixed a bug where clipped video durations were saving raw floating-point decimals to the database (e.g. `01:35.68021241830064s`), causing severe UI overflow. The UI metadata is now cleanly rounded, while the raw exact floating-point precision is secretly passed directly to the FFmpeg engine to guarantee frame-perfect video cuts.

## [1.4.0] - 2026-05-16

### Added
- **Database Backup System**: Added a one-click native "Backup Database & Settings" button in the Settings Maintenance tab. This instantly exports a clean, secure copy of your `saucebox-gallery.json` and `saucebox-settings.json` files to any directory of your choosing using a native system file dialog.
- **Wipe Database & Reset Options**: Added extreme cleanup options with strict multi-step safeguards ("ARE YOU SURE?" text confirmation prompts). Users can now natively "Nuke Gallery Database" to completely empty their history and ratings without losing the physical media files, or "Reset Application Settings" to completely restore the app to factory defaults.
- **Split Native File System Storage**: Completely replaced browser `localStorage` with a robust, cross-platform physical file system storage engine. All application state is now natively parsed and split into two beautifully formatted, human-readable JSON files (`saucebox-settings.json` and `saucebox-gallery.json`). They are written directly to the OS application data directory (`~/.config/saucebox/` on Linux, `%APPDATA%\saucebox\` on Windows, `~/Library/Application Support/saucebox/` on Mac). This guarantees data survival across app updates, prevents loss when browser caches are cleared, ensures identical state between development and production (`.deb` / `.AppImage`) builds, and enables easy manual backups or direct setting modifications via a text editor.
- **Automatic State Migration**: When launching SauceBox after this update, the app will automatically migrate your legacy `saucebox-storage.json` file into the new split files cleanly.
- **Atomic State Writes**: Implemented atomic write operations for the new filesystem state. Data is first written to a temporary file (`.tmp.json`) and then rapidly renamed to prevent any corruption of the user's gallery or settings in the event of a sudden power loss or app crash during a save operation.

### Changed
- **Zustand Storage Adapter**: Refactored `src/store.js` to utilize a custom asynchronous `createJSONStorage` adapter that natively invokes the newly built `load-state`, `save-state`, and `remove-state` IPC handlers in `electron/modules/storage.js`.
- **Vault PIN Reset Instructions**: Updated the PIN reset guide in the Settings tab to point directly to `saucebox-settings.json`, explicitly warning the user NOT to delete `saucebox-gallery.json` to prevent catastrophic data loss.

### Fixed
- **Electron Prompt Crash**: Fixed a fatal crash (`prompt() is and will not be supported`) occurring when attempting to use native browser `window.prompt` or `window.confirm` dialogs in Electron. Completely refactored `SettingsMaintenance.js` to use a custom, non-blocking React Native `ConfirmModal` UI component.
- **Strict Input Validation**: Upgraded the custom `ConfirmModal` component to optionally accept a `requireInputText` parameter, rendering a physical text input that securely disables the confirm button until the exact security phrase (e.g., "NUKE") is matched.
## [1.3.17] - 2026-05-16

### Changed
- **Playlist Builder Symmetrical Layout & Wider Live Monitor**: Shifted the Live Connection Monitor Card outside and directly underneath the Playlist Builder columns. This allows the "Available Videos" and "Current Playlist" cards to align symmetrically in height at exactly `600px`, providing maximum scrolling viewport space for the playlist selection lists while giving the Live Connection Log a full-width panoramic dashboard.

## [1.3.16] - 2026-05-16

### Added
- **Playlist Builder Sort Bar**: Added a thin, ultra-sleek horizontal sort bar at the top of the "Available Videos" list in the Broadcast Tab's Playlist Builder. Users can now instantly sort the list by Date, Title, Time, or Star Rating. Driven reactively using a high-performance in-memory sort pipeline.

## [1.3.15] - 2026-05-16

### Added
- **Available Videos Star Ratings**: Upgraded the Available Videos list in the Broadcast Tab's Playlist Builder to render solid star ratings (`★`) in brand orange (`theme.colors.primary`) to the right of the resolution quality if a rating is set for the video.

## [1.3.14] - 2026-05-16

### Changed
- **Unified Video Player Architecture**: Centralized video playback by moving the built-in `<VideoPlayer>` overlay to the global `App.js` level and driving it through a unified Zustand store state (`activeBuiltinVideo` / `setActiveBuiltinVideo`). Cleaned up and removed redundant local `<VideoPlayer>` rendering and local states from `GalleryTab.js`, `QueueTab.js`, and `BroadcastTab.js`.
- **Feeling Lucky Custom Player support**: Refactored the "Feeling Lucky" sidebar logo click function to now use the global built-in React player overlay by default, but seamlessly fallback to the user's custom player if one is set in the settings. Added robust filepath resolution for random videos before launch.

## [1.3.13] - 2026-05-16

### Added
- **Gallery Playtime Stats & Dashboard Cards**: Overhauled the Gallery page header with a horizontal row of high-contrast, premium metrics badges showing the total video count, total storage size, and cumulative video playtime/duration formatted beautifully (e.g., `3h 45m`).
- **Gallery Playtime Calculation**: Added calculation logic using `reduce` to sum up the playtime of all downloaded media files in `GalleryTab.js` and wired it into `GalleryHeader`.

## [1.3.12] - 2026-05-16

### Changed
- **README Screenshot Size**: Enlarged the primary application UI screenshot inside `README.md` from `width="48%"` to `width="100%"` to make it fully legible and visually outstanding on GitHub and central documentation portals.

## [1.3.11] - 2026-05-16

### Fixed
- **TitleBar Button Vertical Centering**: Added `alignItems: 'center'` to the controls style in `TitleBar.js`. This guarantees all title bar buttons (especially the smaller 24px orange Help button `?` and 32px standard window control actions) are perfectly vertically centered relative to the 40px height of the custom frameless title bar rather than sitting off-center near the top.

## [1.3.10] - 2026-05-16

### Fixed
- **Goldilocks 16px Spacing Tuning**: Tuned the downloads tab spacings to save exactly 16px of vertical height compared to the original layout (setting `content.paddingBottom` to `52` and `batchSection.marginBottom` to `24`). This surgical adjustment perfectly consumes the empty space at the bottom of the viewport while remaining safely below the scrollbar overflow threshold.

## [1.3.9] - 2026-05-16

### Fixed
- **Sweet Spot Spacing Refinement**: Adjusted spacing in `DownloadStyles.js` to find the absolute "Goldilocks" sweet spot. Restored spacious premium paddings, titles, and margins while targeting precisely the `batchSection` bottom margin (reduced by 20px) and `content` padding-bottom (reduced by 12px) to save exactly 32px of vertical height. This perfectly eliminates the 1-10px scrollbar at default dimensions while ensuring zero dead space at the bottom of the screen.

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
