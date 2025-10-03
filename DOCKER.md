# Docker Deployment Guide

Deploy the Ticket Helper bot in a Docker container on your Raspberry Pi.

## Prerequisites

- Raspberry Pi with Raspberry Pi OS (or similar)
- Docker and Docker Compose installed
- Your `.env` file configured with all IDs and tokens

## Install Docker on Raspberry Pi

If Docker isn't installed yet:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoid needing sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Reboot to apply group changes
sudo reboot
```

After reboot, verify:
```bash
docker --version
docker-compose --version
```

## Deploy the Bot

### 1. Transfer Files to Raspberry Pi

From your computer, copy the bot folder to your Pi:

```bash
scp -r /Users/levina/Desktop/tickethelper pi@your-pi-ip:~/
```

Or use git:
```bash
# On your Pi
git clone https://github.com/Bacconatr/TicketHelper.git
cd TicketHelper
```

### 2. Configure Environment

On your Raspberry Pi:

```bash
cd ~/tickethelper
cp .env.example .env
nano .env  # Edit with your IDs and tokens
```

### 3. Build and Start

```bash
# Build the container
docker-compose build

# Start the bot
docker-compose up -d
```

The `-d` flag runs it in the background (detached mode).

### 4. Verify It's Running

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f tickethelper

# You should see: ✅ Ticket Helper Bot is online!
```