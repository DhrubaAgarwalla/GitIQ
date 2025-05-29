
import { config } from 'dotenv';
config();

import { generateAIResponse } from './genkit';

async function testAI() {
  try {
    console.log('Testing Groq AI integration...');
    const response = await generateAIResponse('Hello, can you respond with a simple greeting?');
    console.log('AI Response:', response);
    console.log('✅ AI integration working!');
  } catch (error) {
    console.error('❌ AI integration failed:', error);
  }
}

testAI();
