import OpenAI from 'openai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getContentHash } from './caching';

let openaiInstance: OpenAI | null = null;
let supabaseInstance: SupabaseClient | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiInstance;
}

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseInstance;
}

export async function getEmbedding(
  text: string,
  userId: string
): Promise<number[] | null> {
  try {
    const contentHash = getContentHash(text);
    const supabase = getSupabase();

    const { data: cached, error: cacheError } = await supabase
      .from('paragraph_embeddings')
      .select('embedding')
      .eq('user_id', userId)
      .eq('content_hash', contentHash)
      .single();

    if (!cacheError && cached) {
      return cached.embedding as number[];
    }

    const openai = getOpenAI();
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    const embedding = response.data[0].embedding;

    await supabase
      .from('paragraph_embeddings')
      .insert({
        user_id: userId,
        content_hash: contentHash,
        embedding
      })
      .select()
      .single();

    return embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    magnitudeA += a[i] * a[i];
    magnitudeB += b[i] * b[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
}
