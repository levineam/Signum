import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { getContentHash } from './caching';

let openaiInstance: OpenAI | null = null;

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

export async function getEmbedding(
  text: string
): Promise<number[] | null> {
  try {
    const contentHash = getContentHash(text);

    // Check cache - RLS automatically filters by auth.uid()
    const { data: cached, error: cacheError } = await supabase
      .from('paragraph_embeddings')
      .select('embedding')
      .eq('content_hash', contentHash)
      .single();

    if (!cacheError && cached) {
      return cached.embedding as number[];
    }

    // Generate new embedding via OpenAI
    const openai = getOpenAI();
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });

    const embedding = response.data[0].embedding;

    // Cache the embedding using upsert to handle concurrent requests
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use upsert with onConflict to handle race conditions gracefully
    const { data: inserted, error: insertError } = await supabase
      .from('paragraph_embeddings')
      .upsert({
        user_id: user.id,
        content_hash: contentHash,
        embedding
      }, {
        onConflict: 'user_id,content_hash',
        ignoreDuplicates: false
      })
      .select()
      .single();

    // If upsert encountered a conflict, return the existing cached embedding
    if (insertError || !inserted) {
      const { data: refetched } = await supabase
        .from('paragraph_embeddings')
        .select('embedding')
        .eq('content_hash', contentHash)
        .single();
      return refetched?.embedding as number[] || embedding;
    }

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
