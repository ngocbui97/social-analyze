import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, userMessage, systemMessage, history, model: preferredModel } = req.body;
  
  // Use the secret key from environment variables if not provided by client
  // (In production, the client should NOT provide the key)
  const finalApiKey = process.env.GEMINI_API_KEY || apiKey;

  if (!finalApiKey) {
    return res.status(400).json({ error: 'Gemini API Key is missing on the server.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(finalApiKey);
    
    // We follow the same model fallback logic as the frontend but on the server
    const models = [
      preferredModel,
      "gemini-2.0-flash-exp",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-3.1-flash-lite-preview"
    ].filter(Boolean);

    let lastError;
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        
        if (history && history.length > 0) {
          // Multi-turn chat
          const chatHistory = history.map(msg => ({
            role: (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user',
            parts: [{ text: msg.content || (msg.parts && msg.parts[0]?.text) }]
          }));

          const chat = model.startChat({ history: chatHistory });
          const result = await chat.sendMessage(userMessage || '');
          return res.status(200).json({ text: result.response.text() });
        } else {
          // Single generation
          const prompt = systemMessage ? `${systemMessage}\n\n${userMessage}` : userMessage;
          const result = await model.generateContent(prompt);
          return res.status(200).json({ text: result.response.text() });
        }
      } catch (err) {
        lastError = err;
        console.error(`Model ${modelName} failed on server:`, err.message);
        // Continue to next model
      }
    }
    
    throw lastError;
  } catch (err) {
    console.error('Serverless AI Error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
