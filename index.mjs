/**
 * Ticket Helper Bot
 * 
 * Works alongside Ticket Tool to provide:
 * - Private student tickets with JustinBot
 * - Optional TA/Instructor help via context-required requests
 * - Shared staff queue with claim system
 * - Automatic HTML transcript generation with optional web viewing
 * 
 * Message caching ensures transcripts work even after channel deletion.
 * GitHub Gist integration provides instant browser viewing of transcripts.
 */

import 'dotenv/config';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  Partials,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';

// Load environment variables
const {
  DISCORD_TOKEN,
  GUILD_ID,
  QUEUE_CHANNEL_ID,
  ONLINE_CATEGORY_ID,
  INPERSON_CATEGORY_ID,
  TA_ROLE_ID,
  HEAD_TA_ROLE_ID,
  INSTRUCTOR_ROLE_ID,
  TRANSCRIPT_CHANNEL_ID,
  GITHUB_TOKEN
} = process.env;

// Validate required env vars (GITHUB_TOKEN optional but recommended)
const requiredEnvVars = {
  DISCORD_TOKEN,
  GUILD_ID,
  QUEUE_CHANNEL_ID,
  ONLINE_CATEGORY_ID,
  INPERSON_CATEGORY_ID,
  TA_ROLE_ID,
  HEAD_TA_ROLE_ID,
  INSTRUCTOR_ROLE_ID,
  TRANSCRIPT_CHANNEL_ID
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ Missing required environment variable: ${key}`);
    console.error('Please check your .env file. See .env.example for reference.');
    process.exit(1);
  }
}

if (!GITHUB_TOKEN) {
  console.warn('⚠️ GITHUB_TOKEN not set - transcripts will be downloadable only (no web view)');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel, Partials.Message]
});

// Store ticket metadata, cached messages, and queue message IDs
const ticketMetadata = new Map();
const cachedMessages = new Map();
const queueMessages = new Map(); // Map ticket channel ID to queue message ID

function isTicketChannel(channel) {
  return (
    channel?.type === ChannelType.GuildText &&
    (channel.parentId === ONLINE_CATEGORY_ID || channel.parentId === INPERSON_CATEGORY_ID)
  );
}

function getCategoryName(channel) {
  if (channel.parentId === ONLINE_CATEGORY_ID) return 'Online';
  if (channel.parentId === INPERSON_CATEGORY_ID) return 'In-Person';
  return 'Unknown';
}

function formatTimestamp(date) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function generateHTMLTranscript(channel, messages, metadata) {
  const categoryName = getCategoryName(channel);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Transcript - ${escapeHtml(channel.name)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #36393f;
            color: #dcddde;
            padding: 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #2f3136;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .header {
            background: #202225;
            padding: 30px;
            border-bottom: 1px solid #202225;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin-bottom: 15px;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .metadata-item {
            background: #2f3136;
            padding: 12px;
            border-radius: 4px;
        }
        
        .metadata-label {
            color: #b9bbbe;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 4px;
        }
        
        .metadata-value {
            color: #ffffff;
            font-size: 14px;
        }
        
        .messages {
            padding: 20px 30px;
        }
        
        .message {
            display: flex;
            padding: 8px 0;
            margin-bottom: 8px;
        }
        
        .message:hover {
            background: #32353b;
            margin: 0 -10px 8px -10px;
            padding: 8px 10px;
            border-radius: 4px;
        }
        
        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #5865f2;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            font-size: 16px;
            flex-shrink: 0;
            margin-right: 16px;
        }
        
        .avatar.bot {
            background: #5865f2;
        }
        
        .message-content-wrapper {
            flex: 1;
            min-width: 0;
        }
        
        .message-header {
            display: flex;
            align-items: baseline;
            margin-bottom: 4px;
        }
        
        .author {
            font-weight: 600;
            color: #ffffff;
            margin-right: 8px;
        }
        
        .bot-tag {
            background: #5865f2;
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 4px;
            border-radius: 3px;
            margin-right: 8px;
            text-transform: uppercase;
        }
        
        .timestamp {
            font-size: 12px;
            color: #72767d;
        }
        
        .message-text {
            color: #dcddde;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        
        .attachment {
            margin-top: 8px;
            padding: 8px 12px;
            background: #2f3136;
            border-left: 4px solid #5865f2;
            border-radius: 4px;
        }
        
        .attachment-label {
            color: #b9bbbe;
            font-size: 12px;
            margin-bottom: 4px;
        }
        
        .attachment-link {
            color: #00aff4;
            text-decoration: none;
            font-size: 14px;
        }
        
        .attachment-link:hover {
            text-decoration: underline;
        }
        
        .embed {
            margin-top: 8px;
            padding: 8px 12px;
            background: #2f3136;
            border-left: 4px solid #202225;
            border-radius: 4px;
            color: #b9bbbe;
            font-size: 13px;
        }
        
        .footer {
            background: #202225;
            padding: 20px 30px;
            border-top: 1px solid #202225;
            text-align: center;
            color: #72767d;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>#${escapeHtml(channel.name)}</h1>
            <div class="metadata">
                <div class="metadata-item">
                    <div class="metadata-label">Category</div>
                    <div class="metadata-value">${categoryName}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Ticket ID</div>
                    <div class="metadata-value">${channel.id}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Opened By</div>
                    <div class="metadata-value">${escapeHtml(metadata.opener || 'Unknown')}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Staff Involved</div>
                    <div class="metadata-value">${metadata.claimedBy.length > 0 ? escapeHtml(metadata.claimedBy.join(', ')) : 'None'}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Created</div>
                    <div class="metadata-value">${formatTimestamp(channel.createdAt)}</div>
                </div>
                <div class="metadata-item">
                    <div class="metadata-label">Closed</div>
                    <div class="metadata-value">${formatTimestamp(new Date())}</div>
                </div>
            </div>
        </div>
        
        <div class="messages">`;
  
  let messagesHTML = '';
  for (const msg of messages) {
    const authorInitial = msg.author.username ? msg.author.username[0].toUpperCase() : '?';
    const isBot = msg.author.bot;
    
    messagesHTML += `
            <div class="message">
                <div class="avatar ${isBot ? 'bot' : ''}">${authorInitial}</div>
                <div class="message-content-wrapper">
                    <div class="message-header">
                        <span class="author">${escapeHtml(msg.author.username || msg.author.tag)}</span>
                        ${isBot ? '<span class="bot-tag">BOT</span>' : ''}
                        <span class="timestamp">${formatTimestamp(msg.createdAt)}</span>
                    </div>
                    ${msg.content ? `<div class="message-text">${escapeHtml(msg.content)}</div>` : ''}
                    ${msg.embeds.length > 0 ? `<div class="embed">[${msg.embeds.length} embed${msg.embeds.length > 1 ? 's' : ''}]</div>` : ''}
                    ${msg.attachments.size > 0 ? Array.from(msg.attachments.values()).map(att => `
                    <div class="attachment">
                        <div class="attachment-label">Attachment</div>
                        <a href="${att.url}" class="attachment-link" target="_blank">${escapeHtml(att.name)}</a>
                    </div>`).join('') : ''}
                </div>
            </div>`;
  }
  
  const finalHTML = html + messagesHTML + `
        </div>
        
        <div class="footer">
            Transcript generated for ${escapeHtml(channel.name)} • ${messages.length} messages
        </div>
    </div>
</body>
</html>`;
  
  return finalHTML;
}

