import { GoogleGenerativeAI } from "@google/generative-ai";

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const isAIEnabled = !!ENV_API_KEY;

// Available models in order of preference (preview/fast first, then stable fallbacks)
// We use a mix of specific versions and aliases to ensure maximum compatibility
// [RULE: DO NOT MODIFY]
const GEMINI_MODELS = [
  "gemini-2.5-flash",          // Very fast, reliable
];

/**
 * Helper to call Gemini with exponential backoff and model fallback
 */
async function callWithRetry(apiKey, operation, maxRetries = 3) {
  let lastError;

  for (const modelName of GEMINI_MODELS) {
    let delay = 1000;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });
        return await operation(model);
      } catch (err) {
        lastError = err;
        const isTransient = err.message?.includes('503') || err.message?.includes('429') || err.message?.toLowerCase().includes('high demand');

        if (!isTransient || i === maxRetries) {
          // If not transient (e.g. 404) or last retry for this model, break to try next model or throw
          break;
        }

        console.warn(`AI Model ${modelName} busy (Attempt ${i + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

export async function analyzeChannelData(provider, apiKey, channelData, recentVideos) {
  const finalApiKey = apiKey || ENV_API_KEY;
  if (!finalApiKey) {
    throw new Error(`API Key for ${provider} is missing. Please configure it in AI Settings.`);
  }

  const systemMessage = `You are a YouTube Growth Expert. Analyze the following channel data and provide 3 actionable growth tips and 1 content trend. Format your response in simple markdown with:
### Growth Strategy
(Expert analysis here)
### Content Recommendations
(Ideas based on these stats)`;

  const userMessage = `Channel: ${channelData.title}
Subscribers: ${channelData.subscribers}
Total Views: ${channelData.totalViews}
Recent Videos:
${recentVideos.slice(0, 5).map(v => `- ${v.title} (${v.views} views, ${v.likes} likes)`).join('\n')}`;

  if (provider === 'gemini' || provider === 'default') {
    const keyToUse = provider === 'default' ? ENV_API_KEY : finalApiKey;
    if (provider === 'default' && !ENV_API_KEY) {
      throw new Error("Default App API Key is missing. Please check VITE_GEMINI_API_KEY in .env.local.");
    }

    return await callWithRetry(keyToUse, async (model) => {
      const prompt = `${systemMessage}\n\n${userMessage}`;
      const result = await model.generateContent(prompt);
      return result.response.text();
    });
  }

  return await callGenericCompletion(provider, finalApiKey, systemMessage, userMessage);
}

export async function chatWithAI(provider, apiKey, userMessage, channelData, recentVideos, history = []) {
  const finalApiKey = apiKey || ENV_API_KEY;
  if (!finalApiKey) {
    throw new Error(`API Key for ${provider} is missing. Please configure it in AI Settings.`);
  }

  const systemMessage = `You are "SocialIQ AI", a specialized assistant for YouTube creators.
Channel Data: ${JSON.stringify(channelData)}
Recent Performance: ${JSON.stringify(recentVideos.slice(0, 3))}

Answer the creator's questions based on their data. Keep it motivating, technical, and concise. 
Use Vietnamese if the user asks in Vietnamese.`;

  if (provider === 'gemini' || provider === 'default') {
    const keyToUse = provider === 'default' ? ENV_API_KEY : finalApiKey;
    if (provider === 'default' && !ENV_API_KEY) {
      throw new Error("Default App API Key is missing. Please check VITE_GEMINI_API_KEY in .env.local.");
    }

    return await callWithRetry(keyToUse, async (model) => {
      // Map history to Gemini format
      const geminiHistory = [
        { role: "user", parts: [{ text: systemMessage }] },
        { role: "model", parts: [{ text: "Understood. I am ready to help you grow your channel!" }] }
      ];

      for (const msg of history) {
        const r = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
        const text = msg.content || (msg.parts && msg.parts[0]?.text);
        if (text) {
          geminiHistory.push({ role: r, parts: [{ text }] });
        }
      }

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    });
  }

  return await callGenericCompletion(provider, finalApiKey, systemMessage, userMessage, history);
}

/**
 * Specialized analysis for exported Studio data
 */
export async function analyzeExportedData(apiKey, topVideosText) {
  const finalApiKey = apiKey || ENV_API_KEY;
  if (!finalApiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  const prompt = `You are a YouTube Analytics expert. Analyze this exported channel data detailing my top 10 videos:
${topVideosText}

Provide a short, direct analysis in Vietnamese. Format as Markdown.
Include:
1. "Điểm sáng" (What worked best based on CTR and Views)
2. "Điểm cần cải thiện" (What underperformed)
3. "Chiến lược nội dung" (1-2 recommendations for my next video)`;

  return await callWithRetry(finalApiKey, async (model) => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

/**
 * Interactive chat for exported Studio data
 */
export async function chatWithExportedData(apiKey, topVideosText, userMessage, history = []) {
  const finalApiKey = apiKey || ENV_API_KEY;
  if (!finalApiKey) {
    throw new Error("Gemini API Key is missing.");
  }

  const systemMessage = `You are a YouTube Analytics expert. You have access to my top channel data:
${topVideosText}

Answer my questions about this data in Vietnamese. Be technical, direct, and actionable.`;

  return await callWithRetry(finalApiKey, async (model) => {
    const geminiHistory = [
      { role: "user", parts: [{ text: systemMessage }] },
      { role: "model", parts: [{ text: "Tôi đã sẵn sàng phân tích dữ liệu YouTube của bạn. Bạn muốn biết biết thêm điều gì?" }] }
    ];

    for (const msg of history) {
      const r = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
      const text = msg.content || (msg.parts && msg.parts[0]?.text);
      if (text) {
        geminiHistory.push({ role: r, parts: [{ text }] });
      }
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  });
}

// Generic completion wrapper for OpenAI-compatible APIs and Anthropic
async function callGenericCompletion(provider, apiKey, systemMessage, userMessage, history = []) {
  let url = '';
  let headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  let body = {};

  const formattedHistory = history.map(m => {
    let msgText = m.parts ? m.parts[0].text : m.content;
    let msgRole = (m.role === 'model') ? 'assistant' : m.role;
    return { role: msgRole, content: msgText };
  });

  if (provider === 'chatgpt') {
    url = 'https://api.openai.com/v1/chat/completions';
    body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7
    };
  } else if (provider === 'claude') {
    url = '/api/anthropic/v1/messages';
    headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
    body = {
      model: 'claude-3-haiku-20240307',
      system: systemMessage,
      messages: [
        ...formattedHistory,
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1024
    };
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Error (${provider}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  if (provider === 'claude') {
    return data.content[0].text;
  }
  return data.choices[0].message.content;
}
