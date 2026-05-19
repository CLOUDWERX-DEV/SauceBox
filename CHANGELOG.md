# Changelog

## [1.7.6] - 2026-05-19

### Fixed
- **Resolved Local Media Block Issue (`electron/main.js`, `VideoPlayer.js`)**: Addressed a critical bug where Chromium's strict Cross-Origin Read Blocking (CORB) prevented the internal video player and playlist cover art from rendering local video files when `webSecurity` was enabled. Registered a privileged, custom `sauce-media://` protocol in the main Electron process to safely pipe native disk resources to the isolated renderer. Refactored `VideoPlayer.js` and `PlaylistEditor.js` to utilize URL encoded paths wrapped in this custom scheme, eliminating the "Unable to load video file" error for all downloaded and imported media.
- **Resolved Playlist Cover Art Bug on Unsaved Playlists (`PlaylistEditor.js`, `VideoThumbnail.js`)**: Fixed a visual bug where selecting a new custom cover or video thumbnail during the creation of a new, unsaved playlist failed to instantly update the main cover art preview. Added explicit React `key` props tied to the `uri` to force the `<Image>` component inside `<VideoThumbnail>` to reliably unmount and remount when source strings change.

### Documentation
- **Overhauled Development Guidelines (`CONTRIBUTING.md`)**: Completely restructured the developer contributing guide to feature a highly detailed system architecture blueprint, IPC bridge explanations, atomic storage documentation, and strict modularity constraints. Enforced the absolute ban on subjective adjectives to ensure a professional, open-source-ready engineering manual.

## [1.7.5] - 2026-05-19

### Core
- Pre-release GitHub API caching conflict and artifact synchronization iteration.

## [1.7.4] - 2026-05-18

### Fixed
- **Resolved Playlist Cover Art Preview Bug (`VideoThumbnail.js`)**: Fixed a lifecycle bug where the cover art preview image failed to live-update when selecting a new custom cover while drafting a new, unsaved playlist. The `VideoThumbnail` component now dynamically tracks changes to the `uri` prop and correctly resets its fallback state, ensuring real-time UI updates during the playlist creation flow.

## [1.7.3] - 2026-05-17

### Security
- **Hardened Electron renderer isolation (`electron/main.js`, `electron/preload.js`)**: Replaced direct renderer Node access with a context-isolated preload bridge, disabled renderer `nodeIntegration`, enabled `contextIsolation`, enabled renderer sandboxing, restored `webSecurity`, and allowlisted IPC invoke/send/listener channels exposed to the frontend.
- **Moved renderer file-system playlist writes behind IPC (`BroadcastTab.js`, `mediaServer.js`)**: Replaced direct `fs` and `path` usage in the Broadcast tab with a validated `save-stream-playlist` IPC handler that writes `stream.m3u` from the main process.
- **Restricted high-risk IPC surfaces (`filesystem.js`, `system.js`, `extensionServer.js`)**: Added protocol checks for external links, media-file extension checks for read/delete IPC handlers, custom player path validation, extension-server URL validation, and a request body limit for extension enqueue requests.
- **Hardened runtime binary downloads (`provisioning.js`)**: Added HTTPS-only binary download validation, HTTP status checks, timeout handling, and temporary-file atomic replacement before managed binaries are promoted into place.

### Changed
- **Replaced renderer IPC access (`src/`)**: Migrated renderer calls from raw `window.require('electron')` / `ipcRenderer` usage to the `window.saucebox` preload API across app startup, storage persistence, downloads, gallery playback, playlist editing, broadcast controls, settings, and support links.
- **Replaced native browser confirmations (`App.js`, `DownloadTab.js`, `BroadcastSecurityConfig.js`)**: Removed remaining `window.confirm` usage and routed duplicate-download and internet-exposure confirmations through the modular `ConfirmModal` component.
- **Moved OS path lookups behind IPC (`SettingsDownloadLocation.js`, `SettingsSecurityVault.js`, `SettingsAbout.js`)**: Removed renderer `os`, `path`, and `process.platform` dependencies by exposing only platform metadata and resolved application paths from the main process.

### Documentation
- **Updated internal security rules**: Documented the `window.saucebox` preload bridge requirement, renderer Node-access ban, Electron security defaults, confirmation modal requirement, and current Electron source map entries.

### Removed
- **Removed tracked scratch artifacts (`scratch.js`, `release_notes_1.7.2.tmp`)**: Deleted local one-off release/editing helper files from the tracked project tree.

## [1.7.2] - 2026-05-17

### Security
- **Upgraded `electron` from `^28.1.3` to `^42.1.0`**: Resolves 5 moderate/high CVEs including ASAR integrity bypass (`GHSA-vmqv-hx8q-j7mg`), AppleScript injection on macOS (`GHSA-5rqw-r77c-jp79`), service worker IPC reply spoofing (`GHSA-xj5x-m3f3-5x3h`), incorrect iframe origin in permission handler (`GHSA-r5p7-gp4j-qhrx`), and out-of-bounds read in second-instance IPC on macOS/Linux (`GHSA-3c8v-cfp5-9885`).
- **Upgraded `electron-builder` from `^24.9.1` to `^26.8.1`**: Resolves 7 transitive CVEs in `app-builder-lib`, `dmg-builder`, `builder-util`, `electron-publish`, `http-proxy-agent`, `@tootallnate/once`, and `tar`. Eliminates all high-severity `tar` path traversal vulnerabilities.
- **Upgraded `webpack-dev-server` from `^4.15.1` to `^5.2.4`**: Resolves 1 moderate CVE in the development server. No API-breaking changes required due to the clean `devServer` configuration in `webpack.config.js`.
- Confirmed zero deprecated Electron IPC API usage (`ipcRenderer.sendTo`, `event.senderId`, `event.senderIsMainFrame`) prior to upgrade. No code changes required.

### Documentation
- **Updated README Sponsor Buttons**: Replaced mismatched buttons with beautifully styled, uniform centered Shields.io badges for Buy Me a Coffee and GitHub Sponsors.
- **Created GitHub Funding Configuration**: Added `.github/FUNDING.yml` to enable the official Sponsor button on the repository.
- **Wrote Custom Sponsors Profile**: Generated a complete, highly-personalized markdown file `docs/SPONSORS.md` and bios for the GitHub Sponsors page.
- **Expanded Browser Extension Documentation**: Added dedicated steps for pinning the extension to the toolbar and detailed instructions on right-click vs. toolbar icon usage.

## [1.7.1] - 2026-05-17

