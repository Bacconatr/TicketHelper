# Setup Guide

Complete step-by-step instructions for deploying the Ticket Helper bot.

---

## Part 1: Discord Server Setup

### Step 1: Enable Developer Mode
1. Discord User Settings → Advanced → Developer Mode ✅
2. This lets you right-click and copy IDs

### Step 2: Create Roles
Server Settings → Roles → Create Role:
- `TA`
- `Instructor`

Assign yourself the `Instructor` role for testing.

### Step 3: Create Ticket Categories
Right-click server → Create Category:
- `🎫 Online Tickets`
- `🎫 In-Person Tickets`

**Permissions for BOTH categories:**
- @everyone: ❌ View Channel
- TA: ✅ View Channel (they see empty category)
- Instructor: ✅ View Channel

Categories will appear empty to staff until they claim tickets.

### Step 4: Create Staff Channels
Create these at the server root (not inside categories):

**#ticket-queue:**
- @everyone: ❌ View Channel
- TA: ✅ View/Send
- Instructor: ✅ View/Send

**#ticket-transcripts:**
- @everyone: ❌ View Channel
- TA: ✅ View
- Instructor: ✅ View/Send

### Step 5: Get Discord IDs
Right-click each item and select "Copy ID":

1. Server name → `GUILD_ID`
2. #ticket-queue → `QUEUE_CHANNEL_ID`
3. #ticket-transcripts → `TRANSCRIPT_CHANNEL_ID`
4. 🎫 Online Tickets category → `ONLINE_CATEGORY_ID`
5. 🎫 In-Person Tickets category → `INPERSON_CATEGORY_ID`
6. @TA role → `TA_ROLE_ID`
7. @Instructor role → `INSTRUCTOR_ROLE_ID`

---

## Part 2: Create Discord Bot

### Step 1: Create Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: `Ticket Helper`

### Step 2: Configure Bot
1. Go to "Bot" section
2. Click "Reset Token" → Copy it → Save as `DISCORD_TOKEN`
3. Scroll to "Privileged Gateway Intents":
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Click "Save Changes"

### Step 3: Invite Bot to Server
1. Go to "OAuth2" → "URL Generator"
2. Select scope: ✅ `bot`
3. Select permissions:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Manage Channels
   - ✅ Manage Messages
4. Copy the generated URL
5. Open URL in browser → Select your server → Authorize

---

## Part 3: GitHub Token (Optional)

For web-viewable transcripts:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: `Ticket Helper Bot`
4. Select scope: ✅ `gist` (only this one)
5. Click "Generate token"
6. Copy token → Save as `GITHUB_TOKEN`

---

## Part 4: Install and Configure Bot

### Step 1: Create .env File
```bash
cd /Users/levina/Desktop/tickethelper
cp .env.example .env
```

### Step 2: Edit .env
Open `.env` in a text editor and paste your IDs:

```env
DISCORD_TOKEN=your_bot_token_from_part_2
GUILD_ID=your_server_id
QUEUE_CHANNEL_ID=queue_channel_id
ONLINE_CATEGORY_ID=online_category_id
INPERSON_CATEGORY_ID=inperson_category_id
TA_ROLE_ID=ta_role_id
INSTRUCTOR_ROLE_ID=instructor_role_id
TRANSCRIPT_CHANNEL_ID=transcripts_channel_id
GITHUB_TOKEN=your_github_token_optional
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Start Bot
```bash
npm start
```

You should see:
```
✅ Ticket Helper Bot is online!
   Logged in as: Ticket Helper#1234
   Server ID: ...
   Monitoring categories: ...
