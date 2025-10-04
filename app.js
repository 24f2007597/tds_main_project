const express = require('express');
const { createRepo } = require('./createRepo');
const { addLicense } = require('./add-license');
const { execSync } = require('child_process');
const { enablePages } = require('./enable-pages');
const path = require('path');
require('dotenv').config({ path : './secrets.env' });
const app = express();

const token = process.env.PAT_TOKEN;

app.use(express.json());

app.post('/create-repo', async (req, res) => {
    const { repoName } = req.body;
    try {
        const repo = await createRepo(token, repoName);
        const parentDir = path.resolve(process.cwd(), '..');
        const cloneDir = path.join(parentDir, repoName);

        execSync(`git clone ${repo.clone_url} ${cloneDir}`);

        process.chdir(cloneDir);

        addLicense();

        enablePages(new (require("@octokit/rest").Octokit)({ auth: token }), repo.owner, repo.name);

        res.status(201).json({ message: 'Repository created with MIT License successfully', repo: repo.html_url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create repository : ' + error.message });
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});