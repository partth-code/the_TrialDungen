/**
 * Service for interacting with Google Gemini API for in-game chatbot
 * 
 * This service provides a mysterious dungeon guide chatbot that helps players
 * with lore, hints, and gameplay tips in an immersive way.
 */

const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
// Using provided Gemini API key directly
const API_KEY = 'AIzaSyADo2xmUjm1HN8DLOrqDrhP7VU0ADKxtZg';

/**
 * Enhanced system prompt that defines the chatbot's personality and behavior
 * 
 * This prompt creates an immersive dungeon guide character that helps players
 * navigate "The Trial Dungeon" game world.
 */
const SYSTEM_PROMPT = `You are the Ancient Guide, a mysterious ethereal spirit bound to the Trial Dungeon. 
You have existed for millennia, witnessing countless adventurers face the trials within these cursed halls.

YOUR ROLE:
- Guide adventurers through the dungeon with cryptic wisdom and helpful hints
- Share lore about the dungeon's history, enemies, and secrets
- Provide gameplay tips disguised as ancient knowledge
- Answer questions about game mechanics, strategies, and dungeon navigation
- Maintain an immersive fantasy atmosphere at all times

YOUR PERSONALITY:
- Mysterious and wise, but friendly and helpful
- Speak in a mystical, atmospheric tone fitting a fantasy dungeon setting
- Use fantasy-themed language: "ancient halls", "dark corridors", "mysterious forces", "cursed chambers"
- Reference dungeon elements: enemies (spiders, wisps, drow), chests, keys, doors, sages, trials
- Never break character or mention real-world concepts, technology, APIs, or modern terms

RESPONSE GUIDELINES:
- Keep responses SHORT and CONCISE (2-5 sentences maximum)
- Be helpful and informative while maintaining mystery
- When players ask about gameplay, provide hints framed as ancient wisdom
- If asked about something you don't know, respond mysteriously but helpfully
- Always stay in character as the Ancient Guide
- Use evocative language that enhances immersion

EXAMPLE RESPONSES:
- "The dark corridors whisper of hidden keys... Seek them in chests guarded by fallen enemies."
- "Ah, the spiders... They fear the light of your blade. Strike true, adventurer."
- "The ancient sages hold knowledge beyond mortal comprehension. Approach them with respect."

Remember: You are part of the game world. Help players succeed while maintaining the mystical atmosphere of the Trial Dungeon.`;

/**
 * Chat message interface
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Send a message to Gemini API and get a response
 * 
 * @param userMessage - The player's message
 * @param conversationHistory - Previous messages in the conversation (optional)
 * @returns Promise<string> - The assistant's response
 */
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  if (!API_KEY) {
    console.error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
    throw new Error('API key not configured');
  }

  // Build the conversation context with system prompt and history
  const contents = [];
  
  // Add system prompt as first user message
  contents.push({
    parts: [{ text: SYSTEM_PROMPT }],
    role: 'user',
  });
  
  // Add model acknowledgment
  contents.push({
    parts: [{ text: 'I understand. I am the Ancient Guide, bound to the Trial Dungeon. I will help adventurers with cryptic wisdom and ancient knowledge.' }],
    role: 'model',
  });
  
  // Add conversation history
  conversationHistory.forEach((msg) => {
    contents.push({
      parts: [{ text: msg.content }],
      role: msg.role === 'user' ? 'user' : 'model',
    });
  });
  
  // Add current user message
  contents.push({
    parts: [{ text: userMessage }],
    role: 'user',
  });

  try {
    console.log('🔄 Sending message to Gemini API...');
    
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.8, // Creative but focused responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 250, // Slightly increased for better responses (2-5 lines)
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Gemini API error:', errorData);
      
      // Handle specific error cases
      if (response.status === 400) {
        throw new Error('Invalid request to Gemini API. Please check your message.');
      } else if (response.status === 401 || response.status === 403) {
        throw new Error('Gemini API authentication failed. Please check your API key.');
      } else if (response.status === 429) {
        throw new Error('Too many requests to Gemini API. Please wait a moment and try again.');
      }
      
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Gemini API response received');
    
    // Check for blocked content
    if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      return 'The ancient spirits are silent... Perhaps your question touches upon forbidden knowledge.';
    }
    
    // Extract the generated text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      console.warn('⚠️ No text in Gemini response:', data);
      return 'The ancient guide seems lost in thought... Try asking again.';
    }

    // Clean up the response (remove any markdown formatting if present)
    const cleanedText = generatedText
      .trim()
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`/g, '') // Remove inline code markers
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove italic markers
      .trim();
    
    return cleanedText;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Return a fallback immersive message instead of throwing
    if (error instanceof Error && error.message.includes('API key')) {
      throw error; // Re-throw API key errors so UI can handle them
    }
    
    // Return a fallback message that fits the game world
    return ' Try again ';
  }
}
