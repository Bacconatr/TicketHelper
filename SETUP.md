# Complete Setup Guide

Step-by-step instructions to deploy the Ticket Helper bot.

---

## Part 1: Discord Preparation (10 minutes)

### Enable Developer Mode
1. Discord Settings → Advanced → Developer Mode ✅

### Create Roles
1. Server Settings → Roles → Create:
   - `TA`
   - `Instructor`
2. Assign yourself the `Instructor` role for testing

### Create Ticket Categories
1. Right-click server → Create Category → `🎫 Online Tickets`
2. Right-click server → Create Category → `🎫 In-Person Tickets`

**Set permissions for BOTH categories:**
- @everyone: ❌ View Channel (deny)
- TA: ✅ View Channel (allow - they see empty category)
- Instructor: ✅ View Channel (allow)

### Create Staff Channels
Create at server root level (not in categories):

1. `#ticket-queue`
   - @everyone: ❌ View Channel
   - TA: ✅ View/Send
   - Instructor: ✅ View/Send

2. `#ticket-transcripts`
   - @everyone: ❌ View Channel
   - TA: ✅ View
   - Instructor: ✅ View/Send

### Copy All IDs
Right-click and select "Copy ID":

1. Server name → **GUILD_ID**
2. #ticket-queue → **QUEUE_CHANNEL_ID**
3. #ticket-transcripts → **TRANSCRIPT_CHANNEL_ID**
4. 🎫 Online Tickets → **ONLINE_CATEGORY_ID**
5. 🎫 In-Person Tickets → **INPERSON_CATEGORY_ID**
6. @TA role → **TA_ROLE_ID**
7. @Instructor role → **INSTRUCTOR_ROLE_ID**

---

## Part 2: Create Discord Bot (5 minutes)

### Create Application
1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name: `Ticket Helper`

### Configure Bot
1. Left sidebar → "Bot"
2. Click "Reset Token" → Copy token → **DISCORD_TOKEN**
3. Scroll to "Privileged Gateway Intents":
   - ✅ Server Members Intent
   - ✅ Message Content Intent
4. Save Changes

### Generate Invite Link
1. OAuth2 → URL Generator
2. Scopes: ✅ `bot`
3. Bot Permissions:
   - ✅ View Channels
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Manage Channels
   - ✅ Manage Messages
4. Copy generated URL → Open in browser → Invite to server

---

## Part 3: GitHub Token (Optional, 2 minutes)

For web-viewable transcripts:

1. Go to https://github.com/settings/tokens
2. "Generate new token (classic)"
3. Name: `Ticket Helper Bot`
4. Scope: ✅ `gist` (only this one)
5. Generate → Copy token → **GITHUB_TOKEN**

---

## Part 4: Configure Bot (2 minutes)

### Create .env File
```bash
cd /Users/levina/Desktop/tickethelper
cp .env.example .env
```

### Edit .env
Open `.env` and paste your IDs:

```env
DISCORD_TOKEN=paste_bot_token
GUILD_ID=paste_server_id
QUEUE_CHANNEL_ID=paste_queue_id
ONLINE_CATEGORY_ID=paste_online_category_id
INPERSON_CATEGORY_ID=paste_inperson_category_id
TA_ROLE_ID=paste_ta_role_id
INSTRUCTOR_ROLE_ID=paste_instructor_role_id
TRANSCRIPT_CHANNEL_ID=paste_transcripts_id
GITHUB_TOKEN=paste_github_token_optional
```

### Install and Run
```bash
npm install
npm start
```

Expected output:
```
✅ Ticket Helper Bot is online!
   Logged in as: Ticket Helper#1234
   ...
```

---

## Part 5: Ticket Tool Setup (3 minutes)

### Invite Ticket Tool
1. Go to https://tickettool.xyz/
2. Invite to your server

### Create Panels
Go to https://dashboard.tickettool.xyz/

**Online Panel:**
- Name: `Open Online Ticket`
- Category: `🎫 Online Tickets`
- Message: `Ticket opened by {user}`
- Form: ❌ OFF (no form)

**In-Person Panel:**
- Name: `Open In-Person Ticket`
- Category: `🎫 In-Person Tickets`
- Message: `Ticket opened by {user}`
- Form: ❌ OFF

### Post Panels
Place panel buttons in public channels where students can access them

### Grant Bot Permissions
Ensure Ticket Tool has these permissions in both categories:
- View Channels, Send Messages, Manage Channels, Manage Permissions

Add your Helper Bot to "Support Team" in Ticket Tool dashboard if available

---

## Part 6: Test (2 minutes)

1. Open ticket via panel button
2. Wait for Request Help button to appear
3. Send test messages
4. Click Request Help → Fill form
5. Check #ticket-queue for triage card
6. Claim ticket as staff
7. Delete channel
8. Check #ticket-transcripts for HTML file + View button

---

## Troubleshooting

**Bot doesn't post button:**
- Check category IDs in .env
- Verify bot has permissions in categories
- Look at console for errors

**Can't claim tickets:**
- Verify role IDs in .env
- Check you have TA or Instructor role

**No transcript:**
- Bot must be running when ticket is active (messages cached in RAM)
- Check TRANSCRIPT_CHANNEL_ID
- Verify bot has Send Messages + Attach Files in that channel

**No View in Browser button:**
- GITHUB_TOKEN is optional
- Check GitHub token has `gist` scope
- Console will show upload errors if any

---

## You're Ready!

Students can now work privately with JustinBot, request help when needed, and you'll have full transcripts for grading.