### Added
- **Playlist Editor M3U Support**: Added native `.m3u` Import and Export buttons directly to the Playlist Editor view. Users can now perfectly export their custom local playlists into universal M3U files with absolute paths, enabling immediate playback handoff to VLC, MPV, or other external media players, as well as importing external M3U files to instantly reconstruct saved collections.

### Changed
- **Playlist Editor UI Optimization**: Reduced the vertical height of the playlist cover art preview in the editor by 50% to maximize screen real-estate for managing large playlist arrays.
- **Documentation Parity**: Updated `README.md` to accurately feature the Multi-Threaded Download Manager and explicitly mention GPU-accelerated video playback capabilities. Removed unused frontend dev-server instructions.

## [1.7.0] - 2026-05-17

### Added
- **Runtime Binary Provisioning Engine**: Completely overhauled core dependency management. SauceBox now automatically downloads, manages, and updates `yt-dlp` and `ffmpeg` engines at runtime, storing them safely in the user's OS application data directory (`~/.config/saucebox/binaries/`, etc.). This eliminates the need for manual system package installations and completely bypasses read-only bundle lockouts on Windows/macOS.
- **Initial Setup Boot Screen**: Added a full-screen, blocking `BootScreen` component on first launch or when core engines are missing. The interface features real-time progress bars, byte size formatting, and a live console log output, keeping users fully informed during the download and extraction process.
- **Three-Way Engine Management System**: Rebuilt the "System Binaries" section inside the Settings tab with a three-way toggle: `SauceBox Managed` (default), `System PATH`, and `Custom Path`. Users can freely override the managed binaries if they have networking limitations, strict enterprise policies, or require specific legacy versions.
- **Background Auto-Updater**: Integrated an automatic startup background updater that natively spawns `yt-dlp -U` to ensure extraction schemas remain compatible with the latest website layout changes. Includes a toggle to disable this behavior in Settings.
- **Manual Engine Update & Redownload**: Added dedicated "Update yt-dlp" and "Force Redownload All" action buttons in the Settings tab (visible under the Managed mode). Users can manually trigger an update or completely nuke and redownload the core engines if they become corrupted.
- **Architectural Proposal Documentation**: Authored `docs/BINARIES_BUNDLING_PROPOSAL.md`, detailing the technical, legal (GPL vs Unlicense), and cross-platform limitations of hard-bundling binaries versus the deployed runtime provisioning approach.

### Changed
- **Removed Legacy Binary Warnings**: Removed the old hardcoded "Core Dependencies Missing" warning box that instructed users to manually run `winget`, `brew`, or `apt install`. The UI now natively handles dependency provisioning, making these instructions obsolete.
- **System Binary Version Tracking**: The Settings tab now actively probes the exact file path selected by the three-way toggle mode, dynamically updating the displayed binary version in real-time when switching between Managed, System, or Custom modes.

## [1.6.1] - 2026-05-17

### Added
- **Redesigned Public Documentation & System Architecture Guidelines (README.md)**: Completely overhauled the main `README.md` to serve as a streamlined, GitHub-ready, open-source-friendly user manual. Stripped out verbose instructions, marketing jargon, and subjective adjectives. Proudly emphasized the application's focus on private, locally-hosted adult media curation with native support for thousands of tube networks via `yt-dlp`. Added detailed system dependency setup instructions for Windows, Linux, and macOS, alongside steps for running the application locally, launching the media server, and streaming content directly to TV and VR headsets (e.g., Skybox VR) using host web browsers.
- **Created Comprehensive Developer Guidelines & Architecture Blueprint (CONTRIBUTING.md)**: Created a dedicated `CONTRIBUTING.md` developer guide in the root directory to offload technical specifications from the main user manual. Outlined system architecture diagrams, global state management blueprints (`zustand` persist middleware and custom physical JSON storage engine), system requirements for external engines (`yt-dlp` and `ffmpeg`), IPC communication channels, folder maps (feature-as-a-folder), style token compliance (primary orange `#FF8C00` buttons and tooltips), and build verification checks (`npm run build`).
- **Updated Project Design Rules & Style Standards**: Overhauled the internal contribution rules to include a strict "Changelog Formatting & Style Protocol" requiring objective, technical, and open-source friendly release logs, while strictly banning subjective marketing jargon (such as "beautiful", "gorgeous", "premium", "sleek", "goldilocks", "sweet spot").
- **Active Playlist Name Header Badge with Auto-Truncation**: Added a custom-styled Active Playlist Name Badge (`🎬 Playlist: [Name]`) to the built-in video player (`VideoPlayer.js`). When playing a saved playlist, the badge renders in the header metadata row with a semi-transparent orange border (`#FF8C0080`), dark background (`#FF8C0015`), and orange text. Long playlist names exceeding 20 characters are truncated automatically to prevent header wrapping layout issues, and the badge is wrapped in a `<Tooltip>` to show the complete playlist name on hover.
- **Interactive Prev/Next Navigation Context in Gallery and Playlist Editor**: Added playlist previous/next navigation context when playing individual videos directly from the main Gallery Tab (`GalleryTab.js`) and the Playlist Editor view (`PlaylistsTab.js`). When starting playback, the app constructs a playlist context from the filtered/sorted gallery items (or playlist items), pre-resolves file paths, and passes the current item's relative index into the active Zustand player state. The video player renders `⏮ Prev` and `Next ⏭` header navigation buttons to cycle through items.
- **Video Player Metadata Badges Tooltips**: Wrapped all metadata badges inside the built-in video player (`VideoPlayer.js`) in the modular `<Tooltip>` component. Hovering over duration (`⏱️`), resolution (`📺`), file size (`💾`), and track position (`🗂️`) displays tooltips (`Duration`, `Resolution`, `File Size`, `Track Position in Playlist`) with bottom alignment. Configured `position: 'relative'` and `zIndex: 10` on the parent badge row container to prevent stacking conflicts with the trimmer panel and video wrapper.
- **Tooltips for Card Metadata Badges**: Integrated the modular `<Tooltip>` component on metadata badges across the Gallery, Queue, and Playlist tab cards. Hovering over badges displays descriptive tooltips (`Duration`, `Resolution`, `File Size`, `Date Added`, `Queued`, `Video Count`, `Total Duration`, `Total Size`, `Date Created`) using index-aware top/bottom positioning to prevent clipping.
- **SauceBox Hub Ecosystem Documentation Section**: Added a "SauceBox Hub" section to the documentation modal. Includes a support card highlighting the open-source development model, a three-column donation tier grid (Coffee, Beer, Legend), and a styled orange Support button. Integrates links to community resources (`saucebox.app`, `cloudwerxlab.com`, and the GitHub repository) and a detailed engine reference section for `yt-dlp` and `ffmpeg`.
- **Web Extension Snippets & CLI Testing Center**: Fully overhauled the "Web Extension" documentation section. Integrated action buttons to instantly copy Chrome, Brave, and Edge settings URLs (`chrome://extensions`, etc.) to the clipboard. Added copyable shell/terminal snippets to instantly extract the `chrome-extension` companion folder straight to the user's Desktop for one-click unpacking (available in Bash, PowerShell, and CMD). Also added developer CLI testing integrations, complete with copyable `curl` commands to query offline health status and trigger remote enqueues on `localhost:13337`.

