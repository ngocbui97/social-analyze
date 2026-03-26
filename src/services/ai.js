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

/**
 * Core processor for AI calls
 * Routes between local (client-side) and serverless (server-side) based on config
 */
async function processAICall(provider, apiKey, options) {
  const useServerless = import.meta.env.VITE_USE_SERVERLESS === 'true' || import.meta.env.PROD;
  const localApiKey = apiKey || ENV_API_KEY;

  // Use local call if we have an API key AND either not in production or serverless is explicitly disabled
  if (localApiKey && !useServerless) {
    return await callWithRetry(localApiKey, async (model) => {
      if (options.history) {
        const geminiHistory = [
          { role: "user", parts: [{ text: options.systemMessage }] },
          { role: "model", parts: [{ text: "Understood." }] }
        ];
        for (const msg of options.history) {
          const r = (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user';
          const text = msg.content || (msg.parts && msg.parts[0]?.text);
          if (text) geminiHistory.push({ role: r, parts: [{ text }] });
        }
        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(options.userMessage);
        return result.response.text();
      } else {
        const promptText = options.systemMessage ? `${options.systemMessage}\n\n${options.userMessage}` : options.userMessage;
        
        if (options.imageData) {
            const result = await model.generateContent([
              promptText,
              {
                inlineData: {
                  data: options.imageData.base64,
                  mimeType: options.imageData.mimeType
                }
              }
            ]);
            return result.response.text();
        } else {
            const result = await model.generateContent(promptText);
            return result.response.text();
        }
      }
    });
  }

  // Otherwise, route through serverless function (Secure way)
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options,
        apiKey: localApiKey // Optional, server will use process.env.GEMINI_API_KEY as primary
      })
    });

    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      let errorMessage = `Serverless Error: ${response.status}`;
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        // Handle cases where the endpoint returns HTML (like Vite's 404 during dev)
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>') || response.status === 404) {
          errorMessage = "AI Proxy endpoint not found. If you are developing locally, please ensure you have VITE_GEMINI_API_KEY in .env.local or use 'vercel dev'.";
        }
      }
      throw new Error(errorMessage);
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data.text;
    } else {
      throw new Error("Received non-JSON response from AI server.");
    }
  } catch (err) {
    if (import.meta.env.DEV && !localApiKey) {
      throw new Error(`AI Request failed. Please check your local VITE_GEMINI_API_KEY in .env.local or run 'vercel dev' to test serverless functions.`);
    }
    throw err;
  }
}

export async function analyzeChannelData(provider, apiKey, channelData, recentVideos) {
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

  return await processAICall(provider, apiKey, { systemMessage, userMessage });
}

export async function chatWithAI(provider, apiKey, userMessage, channelData, recentVideos, history = []) {
  const systemMessage = `You are "SocialIQ AI", a specialized assistant for YouTube creators.
Channel Data: ${JSON.stringify(channelData)}
Recent Performance: ${JSON.stringify(recentVideos.slice(0, 3))}

Answer the creator's questions based on their data. Keep it motivating, technical, and concise. 
Use Vietnamese if the user asks in Vietnamese.`;

  return await processAICall(provider, apiKey, { systemMessage, userMessage, history });
}

/**
 * Specialized analysis for exported Studio data
 */
export async function analyzeExportedData(apiKey, topVideosText) {
  const systemMessage = "You are a YouTube Analytics expert.";
  const userMessage = `Analyze this exported channel data detailing my top 10 videos:
${topVideosText}

Provide a short, direct analysis in Vietnamese. Format as Markdown.
Include:
1. "Điểm sáng" (What worked best based on CTR and Views)
2. "Điểm cần cải thiện" (What underperformed)
3. "Chiến lược nội dung" (1-2 recommendations for my next video)`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
}

/**
 * Interactive chat for exported Studio data
 */
export async function chatWithExportedData(apiKey, topVideosText, userMessage, history = []) {
  const systemMessage = `You are a YouTube Analytics expert. You have access to my top channel data:
${topVideosText}

Answer my questions about this data in Vietnamese. Be technical, direct, and actionable.`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage, history });
}

