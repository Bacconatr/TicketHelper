"""
Ticket Verification Bot
Handles Google Form verification webhooks and automatically grants Discord roles
Uses pre-filled form URLs with Discord ID - no manual code entry needed
"""

import discord
from discord.ext import commands
from discord import app_commands
from aiohttp import web
import os
import logging

# logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('verification-bot')

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = commands.Bot(command_prefix='!', intents=intents)

FORM_BASE_URL = os.getenv('FORM_URL')
FORM_ENTRY_ID = os.getenv('FORM_ENTRY_ID')  # "entry.XXXXXXX"
VERIFIED_ROLE_NAME = os.getenv('VERIFIED_ROLE_NAME', 'Verified')
GUILD_ID = int(os.getenv('GUILD_ID'))

# Webhook handler
async def verify_webhook(request):
    """Handle incoming verification webhooks from Google Forms"""
    try:
        data = await request.json()
        discord_id_str = data.get('discord_id', '').strip()
        
        if not discord_id_str:
            logger.warning("No discord_id in request")
            return web.json_response({'status': 'error', 'message': 'No discord_id provided'}, status=400)
        
        try:
            discord_id = int(discord_id_str)
        except ValueError:
            logger.warning(f"Invalid discord_id format: {discord_id_str}")
            return web.json_response({'status': 'error', 'message': 'Invalid discord_id'}, status=400)
        
        logger.info(f"Received verification for Discord ID: {discord_id}")
        
        guild = bot.get_guild(GUILD_ID)
        if not guild:
            logger.error(f"Guild {GUILD_ID} not found")
            return web.json_response({'status': 'error', 'message': 'Guild not found'}, status=500)
        
        member = guild.get_member(discord_id)
        if not member:
            logger.warning(f"Member {discord_id} not found in guild")
            return web.json_response({'status': 'error', 'message': 'Member not found'}, status=404)
        
        role = discord.utils.get(guild.roles, name=VERIFIED_ROLE_NAME)
        if not role:
            logger.error(f"Role '{VERIFIED_ROLE_NAME}' not found")
            return web.json_response({'status': 'error', 'message': 'Role not found'}, status=500)
        
        # Check if already verified
        if role in member.roles:
            logger.info(f"Member {member.name} already verified")
            return web.json_response({'status': 'success', 'message': 'Already verified', 'user': str(member)})
        
        # Grant the role
        await member.add_roles(role)
        logger.info(f"Verified {member.name} (ID: {discord_id})")
        
        # Send confirmation DM
        try:
            embed = discord.Embed(
                title="Verification Complete!",
                description=f"You now have access to ticket channels in **{guild.name}**!\n\nYou can now create tickets using the Ticket Tool.",
                color=discord.Color.green()
            )
            await member.send(embed=embed)
        except discord.Forbidden:
            logger.warning(f"Could not DM {member.name} - DMs disabled")
        except Exception as e:
            logger.error(f"Error sending DM: {e}")
        
        return web.json_response({'status': 'success', 'user': str(member)})
    
    except Exception as e:
        logger.error(f"Error in webhook handler: {e}", exc_info=True)
        return web.json_response({'status': 'error', 'message': str(e)}, status=500)

# Health check endpoint
async def health_check(request):
    """Health check endpoint for monitoring"""
    return web.json_response({
        'status': 'healthy',
        'bot_ready': bot.is_ready(),
        'guild_id': GUILD_ID,
        'verified_role': VERIFIED_ROLE_NAME
    })

async def start_webhook_server():
    """Start the aiohttp webhook server"""
    app = web.Application()
    app.router.add_post('/verify', verify_webhook)
    app.router.add_get('/health', health_check)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 5000)
    await site.start()
    logger.info("Webhook server started on port 5000")

@bot.event
async def on_ready():
    logger.info('═══════════════════════════════════════════')
    logger.info(f'   Verification Bot is online!')
    logger.info(f'   Logged in as: {bot.user}')
    logger.info(f'   Server ID: {GUILD_ID}')
    logger.info(f'   Verified Role: {VERIFIED_ROLE_NAME}')
    logger.info(f'   Form Entry ID: {FORM_ENTRY_ID}')
    logger.info('═══════════════════════════════════════════')
    
    # Start webhook server
    bot.loop.create_task(start_webhook_server())
    
    # Sync slash commands
    try:
        synced = await bot.tree.sync()
        logger.info(f'Synced {len(synced)} command(s)')
    except Exception as e:
        logger.error(f'Error syncing commands: {e}')

