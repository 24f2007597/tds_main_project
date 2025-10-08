async function enablePages(octokit, owner, repoName) {
    try {
        const response = await octokit.rest.repos.createPagesSite({
            owner,
            repo: repoName,
            source: {
                branch: 'main',
                path: '/',
            },
        });
        console.log('GitHub Pages enabled at URL:', response.data.html_url);
        return response.data.html_url;
    } 
    catch (error) {
        console.error('Error enabling GitHub Pages:', error);
    }
}

module.exports = { enablePages };