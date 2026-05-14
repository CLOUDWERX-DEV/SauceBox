# Changelog

## [1.3.2] - 2026-05-14
### Added
- Added a warning card to the Broadcast Tab to explicitly explain the network sharing implications of the current download directory.
- Added explicit CTAs to the Gallery Tab's empty state to direct users to the Download Tab or Import tool.

### Fixed
- Fixed an issue where copying the server URL to the clipboard on the Broadcast Tab threw a "Document is not focused" runtime error by adding a robust invisible-input fallback mechanism.
- Corrected the branding color scheme of the "SauceBox" text in the main TitleBar and Sidebar to reflect pure white and primary orange.

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
