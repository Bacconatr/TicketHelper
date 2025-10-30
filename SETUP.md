# Complete Setup Guide

Full setup instructions for the Ticket Helper system with verification.

---

## What You're Building

A complete Discord ticket system with:
- **Pre-ticket verification** via Google Form
- **Private student tickets** with JustinBot
- **Optional staff help** via queue system
- **Automatic HTML transcripts** with web viewing

---

## Part 1: Discord Server Setup

### Step 1: Enable Developer Mode
1. Discord User Settings → Advanced → Developer Mode 
2. This lets you right-click and copy IDs

### Step 2: Create Roles
Server Settings → Roles → Create Role:
- `Verified`
- `TA`
- `Head TA`
- `Instructor`

### Step 3: Create Ticket Categories
Right-click server → Create Category:
- `🎫 Online Tickets`
- `🎫 In-Person Tickets`

**Permissions for BOTH categories:**
- @everyone: ❌ View Channel
- @Verified: ✅ View Channel
- TA: ✅ View Channel
- Head TA: ✅ View Channel
- Instructor: ✅ View Channel

### Step 4: Create Channels

**#verify-access** (public channel):
- @everyone: ✅ View, ❌ Send
- Description: "Run `/verify` to complete the form and access tickets"

**#ticket-queue** (staff-only):
- @everyone: ❌ View Channel
- TA/Head TA/Instructor: ✅ View/Send

**#ticket-transcripts** (staff-only):
- @everyone: ❌ View Channel
- TA/Head TA/Instructor: ✅ View/Send

### Step 5: Get Discord IDs
Right-click each item → "Copy ID":

1. Server name → `GUILD_ID`
2. #ticket-queue → `QUEUE_CHANNEL_ID`
3. #ticket-transcripts → `TRANSCRIPT_CHANNEL_ID`
4. Online Tickets → `ONLINE_CATEGORY_ID`
5. In-Person Tickets → `INPERSON_CATEGORY_ID`
6. @TA → `TA_ROLE_ID`
7. @Head TA → `HEAD_TA_ROLE_ID`
8. @Instructor → `INSTRUCTOR_ROLE_ID`

---

## Part 2: Create Discord Bots

You need **TWO** Discord bots:

### Bot 1: Ticket Helper
1. https://discord.com/developers/applications → New Application
2. Name: `Ticket Helper`
3. Bot → Reset Token → Copy as `DISCORD_TOKEN`
4. Enable intents: ✅ Server Members, ✅ Message Content
5. OAuth2 → URL Generator:
   - Scope: `bot`
   - Permissions: View Channels, Send Messages, Embed Links, Attach Files, Read Message History, Manage Channels, Manage Messages
6. Invite to server

### Bot 2: Verification
1. https://discord.com/developers/applications → New Application
2. Name: `Ticket Verification`
3. Bot → Reset Token → Copy as `VERIFICATION_BOT_TOKEN`
4. Enable intents: ✅ Server Members, ✅ Message Content
5. OAuth2 → URL Generator:
   - Scope: `bot` + `applications.commands`
   - Permissions: View Channels, Send Messages, Manage Roles
6. Invite to server

---

## Part 3: Google Form Setup

1. Add "Discord User ID" field to your existing form
2. Get pre-filled link and extract `entry.XXXXXXXX`
3. Set up Google Apps Script webhook trigger
4. Note your form's base URL
---

## Part 4: Configure Environment

```bash
cd ~/Desktop/tickethelper
cp .env.example .env
nano .env
```

Fill in ALL values:

```env
# Ticket Helper Bot
DISCORD_TOKEN=your_ticket_helper_bot_token
GUILD_ID=your_server_id
QUEUE_CHANNEL_ID=queue_channel_id
ONLINE_CATEGORY_ID=online_category_id
INPERSON_CATEGORY_ID=inperson_category_id
TA_ROLE_ID=ta_role_id
HEAD_TA_ROLE_ID=head_ta_role_id
INSTRUCTOR_ROLE_ID=instructor_role_id
TRANSCRIPT_CHANNEL_ID=transcripts_channel_id
GITHUB_TOKEN=optional_for_web_transcripts

# Verification Bot
VERIFICATION_BOT_TOKEN=your_verification_bot_token
FORM_URL=https://docs.google.com/forms/d/e/YOUR_FORM_ID/viewform
FORM_ENTRY_ID=entry.123456789
VERIFIED_ROLE_NAME=Verified
```
---

## Part 5: Nginx Proxy Manager

Set up webhook endpoint for instant verification:

1. Add Proxy Host:
   - Domain: `ticket.lospolloshermanos.dev`
   - Forward to: `ticket-verification-bot:5000`
   - SSL: Request new certificate

See [VERIFICATION_SETUP.md](VERIFICATION_SETUP.md) for full details.

---

## Part 6: Configure Ticket Tool

1. Invite Ticket Tool: https://tickettool.xyz/
2. Dashboard: https://dashboard.tickettool.xyz/
3. Create panels:
   - **Online Tickets** → Category: Online Tickets
   - **In-Person Tickets** → Category: In-Person Tickets
4. **Important:** Configure panels to require "Verified" role!

---

## Part 8: Test Complete Flow

### Test Verification
1. Student runs `/verify` in #verify-access
2. Clicks form link (Discord ID auto-filled)
3. Submits form
4. Gets "Verified" role instantly
5. Receives DM confirmation

### Test Ticket System
1. Verified student clicks Ticket Tool panel
2. Ticket channel created
3. Ticket Helper bot posts "Request Help" button
4. Student works with JustinBot
5. Student clicks "Request Help" (optional) → staff can claim
6. Student closes ticket
7. Transcript saved in #ticket-transcripts

---

## 📚 Additional Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - How the bots work together
- **[QUICK_START.md](QUICK_START.md)** - Fast deployment (10 min)
- **[GET_ENTRY_ID.md](GET_ENTRY_ID.md)** - Google Form setup
- **[VERIFICATION_SETUP.md](VERIFICATION_SETUP.md)** - Detailed verification guide
- **[DOCKER.md](DOCKER.md)** - Docker deployment details

---

## Troubleshooting

### Verification Issues
- User can't run `/verify`: Wait 2-3 min for slash commands to sync
- Form doesn't auto-fill: Check `FORM_ENTRY_ID` in .env
- Not getting role: Check bot's role is above "Verified" in hierarchy
- Full guide: [VERIFICATION_SETUP.md](VERIFICATION_SETUP.md)

### Ticket Issues
- Bot doesn't post button: Check category IDs in .env
- Help requests don't show: Verify `QUEUE_CHANNEL_ID` and role IDs
- No transcripts: Bot must run during the entire ticket session
- Can't claim: Ensure you have TA/Head TA/Instructor role

### Check Logs
```bash
docker logs tickethelper-bot
docker logs ticket-verification-bot
```

---

## System Overview

```
┌─────────────────────────────────────────────┐
│         Complete Student Flow               │
│                                             │
│  1. Join server (no ticket access)         │
│  2. /verify → Google Form → "Verified"     │
│  3. Ticket Tool panel → Create ticket      │
│  4. Work with JustinBot privately          │
│  5. Request help (optional)                │
│  6. Close ticket → Transcript saved        │
└─────────────────────────────────────────────┘
```

Your system is ready to handle 100+ students with verification, private tickets, and automatic transcripts! 🚀
