# GitHub-Discord Bot

A Discord bot that interacts with the GitHub API, notifying users about specific actions related to GitHub. It interfaces with the GitHub API at `api.github.com` and supports webhooks. Built using Discord.js.

## Configuration
To configure this Discord bot, create a `config.json` file in the `src/` folder. This file specifies the rules for your channels, certain GitHub actions, and server port.

### JSON Structure

```json
{
  "discordToken": "DISCORD_TOKEN",
  "webhookPort": PORT,
  "discordInterfacingPrefix": ">",
  "discordGuildID": "GUILD_ID",
  "clientId": "APPLICATION_ID",
  "servers": {
    "GUILD_ID": {
      "rules": {
        "ACTION_TYPE": "CHANNEL_ID"
      }
    }
  }
}
```

### Configuration Fields

- **`discordToken`**: (string) Your Discord bot token, enclosed in double quotes.
- **`webhookPort`**: (integer) A free port on your device. Do not enclose in quotes.
- **`discordInterfacingPrefix`**: (string) The prefix for commands in the bot interface. For example, use `>` for a command like `>listrepos InvraNet/github-discord`.
- **`discordGuildID`**: (string) Your Discord server (guild) ID. Enable Developer Mode in Discord, right-click your server, and select "Copy ID".
- **`clientId`**: (string) The Application ID for your bot, enclosed in double quotes.
- **`servers`**: (object) Contains settings for each server:
    - **`GUILD_ID`**: (string) The unique ID for your Discord server.
        - **`rules`**: (object) Maps GitHub actions to Discord channel IDs.
            - **`ACTION_TYPE`**: (string) The GitHub action you want to track (see the [list of actions](https://docs.github.com/en/webhooks/webhook-events-and-payloads)).

### Example Configuration

```json
{
  "discordToken": "YOUR_DISCORD_TOKEN",
  "webhookPort": 3000,
  "discordInterfacingPrefix": "?",
  "discordGuildID": "1234567890123456789",
  "clientId": "9876543210123456789",
  "servers": {
    "1234567890123456789": {
      "rules": {
        "push": "1234876509123456789",
        "pull_request": "1234876509123455432"
      }
    }
  }
}
```
Hope this bot finds you well, happy pushing!