const fetch = require('node-fetch');
const { MessageEmbed } = require('discord.js');

module.exports = {
    name: 'listrepos',
    description: 'Lists all repositories for a given user.',
    async execute(message, args) {
        let username = args[0];
        const githubUrlPattern = /https?:\/\/(www\.)?github\.com\/([^\/]+)/;
        const match = githubUrlPattern.exec(username);
        if (match) {
            username = match[2];
        } else if (!username) {
            return message.channel.send('Please provide a GitHub username or URL.');
        }

        const page = args[1] ? parseInt(args[1]) : 1;
        const perPage = 10;

        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=${perPage}&page=${page}`);
        const repos = await response.json();

        if (repos.length === 0) {
            return message.channel.send('No repositories found.');
        }

        const embed = new MessageEmbed()
            .setTitle(`${username}'s Repositories`)
            .setColor('#0099ff');

        repos.forEach(repo => {
            embed.addField(
                `${repo.name} - ${repo.owner.login} - ${repo.language || 'N/A'}`,
                `[View Repo](${repo.html_url})`,
                false
            );
        });

        await message.channel.send({ embeds: [embed] });
    },
};