### Fixed
- **Resolved Video Player Tooltip Cutoff Bug**: Fixed a stacking context bug where downward-floating tooltips in the built-in video player (`VideoPlayer.js`) were cut off and rendered underneath the trimmer control panel and video element. Applied `position: 'relative'` and `zIndex: 100` to the player's `header` stylesheet block to establish a stacking context above subsequent siblings inside the player container.
- **Elevated Hovered Tooltip Stacking Order**: Fixed a rendering/stacking bug where bottom-aligned tooltips (such as the topmost queue card badge tooltip) drew underneath neighboring text blocks like `✔ Completed` due to layout stacking contexts. Applied `visible && { zIndex: 9999 }` to the Tooltip wrapper container, and added `position: 'relative', zIndex: 10` to the badge row container in `DownloadCard.js`. This guarantees that the entire badge container establishes a superior stacking context above the sibling `progressSection`, allowing the downward floating tooltip balloon to render on top of the status row perfectly.
- **Resolved Flex Badge Layout Collapsing**: Fixed a layout bug where wrapping metadata badges in Tooltips caused the 2x2 grid layout to collapse horizontally. Extended the modular `<Tooltip>` component to accept and merge custom `style` props, and applied `style={[styles.metaBadgeFlex, { alignItems: 'stretch' }]}` to the Tooltip wrapper. This enables the Tooltip container to properly participate in the flex row layout as an equal-width 50/50 column child, while stretching the inner child badge to full size.

### Removed
- **Built-In Video Player External Launch Buttons**: Completely stripped the "🎬 Open Player" action header button and "🎬 Open in External Player" playback fallback error button from `VideoPlayer.js`. Removed the `handleOpenExternal` handler and associated stylesheet properties (`externalButton`, `externalButtonText`) to keep the player codebase lightweight and modular. Since custom player execution is governed globally via the Settings tab config, redundant in-player triggers are no longer needed.