/**
 * Content Planner: Generate Hooks
 */
export async function generateHooks(apiKey, script) {
  const systemMessage = `You are an expert YouTube strategist and copywriter.
Analyze the following video script/outline and generate 3 highly engaging "Hook" variations (for the first 15-30 seconds).
The hooks should grab attention, build curiosity, and retain the viewer.
Format the output in highly readable markdown. Keep it punchy and actionable. Use Vietnamese.`;

  const userMessage = `Here is the video script/outline:\n\n${script}\n\nPlease generate 3 hook variations.`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
}

/**
 * Content Planner: Generate Description & Chapters
 */
export async function generateDescription(apiKey, transcript) {
  const systemMessage = `You are an expert YouTube SEO specialist.
Analyze the following video transcript/script and generate a highly optimized YouTube video description.
It must include:
1. A catchy 2-3 sentence summary with main keywords in the very first paragraph.
2. Timestamps/Chapters (predict logical sections based on the content).
3. Call to Action (e.g. Subscribe, Like, Social media links placeholders).
4. 3-5 relevant hashtags at the bottom.
Format the output in clear markdown. Use Vietnamese.`;

  const userMessage = `Here is the video transcript/script:\n\n${transcript}\n\nPlease generate the optimized description with chapters.`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
}

/**
 * Analyze Thumbnail using Gemini Vision
 */
export async function analyzeThumbnail(apiKey, imageData) {
  const systemMessage = `You are an expert YouTube strategist and designer.
Analyze the provided thumbnail image to predict its Click-Through Rate (CTR) and visual effectiveness.
Focus on: Contrast, Text readability (especially on mobile), Emotional impact of faces, and Clickability.
Format your response in simple markdown with:
1. "Điểm số thiết kế" (A score out of 10)
2. "Đánh giá chi tiết" (Pros and Cons)
3. "Đề xuất cải thiện" (Actionable tips)
Use Vietnamese.`;

  const userMessage = `Vui lòng phân tích hình thu nhỏ (thumbnail) này giúp tôi.`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage, imageData });
}

/**
 * Analyze Comments Sentiment
 */
export async function analyzeComments(apiKey, commentsText) {
  const systemMessage = `You are an expert YouTube community manager.
Analyze the provided comments to determine the overall sentiment and key topics.
Format your response in simple markdown with:
1. "Tâm lý chung" (Overall Sentiment: Positive, Negative, or Mixed)
2. "Chủ đề chính" (2-3 main themes being discussed)
3. "Câu hỏi nổi bật" (Extract 1-2 common questions asked in these comments, if any).
Keep it concise. Use Vietnamese.`;

  const userMessage = `Vui lòng phân tích các bình luận sau:\n\n${commentsText}`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
}

/**
 * Draft Comment Replies
 */
export async function draftCommentReplies(apiKey, commentText) {
  const systemMessage = `You are a YouTube creator responding to a fan.
Draft 3 short, distinct replies to this comment:
1. Hài hước (Humorous/Witty)
2. Chuyên nghiệp (Professional/Informative)
3. Thân thiện (Warm/Grateful)
Format as a simple markdown list without extra fluff. Use Vietnamese.`;

  const userMessage = `Hãy soạn câu trả lời cho bình luận này:\n\n"${commentText}"`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
}

/**
 * Shorts Repurposing Engine: Find Viral Segments
 */
export async function findViralShorts(apiKey, videoDetails) {
  const systemMessage = `You are an expert YouTube Shorts and TikTok strategist.
Analyze this video's title, description, and available data to suggest 3 distinct, highly engaging 30-60 second segments that could perform well as Shorts.
For each segment, provide:
1. **Tiêu đề hấp dẫn** (Catchy Hook/Title)
2. **Khung thời gian** (Estimated Timestamp range, e.g. 02:15 - 03:00)
3. **Lý do chọn** (Why this works: emotion, specific value, controversy)
Format the response clearly in markdown. Use Vietnamese.`;

  const userMessage = `Title: ${videoDetails.title}\nDesc: ${videoDetails.description?.substring(0, 1500)}`;

  return await processAICall('gemini', apiKey, { systemMessage, userMessage });
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
