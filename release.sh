#!/usr/bin/env bash
# ==============================================================================
# SauceBox Automated Release Orchestrator
# Developed by CLOUDWERX LAB
# ==============================================================================
#
# This script automates the complete packaging and release workflow for SauceBox.
# It compiles the React Native frontend, cross-compiles Windows and Linux packages,
# tags the release in Git, and pushes the binaries directly to GitHub Releases.
#
# Primary Colors: Orange (#FF8C00) and White
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Terminal Colors for premium output branding
ORANGE='\033[38;2;255;140;0m'
BOLD='\033[1m'
WHITE='\033[1;37m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print SauceBox Header
echo -e "${ORANGE}${BOLD}============================================================================${NC}"
echo -e "${ORANGE}${BOLD}        ███████╗ █████╗ ██╗   ██╗ ██████╗███████╗██████╗  ██████╗ ██╗  ██╗${NC}"
echo -e "${ORANGE}${BOLD}        ██╔════╝██╔══██╗██║   ██║██╔════╝██╔════╝██╔══██╗██╔═══██╗╚██╗██╔╝${NC}"
echo -e "${WHITE}${BOLD}        ███████╗███████║██║   ██║██║     █████╗  ██████╔╝██║   ██║ ╚███╔╝ ${NC}"
echo -e "${WHITE}${BOLD}        ╚════██║██╔══██║██║   ██║██║     ██╔══╝  ██╔══██╗██║   ██║ ██╔██╗ ${NC}"
echo -e "${ORANGE}${BOLD}        ███████║██║  ██║╚██████╔╝╚██████╗███████╗██████╔╝╚██████╔╝██╔╝ ██╗${NC}"
echo -e "${ORANGE}${BOLD}        ╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝╚═════╝  ╚═════╝╚═╝  ╚═╝${NC}"
echo -e "${ORANGE}${BOLD}============================================================================${NC}"
echo -e "                  ${WHITE}${BOLD}AUTOMATED RELEASE ORCHESTRATOR${NC}"
# Pull version dynamically so the banner is always current
_BANNER_VER=$(node -e "console.log(require('./package.json').version)" 2>/dev/null || echo '?')
echo -e "                    ${ORANGE}${BOLD}CLOUDWERX LAB — v${_BANNER_VER}${NC}\n"

# Step 1: Core Checks
echo -e "${WHITE}${BOLD}[Step 1/7] Running system checks...${NC}"

# Check for GitHub CLI (gh)
if ! command -v gh &> /dev/null; then
    echo -e "${RED}${BOLD}❌ Error: GitHub CLI ('gh') is not installed.${NC}"
    echo -e "Please install it using: sudo apt install gh"
    exit 1
fi

# Check for GitHub authentication status
if ! gh auth status &> /dev/null; then
    echo -e "${RED}${BOLD}❌ Error: You are not logged into GitHub CLI.${NC}"
    echo -e "Please run 'gh auth login' to authenticate your account."
    exit 1
fi
echo -e "${GREEN}✓ GitHub CLI is installed and authenticated successfully.${NC}"

# Parse version from package.json
VERSION=$(node -e "console.log(require('./package.json').version)")
echo -e "${GREEN}✓ Target release version detected: ${BOLD}v${VERSION}${NC}"

# Extract release notes for the target version from CHANGELOG.md
RELEASE_NOTES_FILE="release_notes_${VERSION}.tmp"
echo -e "${WHITE}${BOLD}[Step 2/7] Extracting release notes from CHANGELOG.md...${NC}"

# Robust extraction using AWK
awk "/## \[[0-9]+\.[0-9]+\.[0-9]+\]/{flag=0} /## \[${VERSION}\]/{flag=1;next} flag" CHANGELOG.md > "${RELEASE_NOTES_FILE}"

if [ ! -s "${RELEASE_NOTES_FILE}" ]; then
    echo -e "${YELLOW}⚠️ Warning: No release notes found for version [${VERSION}] in CHANGELOG.md.${NC}"
    echo -e "Please ensure you have added a '## [${VERSION}]' section to the changelog."
    read -p "Do you want to write release notes manually now? (y/N) " WRITE_MANUAL
    if [[ $WRITE_MANUAL =~ ^[Yy]$ ]]; then
        nano "${RELEASE_NOTES_FILE}"
    else
        echo -e "Releasing with empty release notes."
        echo "Release of v${VERSION}" > "${RELEASE_NOTES_FILE}"
    fi
else
    echo -e "${GREEN}✓ Release notes parsed successfully. Summary preview:${NC}"
    echo -e "${ORANGE}----------------------------------------------------------------------${NC}"
    head -n 8 "${RELEASE_NOTES_FILE}"
    echo -e "..."
    echo -e "${ORANGE}----------------------------------------------------------------------${NC}"
fi

# Step 3: Git Status Verification
echo -e "\n${WHITE}${BOLD}[Step 3/7] Verifying Git environment...${NC}"
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️ Warning: You have uncommitted changes in your workspace!${NC}"
    git status -s
    echo ""
    read -p "Do you want to stage and commit these changes automatically? (y/N) " COMMIT_AUTO
    if [[ $COMMIT_AUTO =~ ^[Yy]$ ]]; then
        read -p "Enter commit message (default: 'chore: bump to v${VERSION} and finalize changelog'): " COMMIT_MSG
        if [ -z "${COMMIT_MSG}" ]; then
            COMMIT_MSG="chore: bump to v${VERSION} and finalize changelog"
        fi
        git add .
        git commit -m "${COMMIT_MSG}"
        echo -e "${GREEN}✓ Changes committed successfully.${NC}"
    else
        echo -e "${RED}Aborting release process. Please commit your changes manually first.${NC}"
        rm -f "${RELEASE_NOTES_FILE}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Git workspace is clean.${NC}"