@bot.tree.command(name="verify", description="Complete the verification form to access ticket channels")
async def verify(interaction: discord.Interaction):
    """User command to start verification"""
    
    # Check if already verified
    role = discord.utils.get(interaction.guild.roles, name=VERIFIED_ROLE_NAME)
    if role and role in interaction.user.roles:
        await interaction.response.send_message(
            "✅ You're already verified and have access to ticket channels!",
            ephemeral=True
        )
        return
    
    # Generate pre-filled form URL with Discord ID
    discord_id = interaction.user.id
    
    if not FORM_BASE_URL or not FORM_ENTRY_ID:
        await interaction.response.send_message(
            "Verification form is not properly configured",
            ephemeral=True
        )
        logger.error("FORM_URL or FORM_ENTRY_ID not set in environment variables")
        return
    
    # Build pre-filled URL
    form_url = f"{FORM_BASE_URL}?{FORM_ENTRY_ID}={discord_id}"
    
    embed = discord.Embed(
        title="Verification Form",
        description="Complete the Social Engineering Pre-Assignment Assessment to get verified and access ticket channels.",
        color=discord.Color.blue()
    )
    embed.add_field(
        name="Step 1: Complete the Form",
        value=f"[Click here to open the assessment form]({form_url})\n\n"
              "The form includes questions about your comfort level and knowledge of social engineering practices.",
        inline=False
    )
    embed.add_field(
        name="⏱Step 2: Wait for Verification",
        value="After submitting the form, you'll be automatically verified **within seconds** and receive access to ticket channels!",
        inline=False
    )
    embed.set_footer(text="Your responses help us understand your background with social engineering")
    
    await interaction.response.send_message(embed=embed, ephemeral=True)
    logger.info(f"Sent form to {interaction.user.name} (ID: {discord_id})")

# Admin command to manually verify users
@bot.tree.command(name="manual_verify", description="Manually verify a user (Admin only)")
@app_commands.describe(user="The user to verify")
async def manual_verify(interaction: discord.Interaction, user: discord.Member):
    """Admin command to manually grant verification"""
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        return
    
    role = discord.utils.get(interaction.guild.roles, name=VERIFIED_ROLE_NAME)
    
    if not role:
        await interaction.response.send_message(f"Role '{VERIFIED_ROLE_NAME}' not found!", ephemeral=True)
        return
    
    if role in user.roles:
        await interaction.response.send_message(f"ℹ{user.mention} is already verified.", ephemeral=True)
        return
    
    await user.add_roles(role)
    await interaction.response.send_message(f"Manually verified {user.mention}", ephemeral=True)
    
    try:
        await user.send(f"You've been manually verified in **{interaction.guild.name}**!")
    except:
        pass
    logger.info(f"{interaction.user.name} manually verified {user.name}")

# Admin command to check who's verified
@bot.tree.command(name="verified_users", description="List verified users (Admin only)")
async def verified_users(interaction: discord.Interaction):
    """Show all verified users"""
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        return
    
    role = discord.utils.get(interaction.guild.roles, name=VERIFIED_ROLE_NAME)
    if not role:
        await interaction.response.send_message(f"Role '{VERIFIED_ROLE_NAME}' not found!", ephemeral=True)
        return
    
    verified_members = [member for member in interaction.guild.members if role in member.roles]
    
    if not verified_members:
        await interaction.response.send_message("No verified users yet!", ephemeral=True)
        return
    
    embed = discord.Embed(
        title="Verified Users",
        description=f"**{len(verified_members)}** user(s) have completed verification",
        color=discord.Color.green()
    )
    
    # Show first 25 (Discord embed field limit)
    for member in verified_members[:25]:
        embed.add_field(name=member.name, value=member.mention, inline=True)
    
    if len(verified_members) > 25:
        embed.set_footer(text=f"Showing 25 of {len(verified_members)} verified users")
    
    await interaction.response.send_message(embed=embed, ephemeral=True)

# Admin command to remove verification
@bot.tree.command(name="unverify", description="Remove verification from a user (Admin only)")
@app_commands.describe(user="The user to unverify")
async def unverify(interaction: discord.Interaction, user: discord.Member):
    """Admin command to remove verification"""
    if not interaction.user.guild_permissions.manage_roles:
        await interaction.response.send_message("You don't have permission to use this command.", ephemeral=True)
        return
    
    role = discord.utils.get(interaction.guild.roles, name=VERIFIED_ROLE_NAME)
    
    if not role:
        await interaction.response.send_message(f"Role '{VERIFIED_ROLE_NAME}' not found!", ephemeral=True)
        return
    
    if role not in user.roles:
        await interaction.response.send_message(f"{user.mention} is not verified.", ephemeral=True)
        return
    
    await user.remove_roles(role)
    await interaction.response.send_message(f"Removed verification from {user.mention}", ephemeral=True)
    
    logger.info(f"{interaction.user.name} removed verification from {user.name}")

if __name__ == "__main__":
    TOKEN = os.getenv('VERIFICATION_BOT_TOKEN')
    if not TOKEN:
        logger.error("VERIFICATION_BOT_TOKEN not found in environment variables!")
        exit(1)
    
    bot.run(TOKEN)
