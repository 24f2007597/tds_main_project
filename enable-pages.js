import { checkUrl } from './check-url.js';

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

        const isLive = await checkUrl(response.data.url);
        if (isLive) {
            console.log('GitHub Pages enabled successfully.');
            return response.data.url;
        }
        else {
            console.log('Failed to enable GitHub Pages.');
        }
    } 
    catch (error) {
        console.error('Error enabling GitHub Pages:', error);
    }
}
