import Groq from 'groq-sdk';
import { multiProviderAI } from './providers/multi-provider-ai';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Legacy single-provider function (kept for backward compatibility)
 */
export async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192", // Free model
      temperature: 0.1, // Lower temperature for more consistent JSON
      max_tokens: 2048, // Increased to reduce truncation
    });

    return completion.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to generate AI response');
  }
}

/**
 * Enhanced multi-provider AI response with automatic failover
 */
export async function generateAIResponseWithFailover(prompt: string, preferredProvider?: string): Promise<string> {
  try {
    const response = await multiProviderAI.generateResponse(prompt, preferredProvider);
    console.log(`✅ AI response generated via ${response.provider} in ${response.responseTime}ms`);
    return response.content;
  } catch (error) {
    console.error('Multi-provider AI Error:', error);

    // Fallback to legacy Groq-only function
    console.log('🔄 Falling back to legacy Groq-only function...');
    return generateAIResponse(prompt);
  }
}