### Changed
- **Adjusted Navigation Sidebar Layout & Spacing**: Rescaled the sidebar layout in `Sidebar.js` to prevent scrollbars at default window size. Reduced the logo icon size to `56x56` (header padding `20`, `marginBottom` `10`), set tab container padding to `18`, tab item paddings to `14`, tab icon sizes to `25`, and footer padding to `18`. This configuration reduces total height by 58px, ensuring all tab items, badges, and footer elements render without generating a scrollbar at default dimensions.
- **Redesigned Playlist Gallery Card Metadata Badges**: Replaced the three plain emoji text stats (`🎬 14 videos`, `⏱️ 2h 13m`, `💾 2.6 GB`) on every playlist gallery card with a full **2×2 badge grid**, exactly matching the Gallery tab design language. Added a `formatDate` helper and a new `🕒 Created` badge sourced from `playlist.createdAt` (already stored in the Zustand store). Badge styles (`metaBadge`, `metaBadgeGrid`, `metaBadgeRow`, `metaBadgeFlex`, `metaBadgeIcon`, `metaBadgeText`) added to `PlaylistStyles.js`. Each row holds two flex-1 badges for perfect alignment regardless of content length.
- **Added Timestamp Badge to Queue Download Cards**: Added a `formatDate` helper and a `🕒 Age` badge directly inside `DownloadCard.js`, sourced from `download.id` which is already `Date.now()` at queue time. Aligns the Queue tab card metadata display with the Gallery and Playlist tabs.
- **Redesigned Gallery Card Metadata as 2×2 Badge Grid**: Replaced the free-flowing `flexWrap` badge row in `GalleryCard.js` with a strict 2-row, 2-column grid layout. Row 1: `⏱️ Duration` + `📺 Resolution`. Row 2: `💾 Filesize` + `🕒 Age`. Each badge uses `flex: 1` + `minWidth: 0` so they permanently share the available card width 50/50 and the timestamp never wraps to a third line. Added `metaBadgeGrid`, `metaBadgeRow`, and `metaBadgeFlex` tokens to the `GalleryCard.js` stylesheet.
- **Increased Queue Cards Thumbnail Dimensions**: Enlarged video thumbnail dimensions in `DownloadCard.js` from `192x108` to `240x135` (maintaining the 16:9 aspect ratio) to balance the card layout visually on the Queue tab.
- **Standardized Download Card Metadata Badges**: Replaced plain bullet-separated metadata text on all active/completed download queue cards (`DownloadCard.js` / `QueueStyles.js`) with styled metadata chips: `⏱️ Duration`, `📺 Resolution`, and `💾 Filesize`, aligning with the built-in video player design.
- **Updated Video Player Metadata Header**: Replaced the plain-text bullet-separated video metadata string in `VideoPlayer.js` with structured, styled metadata chips: `⏱️ Duration`, `📺 Resolution`, `💾 Filesize`, and a primary-colored `🗂️ Track Index` when navigating through playlists.
- **Corrected Trimmer Handles Documentation**: Updated the highlight clipping instructions in the documentation panel to precisely match the interface's actual visual aesthetics. Corrected the reference to "two orange handles below the timeline" to accurately describe the "two white vertical pill handles on the timeline track" and the "orange crop range representing your custom clip".
- **Removed Default Sidebar Scrollbar Track**: Replaced React Native Web's `<ScrollView>` component with a standard `<View>` styled container using CSS `overflowY: 'auto'` on the main navigation sidebar (`Sidebar.js`) and the Help/Docs sidebar (`HelpModal.js`). This avoids React Native Web's default `overflow-y: scroll` styling, ensuring the sidebar panel does not show a blank scrollbar track at default window dimensions while maintaining vertical scrollability on overflow.
- **Prevented Scrollable Viewport Top Boundary Clipping**: Resolved horizontal/vertical viewport clipping of tooltips on the very first item (`index === 0`) inside scrollable containers app-wide. Implemented an index-aware alignment check in `PlaylistEditor.js`, `BroadcastPlaylistBuilder.js`, and `DownloadCard.js` (with a newly introduced `index` parameter passed from `QueueTab.js`) to automatically assign `position="bottom"` for tooltips of the first item in any mapped list, while preserving the standard `position="top"` for all subsequent items. This guarantees that tooltips for the topmost items elegantly float downwards into the item's tall boundary space, completely avoiding clipping against the top border of the scrollable scroll view.
- **App-Wide Tooltip Labels & Spacing Refactor**: Streamlined tooltip descriptions across the application to use compact labels. Converted `"Quick Stream / VR Cast"` to `"Quick Cast"`, `"Open Download Folder"` to `"Open Folder"`, `"Delete Video` / `Delete Playlist"` to `"Delete"`, and `"Remove from Playlist` / `Remove from Queue"` to `"Remove"` to prevent text overflow clipping. Removed the layout-level `overflow: 'hidden'` from the Playlist Editor panels (`PlaylistStyles.js`) and Broadcast columns (`BroadcastPlaylistBuilder.js`) to ensure list reordering buttons (Move Up, Move Down, and Remove) do not clip.
- **Fixed Tooltip Clipping & Card Layouts**: Removed the restrictive `overflow: 'hidden'` property from both the Gallery cards (`GalleryCard.js`) and the Playlist cards (`PlaylistStyles.js`). Because both thumbnail elements and overlay assets already have explicit top corner border radiuses (`borderTopLeftRadius: 16` and `borderTopRightRadius: 16`), removing the layout-level clipping rule allows absolute positioned tooltips to float freely outside the boundaries of the cards without being truncated or cut off by the borders.
- **Expanded Application-Wide Tooltips**: Integrated modular tooltips on the Playlist and Broadcast tabs. Wrapped action buttons (Quick Stream, Delete Playlist) on the Playlist gallery cards inside tooltips using `position="bottom"` to prevent clipping. Wrapped move up (`⬆️`), move down (`⬇️`), and remove (`❌`) buttons inside list elements on the Playlist Editor panel (`PlaylistEditor.js`) and the Broadcast playlist panel (`BroadcastPlaylistBuilder.js`) with top-aligned tooltips.
- **Interactive Tooltip System**: Implemented a modular `Tooltip` component for React Native Web supporting top/bottom positioning. Wrapped action buttons in the Download Queue ("Open Folder", "Remove") using top alignment and the Gallery cards ("Quick Cast", "Open Folder", "Delete") using bottom alignment. Custom styled with absolute positioning, arrow indicators, `#111111` background, and `#FF8C0040` borders.
- **Design Guidelines for Tooltips**: Appended comprehensive instructions establishing clear UI/UX boundaries, visual expectations, and placement directives for implementing future tooltips under our modular system.
- **Refactored Gallery Card Interaction & Cursor Alignment**: Removed the misleading `cursor: 'pointer'` style from the main gallery card container in `GalleryCard.js`. The default pointer (arrow) is now preserved when hovering over non-actionable areas of the card (e.g., background, borders, and text), exactly matching the behavior of the Download Queue cards. The cursor correctly switches to a pointer only when hovering over actual interactive targets (like play, cast, folder, edit, tag, stars, and delete buttons).
- **Granular Queue Clearing & Counter Overhaul**: Replaced the global top-right "Clear Queue" button with granular, context-aware clear actions directly aligned next to their respective section headers. Added a "Clear Completed" button to immediately empty only successful downloads, and a "Clear Active" button next to a new "Active Downloads" counter. The active clearing action remains protected behind a dedicated confirmation modal, protecting active download streams from accidental termination.
- **Refactored Queue Card Interactions**: Restricted playback triggers inside the Download Queue card exclusively to the orange thumbnail play button overlay, preventing accidental triggers when clicking other areas of the card. Removed the redundant "Click to watch" text and pointer cursor styles to establish a more polished and intuitive interaction flow.
- **Completed Downloads Count Badge**: Added a real-time numerical counter next to the "Completed" section header in the Download Queue tab, providing users with immediate visual feedback on completed downloads.
- **Tab Header Description Standardization**: Added persistent description subtitles to the header sections of all main application tabs to ensure structural and visual consistency across the app. Subtitles include: `"Monitor, pause, and manage your active download streams ⏳"` on Queue, `"Search, rate, tag, and play your private offline media archive 🎥"` on Gallery, `"Build, sequence, and play custom video collections 🗂️"` on Playlists, and a refined `"Configure download directories, preferred quality, secure vaults, and system parameters ⚙️"` on Settings.
- **Support Dashboard Overhaul**: Redesigned the Settings Support section. Added descriptive copywriting detailing CLOUDWERX LAB's open-source philosophy, privacy commitments, and build requirements. Integrated a three-column support grid (Coffee, Beer, and Legend tiers) with custom emojis, typography, and direct links.
- **Maintenance & Cleanup Button Layout**: Fixed and overhauled the styling of all buttons in the "Maintenance & Cleanup" section under Settings. Replaced variable horizontal paddings with a clean, uniform fixed width of `150px` and aligned elements perfectly, establishing consistent button sizing and typography across all rows.
- **Stealth Mode Hotkey UI Alignment**: Aligned the "Record" button inside the Security & Vault settings section to match the standard `150px` width of other settings buttons. Added clean UI formatting to the hotkey string (converting verbose Electron symbols like `CommandOrControl` to a compact `Ctrl` or `Cmd` format) to prevent layout text wrapping.
- **Advanced Numerical Settings Inputs Overhaul**: Refactored the numerical text inputs for "Safety Disk Threshold", "Concurrent Downloads", and "Speed Limit". Overhauled their width to a consistent `100px` and removed inline padding overrides so they match the height and styling of other input fields. Added uniform trailing labels with fixed-width layout styling (`width: 80px`), ensuring perfect vertical alignment on the right.
- **Overhauled About Tab**: Redesigned the About section in Settings into a structured information dashboard. Added a logo header, product tagline, and project description. Integrated a real-time library statistics grid showing total videos, total disk size, and combined playtime compiled from the Zustand gallery state. Added sections for system specifications (OS, App version, local storage format) and core engines (yt-dlp, FFmpeg, React Native + Electron). Integrated resource links for Buy Me A Coffee support, the product site, company site, and the GitHub repository.
- **Help Modal Branding Upgrades**: Replaced the placeholder question mark icon in the top-left of the Help documentation modal with our official, webpack-inlined base64 SauceBox logo. Overhauled the header title's color formatting to display "Sauce" in white and "Box" in our primary orange brand color, matching the sidebar logo section's styling.
- **Expanded Supported Sites Documentation**: Added YouPorn to the list of core explicitly tested and supported adult networks in both `README.md` and the Help panel documentation (`HelpContent.js`), and updated both references to prominently note the broader support for over 1,000+ online video networks.
- **Core Engine Resource Linking**: Integrated external link actions on the `yt-dlp` and `FFmpeg` spec tags inside the Settings About dashboard. Clicking either key opens their official website or GitHub repository cleanly in the host browser.
- **Database Storage Label Refinement**: Changed the system specification label for the database format inside the Settings About tab from "Split Physical JSON" to "JSON" for cleaner and sleeker information display.
- **Automated Release Script & Comprehensive Documentation**: Developed a highly automated, fully interactive release shell script (`release.sh`) in the project root to handle local compile, cross-compilation (Windows & Linux via Wine), tag validation, changelog parsing, and secure direct publication to GitHub Releases via `gh` CLI. Overhauled `docs/RELEASES.md` into an extensive cross-platform release engineering manual featuring detailed prerequisites, strategic guidance on minor vs major version cycles, and a step-by-step interactive manual.
- **Development Guidelines & Release Safety Protocol**: Added a new foundational ruleset `## 9. Production Release Protocol` establishing a strict execution guard outlining a chronological release staging process to safely execute native builds and tags.
- **Workspace Ignore Refinement**: Added `dist-bin/` to `.gitignore` to prevent massive compiled binary installers and standalone executables (AppImages, DEBs, and Windows EXEs) from bloating the Git repository and history.
- **GPLv3 Licensing**: Created and customized a formal, production-grade `LICENSE` file in the root directory under the GNU General Public License version 3, configured explicitly with CLOUDWERX LAB copyright attributions, SauceBox details, official `https://saucebox.app` product links, and 2026 dates to guarantee SauceBox remains 100% free and open-source forever. Integrated a dedicated Software License row linking to our license on the Settings About page, added a developer attribution row linking to CLOUDWERX LAB to perfectly balance the layout, and added a detailed License section to `README.md`.

