import express from 'express';
import { fileURLToPath } from "url";
import { createRepo } from './createRepo.js';
import { addLicense } from './add-license.js';
import { execSync } from 'child_process';
import { generateCode } from './code-generator.js';
import { enablePages } from './enable-pages.js';
import * as path from "path";
import * as fs from "fs";
import dotenv from 'dotenv';
const app = express();
import { modifyCode } from './code-modifier.js';
import { decodeAttachments } from './decodeAttachments.js';
import { postWithRetry } from './postWithRetry.js';

const token = process.env.PAT_TOKEN;
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './secrets.env' });
}

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
    const cloneDir = path.join(__dirname, 'generated-apps', repoName);

    // Ensure the 'generated-apps' directory exists
    if (!fs.existsSync(path.join(__dirname, 'generated-apps'))) {
        fs.mkdirSync(path.join(__dirname, 'generated-apps'));
    }

    if (round === 1) {
        // 1️⃣ Create GitHub repo
        const repo = await createRepo(token, repoName);

        // 2️⃣ Clone empty repo locally
        execSync(`git clone "${repo.clone_url}" "${cloneDir}"`);

        // 3️⃣ Set Git identity locally
        const execOptions = { cwd: cloneDir };
        const repoUrlWithToken = `https://${process.env.GITHUB_USER}:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_USER}/${repoName}.git`;
        execSync(`git remote set-url origin "${repoUrlWithToken}"`, execOptions);

        // 4️⃣ Generate code inside the cloned repo
        await generateCode(brief, repoName, checks);       // pass cloneDir if your function supports it
        await decodeAttachments(attachments, repoName);     // write attachments into cloneDir
        addLicense(repoName);                                // create LICENSE in repo

        execSync('git config user.email "24f2007597@ds.study.iitm.ac.in"', execOptions);
        execSync('git config user.name "Code Generator"', execOptions);


        // 5️⃣ Commit & push
        execSync('git add .', execOptions);
        execSync('git commit -m "Commit with generated code"', execOptions);
        execSync('git branch -M main', execOptions);
        execSync('git push -u origin main', execOptions);

        console.log('Code pushed to GitHub repository.');

        // 6️⃣ Enable GitHub Pages
        const octokit = new (await import("@octokit/rest")).Octokit({ auth: token });
        const pages_url = await enablePages(octokit, repo.owner, repo.name);
        }

        if (round == 2) {
            // If the repo doesn't exist locally, clone it.
            if (!fs.existsSync(cloneDir)) {
                const repoUrl = `https://${process.env.GITHUB_USER}:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_USER}/${repoName}.git`;
                execSync(`git clone "${repoUrl}" "${cloneDir}"`);
            }
            await modifyCode(brief, cloneDir, checks);
            const execOptions = { cwd: cloneDir };
            const repoUrlWithToken = `https://${process.env.GITHUB_USER}:${process.env.PAT_TOKEN}@github.com/${process.env.GITHUB_USER}/${repoName}.git`;
            execSync(`git remote set-url origin "${repoUrlWithToken}"`, execOptions);
            execSync('git config user.email "24f2007597@ds.study.iitm.ac.in"', execOptions);
            execSync('git config user.name "Code Generator"', execOptions);
            execSync('git add .', execOptions);
            execSync('git commit -m "Commit with modified code"', execOptions);
            execSync('git push -u origin main', execOptions);
            console.log('Modified code pushed to GitHub repository.');
        }

        if (evaluation_url !== '') {
            if (round == 2) {
                console.log('Sleeping for 2 minutes before round 2 evaluation...');
                time.sleep(120);
            }
            const evalPayload = {
                email,
                task,
                round,
                nonce,
                repo_url: repo.html_url,
                commit_sha: execSync('git rev-parse HEAD').toString().trim(),
                pages_url
            };
            console.log(evalPayload);
            await postWithRetry(evaluation_url, evalPayload);
        }

    } catch (error) {
        console.error(error);
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});