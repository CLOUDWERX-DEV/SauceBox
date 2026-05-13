# Changelog

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
