export async function enablePages(octokit, owner, repoName) {
    try {
        const response = await octokit.rest.repos.createPagesSite({
            owner,
            repo: repoName,
            source: {
                branch: 'main',
                path: '/',
            },
        });
        console.log('GitHub Pages enabled successfully at', response.data.html_url);
        return response.data.html_url;
    } 
    catch (error) {
        console.error('Error enabling GitHub Pages:', error);
    }
}
