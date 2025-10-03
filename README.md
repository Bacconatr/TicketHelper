# Ticket Helper Bot for Social Engineering Assignment

A Discord bot that manages ticket-based support workflows for class assignments. Works alongside Ticket Tool to provide private student workspaces with JustinBot, optional TA/Instructor help via a claim system, and automatic HTML transcript generation.

## Features

- **Private student tickets** - Each student gets a private channel with JustinBot
- **Context-required help requests** - Students must explain their issue before staff can join
- **Shared staff queue** - TAs and Instructors see all help requests in one place
- **Claim system** - Staff claim tickets to avoid duplicate work
- **Automatic HTML transcripts** - Beautiful, Discord-styled transcripts saved when tickets close
- **Web-viewable transcripts** - Optional GitHub Gist integration for instant browser viewing
- **Message caching** - Transcripts work even after channel deletion

## Requirements

- Node.js 18+
- Discord bot with Message Content Intent enabled
- Ticket Tool bot in your server
- GitHub personal access token (optional, for web-viewable transcripts)

## Quick Setup

### 1. Discord Bot Setup

1. Create bot at https://discord.com/developers/applications
2. Enable intents: Server Members Intent, Message Content Intent
3. Generate OAuth2 URL with `bot` scope and these permissions:
   - View Channels, Send Messages, Embed Links, Attach Files
   - Read Message History, Manage Channels, Manage Messages
4. Invite to your server

### 2. Server Configuration

Create these roles and channels:

**Roles:** `TA`, `Instructor`

**Categories:**
- `🎫 Online Tickets` - Permissions: @everyone ❌, TA/Instructor ✅ (view only)
- `🎫 In-Person Tickets` - Same permissions

**Channels:**
- `#ticket-queue` - Visible to TA + Instructor only
- `#ticket-transcripts` - Visible to TA + Instructor only

### 3. Install and Configure

```bash
cd tickethelper
npm install
cp .env.example .env
```

Edit `.env` with your IDs (right-click items in Discord with Developer Mode enabled):

```env
DISCORD_TOKEN=your_bot_token
GUILD_ID=your_server_id
QUEUE_CHANNEL_ID=ticket_queue_channel_id
ONLINE_CATEGORY_ID=online_category_id
INPERSON_CATEGORY_ID=inperson_category_id
TA_ROLE_ID=ta_role_id
INSTRUCTOR_ROLE_ID=instructor_role_id
TRANSCRIPT_CHANNEL_ID=transcripts_channel_id
GITHUB_TOKEN=ghp_your_token_optional
```

### 4. Optional: GitHub Gist Integration

For web-viewable transcripts:

1. Go to https://github.com/settings/tokens
2. Generate new token (classic) → Select `gist` scope only
3. Add token to `.env` as `GITHUB_TOKEN`

### 5. Run

```bash
npm start
```

## Workflow

1. **Student opens ticket** via Ticket Tool panel → Private channel created
2. **Bot posts "Request Help" button** automatically
3. **Student works with JustinBot** privately
4. **Optional: Student requests help** → Fills context form → Posted to staff queue
5. **Staff member claims ticket** → Joins the channel to assist
6. **Student deletes channel when done** → Transcript auto-generated and posted to #ticket-transcripts

## Transcript Features

Each transcript includes:
- Discord-styled HTML with dark theme
- All messages with timestamps and avatars
- Metadata (who opened, which staff helped, message count)
- Downloadable .html file attachment
- Optional "View in Browser" button (if GitHub token provided)

## Troubleshooting

**Bot doesn't post Request Help button?**
- Verify category IDs in `.env` are correct
- Check bot has permissions in ticket categories

**Help requests don't appear in queue?**
- Verify bot has Send Messages permission in #ticket-queue
- Check TA_ROLE_ID and INSTRUCTOR_ROLE_ID are correct

**No transcript generated?**
- Messages are cached in RAM - if bot restarts during a ticket, cache is lost
- Ensure TRANSCRIPT_CHANNEL_ID is correct

**No "View in Browser" button?**
- GITHUB_TOKEN is optional - transcripts work without it
- Check GitHub token has `gist` scope
- Check console for GitHub API errors

## Project Structure

```
tickethelper/
├── index.mjs          # Main bot code
├── package.json       # Dependencies
├── .env              # Configuration (gitignored)
├── .env.example      # Template
└── README.md         # This file
```

## License

MIT
