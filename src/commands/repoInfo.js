const fetch = require('node-fetch');

module.exports = {
    name: 'repoinfo',
    description: 'Get detailed information about a specific repository.',
    options: [
        {
            name: 'repository',
            description: 'The repository in the format user/repo or link',
            type: 3,
            required: true,
        },
    ],
    async execute(interactionOrMessage) {
        const isInteraction = interactionOrMessage.isCommand();

        // Defer the reply to avoid timeout
        if (isInteraction) {
            await interactionOrMessage.deferReply();
        }

        const repoFullName = isInteraction
            ? interactionOrMessage.options.getString('repository')
            : interactionOrMessage.content.split(' ')[1];

        const repoParts = repoFullName.split('/');
        if (repoParts.length !== 2) {
            const errorMessage = 'Please provide a valid GitHub repository format (username/repo).';
            return isInteraction
                ? interactionOrMessage.editReply({ content: errorMessage })
                : await interactionOrMessage.channel.send(errorMessage);
        }

        const username = repoParts[0].toLowerCase();
        const repoName = repoParts[1];

        console.log(`Fetching repo info for: ${username}/${repoName}`);

        try {
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}`);
            const repoInfo = await response.json();

            if (repoInfo.message) {
                const errorMessage = 'Repository not found.';
                return isInteraction
                    ? interactionOrMessage.editReply({ content: errorMessage })
                    : await interactionOrMessage.channel.send(errorMessage);
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

            if (isInteraction) {
                await interactionOrMessage.editReply({ embeds: [embed] });
            } else {
                await interactionOrMessage.channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error fetching repository info:', error);
            const errorMessage = 'An error occurred while fetching repository information.';
            return isInteraction
                ? interactionOrMessage.editReply({ content: errorMessage })
                : await interactionOrMessage.channel.send(errorMessage);
        }
    },
};