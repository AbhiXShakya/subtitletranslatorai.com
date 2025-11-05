# Gemini AI Subtitle Optimization - Implementation Guide

## Overview

This document describes the Gemini AI integration for subtitle optimization in the Subtitle Translator application. The feature allows users to improve the quality of subtitles in **any language** using Google's Gemini AI with context-aware optimization.

## Features

- 🤖 **AI-Powered Optimization**: Uses Gemini 2.0 Flash model for grammar and clarity improvements
- 🌍 **Multilingual Support**: Works with subtitles in any language - no translation, just optimization
- 🧠 **Context-Aware**: AI analyzes all subtitles first to understand context before making improvements
- 📦 **Batch Processing**: Automatically splits large subtitle files into 75K token batches
- 🔒 **Privacy-First**: API keys stored only in browser localStorage, never on servers
- 💾 **Persistent Storage**: API key persists across browser sessions
- ⚡ **Real-time Feedback**: Loading states and progress notifications
- 🎯 **Smart Validation**: Validates API keys and subtitle content before processing

## Architecture

### Components

1. **API Endpoint**: [`/api/aioptimize`](src/pages/api/aioptimize.ts)

   - Handles batch processing
   - Communicates with Gemini AI
   - Returns optimized subtitles in JSON format

2. **UI Components**: [`translate.astro`](src/pages/translate.astro)

   - Collapsible AI Optimize section
   - API key input with visibility toggle
   - Privacy warning notice
   - Optimize button with loading states

3. **TypeScript Types**: [`src/types/gemini.ts`](src/types/gemini.ts)
   - Type definitions for requests/responses
   - Ensures type safety across the application

### Data Flow

```
User Input (API Key + Subtitles)
    ↓
Client-side Validation
    ↓
POST /api/aioptimize
    ↓
Token Estimation & Batch Splitting
    ↓
Gemini AI Processing (Sequential Batches)
    ↓
Merge & Sort Results
    ↓
Update UI with Optimized Subtitles
```

## Usage

### For Users

