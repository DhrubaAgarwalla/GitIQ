/**
 * Multi-Provider AI System with Smart Batch Distribution
 * Supports Groq, Gemini, and Hugging Face with automatic failover
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export interface AIProvider {
  name: string;
  priority: number;
  maxBatchSize: number;
  requestsPerMinute: number;
  avgResponseTime: number; // in milliseconds
  isAvailable: boolean;
  lastError?: string;
  requestCount: number;
  lastResetTime: number;
}

export interface AIResponse {
  content: string;
  provider: string;
  responseTime: number;
}

export interface BatchDistribution {
  provider: string;
  commits: Array<{ sha: string; message: string }>;
  batchSize: number;
}

class MultiProviderAI {
  private providers: Map<string, AIProvider> = new Map();
  private groq?: Groq;
  private gemini?: GoogleGenerativeAI;

  constructor() {
    this.initializeProviders();
    this.initializeClients();
  }

  private initializeProviders() {
    // Load environment variables (for Node.js environments)
    if (typeof process !== 'undefined' && process.env) {
      // Check if we're in a Node.js environment and try to load .env
      try {
        require('dotenv').config({ path: '.env.local' });
      } catch {
        // dotenv not available or .env.local not found, continue
      }
    }

    // Provider configurations based on their capabilities
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const hfKey = process.env.HUGGINGFACE_API_KEY;

    console.log('🔑 API Key Status:');
    console.log(`   Groq: ${groqKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Gemini: ${geminiKey ? '✅ Available' : '❌ Missing'}`);
    console.log(`   Hugging Face: ${hfKey ? '✅ Available' : '❌ Missing'}`);

    this.providers.set('groq', {
      name: 'Groq',
      priority: 1, // Highest priority (fastest)
      maxBatchSize: 12,
      requestsPerMinute: 100, // Conservative limit
      avgResponseTime: 800,
      isAvailable: !!groqKey,
      requestCount: 0,
      lastResetTime: Date.now()
    });

    this.providers.set('gemini', {
      name: 'Google Gemini',
      priority: 2, // Second priority
      maxBatchSize: 8,
      requestsPerMinute: 14, // Conservative (15/min limit)
      avgResponseTime: 1500,
      isAvailable: !!geminiKey,
      requestCount: 0,
      lastResetTime: Date.now()
    });

    this.providers.set('huggingface', {
      name: 'Hugging Face',
      priority: 3, // Backup priority
      maxBatchSize: 5,
      requestsPerMinute: 10, // Very conservative
      avgResponseTime: 3000,
      isAvailable: false, // Temporarily disabled due to token issues
      requestCount: 0,
      lastResetTime: Date.now()
    });
  }

  private initializeClients() {
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
   * Get the best available provider based on priority and rate limits
   */
  private getBestAvailableProvider(): AIProvider | null {
    const now = Date.now();
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => {
        // Reset request count if a minute has passed
        if (now - provider.lastResetTime > 60000) {
          provider.requestCount = 0;
          provider.lastResetTime = now;
        }

        return provider.isAvailable &&
               provider.requestCount < provider.requestsPerMinute;
      })
      .sort((a, b) => a.priority - b.priority);

    return availableProviders[0] || null;
  }

  /**
   * Smart batch distribution with percentage allocation (50% Groq, 30% Gemini, 20% Hugging Face)
   */
  public distributeBatches(commits: Array<{ sha: string; message: string }>): BatchDistribution[] {
    const distributions: BatchDistribution[] = [];
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isAvailable)
      .sort((a, b) => a.priority - b.priority);

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // Define percentage allocation (50% Groq, 50% Gemini as requested)
    const allocation = {
      'groq': 0.50,        // 50% (as requested)
      'gemini': 0.50,      // 50% (as requested)
      'huggingface': 0.00  // 0% (disabled due to token issues)
    };

    const totalCommits = commits.length;
    let remainingCommits = [...commits];

    // Calculate commits per provider based on percentages
    for (const provider of availableProviders) {
      const providerKey = provider.name.toLowerCase().replace(' ', '').replace('google', '');
      const percentage = allocation[providerKey as keyof typeof allocation] || 0;

      if (percentage > 0 && remainingCommits.length > 0) {
        const commitsForProvider = Math.ceil(totalCommits * percentage);
        const actualCommits = Math.min(commitsForProvider, remainingCommits.length);

        // Split into batches based on provider's max batch size
        let providerCommits = remainingCommits.splice(0, actualCommits);

        while (providerCommits.length > 0) {
          const batchSize = Math.min(provider.maxBatchSize, providerCommits.length);
          const batch = providerCommits.splice(0, batchSize);

          distributions.push({
            provider: providerKey,
            commits: batch,
            batchSize: batch.length
          });
        }
      }
    }

    // Distribute any remaining commits to available providers
    if (remainingCommits.length > 0) {
      let providerIndex = 0;
      while (remainingCommits.length > 0 && providerIndex < availableProviders.length) {
        const provider = availableProviders[providerIndex];
        const providerKey = provider.name.toLowerCase().replace(' ', '').replace('google', '');
        const batchSize = Math.min(provider.maxBatchSize, remainingCommits.length);

        if (batchSize > 0) {
          const batch = remainingCommits.splice(0, batchSize);
          distributions.push({
            provider: providerKey,
            commits: batch,
            batchSize: batch.length
          });
        }

        providerIndex = (providerIndex + 1) % availableProviders.length;
      }
    }

    return distributions;
  }

  /**
   * Generate AI response using the best available provider
   */
  public async generateResponse(prompt: string, preferredProvider?: string): Promise<AIResponse> {
    const startTime = Date.now();

    // Try preferred provider first if specified
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      if (provider?.isAvailable) {
        try {
          const content = await this.callProvider(preferredProvider, prompt);
          provider.requestCount++;
          return {
            content,
            provider: preferredProvider,
            responseTime: Date.now() - startTime
          };
        } catch (error) {
          console.warn(`Preferred provider ${preferredProvider} failed:`, error);
          provider.lastError = error instanceof Error ? error.message : 'Unknown error';
        }
      }
    }

    // Fallback to best available provider
    const provider = this.getBestAvailableProvider();
    if (!provider) {
      throw new Error('No AI providers available or all rate limited');
    }

    try {
      const content = await this.callProvider(provider.name.toLowerCase().replace(' ', ''), prompt);
      provider.requestCount++;
      return {
        content,
        provider: provider.name,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      provider.lastError = error instanceof Error ? error.message : 'Unknown error';
      provider.isAvailable = false;

      // Try next available provider
      const nextProvider = this.getBestAvailableProvider();
      if (nextProvider) {
        const content = await this.callProvider(nextProvider.name.toLowerCase().replace(' ', ''), prompt);
        nextProvider.requestCount++;
        return {
          content,
          provider: nextProvider.name,
          responseTime: Date.now() - startTime
        };
      }

      throw new Error(`All AI providers failed. Last error: ${provider.lastError}`);
    }
  }

  private async callProvider(providerName: string, prompt: string): Promise<string> {
    // Normalize provider names
    const normalizedName = providerName.toLowerCase().replace(/[^a-z]/g, '');

    switch (normalizedName) {
      case 'groq':
        return this.callGroq(prompt);
      case 'gemini':
      case 'googlegemini':
        return this.callGemini(prompt);
      case 'huggingface':
        return this.callHuggingFace(prompt);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  private async callGroq(prompt: string): Promise<string> {
    if (!this.groq) throw new Error('Groq client not initialized');

    const completion = await this.groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "No response generated";
  }

  private async callGemini(prompt: string): Promise<string> {
    if (!this.gemini) throw new Error('Gemini client not initialized');

    const model = this.gemini.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text() || "No response generated";
  }

  private async callHuggingFace(prompt: string): Promise<string> {
    if (!process.env.HUGGINGFACE_API_KEY) throw new Error('Hugging Face API key not found');

    // Use reliable and available text generation models
    const models = [
      "gpt2",                           // Most reliable, always available
      "distilgpt2",                     // Smaller, faster version
      "microsoft/DialoGPT-medium",      // Conversational model
      "facebook/opt-350m",              // Meta's model
      "EleutherAI/gpt-neo-125M"        // EleutherAI model
    ];

    for (const model of models) {
      try {
        console.log(`Trying Hugging Face model: ${model}`);

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 100,
                temperature: 0.1,
                do_sample: true,
                return_full_text: false,
                pad_token_id: 50256, // For GPT-2 models
              },
              options: {
                wait_for_model: true,
                use_cache: false
              }
            }),
          }
        );

        if (response.ok) {
          const result = await response.json();
          console.log(`Hugging Face ${model} response:`, JSON.stringify(result).substring(0, 200));

          // Handle different response formats
          if (Array.isArray(result) && result.length > 0) {
            const text = result[0]?.generated_text || result[0]?.text || "";
            if (text) {
              console.log(`✅ Hugging Face ${model} succeeded`);
              return text;
            }
          } else if (result.generated_text) {
            console.log(`✅ Hugging Face ${model} succeeded`);
            return result.generated_text;
          } else if (result.text) {
            console.log(`✅ Hugging Face ${model} succeeded`);
            return result.text;
          }

          console.warn(`Hugging Face ${model} returned empty response`);
        } else {
          const errorText = await response.text();
          console.warn(`Hugging Face model ${model} failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      } catch (error) {
        console.warn(`Error with Hugging Face model ${model}:`, error);
      }
    }

    throw new Error('All Hugging Face models failed');
  }

  /**
   * Get provider status for monitoring
   */
  public getProviderStatus() {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      name: key,
      ...provider
    }));
  }

  /**
   * Reset provider availability (useful for retrying failed providers)
   */
  public resetProviderAvailability() {
    this.providers.forEach(provider => {
      provider.isAvailable = true;
      provider.lastError = undefined;
    });
  }
}

// Export singleton instance
export const multiProviderAI = new MultiProviderAI();
