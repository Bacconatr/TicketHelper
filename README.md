# 🎫 Ticket Helper Bot Suite

A comprehensive Discord ticket system with automatic verification and transcript generation for educational environments.
---

## Features

### Pre-Ticket Verification
- Google Form integration with automatic role assignment
- Instant webhook-based verification (no polling delays)
- Pre-filled Discord IDs for seamless UX
- Admin commands for manual verification

### Smart Ticket Management
- Private student tickets with assignment bot (e.g., JustinBot)
- Context-required help requests (students explain what they tried)
- Shared staff queue with claim system
- Optional staff intervention - students can work independently

### Automatic Transcripts
- HTML transcripts with Discord-style formatting
- Message caching ensures transcripts even after channel deletion
- GitHub Gist integration for instant browser viewing
- Includes metadata: opener, staff involved, timestamps

---

## Architecture

```
Student joins Discord
    ↓
[Verification Bot] /verify → Google Form → "Verified" role
    ↓
[Ticket Tool] Creates ticket if user has "Verified" role
    ↓
[Ticket Helper Bot] Posts "Request Help" button
    ↓
Student works → Optionally requests help → Staff claims
    ↓
Ticket closes → HTML transcript auto-generated
```

**Two Independent Bots:**
- **Verification Bot** (Python) - Handles pre-access form verification
- **Ticket Helper Bot** (JavaScript) - Manages ticket workflow and transcripts

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Two Discord bots (see [SETUP.md](SETUP.md))
- Google Form with verification field
- Domain with SSL (for webhook)

### Deploy in 5 Commands

```bash
# 1. Clone repository
git clone <your-repo> tickethelper && cd tickethelper

# 2. Configure environment
cp .env.example .env
nano .env  # Fill in your tokens and IDs

# 3. Deploy both bots
docker-compose up -d --build

# 4. Verify deployment
docker ps && docker logs -f ticket-verification-bot

# 5. Test
curl https://ticket.lospolloshermanos.dev/health
```

**Detailed guides:**
- 📖 [Full Setup Guide](SETUP.md) - Complete step-by-step
- ⚡ [Quick Start](QUICK_START.md) - Deploy in 10 minutes
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Ensure nothing is missed

---

## User Experience

### Student Flow
1. Join Discord server (no ticket access yet)
2. Run `/verify` command
3. Complete Google Form (Discord ID auto-filled)
4. Receive "Verified" role instantly
5. Click Ticket Tool panel to open private ticket
6. Work on assignment with bot
7. Click "Request Help" if stuck (requires context)
8. Close ticket → receive transcript

### Staff Flow
1. Monitor `#ticket-queue` for help requests
2. Review student's context and attempts
3. Click "Claim & Join" to enter ticket
4. Help student
5. Student closes ticket → transcript auto-saved in `#ticket-transcripts`

---

## Configuration

All configuration in `.env`:

```env
# Ticket Helper Bot (JavaScript)
DISCORD_TOKEN=your_ticket_helper_token
GUILD_ID=your_server_id
QUEUE_CHANNEL_ID=...
TRANSCRIPT_CHANNEL_ID=...
GITHUB_TOKEN=optional_for_web_view

# Verification Bot (Python)
VERIFICATION_BOT_TOKEN=your_verification_token
FORM_URL=https://docs.google.com/forms/.../viewform
FORM_ENTRY_ID=entry.123456789
VERIFIED_ROLE_NAME=Verified
```

---

## Tech Stack

**Ticket Helper Bot:**
- Node.js 20
- discord.js 14.x
- GitHub Gist API (optional)

**Verification Bot:**
- Python 3.11
- discord.py 2.3
- aiohttp 3.9

**Infrastructure:**
- Docker & Docker Compose
- Nginx Proxy Manager
- Cloudflare DNS

---

## Commands

### User Commands
- `/verify` - Start verification process

### Admin Commands (Staff Only)
- `/manual_verify @user` - Manually verify a user
- `/verified_users` - List all verified users
- `/unverify @user` - Remove verification

---

## Docker Management

```bash
# Start both bots
docker-compose up -d

# View logs
docker-compose logs -f

# View specific bot
docker logs -f tickethelper-bot
docker logs -f ticket-verification-bot

# Restart
docker-compose restart

# Stop
docker-compose down

# Update and rebuild
git pull && docker-compose up -d --build
```

---

## Security

- Verification codes are single-use and cryptographically random
- Webhook uses HTTPS with Let's Encrypt SSL
- Bot tokens stored in environment variables (not committed)
- Transcripts uploaded as private GitHub Gists
- Role hierarchy prevents privilege escalation
- Google Form responses only accessible to verified staff

---

## Testing

```bash
# Test verification webhook
curl https://ticket.lospolloshermanos.dev/health

# Test verification flow
# 1. Run /verify in Discord
# 2. Submit form
# 3. Check role assignment
# 4. Check logs

# Test ticket flow
# 1. Create ticket via Ticket Tool
# 2. Verify "Request Help" button appears
# 3. Send messages
# 4. Close ticket
# 5. Check transcript in #ticket-transcripts
```

---

## Credits

Built for Northeastern University cybersecurity courses.

**Used for:** Social Engineering & Cybersecurity Education

---
