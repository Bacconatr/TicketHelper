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
- Two Discord bots (see [SETUP.md](SETUP.md))
- Google Form with verification field

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

---

## Commands

### User Commands
- `/verify` - Start verification process

### Admin Commands (Staff Only)
- `/manual_verify @user` - Manually verify a user
- `/verified_users` - List all verified users
- `/unverify @user` - Remove verification

---

## Credits

Built for Northeastern University cybersecurity courses.

**Used for:** Social Engineering & Cybersecurity Education

---
