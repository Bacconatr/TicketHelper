# Ticket Helper Bot

A Discord bot that works alongside Ticket Tool to manage private student support tickets with automatic HTML transcript generation.

## Features

- Private student tickets with JustinBot for social engineering assignments
- Context-required help requests (students must explain their issue)
- Shared staff queue where TAs, Head TAs, and Instructors can claim tickets
- Automatic HTML transcript generation with Discord-style formatting
- Optional GitHub Gist integration for instant browser viewing of transcripts
- Message caching ensures transcripts work even after channel deletion

## Requirements

- Node.js 18+
- Discord bot with Message Content Intent and Server Members Intent enabled
- Ticket Tool bot in your Discord server
- GitHub personal access token (optional, for web-viewable transcripts)

## Quick Start

### 1. Discord Bot Setup

1. Create bot at https://discord.com/developers/applications
2. Enable **Privileged Gateway Intents**: Server Members Intent, Message Content Intent
3. Generate invite URL with `bot` scope and permissions:
   - View Channels, Send Messages, Embed Links, Attach Files
   - Read Message History, Manage Channels, Manage Messages
4. Invite to your server

### 2. Server Structure

**Roles:** `TA`, `Head TA`, `Instructor`

**Categories:**
- `🎫 Online Tickets` (deny @everyone, allow TA/Head TA/Instructor to view)
- `🎫 In-Person Tickets` (same permissions)

**Channels:**
- `#ticket-queue` (visible to TA + Head TA + Instructor only)
- `#ticket-transcripts` (visible to TA + Head TA + Instructor only)

### 3. Install

```bash
npm install
cp .env.example .env
```

Edit `.env` with your Discord IDs and tokens.

### 4. Run

```bash
npm start
```

## Configuration

All configuration is in `.env`:

```env
DISCORD_TOKEN=your_bot_token
GUILD_ID=your_server_id
QUEUE_CHANNEL_ID=ticket_queue_channel_id
ONLINE_CATEGORY_ID=online_category_id
INPERSON_CATEGORY_ID=inperson_category_id
TA_ROLE_ID=ta_role_id
HEAD_TA_ROLE_ID=head_ta_role_id
INSTRUCTOR_ROLE_ID=instructor_role_id
TRANSCRIPT_CHANNEL_ID=transcripts_channel_id
GITHUB_TOKEN=ghp_your_github_token_optional
```

Get IDs by right-clicking items in Discord (Developer Mode must be enabled).

## GitHub Gist Setup (Optional)

For web-viewable transcripts:

1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `gist` only
4. Copy token and add to `.env` as `GITHUB_TOKEN`

## How It Works

1. Student opens ticket via Ticket Tool panel
2. Bot posts "Request Help" button in the private ticket
3. Student works with JustinBot privately
4. If student needs help, they click "Request Help" and fill a form (requires context)
5. Help request appears in #ticket-queue
6. TA, Head TA, or Instructor clicks "Claim & Join" to enter the ticket
7. When done, student deletes the channel
8. Bot automatically generates and saves HTML transcript

## Transcript Features

Each transcript includes:
- Discord-styled HTML with dark theme
- All messages with timestamps and user avatars
- Channel metadata (opener, staff involved, timestamps)
- Downloadable .html file
- Optional "View in Browser" button (opens in web browser via GitHub Gist)