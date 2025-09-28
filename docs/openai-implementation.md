# OpenAI GPT-5 Implementation Guide for Story 2.4

## GPT-5 Availability
As of August 2025, GPT-5 is available with enhanced reasoning capabilities, custom tools, and new API features designed for complex analysis tasks like personal ontology extraction.

## API Configuration

### 1. Installation
```bash
npm install openai
```

### 2. Environment Variables
Add to `.env.local`:
```env
OPENAI_API_KEY=your_api_key_here
```

### 3. Security Best Practices
- **Never expose API keys in frontend code**
- Use Next.js API routes (server-side only)
- Validate all inputs before sending to OpenAI
- Implement rate limiting
- Use environment variables for configuration
- Never log API keys or sensitive data

## GPT-5 Model Family

### Available Models
- **`gpt-5`**: Best for complex reasoning, broad world knowledge, and code-heavy or multi-step agentic tasks
- **`gpt-5-mini`**: Cost-optimized reasoning and chat; balances speed, cost, and capability
- **`gpt-5-nano`**: High-throughput tasks, especially simple instruction-following or classification

For personal ontology extraction, we recommend **`gpt-5`** for its superior reasoning capabilities.

## Implementation Details

### API Client Setup (Responses API)
```typescript
import OpenAI from 'openai';

// Server-side only - in API route
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### Personal Ontology Extraction with GPT-5
```typescript
const response = await openai.responses.create({
  model: "gpt-5",
  input: `Analyze this journal entry and extract core Values, Beliefs, and Aims.

Definitions:
- Values: Core principles that guide decisions
- Beliefs: Fundamental truths about the world
- Aims: Life goals and aspirations

Journal Entry: ${journalContent}

Return as structured JSON with extracted concepts, confidence scores, and reasoning.`,
  reasoning: {
    effort: "medium"  // balanced performance and quality
  },
  text: {
    verbosity: "medium"  // detailed but concise explanations
  }
});
```

### New GPT-5 Parameters

#### Reasoning Effort
Controls how many reasoning tokens the model generates:
- **`minimal`**: Fastest time-to-first-token, very few reasoning tokens
- **`low`**: Favors speed, fewer tokens
- **`medium`**: Balanced performance (default)
- **`high`**: More thorough reasoning for complex tasks

#### Verbosity
Controls output token generation:
- **`low`**: Concise answers, minimal commentary
- **`medium`**: Balanced explanations (default)
- **`high`**: Thorough explanations, extensive detail

### API Route Structure
```typescript
// app/api/extract-ontology/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Validate request
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid content' },
        { status: 400 }
      );
    }

    // Call GPT-5 using Responses API
    const response = await openai.responses.create({
      model: "gpt-5",
      input: `Analyze this journal entry and extract personal ontology...

Journal Entry: ${content}`,
      reasoning: {
        effort: "medium"
      },
      text: {
        verbosity: "medium"
      }
    });

    return NextResponse.json({
      ontology: JSON.parse(response.output_text),
      reasoning_tokens: response.usage?.reasoning_tokens,
      output_tokens: response.usage?.output_tokens
    });
  } catch (error) {
    console.error('GPT-5 API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## Important GPT-5 Changes

### Unsupported Parameters
⚠️ **These parameters are NOT supported in GPT-5:**
- `temperature`
- `top_p`
- `logprobs`

### Use Instead:
- **Reasoning depth:** `reasoning: { effort: "minimal" | "low" | "medium" | "high" }`
- **Output verbosity:** `text: { verbosity: "low" | "medium" | "high" }`
- **Output length:** `max_output_tokens`

## Rate Limiting & Error Handling

### Rate Limiting Implementation
```typescript
import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'minute'
});

// In API route
if (!await limiter.tryRemoveTokens(1)) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  );
}
```

### Error Handling
```typescript
try {
  const response = await openai.responses.create({...});
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    switch (error.status) {
      case 401:
        // Invalid API key
        break;
      case 429:
        // Rate limit exceeded
        break;
      case 500:
        // Server error
        break;
    }
  }
}
```

## Performance Optimizations

### Chain of Thought Passing
GPT-5's Responses API supports passing chain of thought between turns for:
- Improved intelligence
- Fewer generated reasoning tokens
- Higher cache hit rates
- Lower latency

```typescript
// Multi-turn conversation with CoT passing
const followUpResponse = await openai.responses.create({
  model: "gpt-5",
  input: "Please elaborate on the extracted values",
  previous_response_id: initialResponse.id  // Passes CoT automatically
});
```

### Token Management
- GPT-5 has optimized reasoning efficiency
- Chain-of-thought passing reduces redundant reasoning
- Consider `gpt-5-mini` for cost-sensitive applications
- Use `reasoning.effort: "low"` for faster responses

## Cost Considerations
- GPT-5 offers improved cost efficiency with optimized reasoning
- Reasoning tokens are tracked separately from output tokens
- Chain-of-thought passing reduces overall token usage
- `gpt-5-mini` provides cost-optimized alternative

## Advanced Features (Future Enhancements)

### Custom Tools
GPT-5 supports custom tools that accept freeform text inputs:
```typescript
tools: [{
  type: "custom",
  name: "ontology_analyzer",
  description: "Analyzes text for philosophical concepts"
}]
```

### Allowed Tools
Restrict model to specific tool subsets for safety:
```typescript
tool_choice: {
  type: "allowed_tools",
  mode: "auto",
  tools: [
    { type: "function", name: "extract_values" },
    { type: "function", name: "extract_beliefs" }
  ]
}
```

## Testing Recommendations
1. Start with `gpt-5` and `medium` reasoning effort
2. Test with various journal entry lengths and styles
3. Validate JSON response format and structure
4. Test error handling scenarios (rate limits, API failures)
5. Monitor token usage and costs
6. Compare quality with different reasoning effort levels

## Migration from GPT-4
- Replace Chat Completions API calls with Responses API
- Remove `temperature`, `top_p`, `logprobs` parameters
- Add `reasoning.effort` and `text.verbosity` parameters
- Update error handling for new API structure
- Test performance with different reasoning levels

## Best Practices
1. **Use medium reasoning effort** for ontology extraction balance
2. **Validate outputs server-side** for security
3. **Pass chain of thought** between related API calls
4. **Monitor token usage** to optimize costs
5. **Handle errors gracefully** with fallback responses
6. **Cache results** when appropriate to reduce API calls