async function uploadToGist(htmlContent, filename) {
  if (!GITHUB_TOKEN) {
    return null; // Skip if no token
  }

  try {
    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'TicketHelperBot'
      },
      body: JSON.stringify({
        description: `Ticket transcript - ${filename}`,
        public: false, // unlisted - only accessible via link
        files: {
          [filename]: {
            content: htmlContent
          }
        }
      })
    });

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const gist = await response.json();
    
    // Get the raw URL for the first (and only) file
    const fileKey = Object.keys(gist.files)[0];
    if (!fileKey || !gist.files[fileKey].raw_url) {
      console.error('No raw URL found in Gist response');
      return null;
    }
    
    const rawUrl = gist.files[fileKey].raw_url;
    
    // Wrap with htmlpreview.github.io for proper HTML rendering
    const previewUrl = `https://htmlpreview.github.io/?${rawUrl}`;
    
    return previewUrl;
  } catch (error) {
    console.error('Error uploading to Gist:', error);
    return null;
  }
}

// 1) EVENT: When Ticket Tool creates a new ticket channel, post the "Request Help" button
client.on(Events.ChannelCreate, async (channel) => {
  try {
    if (!isTicketChannel(channel)) return;

    console.log(`📋 New ticket channel created: ${channel.name}`);

    // Store ticket metadata and initialize cache
    ticketMetadata.set(channel.id, {
      createdAt: new Date(),
      opener: null,
      claimedBy: []
    });
    cachedMessages.set(channel.id, []);

    // Wait a brief moment for Ticket Tool to finish setting up the channel
    await new Promise(resolve => setTimeout(resolve, 500));

    // Try to identify who opened the ticket from permissions
    const permissions = channel.permissionOverwrites.cache;
    for (const [id, overwrite] of permissions) {
      if (overwrite.type === 1) {
        try {
          const member = await channel.guild.members.fetch(id);
          if (!member.user.bot) {
            const metadata = ticketMetadata.get(channel.id);
            if (metadata) {
              metadata.opener = member.user.tag;
              ticketMetadata.set(channel.id, metadata);
            }
            break;
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    const requestHelpButton = new ButtonBuilder()
      .setCustomId(`reqhelp:${channel.id}`)
      .setLabel('Request Help')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🙋');

    const row = new ActionRowBuilder().addComponents(requestHelpButton);

    const message = await channel.send({
      content:
        `**Welcome to your private ticket!**\n\n` +
        `This space is private between **you and JustinBot**.\n` +
        `You can work on your social engineering assignment here without anyone watching.\n\n` +
        `**Need a TA or Instructor?**\n` +
        `Click the **Request Help** button below and fill out the form.\n` +
        `A staff member will review your request and join if needed.\n\n` +
        `**When you've completed the assignment:**\n` +
        `Click close ticket from Ticket Tool in this channel\n` +
        `Your transcript will be automatically saved.\n\n`,
      components: [row]
    });

    await message.pin().catch(err => console.log('Could not pin message:', err.message));
    
    console.log(`✅ Posted Request Help button in ${channel.name}`);
  } catch (error) {
    console.error('Error in ChannelCreate event:', error);
  }
});

// 2) EVENT: Cache messages as they arrive
client.on(Events.MessageCreate, async (message) => {
  try {
    if (!isTicketChannel(message.channel)) return;
    
    const cached = cachedMessages.get(message.channel.id);
    if (cached) {
      cached.push(message);
    }
  } catch (error) {
    // Silent fail
  }
});

// 3) EVENT: Handle button clicks and modal submissions
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // Handle "Request Help" button click to show modal
    if (interaction.isButton() && interaction.customId.startsWith('reqhelp:')) {
      const channelId = interaction.customId.split(':')[1];

      const modal = new ModalBuilder()
        .setCustomId(`reqform:${channelId}`)
        .setTitle('Request Staff Assistance');

      const issueSummaryInput = new TextInputBuilder()
        .setCustomId('issue')
        .setLabel('Issue Summary (20-300 characters)')
        .setPlaceholder('e.g., "Stuck on approach for extracting target info"')
        .setStyle(TextInputStyle.Short)
        .setMinLength(20)
        .setMaxLength(300)
        .setRequired(true);

      const whatTriedInput = new TextInputBuilder()
        .setCustomId('tried')
        .setLabel('What have you tried? (30-500 characters)')
        .setPlaceholder('Describe your attempts, commands used, research done, etc.')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(30)
        .setMaxLength(500)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(issueSummaryInput);
      const row2 = new ActionRowBuilder().addComponents(whatTriedInput);

      modal.addComponents(row1, row2);

      return interaction.showModal(modal);
    }

    // Handle modal submission to post to staff queue
    if (interaction.isModalSubmit() && interaction.customId.startsWith('reqform:')) {
      const channelId = interaction.customId.split(':')[1];
      const issue = interaction.fields.getTextInputValue('issue')?.trim() ?? '';
      const tried = interaction.fields.getTextInputValue('tried')?.trim() ?? '';

      if (issue.length < 20 || tried.length < 30) {
        return interaction.reply({
          content: '❌ Please provide more detail:\n• Issue Summary needs at least 20 characters\n• "What you tried" needs at least 30 characters',
          ephemeral: true
        });
      }

      const ticketChannel = await client.channels.fetch(channelId);
      const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
      const categoryName = getCategoryName(ticketChannel);

      const embed = new EmbedBuilder()
        .setTitle(`🆘 New Help Request — ${categoryName}`)
        .setColor(categoryName === 'Online' ? 0x3498db : 0x9b59b6)
        .addFields(
          { name: '👤 Student', value: `${interaction.user}`, inline: true },
          { name: '🎫 Ticket', value: `[Jump to channel](https://discord.com/channels/${ticketChannel.guildId}/${ticketChannel.id})`, inline: true },
          { name: '📝 Issue Summary', value: issue.slice(0, 1024) },
          { name: '🔍 What They Tried', value: tried.slice(0, 1024) }
        )
        .setFooter({ text: `Ticket ID: ${ticketChannel.id}` })
        .setTimestamp();

      const claimButton = new ButtonBuilder()
        .setCustomId(`claim:${channelId}`)
        .setLabel('Claim & Join')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋');

      const closeButton = new ButtonBuilder()
        .setCustomId(`qclose:${channelId}`)
        .setLabel('Close Request')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🗑️');

      const buttonRow = new ActionRowBuilder().addComponents(claimButton, closeButton);

      const queueMessage = await queueChannel.send({
        content: `<@&${TA_ROLE_ID}> <@&${HEAD_TA_ROLE_ID}> <@&${INSTRUCTOR_ROLE_ID}>`,
        embeds: [embed],
        components: [buttonRow]
      });

      // Store the queue message ID for this ticket
      queueMessages.set(channelId, queueMessage.id);

      await interaction.reply({
        content: '✅ Your request has been sent to staff. A TA or Instructor will review it and join your ticket if needed.',
        ephemeral: true
      });

      console.log(`📨 Help request posted to queue from ${interaction.user.tag} in ${ticketChannel.name}`);
    }

    // Handle "Claim & Join" button to add staff to ticket
    if (interaction.isButton() && interaction.customId.startsWith('claim:')) {
      const member = interaction.member;

      const hasStaffRole = member.roles.cache.has(TA_ROLE_ID) || member.roles.cache.has(HEAD_TA_ROLE_ID) || member.roles.cache.has(INSTRUCTOR_ROLE_ID);
      if (!hasStaffRole) {
        return interaction.reply({
          content: 'Only TAs, Head TAs, or Instructors can claim help requests.',
          ephemeral: true
        });
      }

      const channelId = interaction.customId.split(':')[1];
      const ticketChannel = await client.channels.fetch(channelId);

      const metadata = ticketMetadata.get(channelId);
      if (metadata && !metadata.claimedBy.includes(member.user.tag)) {
        metadata.claimedBy.push(member.user.tag);
        ticketMetadata.set(channelId, metadata);
      }

      await ticketChannel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        EmbedLinks: true,
        AttachFiles: true,
        AddReactions: true
      });

      const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      originalEmbed.setColor(0x2ecc71);
      originalEmbed.setFooter({ text: `✅ Claimed by ${member.displayName} at ${new Date().toLocaleTimeString()}` });

      // After claiming: Claim button disabled, Close Request enabled for the claimer
      const row = new ActionRowBuilder();
      const claimBtn = new ButtonBuilder()
        .setCustomId('claimed_disabled')
        .setLabel('Claim & Join')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋')
        .setDisabled(true);
      
      const closeBtn = new ButtonBuilder()
        .setCustomId(`qclose_claimed:${channelId}`)
        .setLabel('Close Request')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️')
        .setDisabled(false); // Keep enabled so claimer can close if needed
      
      row.addComponents(claimBtn, closeBtn);

      await interaction.update({
        embeds: [originalEmbed],
        components: [row]
      });

      await ticketChannel.send({
        content: `👋 ${member} has joined to help!`
      });

      console.log(`✅ ${member.user.tag} claimed and joined ticket ${ticketChannel.name}`);
    }

    // Handle "Close Request" button to dismiss without joining (before claim)
    if (interaction.isButton() && interaction.customId.startsWith('qclose:')) {
      const member = interaction.member;

      const hasStaffRole = member.roles.cache.has(TA_ROLE_ID) || member.roles.cache.has(HEAD_TA_ROLE_ID) || member.roles.cache.has(INSTRUCTOR_ROLE_ID);
      if (!hasStaffRole) {
        return interaction.reply({
          content: '❌ Only TAs, Head TAs, or Instructors can close help requests.',
          ephemeral: true
        });
      }

      const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      originalEmbed.setColor(0x95a5a6);
      originalEmbed.setFooter({ text: `🗑️ Closed by ${member.displayName} without joining` });

      // Recreate buttons and disable them
      const row = new ActionRowBuilder();
      const claimBtn = new ButtonBuilder()
        .setCustomId('claim_disabled')
        .setLabel('Claim & Join')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋')
        .setDisabled(true);
      
      const closeBtn = new ButtonBuilder()
        .setCustomId('close_disabled')
        .setLabel('Close Request')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🗑️')
        .setDisabled(true);
      
      row.addComponents(claimBtn, closeBtn);

      await interaction.update({
        embeds: [originalEmbed],
        components: [row]
      });

      console.log(`🗑️ ${member.user.tag} closed help request without joining`);
    }

    // Handle "Close Request" after claim (allows claimer to dismiss the queue entry)
    if (interaction.isButton() && interaction.customId.startsWith('qclose_claimed:')) {
      const member = interaction.member;

      const hasStaffRole = member.roles.cache.has(TA_ROLE_ID) || member.roles.cache.has(HEAD_TA_ROLE_ID) || member.roles.cache.has(INSTRUCTOR_ROLE_ID);
      if (!hasStaffRole) {
        return interaction.reply({
          content: '❌ Only TAs, Head TAs, or Instructors can close help requests.',
          ephemeral: true
        });
      }

      const originalEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      originalEmbed.setColor(0x95a5a6);
      originalEmbed.setFooter({ text: `🗑️ Dismissed by ${member.displayName}` });

      // Disable both buttons
      const row = new ActionRowBuilder();
      const claimBtn = new ButtonBuilder()
        .setCustomId('claim_disabled')
        .setLabel('Claim & Join')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✋')
        .setDisabled(true);
      
      const closeBtn = new ButtonBuilder()
        .setCustomId('close_disabled')
        .setLabel('Close Request')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🗑️')
        .setDisabled(true);
      
      row.addComponents(claimBtn, closeBtn);

      await interaction.update({
        embeds: [originalEmbed],
        components: [row]
      });

      console.log(`🗑️ ${member.user.tag} dismissed claimed help request`);
    }

  } catch (error) {
    console.error('Error handling interaction:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: '❌ An error occurred while processing your request. Please try again or contact an administrator.',
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// 4) EVENT: When ticket is deleted, generate transcript from cached messages and close queue entry
client.on(Events.ChannelDelete, async (channel) => {
  try {
    if (!isTicketChannel(channel)) return;

    console.log(`🗑️ Ticket channel deleted: ${channel.name}, generating transcript from cache...`);

    const messages = cachedMessages.get(channel.id);
    const metadata = ticketMetadata.get(channel.id) || {};
    
    if (!messages || messages.length === 0) {
      console.log('⚠️ No cached messages found for transcript');
      return;
    }

    // Close/update the queue message if it exists
    const queueMessageId = queueMessages.get(channel.id);
    if (queueMessageId) {
      try {
        const queueChannel = await client.channels.fetch(QUEUE_CHANNEL_ID);
        const queueMessage = await queueChannel.messages.fetch(queueMessageId);
        
        if (queueMessage && queueMessage.embeds.length > 0) {
          const originalEmbed = EmbedBuilder.from(queueMessage.embeds[0]);
          originalEmbed.setColor(0x95a5a6);
          originalEmbed.setFooter({ text: `✅ Ticket closed - Transcript saved at ${new Date().toLocaleTimeString()}` });

          // Disable all buttons
          const row = new ActionRowBuilder();
          const claimBtn = new ButtonBuilder()
            .setCustomId('claim_disabled')
            .setLabel('Claim & Join')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✋')
            .setDisabled(true);
          
          const closeBtn = new ButtonBuilder()
            .setCustomId('close_disabled')
            .setLabel('Close Request')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🗑️')
            .setDisabled(true);
          
          row.addComponents(claimBtn, closeBtn);

          await queueMessage.edit({
            embeds: [originalEmbed],
            components: [row]
          });
          
          console.log(`✅ Updated queue message for closed ticket ${channel.name}`);
        }
        
        queueMessages.delete(channel.id);
      } catch (error) {
        console.error('Error updating queue message:', error.message);
      }
    }

    // Get student user ID from channel permissions
    let studentUserId = null;
    const permissions = channel.permissionOverwrites.cache;
    for (const [id, overwrite] of permissions) {
      if (overwrite.type === 1) {
        try {
          const member = await channel.guild.members.fetch(id);
          if (!member.user.bot) {
            studentUserId = member.id;
            break;
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    const htmlContent = generateHTMLTranscript(channel, messages, metadata);
    const filename = `transcript-${channel.name}-${Date.now()}.html`;
    
    console.log('🌐 Uploading transcript to GitHub Gist...');
    const gistUrl = await uploadToGist(htmlContent, filename);
    
    if (gistUrl) {
      console.log(`✅ Uploaded to Gist: ${gistUrl}`);
    }

    const attachment = new AttachmentBuilder(
      Buffer.from(htmlContent, 'utf-8'),
      { name: filename }
    );

    const transcriptChannel = await client.channels.fetch(TRANSCRIPT_CHANNEL_ID);
    const categoryName = getCategoryName(channel);

    const summaryEmbed = new EmbedBuilder()
      .setTitle(`📄 Ticket Transcript — ${channel.name}`)
      .setColor(0x2ecc71)
      .addFields(
        { name: 'Category', value: categoryName, inline: true },
        { name: 'Ticket ID', value: channel.id, inline: true },
        { name: 'Opened by', value: metadata.opener || 'Unknown', inline: true },
        { name: 'Student ID', value: studentUserId || 'Unknown', inline: true },
        { name: 'Staff involved', value: metadata.claimedBy.length > 0 ? metadata.claimedBy.join(', ') : 'None (student worked independently)', inline: false },
        { name: 'Messages', value: `${messages.length} messages`, inline: true }
      )
      .setTimestamp();

    // Build message with optional View button
    const messageOptions = {
      embeds: [summaryEmbed],
      files: [attachment]
    };

    // Add "View in Browser" button if Gist upload succeeded
    if (gistUrl) {
      const viewButton = new ButtonBuilder()
        .setLabel('View in Browser')
        .setStyle(ButtonStyle.Link)
        .setURL(gistUrl)
        .setEmoji('🌐');

      const row = new ActionRowBuilder().addComponents(viewButton);
      messageOptions.components = [row];
    }

    const transcriptMessage = await transcriptChannel.send(messageOptions);

    // DM the student with their transcript
    if (studentUserId) {
      try {
        const student = await client.users.fetch(studentUserId);
        const dmEmbed = new EmbedBuilder()
          .setTitle('📄 Your Ticket Transcript')
          .setDescription(`Your ticket **${channel.name}** has been closed. Here's your transcript:`)
          .setColor(0x2ecc71)
          .setTimestamp();

        const dmOptions = { embeds: [dmEmbed] };
        
        // Add view button if available
        if (gistUrl) {
          const viewButton = new ButtonBuilder()
            .setLabel('View in Browser')
            .setStyle(ButtonStyle.Link)
            .setURL(gistUrl)
            .setEmoji('🌐');
          const row = new ActionRowBuilder().addComponents(viewButton);
          dmOptions.components = [row];
        }

        // Attach the HTML file
        const dmAttachment = new AttachmentBuilder(
          Buffer.from(htmlContent, 'utf-8'),
          { name: filename }
        );
        dmOptions.files = [dmAttachment];

        await student.send(dmOptions);
        console.log(`✅ DM sent to student ${student.tag} with transcript`);
      } catch (error) {
        console.error(`❌ Could not DM student (ID: ${studentUserId}):`, error.message);
      }
    }

    // Clean up
    cachedMessages.delete(channel.id);
    ticketMetadata.delete(channel.id);

    console.log(`✅ HTML transcript saved for ${channel.name} (${messages.length} messages)${gistUrl ? ' with web view' : ''}`);
  } catch (error) {
    console.error('Error saving transcript:', error);
  }
});




// Bot ready event
client.once(Events.ClientReady, (c) => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Ticket Helper Bot is online!`);
  console.log(`   Logged in as: ${c.user.tag}`);
  console.log(`   Server ID: ${GUILD_ID}`);
  console.log(`   Monitoring categories:`);
  console.log(`   • Online Tickets: ${ONLINE_CATEGORY_ID}`);
  console.log(`   • In-Person Tickets: ${INPERSON_CATEGORY_ID}`);
  console.log(`   Queue channel: ${QUEUE_CHANNEL_ID}`);
  console.log(`   Transcript channel: ${TRANSCRIPT_CHANNEL_ID}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Bot is now monitoring for new ticket channels...');
});

client.on(Events.Error, error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(DISCORD_TOKEN);
