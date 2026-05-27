# SauceBox Docker Deployment Guide

SauceBox isn't just a desktop application—it can also be run entirely headlessly inside a Docker container. This is perfect for home servers, NAS devices, and Raspberry Pis. 

The Docker image includes a highly optimized Node.js Web Server that completely replaces the Electron shell, providing 100% feature parity through a custom IPC-to-Web API bridge.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to deploy SauceBox is using `docker-compose`. Create a `docker-compose.yml` file anywhere on your server:

```yaml
services:
  saucebox:
    image: cloudwerxlabs/saucebox:latest
    container_name: saucebox
    restart: unless-stopped
    ports:
      # Format is "HostPort:ContainerPort"
      # You can change the FIRST number to map to a different port on your host.
      - "8080:8080"     # Main Web UI and API Port
      - "8081:8081"     # Media Streaming Port (If Broadcast is enabled)
    volumes:
      - ./saucebox_data:/data   # Persists configuration and gallery library
    environment:
      - TZ=America/New_York     # Replace with your timezone
      # - SAUCEBOX_HOST_IP=192.168.1.100    # Set this if your Broadcast M3U needs a specific LAN IP
      # - SAUCEBOX_HOST_PORT=8081           # Set this if you changed the Broadcast port above (e.g. 9091)
```

Then simply run:
```bash
docker-compose up -d
```

You can now access your SauceBox server via a web browser at `http://<your-server-ip>:8080`.

### Changing Ports in Docker
By default, SauceBox uses port `8080` for the Web UI and `8081` for the Broadcast Media Server.
If these ports are already in use on your server, you can easily change them in your `docker-compose.yml` file by changing the **first** number in the `ports` mapping:

```yaml
    ports:
      - "9090:8080"     # Web UI now accessible on port 9090
      - "9091:8081"     # Media Server now accessible on port 9091
```

**Important**: If you change the Broadcast Media Server port (e.g. to `9091`), you MUST also tell SauceBox about this external port change so it can generate correct URLs in your M3U playlists. To do this, uncomment and set the `SAUCEBOX_HOST_PORT` and `SAUCEBOX_HOST_IP` variables:

```yaml
    environment:
      - SAUCEBOX_HOST_IP=192.168.1.100  # Your server's actual LAN IP
      - SAUCEBOX_HOST_PORT=9091         # The new external port you mapped
```

This guarantees that smart TVs and VR headsets will be able to resolve the video links correctly over your local network.

---

## 📁 Volume Mapping

SauceBox uses a single directory for all of its persistent storage. You **must** map the `/data` directory to a persistent volume or bind mount on your host machine to ensure your downloads, playlists, and settings survive container restarts.

- `/data/saucebox-settings.json` — Persistent user configuration.
- `/data/saucebox-gallery.json` — Download history, tags, and media database.
- `/data/binaries/` — System binaries.
- `/data/` — Your downloaded video files (unless you change the download path in Settings).

---

## ⚙️ Architecture & Headless IPC

Since SauceBox was originally designed as an Electron desktop application, it relies heavily on Electron's Inter-Process Communication (IPC). To make it work in Docker without shipping a massive headless Electron binary or X11 dependencies, we built a custom translation layer.

When you run SauceBox in Docker, the entrypoint is a custom `server.js` script. This script:
1. Mocks the Electron `ipcMain` and `app` modules natively.
2. Intercepts backend calls and maps them to an Express HTTP server (`/api/invoke`).
3. Uses Server-Sent Events (SSE) at `/api/events` to stream real-time updates (like `yt-dlp` download progress) directly to the web client.

This means the SauceBox Docker image is fully contained, fast, and supports `linux/amd64` and `linux/arm64` natively.

### Native Binaries & Auto-Provisioning
Because the Docker image is based on Debian (standard Linux `glibc`), SauceBox's native auto-provisioning engine works **exactly** the same way in Docker as it does on the desktop. 

On first boot, SauceBox will automatically download the correct standard Linux `yt-dlp` and `ffmpeg` binaries into the `/data/binaries` volume. 
This means:
1. You never have to manually install dependencies.
2. The **"Update yt-dlp"** button inside the SauceBox Settings UI works flawlessly in Docker.
3. Your binaries persist across container updates since they are stored in your `/data` volume.

## 🛠️ Building the Image Manually

If you prefer to build the image from source instead of pulling from Docker Hub:

```bash
git clone https://github.com/CLOUDWERX-DEV/SauceBox.git
cd SauceBox
docker build -t saucebox-local .
```
