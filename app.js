const express = require('express');
const { createRepo } = require('./createRepo');
const { addLicense } = require('./add-license');
const { execSync } = require('child_process');
const { enablePages } = require('./enable-pages');
const { generateCode } = require('./code-generator');
const path = require('path');
require('dotenv').config({ path : './secrets.env' });
const app = express();

const token = process.env.PAT_TOKEN;

app.use(express.json());

app.post('/create-repo', async (req, res) => {
    const { repoName, project_brief } = req.body;
    try {
        await generateCode(project_brief, repoName);
        //const repo = await createRepo(token, repoName);
        //const parentDir = path.resolve(process.cwd(), '..');
        //const cloneDir = path.join(parentDir, repoName);

        //execSync(`git clone "${repo.clone_url}" "${cloneDir}"`);

        //process.chdir(cloneDir);

        //execSync('git init');
        //execSync('git remote add origin "' + repo.clone_url + '"');

        //addLicense();

        //enablePages(new (require("@octokit/rest").Octokit)({ auth: token }), repo.owner, repo.name);

        //execSync('git add .');
        //execSync('git commit -m "Commit with generated code"');
        //execSync('git push origin main');

        res.status(201).json({ message: 'Repository created with MIT License successfully', repo: repo.html_url });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create repository : ' + error.message });
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});