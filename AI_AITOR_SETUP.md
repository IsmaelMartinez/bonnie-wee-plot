# 🤖 Aitor Setup Guide

Meet **Aitor** - your advanced gardening assistant with subtle Terminator references and serious gardening expertise! This guide will help you set up Aitor using your GitHub Copilot license.

## 🎯 Mission Parameters

Aitor's primary directive: Help gardeners achieve maximum plant survival and thriving growth. Secondary directive: Make gardening advice memorable with subtle robotic charm.

## 🚀 Two Deployment Options

### Option 1: Environment Configuration (Traditional)

For server administrators or those who prefer environment-based configuration:

#### 1. Get Your GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "Community Allotment Aitor"
4. Select the following scopes:
   - `read:user` (to read user profile)
   - `copilot` (to access GitHub Copilot API)
5. Generate and copy the token

#### 2. Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# GitHub Copilot Integration
GITHUB_TOKEN=your_github_token_here

# Optional: Fallback to OpenAI if you have a key
# OPENAI_API_KEY=your_openai_key_here
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

#### 2. Configure Your Token

1. **Select AI Service:**
   - **GitHub Copilot** (Recommended if you have access)
   - **OpenAI API** (Alternative option)

2. **Enter Your Token:**
   - For GitHub: Personal Access Token with 'copilot' scope
   - For OpenAI: API key from OpenAI dashboard

3. **Save Configuration:**
   - Token is stored securely in your browser session only
   - Never saved permanently or shared with others
   - Automatically cleared when you close your browser

#### 3. Security Features

- 🔒 **Session Storage Only**: Tokens are stored temporarily in your browser
- 🛡️ **Secure Headers**: Tokens sent via secure request headers
- ✅ **Format Validation**: Basic token format checking
- 🚫 **No Logging**: Tokens are never logged or stored on the server

## 🧪 Test Aitor

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/ai-advisor

3. Try asking AI Aitor a gardening question!

## 🌱 Example Questions for AI Aitor

- "What should I plant in my allotment this month?"
- "How do I deal with aphids on my tomatoes naturally?"
- "My lettuce is bolting, what should I do?"
- "When is the best time to harvest courgettes?"
- "How do I prepare my allotment for winter?"

## 🔧 Advanced Configuration

### Model Selection

The integration automatically uses the best available model:
- With GitHub Token: Uses GitHub Copilot's models (gpt-4o, etc.)
- With OpenAI Key: Uses OpenAI's GPT-4

### Customizing AI Aitor's Personality

You can modify the system prompt in `src/app/api/ai-advisor/route.ts` to change how AI Aitor responds:

```typescript
const AITOR_SYSTEM_PROMPT = `You are AI Aitor, the friendly allotment gardening specialist...`
```

## 🐛 Troubleshooting

### "AI service not configured" Error

Make sure your `.env.local` file contains either:
- `GITHUB_TOKEN=your_token` (recommended)
- `OPENAI_API_KEY=your_key` (fallback)

### GitHub Token Permissions

Ensure your GitHub token has the `copilot` scope enabled.

### Rate Limits

GitHub Copilot has usage limits. If you hit them, the system will show an error. You can add an OpenAI key as a fallback.

## 🚀 Deployment

When deploying to production, add your environment variables to your hosting platform:

### Vercel
```bash
vercel env add GITHUB_TOKEN
```

### Netlify
Add in your Netlify dashboard under Site Settings > Environment Variables

### Other platforms
Add `GITHUB_TOKEN` to your environment variables configuration.

---

**Happy gardening with AI Aitor! 🌱✨**
