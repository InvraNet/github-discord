const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(bodyParser.json());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ]
});

const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    commands.set(command.name, command);
}

const rest = new REST({ version: '9' }).setToken(config.discordToken);

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const commandData = Array.from(commands.values()).map(command => ({
        name: command.name,
        description: command.description,
        options: command.options || [],
    }));

    try {
        await rest.put(Routes.applicationCommands(config.clientId), { body: commandData });
        console.log('Slash commands registered globally successfully.');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
        console.warn(`Command "${interaction.commandName}" not found.`);
        return;
    }

    console.log(`Executing command: ${interaction.commandName} with args: ${interaction.options.data.map(option => option.value).join(', ')}`);

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
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