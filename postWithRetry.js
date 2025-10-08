async function postWithRetry(url, payload, maxRetries = 5) {
    let attempt = 0;
    let delay = 1000; // start with 1 second
    while (attempt < maxRetries) {
        try {
            const response = await axios.post(url, payload);
            if (response.status === 200) {
                return response;
            }
            throw new Error(`HTTP ${response.status}`);
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            console.error(`POST to ${url} failed (attempt ${attempt}): ${error.message}. Retrying in ${delay / 1000}s...`);
            await new Promise(res => setTimeout(res, delay));
            delay *= 2; // exponential backoff
        }
    }
}

module.exports = { postWithRetry };