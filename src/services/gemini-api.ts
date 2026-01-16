export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer (0-3)
}

/**
 * Service for generating MCQ questions using Google Gemini API
 */
export class GeminiApiService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private static readonly API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  /**
   * Generate a single MCQ question using Gemini API
   */
  static async generateMCQQuestion(topic: string = 'computer science algorithms'): Promise<MCQQuestion | null> {
    if (!this.API_KEY) {
      console.error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file');
      return null;
    }

    const prompt = `Generate a multiple-choice question (MCQ) on the topic: "${topic}".
Provide exactly 4 answer choices, with only one correct answer.
The question should be about algorithms, data structures, or programming concepts.

Output as valid JSON with this exact format:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0
}

Where correctAnswer is the index (0-3) of the correct option.
Only return the JSON, no additional text or markdown formatting.`;

    try {
      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9, // Higher temperature for more variety
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 500,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Extract the generated text from Gemini response
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('No text generated in Gemini response');
      }

      // Parse JSON from the response (remove markdown code blocks if present)
      const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanedText);

      // Validate the structure
      if (!parsed.question || !Array.isArray(parsed.options) || parsed.options.length !== 4) {
        throw new Error('Invalid question format from Gemini');
      }

      // Ensure correctAnswer is a valid index
      if (parsed.correctAnswer < 0 || parsed.correctAnswer > 3) {
        throw new Error('Invalid correctAnswer index');
      }

      return {
        question: parsed.question,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer,
      };
    } catch (error) {
      console.error('Error generating MCQ from Gemini API:', error);
      return null;
    }
  }

  /**
   * Generate multiple MCQ questions
   */
  static async generateMCQQuestions(count: number = 3, topic: string = 'computer science algorithms'): Promise<MCQQuestion[]> {
    const questions: MCQQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      const question = await this.generateMCQQuestion(topic);
      if (question) {
        questions.push(question);
      } else {
        console.warn(`Failed to generate question ${i + 1}, using fallback`);
        // Add a fallback question if API fails
        questions.push(this.getFallbackQuestion(i));
      }
      
      // Small delay between requests to avoid rate limiting
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return questions;
  }

  /**
   * Fallback questions if API fails
   */
  private static getFallbackQuestion(index: number): MCQQuestion {
    const fallbacks: MCQQuestion[] = [
      {
        question: "What is the time complexity of binary search?",
        options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correctAnswer: 1,
      },
      {
        question: "Which data structure uses LIFO (Last In First Out)?",
        options: ["Queue", "Stack", "Tree", "Graph"],
        correctAnswer: 1,
      },
      {
        question: "What is the time complexity of finding an element in a hash table?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
        correctAnswer: 2,
      },
    ];
    return fallbacks[index % fallbacks.length];
  }
}
