const path = import('path');
const fs = import('fs');
import('buffer').Buffer;

async function decodeAttachments(attachments, repoName) {
    if (!attachments || attachments.length === 0) {
        console.log('No attachments to decode.');
        return;
    }

    const parentDir = path.dirname(__dirname);
    const outputDir = path.join(parentDir, 'generated-apps', repoName, 'attachments');
    console.log('Output directory for attachments:', outputDir);
    await fs.promises.mkdir(outputDir, { recursive: true });

    for (const attachment of attachments) {
        const { name, url } = attachment;
        const filePath = path.join(outputDir, name);
        const buffer = Buffer.from(url, 'base64');
        await fs.promises.writeFile(filePath, buffer);
        console.log(`Decoded and saved attachment: ${filePath}`);
    }
}

module.exports = { decodeAttachments };