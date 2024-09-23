const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(bodyParser.json());

const client = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
    ]
});
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
    console.log(`Message: ${message.content}`);
    if (!message.content.startsWith(config.discordInterfacingPrefix)) return;

    console.log(`Message received: ${message.content}`);

    const args = message.content.slice(config.discordInterfacingPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (!command) {
        console.warn(`Command "${commandName}" not found.`);
        return;
    }

    console.log(`Executing command: ${commandName} with args: ${args.join(', ')}`);

    try {
        await command.execute(message, args);
    } catch (error) {
        console.error('Error executing command:', error);
        await message.reply('There was an error executing that command.');
    }
});

app.post('/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    console.log(`GitHub event: ${event}`);

    if (event === 'push') {
        const { repository, pusher, head_commit } = req.body;

        if (!repository || !pusher || !head_commit) {
            console.error('Missing required fields in push event:', req.body);
            return res.status(400).send('Bad Request: Missing data');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('New Activity')
            .addFields(
                { name: 'Action:', value: 'Push', inline: true },
                { name: 'Action Tag:', value: `[${repository.default_branch} - ${head_commit.id.substring(0, 7)}](${head_commit.url})`, inline: true },
                { name: 'Pushed By:', value: `[${pusher.name}](https://github.com/${pusher.name})`, inline: true },
                { name: 'Action Date:', value: `<t:${Math.floor(Date.parse(head_commit.timestamp) / 1000)}:F>`, inline: true },
                { name: 'Commit Message:', value: head_commit.message, inline: false }
            )
            .setURL(repository.html_url)
            .setFooter({ text: `Repository: ${repository.full_name}`, iconURL: repository.owner.avatar_url })
            .setTimestamp();

        const guildId = config.discordGuildID;
        const channelId = config.servers[guildId].rules.push;
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            channel.send({ embeds: [embed] })
                .then(() => console.log('Embed sent to Discord channel.'))
                .catch(err => console.error('Error sending embed to Discord:', err));
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