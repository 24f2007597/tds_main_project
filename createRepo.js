const {Octokit} = require("@octokit/rest");

async function createRepo(token, repoName) {
    const octokit = new Octokit({
        auth: token
    });

    try {
        const response = await octokit.repos.createForAuthenticatedUser({
            name: repoName,
            private: false
        });
        console.log(`Repository ${repoName} created successfully.`);
        return response.data;
    } 
    catch (error) {
        console.error(`Error creating repository: ${error}`);
        throw error;
    }
}

module.exports = { createRepo };