fi

# Step 4: Tag & Repository Alignment
echo -e "\n${WHITE}${BOLD}[Step 4/7] Aligning Git Tag...${NC}"
git fetch --tags origin

# Check if tag already exists
if git rev-parse "v${VERSION}" >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Git Tag 'v${VERSION}' already exists!${NC}"
    read -p "Do you want to recreate and overwrite this tag? (y/N) " RECREATE_TAG
    if [[ $RECREATE_TAG =~ ^[Yy]$ ]]; then
        git tag -d "v${VERSION}"
        git push --delete origin "v${VERSION}" || true
        git tag "v${VERSION}"
        echo -e "${GREEN}✓ Tag v${VERSION} recreated locally.${NC}"
    else
        echo -e "${GREEN}✓ Reusing existing tag 'v${VERSION}'.${NC}"
    fi
else
    git tag "v${VERSION}"
    echo -e "${GREEN}✓ Created new Git Tag: v${VERSION}${NC}"
fi

# Step 5: Compilation and Bundle Build
echo -e "\n${WHITE}${BOLD}[Step 5/7] Compiling frontend & packaging binaries...${NC}"
echo -e "This will run a full React Native compilation, build the Electron main process,"
echo -e "and cross-compile both Linux packages and Windows installers."
echo -e "This might take a minute..."
echo -e "${ORANGE}----------------------------------------------------------------------${NC}"

# Clean build artifacts first
rm -rf dist dist-bin/*.exe dist-bin/*.AppImage dist-bin/*.deb dist-bin/*.tar.gz

# Run build and pack
npm run dist -- --linux --win

echo -e "${ORANGE}----------------------------------------------------------------------${NC}"
echo -e "${GREEN}✓ Compilation and Electron Packaging completed successfully!${NC}"

# Step 6: Map Release Artifacts
echo -e "\n${WHITE}${BOLD}[Step 6/7] Mapping release binary packages...${NC}"
ARTIFACTS=()

# Expected Linux binaries
APPIMAGE="dist-bin/SauceBox-${VERSION}.AppImage"
DEB="dist-bin/saucebox_${VERSION}_amd64.deb"
TARGZ="dist-bin/saucebox-${VERSION}.tar.gz"

# Expected Windows binaries
WIN_SETUP="dist-bin/SauceBox Setup ${VERSION}.exe"
WIN_PORTABLE="dist-bin/SauceBox ${VERSION}.exe"

# Verify and add files to upload list
for FILE in "${APPIMAGE}" "${DEB}" "${TARGZ}" "${WIN_SETUP}" "${WIN_PORTABLE}"; do
    if [ -f "${FILE}" ]; then
        echo -e "  ${GREEN}✓ Found Release Asset:${NC} $(basename "${FILE}") ($(du -h "${FILE}" | cut -f1))"
        ARTIFACTS+=("${FILE}")
    else
        echo -e "  ${RED}✗ Missing expected Asset:${NC} $(basename "${FILE}")"
    fi
done

if [ ${#ARTIFACTS[@]} -eq 0 ]; then
    echo -e "${RED}${BOLD}❌ Error: No release binaries found in 'dist-bin/'. Aborting Release.${NC}"
    rm -f "${RELEASE_NOTES_FILE}"
    exit 1
fi

# Step 7: Push Tag & Upload Release to GitHub
echo -e "\n${WHITE}${BOLD}[Step 7/7] Pushing to GitHub & Creating Release...${NC}"
read -p "Are you absolutely ready to publish v${VERSION} to GitHub? (y/N) " CONFIRM_PUBLISH

if [[ $CONFIRM_PUBLISH =~ ^[Yy]$ ]]; then
    echo -e "Pushing commits to remote..."
    git push origin main
    
    echo -e "Pushing tag 'v${VERSION}' to remote..."
    git push origin "v${VERSION}"
    
    echo -e "Uploading binaries and creating GitHub Release... (this will take a moment)"
    
    # Check if a release for this tag already exists on GitHub
    if gh release view "v${VERSION}" &>/dev/null; then
        echo -e "${YELLOW}⚠️ Release 'v${VERSION}' already exists on GitHub. Updating assets...${NC}"
        gh release upload "v${VERSION}" "${ARTIFACTS[@]}" --clobber
    else
        gh release create "v${VERSION}" "${ARTIFACTS[@]}" \
            --title "v${VERSION}" \
            --notes-file "${RELEASE_NOTES_FILE}" \
            --discussion-category "Announcements" || \
        gh release create "v${VERSION}" "${ARTIFACTS[@]}" \
            --title "v${VERSION}" \
            --notes-file "${RELEASE_NOTES_FILE}"
    fi
    
    echo -e "\n${GREEN}${BOLD}🎉 SUCCESS! SauceBox v${VERSION} has been published successfully on GitHub!${NC}"
    echo -e "${WHITE}Check out your release here: ${NC} https://github.com/CLOUDWERX-DEV/SauceBox/releases/tag/v${VERSION}"
else
    echo -e "${YELLOW}Release aborted. Git Tag is created locally. You can publish manually later.${NC}"
fi

# Cleanup temporary release notes file
rm -f "${RELEASE_NOTES_FILE}"
echo -e "\n${ORANGE}${BOLD}============================================================================${NC}"
