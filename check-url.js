export async function checkUrl(url, duration = 120000, delay = 4000) {
  const startTime = Date.now();
  console.log(`Checking URL for up to ${duration / 1000} seconds: ${url}`);

  while (Date.now() - startTime < duration) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`✅ Success! URL is live and returned status ${response.status}.`);
        return true;
      } else {
        console.log(`...URL returned status ${response.status}. Retrying...`);
      }
    } catch (error) {
      console.log(`...Request failed: ${error.message}. Retrying...`);
    }
    
    // Wait for the delay before the next attempt
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  console.log(`❌ Failed to get a successful response within ${duration / 1000} seconds.`);
  return false;
}