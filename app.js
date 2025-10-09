const express = import('express');
const { createRepo } = import('./createRepo.js');
const { addLicense } = import('./add-license.js');
const { execSync } = import('child_process');
const { enablePages } = import('./enable-pages.js');
const { generateCode } = import('./code-generator.js');
const path = import('path');
import dotenv from 'dotenv';
dotenv.config({ path : './secrets.env' });
const app = express();
const { decodeAttachments } = import('./decodeAttachments.js');
const { modifyCode } = import('./code-modifier.js');
const axios = import('axios');
const e = import('express');

const token = process.env.PAT_TOKEN;
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/create-app', async (req, res) => {
    const { email, secret, task, brief, checks, attachments, evaluation_url, round, nonce } = req.body;
    repoName = task.toLowerCase().trim();

    if (secret == process.env.STUDENT_SECRET) {
        res.status(200).json({ message: 'Secret is valid' });
        
        ( async () => { 
            try {
                const parentDir = path.dirname(__dirname);
                const cloneDir = path.join(parentDir, 'generated-apps', repoName);

                if (round == 1) {
                    await generateCode(brief, repoName, checks);
                    await decodeAttachments(attachments, repoName);
                    const repo = await createRepo(token, repoName);
                    const execOptions = { cwd: cloneDir}

                    execSync('git init', execOptions);
                    execSync('git remote add origin "' + repo.clone_url + '"', execOptions);

                    addLicense();

                    execSync('git add .', execOptions);
                    execSync('git commit -m "Commit with generated code"', execOptions);
                    execSync('git branch -M main', execOptions);

                    execSync('git push -u origin main', execOptions);
                    console.log('Code pushed to GitHub repository.');

                    pages_url = await enablePages(new (import("@octokit/rest").Octokit)({ auth: token }), repo.owner, repo.name);                
                }

                if (round == 2) {
                    await modifyCode(brief, cloneDir, checks);
                    const execOptions = { cwd: cloneDir}

                    execSync('git add .', execOptions);
                    execSync('git commit -m "Commit with modified code"', execOptions);
                    execSync('git push -u origin main', execOptions);
                    console.log('Modified code pushed to GitHub repository.');
                }

                if (evaluation_url) {
                    const evalPayload = {
                            email: email,
                            task: task,
                            round: round,
                            nonce: nonce,
                            repo_url: repo.html_url,
                            commit_sha: execSync('git rev-parse HEAD').toString().trim(),
                            pages_url: pages_url
                    };
                    await postWithRetry(evaluation_url, evalPayload);
                }
                    
            } catch (error) {
                console.error(error);
            }
        })();
        return;
    }
    res.status(401).json({ message: 'Invalid secret' });
});

app.listen(PORT, () => {
    console.log('Server started on port 3000');
});