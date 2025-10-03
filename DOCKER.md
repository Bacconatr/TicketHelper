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

Press Ctrl+C to exit logs (bot keeps running).

## Managing the Bot

**Stop the bot:**
```bash
docker-compose stop
```

**Start the bot:**
```bash
docker-compose start
```

**Restart the bot:**
```bash
docker-compose restart
```

**View logs:**
```bash
docker-compose logs -f
```

**Stop and remove container:**
```bash
docker-compose down
```

**Update the bot:**
```bash
# Pull latest code (if using git)
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Auto-Start on Reboot

The `docker-compose.yml` includes `restart: unless-stopped`, which means:
- Bot automatically restarts if it crashes
- Bot starts when your Pi boots up
- Bot stays running until you manually stop it

## Monitoring

**Check if bot is running:**
```bash
docker-compose ps
```

**Check resource usage:**
```bash
docker stats tickethelper-bot
```

**View recent logs:**
```bash
docker-compose logs --tail=50 tickethelper
```

## Troubleshooting

**Container won't start:**
```bash
docker-compose logs tickethelper
```
Check for missing environment variables or errors.

**Bot not responding in Discord:**
- Verify `.env` file is correctly configured
- Check logs: `docker-compose logs -f`
- Ensure Pi has internet connection

**High memory usage:**
- Normal for Node.js apps (~80-100 MB baseline)
- Message cache adds ~15 MB per 100 active tickets
- Pi should handle this easily with 1GB+ RAM

**Container keeps restarting:**
- Check logs for the error
- Verify all environment variables are set
- Check Discord token hasn't expired

## Benefits of Docker Deployment

- Isolated environment (doesn't conflict with other Pi projects)
- Easy updates (just rebuild container)
- Auto-restart on crashes
- Consistent across different systems
- Simple to start/stop/monitor

## Alternative: Run Without Docker

If you prefer not to use Docker:

```bash
cd ~/tickethelper
npm install
npm start
```

Use `pm2` to keep it running:
```bash
npm install -g pm2
pm2 start index.mjs --name tickethelper
pm2 save
pm2 startup  # Follow the instructions it gives you
```

Both approaches work fine - Docker is just cleaner and more portable.
