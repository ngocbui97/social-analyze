import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return console.error("No API key");

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // There isn't a direct listModels on genAI, we usually use the lower level fetch or check docs.
    // However, some versions of the SDK might have it.
    // Let's try the most basic prompt with gemini-1.5-flash again but log the FULL error.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log("SUCCESS:", (await result.response).text());
  } catch (err) {
    console.log("FULL ERROR TYPE:", err.constructor.name);
    console.log("FULL ERROR MESSAGE:", err.message);
    if (err.response) {
       console.log("ERROR RESPONSE:", await err.response.json());
    }
  }
}
test();