1. **Get a Gemini API Key**

   - Visit [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
   - Create a free or paid API key

2. **Translate Subtitles**

   - Upload your subtitle file
   - Select target language
   - Click "Translate" button

3. **Optimize with AI**
   - Expand "AI Subtitle Optimization" section
   - Enter your Gemini API key
   - Click "AI Optimize Subtitles"
   - Wait for processing (shows progress)
   - Download optimized subtitles

### For Developers

#### Installation

```bash
# Already installed if you've run the integration
bun add @google/genai
```

#### API Endpoint Usage

```typescript
// POST /api/aioptimize
const response = await fetch('/api/aioptimize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    apiKey: 'your-gemini-api-key',
    subtitles: [
      { index: 1, content: 'First subtitle' },
      { index: 2, content: 'Second subtitle' },
    ],
  }),
});

const result = await response.json();
// {
//   success: true,
//   optimized: [
//     { index: 1, content: 'Optimized first subtitle' },
//     { index: 2, content: 'Optimized second subtitle' }
//   ],
//   batches: 1
// }
```

#### TypeScript Types

```typescript
import type {
  SubtitleItem,
  GeminiOptimizeRequest,
  GeminiOptimizeResponse,
} from './types/gemini';
```

## Configuration

### Token Limits

- **Batch Size**: 75,000 tokens per batch
- **Character Estimation**: 3 characters per token (conservative)
- **Maximum Characters per Batch**: 225,000 characters

### Optimization Instructions

The AI is instructed to:

1. Fix grammar and spelling errors
2. Improve clarity and sentence structure
3. Maintain timing-appropriate subtitle length
4. Preserve original meaning

## Security & Privacy

### API Key Storage

- ✅ Stored in browser's `localStorage` only
- ✅ Never sent to our servers (except in API requests to Gemini)
- ✅ Can be cleared by user at any time
- ✅ Transmitted over HTTPS

### Data Handling

- Subtitle content is sent to Google's Gemini API for processing
- No subtitle data is stored on our servers
- API requests are made server-side to protect API keys during transit

## Error Handling

The system handles various error scenarios:

| Error Type      | User Message                                           | Action                    |
| --------------- | ------------------------------------------------------ | ------------------------- |
| Missing API Key | "Please enter your Gemini API key"                     | Prompt for API key        |
| Invalid API Key | "Invalid API key. Please check your Gemini API key..." | Clear from localStorage   |
| No Subtitles    | "Please translate subtitles first before optimizing"   | Prompt to translate first |
| Network Error   | "Failed to optimize subtitles: [error details]"        | Show error toast          |
| Rate Limit      | API returns specific error                             | Show error message        |

## Performance Considerations

### Batch Processing

- Sequential processing to avoid rate limits
- Each batch processed independently
- Results merged and sorted by index

### Token Estimation

```typescript
// Conservative estimation
const CHARS_PER_TOKEN = 3;
const estimatedTokens = totalCharacters / CHARS_PER_TOKEN;
```

### Response Parsing

- Handles both raw JSON and markdown-wrapped responses
- Validates response structure before applying
- Falls back gracefully on parsing errors

## Testing

### Manual Testing Checklist

- [ ] API key input saves to localStorage
- [ ] API key visibility toggle works
- [ ] Button enables/disables based on API key
- [ ] Loading states display correctly
- [ ] Small subtitle files (< 75K tokens) process in single batch
- [ ] Large subtitle files split into multiple batches
- [ ] Invalid API key shows appropriate error
- [ ] Empty subtitles show appropriate error
- [ ] Network failures handle gracefully
- [ ] Optimized content updates textareas correctly
- [ ] Success toast shows with batch count
- [ ] Error toasts show with clear messages

### Test Scenarios

1. **Happy Path**

   - Upload subtitle file
   - Translate to English
   - Enter valid API key
   - Click optimize
   - Verify improvements

2. **Large File**

   - Upload file with 500+ subtitles
   - Verify batch processing
   - Check all subtitles are optimized

3. **Error Scenarios**
   - Invalid API key
   - Network disconnection
   - Empty subtitles
   - Rate limit exceeded

## Troubleshooting

### Common Issues

**Issue**: "Invalid API key" error

- **Solution**: Verify API key from Google AI Studio
- **Check**: Key has proper permissions for Gemini API

**Issue**: Optimization takes too long

- **Solution**: Large files are processed in batches (normal)
- **Check**: Monitor browser console for progress logs

**Issue**: Some subtitles not optimized

- **Solution**: Check if subtitles had content before optimization
- **Check**: Look for error messages in console

**Issue**: API key not persisting

- **Solution**: Check browser localStorage is enabled
- **Check**: Not in private/incognito mode

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Batch Sizing**: Adjust based on API tier (free vs paid)
2. **Undo/Redo**: Allow reverting optimizations
3. **Preview Mode**: Show before/after comparison
4. **Custom Instructions**: Let users customize optimization goals
5. **Progress Bar**: Visual progress indicator for batch processing
6. **Model Selection**: Allow choosing between Gemini models
7. **Bulk Operations**: Optimize multiple files at once
8. **History**: Track optimization history

## Dependencies

```json
{
  "@google/genai": "^1.28.0"
}
```

## API Reference

### Endpoints

#### POST /api/aioptimize

Optimizes subtitle content using Gemini AI.

**Request Body:**

```typescript
{
  apiKey: string;
  subtitles: Array<{
    index: number;
    content: string;
  }>;
}
```

**Response:**

```typescript
{
  success: boolean;
  optimized?: Array<{
    index: number;
    content: string;
  }>;
  batches?: number;
  error?: string;
}
```

**Status Codes:**

- `200`: Success
- `400`: Invalid request data
- `401`: Invalid API key
- `500`: Server error

## Contributing

When contributing to this feature:

1. Maintain type safety with TypeScript
2. Add error handling for new scenarios
3. Update this documentation
4. Test with various subtitle file sizes
5. Consider rate limiting implications

## License

This feature is part of the Subtitle Translator project and follows the same license.

## Support

For issues or questions:

- Check the troubleshooting section
- Review browser console for errors
- Verify API key validity
- Check Google Gemini API status

---

**Last Updated**: 2025-11-05
**Version**: 1.0.0
