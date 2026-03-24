import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  console.log("Fetching models list...");
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models found or error response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
listModels();
