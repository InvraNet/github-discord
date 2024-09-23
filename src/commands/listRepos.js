const fetch = require('node-fetch');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'listrepos',
    description: 'Lists all repositories for a given user.',
    options: [
        {
            name: 'username',
            description: 'GitHub username or URL',
            type: 3, // 3 represents STRING
            required: true,
        },
        {
            name: 'page',
            description: 'Page number of results',
            type: 4, // 4 represents INTEGER
            required: false,
        },
    ],
    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isCommand ? interactionOrMessage.isCommand() : false;

        if (isInteraction) {
            await interactionOrMessage.deferReply();
        }

        let username = isInteraction ? interactionOrMessage.options.getString('username') : interactionOrMessage.content.split(' ')[1];
        const githubUrlPattern = /https?:\/\/(www\.)?github\.com\/([^\/]+)/;
        const match = githubUrlPattern.exec(username);

        if (match) {
            username = match[2];
        } else if (!username) {
            const errorMessage = 'Please provide a GitHub username or URL.';
            return isInteraction ? interactionOrMessage.editReply(errorMessage) : await interactionOrMessage.channel.send(errorMessage);
        }

        const page = isInteraction ? interactionOrMessage.options.getInteger('page') || 1 : (parseInt(interactionOrMessage.content.split(' ')[2]) || 1);
        const perPage = 10;

        try {
            const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`);
            const repos = await response.json();

            if (repos.length === 0) {
                const errorMessage = 'No repositories found.';
                return isInteraction ? interactionOrMessage.editReply(errorMessage) : await interactionOrMessage.channel.send(errorMessage);
            }

            const embed = new EmbedBuilder()
                .setTitle(`${username}'s Repositories`)
                .setColor('#0099ff');

            repos.forEach(repo => {
                embed.addFields({
                    name: `${repo.name} - ${repo.owner.login} - ${repo.language || 'N/A'}`,
                    value: `[View Repo](${repo.html_url})`,
                    inline: false,
                });
            });

            if (isInteraction) {
                await interactionOrMessage.editReply({ embeds: [embed] });
            } else {
                await interactionOrMessage.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching repositories:', error);
            const errorMessage = 'An error occurred while fetching repositories.';
            return isInteraction ? interactionOrMessage.editReply(errorMessage) : await interactionOrMessage.channel.send(errorMessage);
        }
    },
};