## [1.6.0] - 2026-05-16

### Added
- **Playlists System**: Introduced a fully functional, cross-platform Playlists ecosystem. Playlists are natively persisted inside the `saucebox-gallery.json` storage engine. 
- **Playlists Tab Orchestrator**: Added a new dedicated Playlists tab to the main sidebar. It features a grid-based gallery view showing playlist stats (video count, total duration, total disk size) and custom cover images.
- **Playlist Editor UI**: Built a split-pane UI for playlist management. The left pane provides full search/sort/filter access to the user's gallery library. The right pane serves as the builder, allowing users to rename the playlist, add/remove videos, set custom cover artwork, and natively drag-and-drop tracks to reorder them.
- **Video Player Integration**: Upgraded the core `VideoPlayer.js` overlay to fully support Playlist context. When "Play All" is triggered, the player automatically tracks the current `playlistIndex`, displaying "Track X of Y" in the subtitle header.
- **Playback Navigation**: Added `[⏭ Next]` and `[⏮ Prev]` navigation buttons directly into the VideoPlayer UI.
- **Auto-Advance Playback**: Implemented HTML5 `onEnded` detection in the VideoPlayer. When a clip or video finishes naturally, SauceBox will automatically load and play the next video in the active playlist.
- **External Player Support**: Fully wired the Playlists ecosystem to the custom external video player handoff. Hitting "Play All" while using an external player (like VLC) passes the file paths correctly.
- **Playlist UI Refinements**: Added a large quick-play button on playlist cards, a new "Save & Return" exit pattern in the editor, and a large custom cover art selector. Drag-and-drop was refined to match the Broadcast tab with manual numbering overrides and up/down quick keys. Left pane now displays video ratings.
- **Broadcast Tab Playlist Builder UI Overhaul**: Revamped search input, available videos count, sort buttons, and layout to match the PlaylistEditor.
- **Unified Added State Styling**: Refactored the "Added" status across both PlaylistEditor and Broadcast tab to show clean, bold orange text instead of a grey badge.
- **Broadcast Playlist Items Refinement**: Reverted items in the current playlist list back to the card layout with exact borders, margins, padding, and drop shadow styles, mirroring the PlaylistEditor.
- **Drag-and-Drop Parity**: Fully matched the drag-and-drop scale, opacity, border transitions, and highlight visual effects of the PlaylistEditor.
- **Full-Bleed Spacing Alignment**: Removed the inner padding from the right-hand column container, wrapped the header section in a padded header with a bottom border, and placed bottom buttons inside a toolbar to allow draggable video cards to bleed fully to the edge of the panel container, matching the spacing of the PlaylistEditor.
- **Empty State Alignment**: Aligned the Broadcast current playlist's empty state to use the mailbox emoji (`📬`) and styled placeholder text matching the PlaylistEditor.
- **Middle Dot Character Alignment**: Replaced all bullet dot characters (`•`) between video duration and resolution/quality in both available and current playlist panels inside the Broadcast tab with the thin middle dot character (`·`) used in the PlaylistEditor.
- **Available Videos Empty States Overhaul**: Aligned both the Broadcast playlist builder and the PlaylistEditor available videos lists to handle empty states. Displays a `🍿` popcorn emoji when the gallery library is completely empty, and a `🔍` emoji when search filtering yields no results.
- **Vertical Centering Alignment**: Removed the `opacity: 0.5` washed-out style from empty state icons. Added `contentContainerStyle={{ flexGrow: 1 }}` to both available videos ScrollViews (left panels) and the current playlist ScrollView (right panel) inside the PlaylistEditor so they stretch and center the empty state components vertically in their containers, matching the Broadcast tab.
- **Local Playlist Draft Refactoring**: Completely refactored the Playlist Editor state flow to use a localized draft state. Creating a new playlist now opens a temporary unsaved draft instead of immediately committing it to the global store/file system. Edits (adding, removing, reordering, renaming, cover art updates) are held in a local React state and are only saved to the gallery when explicitly clicking "Save & Return". Clicking "Discard" or exiting does not pollute the gallery database.
- **Conditional Delete Button**: Configured the "🗑 Delete Playlist" button to render conditionally based on whether the playlist actually exists on disk/database. It is hidden for brand-new unsaved drafts since there is nothing to delete, reducing UI confusion.
- **Playlist Gallery Header & Stats Overhaul**: Redesigned the Playlist Gallery header layout to match the main Video Gallery layout. Shifted the "➕ NEW PLAYLIST" button to the top-right corner, and implemented three stats badges on the top-left showing the total count of playlists, combined disk storage space, and total playtime of all unique items across your playlists. Hides both the stats row and the top-right action buttons when the playlist database is empty to prevent visual redundancy, and removed the legacy "New Playlist" grid card for a clean look.
- **Playlist Gallery "Clear All" Button**: Added a **"🗑️ Clear All"** button to the top-right corner of the Playlist tab, positioned next to the "➕ NEW PLAYLIST" button. Styled it to match the main Video Gallery's Clear All button, and integrated a modular `ConfirmModal` popup dialog. When triggered, it prompts the user to confirm clearing the entire playlist collection before executing, ensuring crash immunity and safe bulk operations.
- **Centered Playlist Empty State**: Aligned and centered the "No playlists yet" empty state container vertically and horizontally. Configured `alignSelf: 'stretch'` to guarantee full width, and overhauled margins/sizes to match `GalleryEmptyState.js`. Added a primary orange **"➕ CREATE FIRST PLAYLIST"** call-to-action button inside the empty state itself and set `paddingVertical: 120` to balance the layout. Wrapped the galleryGrid view so it does not render when empty.
- **Top-Right Import Button Hiding**: Refactored the `GalleryHeader.js` layout to hide the stats badges block, "📥 IMPORT VIDEOS", and "🗑️ Clear All" top-right buttons when the main Video Gallery database is completely empty. This removes the visually redundant button and stat double-up since the central empty state already communicates the empty state.
- **Queue Subtitle Hiding**: Updated the `QueueTab.js` layout to conditionally render the active download count subtitle *only* when there are actual active items in the queue. When the active queue is empty, the subtitle is hidden, removing visual clutter and keeping the interface clean and focused.
- **Help Panel Overhaul**: Extensively updated the Help Modal panel components (`HelpModal.js` and `HelpContent.js`) to align with all recent releases:
  - Added a complete, dedicated **Playlists Collection** tab documenting the isolated draft system, dual-pane curation layout, sequence index reordering, automatic player sequence auto-advance, and header statistics badges.
  - Fully refactored the **Playback & Clipping** section to describe the interactive Visual Dual-Slider trimmer scrubbing track and Quick-Cut snapping features.
  - Thoroughly modernized the **Troubleshooting** section to detail the offline local storage split files (`saucebox-settings.json` and `saucebox-gallery.json`) in native OS app data directories (`~/.config/saucebox` on Linux, etc.), providing clean, precise steps to reset or change Vault PINs directly in a text editor.
