const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(bodyParser.json());

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const commands = new Map();

const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(config.discordInterfacingPrefix) || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) {
        console.warn(`Command "${commandName}" not found.`);
        return;
    }

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        await message.reply('There was an error executing that command.');
    }
});

app.post('/webhook', (req, res) => {
    // Log the entire request body
    console.log('Received webhook:', JSON.stringify(req.body, null, 2)); // Pretty-print JSON

    const event = req.headers['x-github-event'];
    console.log(`GitHub event: ${event}`); // Log the event type

    // Check if the event is a push
    if (event === 'push') {
        const { repository, pusher } = req.body;

        // Log the repository and pusher for debugging
        console.log('Repository:', repository);
        console.log('Pusher:', pusher);

        // Check if both repository and pusher exist
        if (!repository || !pusher) {
            console.error('Missing repository or pusher in push event:', req.body);
            return res.status(400).send('Bad Request: Missing data');
        }

        const guildId = config.discordGuildID;
        const channelId = config.servers[guildId].rules.push;
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            channel.send(`New push by ${pusher.name} in ${repository.name}`)
                .then(() => console.log('Message sent to Discord channel.'))
                .catch(err => console.error('Error sending message to Discord:', err));
        } else {
            console.warn(`Channel ID "${channelId}" not found in guild "${guildId}".`);
        }
    } else {
        console.warn(`Unhandled event type: ${event}`);
    }
    res.status(200).send('Event received');
});

client.login(config.discordToken).then(() => {
    app.listen(config.webhookPort, () => {
        console.log(`Server running on port ${config.webhookPort}`);
    });
}).catch(err => {
    console.error('Failed to login to Discord:', err);
});