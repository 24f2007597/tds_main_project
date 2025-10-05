const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path : './secrets.env' });

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateCode(project_brief, repoName) {
    const prompt = `You are an expert web developer in building single page applications.
    Write a complete code snippet for the following project brief:\n\n${project_brief}\n\n
    Write the code in Node.js. Return only the complete, clean code for a single page web application.
    Please ensure the code is well-structured and includes comments for clarity.
    
    You MUST generate three files:
    1. 'server.js': A Node.js backend using Express.
    2. 'public/index.html': A minimal HTML shell for the frontend.
    3. 'public/app.js': The frontend Vue code.

    You MUST return the output as a single VALID JSON array of objects. Each object must have "fileName" and "code" keys. Use the 'public/' prefix for frontend files.

    Example format:
    [
        {
        "fileName": "server.js",
        "code": "const express = require('express');..."
        },
        {
        "fileName": "public/index.html",
        "code": "<!DOCTYPE html>..."
        },
        {
        "fileName": "public/app.js",
        "code": "import React from 'https://esm.sh/react';..."
        }
    ]
    `;

    const data = {
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ]
    };

    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        if (!GEMINI_API_KEY) {
            throw new Error('AI_TOKEN is not set in environment variables.');
        }
        const response = await axios.post(
            `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`,
            data,
            { headers }
        );
        // Gemini's response format
        const responseText = response.data.candidates[0].content.parts[0].text;
        const startIndex = responseText.indexOf('[');
        const endIndex = responseText.lastIndexOf(']');
        if (startIndex === -1 || endIndex === -1) {
            throw new Error('Invalid response format from Gemini API.');
        }
        const jsonString = responseText.substring(startIndex, endIndex + 1);

        const generatedFiles = JSON.parse(jsonString);

        const outputDir = path.join(__dirname, 'generated-apps', repoName);
        await fs.promises.mkdir(outputDir, { recursive: true });

        for (const file of generatedFiles) {
            const filePath = path.join(outputDir, file.fileName);
            await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
            await fs.promises.writeFile(filePath, file.code);
            console.log(`Generated ${filePath}`);
        }
    } 
    catch (error) {
        console.error('Error generating code:', error.message);
        throw error;
    }
}

module.exports = { generateCode };