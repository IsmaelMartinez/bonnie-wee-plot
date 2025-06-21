# 🌱 Aitor Setup Guide

Meet **Aitor** - your friendly gardening companion and allotment expert! This guide will help you set up Aitor using OpenAI's API for personalized, location-aware gardening advice.

## 🎯 What Aitor Does

Aitor helps gardeners grow healthy, thriving gardens through:
- Seasonal, location-specific planting advice
- Natural pest and disease management solutions
- Soil health and composting guidance
- Weather-appropriate care recommendations
- Personalized advice based on your experience level

## 🚀 Two Deployment Options

### Option 1: Environment Configuration (Traditional)

For server administrators or those who prefer environment-based configuration:

#### 1. Get Your OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name like "Community Allotment Aitor"
4. Copy the API key (starts with 'sk-')

#### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### Option 2: User Interface Configuration (New!)

For individual users who want to provide their own API tokens via the web interface:

#### 1. Access Aitor's Settings

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/ai-advisor

3. Click the settings icon (⚙️) in the top-right corner of Aitor's page

#### 2. Configure Your OpenAI Token

1. **Enter Your OpenAI API Key:**
   - Get your API key from [OpenAI Dashboard](https://platform.openai.com/api-keys)
   - Paste it into the token field
   - Format: `sk-xxxxxxxxxxxxxxxxxx`

2. **Save Configuration:**
   - Token is stored securely in your browser session only
   - Never saved permanently or shared with others
   - Automatically cleared when you close your browser

#### 3. Security Features

- 🔒 **Session Storage Only**: Tokens are stored temporarily in your browser
- 🛡️ **Secure Headers**: Tokens sent via secure request headers
- ✅ **Format Validation**: Basic token format checking for OpenAI keys
- 🚫 **No Logging**: Tokens are never logged or stored on the server

## 🧪 Test Aitor

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/ai-advisor

3. Try asking Aitor a gardening question!

## 🌱 Example Questions for AI Aitor

- "What should I plant in my allotment this month?"
- "How do I deal with aphids on my tomatoes naturally?"
- "My lettuce is bolting, what should I do?"
- "When is the best time to harvest courgettes?"
- "How do I prepare my allotment for winter?"

## 🔧 Advanced Configuration

### Model Selection

Aitor uses OpenAI's gpt-4o-mini model by default, which provides excellent gardening advice at a reasonable cost.

### Customizing AI Aitor's Personality

You can modify the system prompt in `src/app/api/ai-advisor/route.ts` to change how AI Aitor responds:

```typescript
const AITOR_SYSTEM_PROMPT = `You are AI Aitor, the friendly allotment gardening specialist...`
```

## 🐛 Troubleshooting

### "AI service not configured" Error

Make sure your `.env.local` file contains:
- `OPENAI_API_KEY=your_openai_api_key`

### Rate Limits

OpenAI has usage limits based on your account tier. If you hit them, the system will show an error. Check your OpenAI dashboard for usage and billing information.

## 🚀 Deployment

When deploying to production, add your environment variables to your hosting platform:

### Vercel
```bash
vercel env add OPENAI_API_KEY
```

### Netlify
Add in your Netlify dashboard under Site Settings > Environment Variables

### Other platforms
Add `OPENAI_API_KEY` to your environment variables configuration.

---

**Happy gardening with AI Aitor! 🌱✨**
