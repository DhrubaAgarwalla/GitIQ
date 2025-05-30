import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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
