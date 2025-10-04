const express = require('express');
const { createRepo } = require('./createRepo');
const path = require('path');
require('dotenv').config({ path : './secrets.env' });
const app = express();

const token = process.env.PAT_TOKEN;

app.use(express.json());

app.post('/create-repo', async (req, res) => {
    const { repoName } = req.body;
    try {
        const repo = await createRepo(token, repoName);
        res.status(201).json(repo);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create repository : ' + error.message });
    }
});

app.listen(3000, () => {
    console.log('Server started on port 3000');
});