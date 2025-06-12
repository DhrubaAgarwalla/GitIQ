/**
 * Debug script to test Hugging Face API key and endpoints
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testHuggingFaceAPI() {
  console.log('🔍 Debugging Hugging Face API...\n');
  
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  console.log(`API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND'}`);
  
  if (!apiKey) {
    console.error('❌ HUGGINGFACE_API_KEY not found in environment variables');
    return;
  }
  
  // Test 1: Check API key validity with a simple request
  console.log('\n🧪 Test 1: Checking API key validity...');
  try {
    const response = await fetch('https://huggingface.co/api/whoami', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ API key is valid');
      console.log(`   User: ${user.name || 'Unknown'}`);
      console.log(`   Type: ${user.type || 'Unknown'}`);
    } else {
      console.log(`❌ API key validation failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error checking API key:', error);
  }
  
  // Test 2: Try the simplest possible model
  console.log('\n🧪 Test 2: Testing simplest model (gpt2)...');
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/gpt2', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: 'Hello world',
        parameters: {
          max_new_tokens: 10,
          return_full_text: false
        }
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ GPT-2 model works!');
      console.log('   Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ GPT-2 model failed: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error testing GPT-2:', error);
  }
  
  // Test 3: Check available models
  console.log('\n🧪 Test 3: Checking model availability...');
  const testModels = [
    'gpt2',
    'distilgpt2', 
    'microsoft/DialoGPT-small',
    'facebook/blenderbot_small-90M'
  ];
  
  for (const model of testModels) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'HEAD', // Just check if the endpoint exists
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      console.log(`   ${model}: ${response.status === 200 ? '✅ Available' : `❌ ${response.status} ${response.statusText}`}`);
    } catch (error) {
      console.log(`   ${model}: ❌ Error - ${error}`);
    }
  }
  
  // Test 4: Try a different approach - text classification instead of generation
  console.log('\n🧪 Test 4: Testing text classification model...');
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: 'fix: resolve bug in authentication'
      })
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Classification model works!');
      console.log('   Response:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ Classification model failed: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Error testing classification:', error);
  }
  
  console.log('\n📋 Summary:');
  console.log('If all tests fail with 404 errors, it might be because:');
  console.log('1. Your API key is for Hugging Face Hub (read-only) not Inference API');
  console.log('2. You need to enable Inference API access in your Hugging Face settings');
  console.log('3. The free tier might have limitations');
  console.log('4. You might need to create a new token with "Inference API" permissions');
  
  console.log('\n🔧 Solutions:');
  console.log('1. Go to https://huggingface.co/settings/tokens');
  console.log('2. Create a new token with "Inference API" role');
  console.log('3. Or use a different provider (Groq + Gemini work perfectly!)');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHuggingFaceAPI().catch(console.error);
}

export { testHuggingFaceAPI };