- **README Documentation Modernization**: Overhauled the central `README.md` to integrate feature descriptions for the Visual Trimmer and the Curated Playlists engine, matching all features documented in the Help Panel.
- **Playlist Editor Dynamic Window Sizing**: Redesigned the Edit Playlist page layout to stretch and size dynamically with the window using pure flexbox integration. Replaced hardcoded dimensions with `height: '100%'` and `overflow: 'hidden'` on the root wrapper, while utilizing `flex: 1` auto-stretching for the dual-pane workspace. This guarantees zero vertical scrollbar generation on the far-right side of the viewport, aligning panels perfectly scroll-free in any window height or resolution.
- **Taller Cover Art Preview**: Increased the height of the playlist cover thumbnail preview inside the editor panel header from `120` to `280` to display cover art choices in a landscape aspect ratio.
- **50/50 Equal-Width Columns Overhaul**: Reconfigured the main dual-pane layout columns in both the **Edit Playlist** page and the **Broadcast Tab** playlist builder to split container space equally. Replaced fixed pane widths (`width: 420` on the right side) with `flex: 1` columns on both sides, letting left and right panels expand evenly in unison when scaling window sizes.
- **Fix: Live Playlist Cover Art Preview**: Fixed an issue in `PlaylistEditor.js` where selecting a video thumbnail or custom cover art image did not update the larger cover thumbnail preview in real time. Swapped the preview binding from the original static `playlist.coverImage` prop to the mutable local `draftPlaylist.coverImage` state, enabling instant visual feedback as soon as a new cover is chosen.
- **Fix: Resolved ReferenceError**: Fixed an uncaught runtime error in `PlaylistEditor.js` where accessing `videos` was causing a crash when opening the editor with an empty gallery; corrected it to reference the `history` prop.


## [1.5.0] - 2026-05-16

### Added
- **Visual Video Trimmer**: Overhauled the clipping tool in the Video Player. Replaced manual time-input fields with an interactive dual-slider scrubbing track. Users can drag `Start` and `End` handles to scrub frame-by-frame and select clip ranges.
- **Quick-Cut Snapping**: Added `[ Set Start` and `Set End ]` buttons to the trimmer UI, allowing users to snap the trim handles to the player's current playback position.

### Fixed
- **Clip Metadata Precision Bug**: Fixed a bug where clipped video durations were saving raw floating-point decimals to the database, causing UI overflow. The UI metadata is now rounded, while the raw exact floating-point precision is passed directly to the FFmpeg engine to guarantee frame-perfect video cuts.


## [1.4.0] - 2026-05-16

