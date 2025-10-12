import axios from 'axios';
import fs from 'fs';
import * as path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import * as json5 from "json5";

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './secrets.env' });
}

const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function generateCode(project_brief, repoName, check_procedures) {
    const prompt = `You are an expert full-stack web developer specializing in creating runnable, single-page applications.

Your task is to generate a complete project based on the brief and importments below.

## CONTEXT
Project Brief:
${project_brief}

Evaluation Checks:
The final application must be able to pass these checks:
${check_procedures}

## TECHNICAL importMENTS
Architecture: The entire application MUST be static and run 100% in the client's browser.

No Backend: There must be absolutely NO backend code. Do not use Node.js, Express, or any server-side logic.

Dependencies: All external libraries like Vue.js, Bootstrap, or marked.js MUST be loaded from a CDN via SCRIPT or LINK tags in the HTML.

Code Quality: The code must be clean, well-structured, and include comments for clarity.

## FILES TO GENERATE
You MUST generate the complete code for the following three files:

index.html: The main HTML file.

script.js: The client-side JavaScript logic.

style.css: The CSS styles.

README.md: A simple README file explaining what the app does based on the project brief.

## OUTPUT FORMAT
You MUST return the output as a single, VALID JSON array of objects. Each object must have a fileName key and a code key.

Example format:

[
{
"fileName": "index.html",
"code": "<!DOCTYPE html>..."
},
{
"fileName": "script.js",
"code": "document.addEventListener('DOMContentLoaded', () => {...});"
},
{
"fileName": "style.css",
"code": "body { font-family: sans-serif; }"
}
]

CRITICAL: Your entire response must ONLY be the JSON text. Do NOT include any conversational text, greetings, explanations, or markdown formatting. Your response must start with [ and end with ].`;

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
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables.');
        }
        const response = await axios.post(
            `${GEMINI_API_ENDPOINT}?key=${GEMINI_API_KEY}`,
            data,
            { headers }
        );
        // Gemini's response format
        const responseText = response.data.candidates[0].content.parts[0].text;
        if (!responseText || typeof responseText !== 'string') {
            throw new Error("AI response is empty or not a string.");
        }

        const cleanString = responseText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

        // Step 2: Extract the JSON block (from the now-clean string).
        const startIndex = cleanString.indexOf('[');
        const endIndex = cleanString.lastIndexOf(']');
        if (startIndex === -1 || endIndex === -1) {
            console.error("The string after deep cleaning was:", cleanString);
            throw new Error('Could not find a JSON array in the cleaned AI response.');
        }
        let jsonBlock = cleanString.substring(startIndex, endIndex + 1);

        jsonBlock = jsonBlock.replace(/`/g, '\\`');

        const generatedFiles = json5.parse(jsonBlock);

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