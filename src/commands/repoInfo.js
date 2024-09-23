const fetch = require('node-fetch');

module.exports = {
    name: 'repoinfo',
    description: 'Get detailed information about a specific repository.',
    async execute(message, args) {
        console.log(`Received args for repoinfo: ${args}`);

        const repoUrl = args[0];
        const urlParts = repoUrl.split('/');

        if (urlParts.length < 3) {
            return message.channel.send('Please provide a valid GitHub repository URL.');
        }

        const username = urlParts[urlParts.length - 2];
        const repoName = urlParts[urlParts.length - 1];

        console.log(`Fetching repo info for: ${username}/${repoName}`);

        const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
        const repoInfo = await response.json();

        if (repoInfo.message) {
            return message.channel.send('Repository not found.');
        }

        const embed = {
            title: repoInfo.name,
            url: repoInfo.html_url,
            fields: [
                { name: 'Owner', value: repoInfo.owner.login, inline: true },
                { name: 'Stars', value: repoInfo.stargazers_count.toString(), inline: true },
                { name: 'Forks', value: repoInfo.forks_count.toString(), inline: true },
                { name: 'Language', value: repoInfo.language || 'N/A', inline: true },
                { name: 'Description', value: repoInfo.description || 'No description', inline: false },
            ],
            color: 0x0099ff,
        };

        await message.channel.send({ embeds: [embed] });
    },
};