### Added
- **Database Backup System**: Added a one-click native "Backup Database & Settings" button in the Settings Maintenance tab. This exports a copy of your `saucebox-gallery.json` and `saucebox-settings.json` files to any directory of your choosing using a native system file dialog.
- **Wipe Database & Reset Options**: Added cleanup options with strict multi-step safeguards ("ARE YOU SURE?" text confirmation prompts). Users can now "Nuke Gallery Database" to empty their history and ratings without losing the physical media files, or "Reset Application Settings" to restore the app to factory defaults.
- **Split Native File System Storage**: Replaced browser `localStorage` with a robust, cross-platform physical file system storage engine. All application state is parsed and split into two formatted, human-readable JSON files (`saucebox-settings.json` and `saucebox-gallery.json`). They are written directly to the OS application data directory (`~/.config/saucebox/` on Linux, `%APPDATA%\saucebox\` on Windows, `~/Library/Application Support/saucebox/` on Mac). This guarantees data survival across app updates, prevents loss when browser caches are cleared, ensures identical state between development and production (`.deb` / `.AppImage`) builds, and enables easy manual backups or direct setting modifications via a text editor.
- **Automatic State Migration**: When launching SauceBox after this update, the app will automatically migrate your legacy `saucebox-storage.json` file into the new split files.
- **Atomic State Writes**: Implemented atomic write operations for the new filesystem state. Data is first written to a temporary file (`.tmp.json`) and then renamed to prevent any corruption of the user's gallery or settings in the event of a sudden power loss or app crash during a save operation.

### Changed
- **Zustand Storage Adapter**: Refactored `src/store.js` to utilize a custom asynchronous `createJSONStorage` adapter that invokes the newly built `load-state`, `save-state`, and `remove-state` IPC handlers in `electron/modules/storage.js`.
- **Vault PIN Reset Instructions**: Updated the PIN reset guide in the Settings tab to point directly to `saucebox-settings.json`, warning the user NOT to delete `saucebox-gallery.json` to prevent data loss.

### Fixed
- **Electron Prompt Crash**: Fixed a crash (`prompt() is and will not be supported`) occurring when attempting to use native browser `window.prompt` or `window.confirm` dialogs in Electron. Completely refactored `SettingsMaintenance.js` to use a custom, non-blocking React Native `ConfirmModal` UI component.
- **Strict Input Validation**: Upgraded the custom `ConfirmModal` component to optionally accept a `requireInputText` parameter, rendering a physical text input that disables the confirm button until the exact security phrase (e.g., "NUKE") is matched.


## [1.3.17] - 2026-05-16

### Changed
- **Playlist Builder Symmetrical Layout & Wider Live Monitor**: Shifted the Live Connection Monitor Card outside and directly underneath the Playlist Builder columns. This allows the "Available Videos" and "Current Playlist" cards to align symmetrically in height at exactly `600px`, providing maximum scrolling viewport space for the playlist selection lists while giving the Live Connection Log a full-width panoramic dashboard.


## [1.3.16] - 2026-05-16

### Added
- **Playlist Builder Sort Bar**: Added a horizontal sort bar at the top of the "Available Videos" list in the Broadcast Tab's Playlist Builder. Users can sort the list by Date, Title, Time, or Star Rating.


## [1.3.15] - 2026-05-16

### Added
- **Available Videos Star Ratings**: Upgraded the Available Videos list in the Broadcast Tab's Playlist Builder to render solid star ratings (`★`) in brand orange (`theme.colors.primary`) to the right of the resolution quality if a rating is set for the video.


## [1.3.14] - 2026-05-16

### Changed
- **Unified Video Player Architecture**: Centralized video playback by moving the built-in `<VideoPlayer>` overlay to the global `App.js` level and driving it through a unified Zustand store state (`activeBuiltinVideo` / `setActiveBuiltinVideo`). Cleaned up and removed redundant local `<VideoPlayer>` rendering and local states from `GalleryTab.js`, `QueueTab.js`, and `BroadcastTab.js`.
- **Feeling Lucky Custom Player support**: Refactored the "Feeling Lucky" sidebar logo click function to now use the global built-in React player overlay by default, but fallback to the user's custom player if one is set in the settings. Added filepath resolution for random videos before launch.


## [1.3.13] - 2026-05-16

### Added
- **Gallery Playtime Stats badges**: Added stats badges in the Gallery page header displaying total video count, total storage size, and cumulative playtime formatted as hours and minutes (e.g. `3h 45m`).
- **Gallery Playtime Calculation**: Added calculation logic using `reduce` to sum up the playtime of all downloaded media files in `GalleryTab.js` and wired it into `GalleryHeader`.


## [1.3.12] - 2026-05-16

### Changed
- **README Screenshot Size**: Enlarged the primary application UI screenshot inside `README.md` from `width="48%"` to `width="100%"` to make it fully legible and outstanding on GitHub and documentation portals.


## [1.3.11] - 2026-05-16

### Fixed
- **TitleBar Button Vertical Centering**: Added `alignItems: 'center'` to the controls style in `TitleBar.js`. This guarantees all title bar buttons (especially the smaller 24px Help button `?` and 32px standard window control actions) are vertically centered relative to the 40px height of the custom frameless title bar.


## [1.3.10] - 2026-05-16

### Fixed
- **16px Spacing Tuning**: Tuned downloads tab spacing by setting `content.paddingBottom` to `52` and `batchSection.marginBottom` to `24` to save 16px of vertical height, remaining below the scrollbar threshold.


## [1.3.9] - 2026-05-16

### Fixed
- **Sweet Spot Spacing Refinement**: Adjusted spacing in `DownloadStyles.js`. Reduced the `batchSection` bottom margin by 20px and `content` padding-bottom by 12px to save 32px of vertical height, preventing unwanted scrollbars at default screen size.


## [1.3.8] - 2026-05-16

### Fixed
- **Download Spacing Optimization**: Fine-tuned vertical margins, paddings, and child gaps in `DownloadStyles.js`. By shaving 148px of empty height across main card padding, input margin, batch section margins, and tips layout padding, the downloads tab now comfortably fits all default screen heights perfectly without triggering a scrollbar.


## [1.3.7] - 2026-05-16

### Fixed
- **Scrollbar Behavior Polish**: Changed layout overflow behavior. Removed the nested `main-content-wrapper` div in `DownloadTab.js` to avoid layout bugs and replaced `overflow-y: scroll` with `overflow-y: auto` in the HTML shell (`public/index.html`) and tab containers (`GalleryTab.js`, `SettingsTab.js`, `BroadcastTab.js`, `QueueStyles.js`). The scrollbar now only appears if content exceeds the viewport height.


## [1.3.6] - 2026-05-16

### Added
- **Branding Copy Document**: Created `docs/BRANDING_COPY.md` with 10 short descriptions, 10 extended descriptions, and 10 taglines for use in marketing materials.
- **Branding Applied Everywhere**: Deployed chosen branding copy across all surfaces — README header/body, `package.json` description field (appears in `.deb` / NSIS / AppImage installer metadata), HelpModal header subtext (`"Your sauce. Your box. Your rules."`), and HelpContent "Getting Started" subtitle.
- **Source Directory Map**: Added a documented source directory tree so contributors understand the modular file structure.
- **Interactive Guide Navigation**: Converted reference keywords ("Queue", "Settings", "Gallery", "cast") inside the "How to Use SauceBox" guide card on the Download tab into active clickable links styled in our brand orange color palette, allowing users to jump to target app screens.

### Changed
- **Modular Refactoring (HelpModal)**: Decomposed the 773-line `HelpModal.js` into a 191-line orchestrator. Extracted the switch-case content renderer into `src/components/Help/HelpContent.js` and shared styles into `src/components/Help/HelpStyles.js`.
- **Modular Refactoring (DownloadTab)**: Decomposed the 666-line `DownloadTab.js` into a 270-line orchestrator. Extracted the URL input form into `DownloadInputForm.js`, the batch section into `BatchSection.js`, and the tips card into `HowToUseCard.js` under `src/components/tabs/Download/`.
- **Modular Refactoring (QueueTab)**: Decomposed the 634-line `QueueTab.js` into a 184-line orchestrator. Extracted the download card renderer into `DownloadCard.js` and the empty state UI into `EmptyQueueState.js` under `src/components/tabs/Queue/`.

### Fixed
- **Linux .deb Icon Missing**: Fixed a packaging issue where the application icon would not appear in Linux app menus after installing the `.deb` package. Generated a set of XDG-compliant icon sizes (16×16 through 512×512) in `build/icons/` and updated the `electron-builder` Linux config to point to the icon directory rather than a single PNG file. Generated `build/icon.ico` (multi-size embedded) for Windows installers.
- **Frameless Window Minimize Bug (Linux)**: Minimizing the app on Linux desktop environments caused the window to vanish entirely instead of minimizing to the taskbar. Removed the unsupported `titleBarStyle: 'hidden'` property on Linux and added `skipTaskbar: false` explicitly to the BrowserWindow config.
- **Linux Taskbar Icon Missing in Dev Mode**: Added `app.setIcon(nativeImage.createFromPath(...))` call after `createWindow()` on Linux.
- **Logo Missing in Packaged Builds (.deb / AppImage)**: Bare string URIs only resolve in dev mode where webpack-dev-server serves public files. Fixed by adding an `asset/inline` webpack rule for PNG/JPG/GIF/WebP/SVG files and importing `logo.png` directly as a JS module in `TitleBar.js`, `Sidebar.js`, `VideoThumbnail.js`, and `App.js`. Webpack now inlines images as base64 data URIs.
- **Help Modal Sidebar Too Wide**: Force-locked the Help panel navigation sidebar to 160px using `flexGrow: 0`, `flexShrink: 0`, `minWidth`, and `maxWidth`.


## [1.3.4] - 2026-05-16
### Added
- **4K / 2K Resolution Support**: Extended the quality selector in Settings, VideoPreviewModal (the Preview button), and the download pipeline to support Ultra HD (2160p / 4K) and Quad HD (1440p / 2K) resolutions. yt-dlp format strings are updated to request the correct height, with automatic fallback to the next-closest quality if the site does not offer it.
- **Internet Exposure Mode**: Added a new "Expose Server to the Internet" toggle in the Broadcast tab's Security section. When enabled, the app detects the user's public IP (via ipify), displays a second QR code card styled in a red danger theme, and shows the external URL alongside the local-network URL. A native confirmation dialog warns the user of the security implications before enabling.
- **PIN Reset Instructions**: Added an OS-aware "Forgot your PIN?" hint card below the Vault PIN field. It dynamically computes the exact Local Storage folder path for the current OS (Windows `%APPDATA%\saucebox\...`, macOS `~/Library/Application Support/saucebox/...`, Linux `~/.config/saucebox/...`) and shows the correct shell command or Finder/Explorer tip to delete it and regain access.

### Fixed
- **Phantom Babel Syntax Errors**: Fixed a Webpack configuration bug where both `main` and `runtime` chunks were attempting to save as `bundle.js` in development, causing parallel write collisions, corrupting the Babel `.cache`, and throwing syntax errors.
- **Production Packaged Builds**: Fixed a critical issue where the built `.deb` / `.AppImage` binaries would show a blank screen. `electron/main.js` now serves the statically compiled `dist/index.html` via `app.isPackaged` rather than hardcoding the localhost dev server.
- **Dangling Dev Server**: Fixed an issue where closing the Electron window during development left the `webpack serve` instance running invisibly on port 8081 by adding `--kill-others` to the concurrently script.
- **Help Modal sidebar width**: Reduced the sidebar from 260px to 220px and tightened horizontal padding to prevent layout overflow on small windows.

### Changed
- **Quality resolution badges**: Gallery, Queue, and live download cards now display badges ("4K", "2K") instead of raw resolution strings like "2160p" / "1440p".
- **Settings quality description**: Added an explanatory note above the quality selector explaining the fallback behaviour when a site does not offer the selected resolution.
- **Broadcast Security section renamed**: Renamed "Security" to "Security & Exposure" to reflect the new internet-facing options.
- **Webpack build optimization**: Overhauled `webpack.config.js` to use `SplitChunksPlugin` (separating vendor, common, and app chunks), `TerserPlugin` with 2-pass compression, content-hashed filenames for cache busting, and raised performance budget limits appropriate for an Electron app. Build is now warning-free.


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
- Overhauled the Help Panel (Documentation Modal): Added a detailed guide for manually installing the Chrome web companion extension, integrated explanations of advanced settings (maintenance, auto-clear, proxy), and published an explicit `Supported Sites` section detailing `yt-dlp` coverage networks.
- The `GalleryTab` now unmounts the search and filter bar completely when the local history library is empty to reduce initial UI clutter.

### Changed
- Overhauled the `DownloadTab` UI: the generic "SauceBox Engine" feature card has been replaced with an explicit step-by-step "How to Use" instructional guide.
- Improved the "Feeling Lucky?" action: clicking the app logo now strictly respects the `settings.notifications` state and will launch random videos/sites without triggering desktop notifications if they are disabled.


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
- Advanced M3U Metadata: Implemented #EXTART metadata injection into playlists so VR players (like Skybox VR) display cover art thumbnails and group videos by custom tags.
- On-the-Fly Transcoding: Integrated real-time FFmpeg streaming to force-transcode incompatible formats (like .mkv and .webm) to .mp4 instantly while streaming to headsets.
- Completely scrubbed all references to the internal project name, updating all user-facing documentation, logs, and components to SauceBox.


## [1.1.0] - 2026-05-13
### Added
- Implemented UI text truncation for long filenames in the Import Wizard.
- Added Duplicate Detection & Conflict Resolution workflow in the Import tool. Users can now choose to Skip, Replace, or Duplicate conflicting files with batch "Apply to All" functionality.
- Enhanced the Chrome extension's download pipeline. Extension downloads now properly trigger the primary download flow with immediate metadata fetching, thumbnail generation, and quality resolution.
- Separated the `Queue` page into two visually distinct "Active Downloads" and "Completed" sections.
- Restyled the `VideoPlayer` to be completely responsive dynamically, perfectly adapting to the window's current dimensions using `vw`/`vh` sizing and flexbox while maintaining the `16:9` aspect ratio.
- Rebuilt the `VideoPlayer` Header to show dynamic metadata identical to the gallery cards rather than generic titles.
- Added `Open Folder` and `Open Player` functionality to the `VideoPlayer` controls for seamless media management.

### Fixed
- Fixed an issue where the Chrome extension failed to load due to missing `icon.png` in the manifest by correctly migrating the primary logo to the local extension folder.
- Resolved application locking and hanging issues when multiple downloads were active. Restructured the `yt-dlp` output capture pipeline in the main process to throttle IPC spam (progress, speed, and ETA) into a single 500ms batched payload.
- Fixed overlay background opacity dimming inside `VideoPlayer` and `EditVideoModal` for clearer visual contrast, preserving full title bar visibility.


## [1.0.0] - 2026-05-12
### Initial Release
- Initial stable release of SauceBox Media Manager.

