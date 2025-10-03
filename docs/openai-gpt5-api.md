# OpenAI GPT-5 API Documentation

**Source:** OpenAI Platform Documentation (via Context7 MCP)
**Date Retrieved:** 2025-09-30
**Date Verified:** 2025-10-03
**Relevance:** Story 2.4 - AI Personal Ontology Extraction

## ⚠️ IMPORTANT: GPT-5 Uses Different API Endpoint

**GPT-5 models (`gpt-5`, `gpt-5-mini`, `gpt-5-nano`) ONLY work with the Responses API (`/v1/responses`)**

- ❌ **DO NOT** use `openai.chat.completions.create()`
- ✅ **DO** use `openai.responses.create()`
- ❌ **DO NOT** assume new models don't exist without checking documentation
- ✅ **DO** use Context7 MCP to verify current API structure

## Overview

GPT-5 is OpenAI's latest reasoning model, available ONLY via:
1. **Responses API** (`/v1/responses`) - Required for GPT-5 models

## Key Features

- **Reasoning Effort Control**: Adjust internal reasoning tokens generated before response
- **Chain of Thought (CoT) Passing**: Responses API can pass CoT between turns for multi-turn conversations
- **Optimized Performance**: Better cost efficiency with GPT-5's reasoning capabilities

## Model Variants

- **gpt-5**: Full reasoning model
- **gpt-5-mini**: Smaller, faster variant (recommended for MVP cost efficiency)
- **gpt-5-nano**: Smallest, fastest variant

## Unsupported Parameters (Will Cause Errors)

GPT-5 models **DO NOT** support these parameters from Chat Completions API:
- ❌ `temperature` - Use `reasoning.effort` instead
- ❌ `top_p` - Not available
- ❌ `logprobs` - Not available
- ❌ `max_tokens` - Use `max_output_tokens` instead
- ❌ `max_completion_tokens` - Use `max_output_tokens` instead
- ❌ `response_format` - JSON output is automatic based on prompt
- ❌ `messages` array - Use single `input` string instead

## API Endpoints

### Responses API (ONLY Option for GPT-5)

**Endpoint:** `POST https://api.openai.com/v1/responses`

**TypeScript/Node.js:**
```typescript
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: 'Your prompt here',
  reasoning: {
    effort: 'medium'  // 'minimal' | 'low' | 'medium' | 'high'
  }
})

const text = response.output_text  // NOT response.choices[0].message.content
```

**Request Structure:**
```json
{
  "model": "gpt-5-mini",
  "input": "Your prompt here",
  "reasoning": {
    "effort": "minimal" | "low" | "medium" | "high"
  },
  "text": {
    "verbosity": "low" | "medium" | "high"
  },
  "max_output_tokens": 2000
}
```

**Reasoning Effort Levels:**
- **minimal**: Fastest time-to-first-token, direct responses
- **low**: Quick reasoning for simple tasks
- **medium**: Balanced performance (default)
- **high**: Thorough reasoning for complex problems

**Response Structure:**
```json
{
  "id": "resp_abc123",
  "object": "response",
  "created": 1678886400,
  "model": "gpt-5-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Response text here"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 30,
    "completion_tokens": 120,
    "total_tokens": 150
  }
}
```

### 2. Chat Completions API (Alternative)

**Endpoint:** `POST https://api.openai.com/v1/chat/completions`

**Request Structure:**
```json
{
  "model": "gpt-5-mini",
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ],
  "reasoning_effort": "minimal" | "low" | "medium" | "high"
}
```

**Note:** In Chat Completions API, reasoning control uses `reasoning_effort` (top-level parameter) instead of nested `reasoning.effort`.

## Implementation Recommendations for Story 2.4

### Recommended Configuration

```typescript
// For ontology extraction from notes
const extractionConfig = {
  model: 'gpt-5-mini',  // Cost-efficient for MVP
  reasoning: {
    effort: 'medium'     // Balanced for philosophical analysis
  }
}
```

### API Security (Next.js)

```typescript
// /src/app/api/extract-ontology/route.ts
export async function POST(request: Request) {
  const { notes } = await request.json()

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      input: buildExtractionPrompt(notes),
      reasoning: { effort: 'medium' }
    })
  })

  return Response.json(await response.json())
}
```

## Prompt Engineering for Ontology Extraction

### System Prompt Template

```typescript
const EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing personal notes and journal entries to extract:

1. **Values**: Core principles that guide decisions and behavior
   - Examples: integrity, compassion, independence, growth

2. **Beliefs**: Fundamental truths the person holds about the world
   - Examples: "happiness is a choice", "people are inherently good"

3. **Aims**: Life goals, aspirations, and intentions
   - Examples: "cultivate mindfulness", "build meaningful relationships"

Analyze the provided notes and return structured JSON with:
- Extracted concept text
- Category (value/belief/aim)
- Confidence level (high/medium/low)
- Source quote from the notes
- Brief reasoning for categorization

Focus on recurring themes, explicit statements of principle, and implicit patterns.`
```

### User Prompt Template

```typescript
function buildExtractionPrompt(notes: Note[]): string {
  const notesText = notes.map((note, i) =>
    `## Note ${i + 1}: ${note.title}\n${note.content}`
  ).join('\n\n')

  return `${EXTRACTION_SYSTEM_PROMPT}

Analyze these notes and extract the person's values, beliefs, and aims:

${notesText}

Return your analysis as JSON in this format:
{
  "values": [
    {
      "text": "The value statement",
      "confidence": "high|medium|low",
      "sourceQuote": "Quote from notes",
      "reasoning": "Why this is a value"
    }
  ],
  "beliefs": [...],
  "aims": [...]
}`
}
```

## Cost Estimation

### Token Usage Guidelines

- **Input**: ~500-1000 tokens per extraction (5-10 notes)
- **Output**: ~200-500 tokens per extraction
- **Reasoning Tokens**: Varies by effort level (hidden internal tokens, included in billing)

### Estimated Costs (as of 2025)

*Note: Check current OpenAI pricing at https://openai.com/pricing*

- **gpt-5-mini** is significantly cheaper than full GPT-5
- Reasoning effort affects total cost (more reasoning = more tokens)
- Medium effort recommended for quality/cost balance

## Rate Limiting

**Recommended Limits for MVP:**
- 10 extractions per user per day
- 3-5 notes per extraction batch
- Implement client-side throttling and queue management

## Error Handling

```typescript
interface APIError {
  error: {
    message: string
    type: string
    code: string
  }
}

async function handleExtractionError(error: APIError) {
  switch (error.error.type) {
    case 'insufficient_quota':
      return 'API quota exceeded. Please try again later.'
    case 'invalid_request_error':
      return 'Invalid request. Please check your notes format.'
    case 'rate_limit_error':
      return 'Rate limit reached. Please wait a moment.'
    default:
      return 'Extraction temporarily unavailable. Please try again.'
  }
}
```

## References

- **OpenAI Platform Docs**: https://platform.openai.com/docs/guides/gpt-5
- **API Reference**: https://platform.openai.com/docs/api-reference
- **Pricing**: https://openai.com/pricing

## Notes for Implementation

1. **Start with gpt-5-mini** for cost efficiency during development
2. **Use Responses API** for better reasoning control
3. **Medium reasoning effort** balances quality and cost
4. **Batch processing** (3-5 notes) optimizes API usage
5. **Server-side only** - never expose API keys to frontend
6. **Implement retry logic** for transient failures
7. **Cache results** to avoid redundant API calls
8. **Monitor usage** to prevent unexpected costs