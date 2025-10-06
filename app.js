const express = require('express');
const { createRepo } = require('./createRepo');
const { addLicense } = require('./add-license');
const { execSync } = require('child_process');
const { enablePages } = require('./enable-pages');
const { generateCode } = require('./code-generator');
const path = require('path');
require('dotenv').config({ path : './secrets.env' });
const app = express();
const { decodeAttachments } = require('./decodeAttachments');

const token = process.env.PAT_TOKEN;

app.use(express.json());

app.post('/create-app', async (req, res) => {
    const { secret, task, brief, checks, attachments } = req.body;
    repoName = task.toLowerCase().trim();

    if (secret == process.env.STUDENT_SECRET) {
        res.status(200).json({ message: 'Secret is valid' });
        
        ( async () => { 
            try {
                const parentDir = path.dirname(__dirname);
                const cloneDir = path.join(parentDir, 'generated-apps', repoName);

                await generateCode(brief, repoName, checks);
                await decodeAttachments(attachments, repoName);
                const repo = await createRepo(token, repoName);
                const execOptions = { cwd: cloneDir}

                execSync('git init', execOptions);
                execSync('git remote add origin "' + repo.clone_url + '"', execOptions);

                await addLicense();

                execSync('git add .', execOptions);
                execSync('git commit -m "Commit with generated code"', execOptions);
                execSync('git branch -M main', execOptions);

                execSync('git push -u origin main', execOptions);
                console.log('Code pushed to GitHub repository.');

                await enablePages(new (require("@octokit/rest").Octokit)({ auth: token }), repo.owner, repo.name);

            } catch (error) {
                console.error(error);
            }
        })();
        return;
    }
    res.status(401).json({ message: 'Invalid secret' });
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});