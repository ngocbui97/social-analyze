import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY not found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Testing both names to be sure
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  
  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Hi");
      const response = await result.response;
      console.log(`✅ Success with ${modelName}! Response:`, response.text().substring(0, 20) + "...");
      break; // Stop if one works
    } catch (err) {
      console.error(`❌ Failed with ${modelName}:`, err.message);
    }
  }
}

test();
