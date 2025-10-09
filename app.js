import express from 'express';
import { fileURLToPath } from "url";
import { createRepo } from './createRepo.js';
import { addLicense } from './add-license.js';
import { execSync } from 'child_process';
import { generateCode } from './code-generator.js';
import { enablePages } from './enable-pages.js';
import * as path from "path";
import dotenv from 'dotenv';
dotenv.config({ path : './secrets.env' });
const app = express();
import { modifyCode } from './code-modifier.js';
import { decodeAttachments } from './decodeAttachments.js';
import { postWithRetry } from './postWithRetry.js';

const token = process.env.PAT_TOKEN;
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/create-app', async (req, res) => {
    const { email, secret, task, brief, checks, attachments, evaluation_url, round, nonce } = req.body;
    const repoName = task.toLowerCase().trim();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    if (secret !== process.env.STUDENT_SECRET) {
        return res.status(401).json({ message: 'Invalid secret' });
    }

    // Secret is valid, send 200 immediately
    res.status(200).json({ message: 'Secret is valid' });

    try {
        const parentDir = path.dirname(__dirname);
        const cloneDir = path.join(parentDir, 'generated-apps', repoName);

        if (round == 1) {
            await generateCode(brief, repoName, checks);
            await decodeAttachments(attachments, repoName);
            const repo = await createRepo(token, repoName);

            const execOptions = { cwd: cloneDir };
            execSync('git init', execOptions);
            execSync('git remote add origin "' + repo.clone_url + '"', execOptions);
            addLicense(repoName);

            execSync('git add .', execOptions);
            execSync('git commit -m "Commit with generated code"', execOptions);
            execSync('git branch -M main', execOptions);
            execSync('git push -u origin main', execOptions);
            console.log('Code pushed to GitHub repository.');

            const octokit = new (import("@octokit/rest").Octokit)({ auth: token });
            pages_url = await enablePages(octokit, repo.owner, repo.name);
        }

        if (round == 2) {
            await modifyCode(brief, cloneDir, checks);
            const execOptions = { cwd: cloneDir };

            execSync('git add .', execOptions);
            execSync('git commit -m "Commit with modified code"', execOptions);
            execSync('git push -u origin main', execOptions);
            console.log('Modified code pushed to GitHub repository.');
        }

        if (evaluation_url) {
            const evalPayload = {
                email,
                task,
                round,
                nonce,
                repo_url: repo.html_url,
                commit_sha: execSync('git rev-parse HEAD').toString().trim(),
                pages_url
            };
            await postWithRetry(evaluation_url, evalPayload);
        }

    } catch (error) {
        console.error(error);
    }
});

export default app;