```

---

## Part 5: Configure Ticket Tool

### Step 1: Invite Ticket Tool
1. Go to https://tickettool.xyz/
2. Click "Invite" → Add to your server

### Step 2: Create Panels
Go to https://dashboard.tickettool.xyz/ and select your server.

**Create Online Panel:**
- Name: `Open Online Ticket`
- Category: Select `🎫 Online Tickets`
- Ticket Message: `Ticket opened by {user}`
- Form: ❌ Disabled (no form)
- Save Panel

**Create In-Person Panel:**
- Name: `Open In-Person Ticket`
- Category: Select `🎫 In-Person Tickets`
- Ticket Message: `Ticket opened by {user}`
- Form: ❌ Disabled
- Save Panel

### Step 3: Add Helper Bot to Support Team
In Ticket Tool dashboard:
- Look for "Support Team" or "Support Roles" settings
- Add your `Ticket Helper` bot to the support team
- This ensures it has access to all tickets

### Step 4: Post Panels
Place the panel buttons in a public channel where students can access them (like #general or #support).

---

## Part 6: Test the System

1. **Open a ticket:** Click "Open Online Ticket" button
2. **Wait ~1 second:** Helper bot should post "Request Help" button
3. **Send test messages** with JustinBot
4. **Request help (optional):** Click "Request Help" → Fill form
5. **Check queue:** Go to #ticket-queue to see triage card
6. **Claim ticket:** Click "Claim & Join" → You can now see the ticket
7. **Close ticket:** Right-click channel → Delete Channel
8. **Check transcript:** Go to #ticket-transcripts:
   - Summary embed with metadata
   - Attached .html file (download)
   - "View in Browser" button (if GitHub token configured)

---

## Workflow Summary

**Student workflow:**
1. Click panel button to open private ticket
2. Work with JustinBot on assignment
3. Click "Request Help" if stuck (requires context)
4. Delete channel when done → transcript auto-saved

**Staff workflow:**
1. Monitor #ticket-queue for help requests
2. Review context before deciding to help
3. Click "Claim & Join" to enter ticket
4. Help student
5. Student deletes channel → transcript saved

**Transcript access:**
- All transcripts saved to #ticket-transcripts (staff-only)
- Download .html file or click "View in Browser"
- Send transcript to students for their write-ups

---

## Troubleshooting

**Bot doesn't post Request Help button:**
- Check category IDs in `.env` are correct
- Ensure bot has permissions in ticket categories (View, Send, Manage Channels)
- Look at console logs for errors

**Help requests don't appear in queue:**
- Verify QUEUE_CHANNEL_ID is correct
- Check bot has Send Messages + Embed Links permission in #ticket-queue
- Verify TA_ROLE_ID and INSTRUCTOR_ROLE_ID match your roles

**Can't claim tickets:**
- Ensure you have TA or Instructor role assigned
- Verify role IDs in `.env` are correct

**No transcript generated:**
- Bot caches messages in RAM - it must be running during the ticket
- If bot restarts, existing tickets lose cached messages
- Check TRANSCRIPT_CHANNEL_ID is correct
- Verify bot has Send Messages + Attach Files in #ticket-transcripts

**No "View in Browser" button:**
- GITHUB_TOKEN is optional - transcripts work without it
- Ensure token has `gist` scope only
- Check console for GitHub API errors

**"This interaction failed" errors:**
- Usually a permissions issue
- Check console logs for specific error
- Verify bot has all required permissions in relevant channels

---

## Production Deployment

### Running on Raspberry Pi or Server

1. Install Node.js 18+ on your Pi
2. Clone/copy the bot files to your Pi
3. Configure `.env` with your IDs
4. Use a process manager to keep it running:

**Using PM2 (recommended):**
```bash
npm install -g pm2
pm2 start index.mjs --name tickethelper
pm2 save
pm2 startup
```

**Or using systemd:**
Create `/etc/systemd/system/tickethelper.service` and configure as a service.

---

## Support

For issues with:
- This bot: Check console logs and verify `.env` configuration
- Ticket Tool: See https://docs.tickettool.xyz/
- Discord bot setup: See https://discord.com/developers/docs

---

Your bot is ready to support 100+ students with private tickets and automatic transcripts!
