# 🌱 Bonnie Wee Plot - Gardening for the Bold and Weather-Beaten!

*Because growing anything in Scottish weather is already a form of extreme sport!*

Welcome to your personal digital garden assistant, specifically tuned for those brave souls who garden where horizontal rain is a lifestyle choice. Plan your plot, get AI-powered advice, and learn proven techniques for growing in Scotland's "interesting" climate—all in one place.

**Try it now:** [Bonnie Wee Plot](https://bonnie-wee-plot.vercel.app) (primary) | [GitHub Pages mirror](https://ismaelmartinez.github.io/bonnie-wee-plot) (static fallback)

## 🤖 AI-Generated Code Disclaimer

**This entire project was created using Claude (Anthropic's AI assistant) via VS Code's agent mode and Claude Code CLI.** Every line of code, configuration, test, and documentation was generated through AI assistance, demonstrating the current capabilities of AI-powered software development.

This serves as an example of what's possible when AI agents have access to development tools and can iterate on complex projects. The code quality, architecture decisions, and feature implementations represent the state of AI coding capabilities. I did guide the AI, as it does like to be a bit too creative at times, and too lazy at others, but the AI did the heavy lifting.

## 🎉 What Does This Thing Actually Do?

### 📅 Today Dashboard
Your personal growing command center that answers "what should I do today?" (weather permitting, obviously):
- **Seasonal Insights**: Current seasonal phase with actionable suggestions for Scottish growing conditions
- **Smart Task List**: Auto-generated tasks based on your plantings, including harvest reminders, sowing windows, and maintenance schedules
- **Quick Actions**: Fast access to your plot, seeds, and AI advisor

### 🗺️ Plot Planner
Design and track your growing space with year-by-year planning:
- **Physical Layout**: Map your beds, polytunnels, and cold frames (essential for Scottish growing!)
- **Yearly Planning**: Track plantings across multiple growing seasons
- **Bed Notes**: Record observations and "what survived the gales" notes for each bed
- **Historical Data**: View past years to inform future decisions and remember which varieties actually ripened

### 🌱 Seeds & Tracking
Comprehensive seed and plant management for our shorter growing season:
- **Seed Catalog**: Browse and search vegetables by category, focusing on what actually grows here
- **Seed Inventory**: Track seed status per year (need/ordered/have/had) to manage your collection
- **Planting Calendar**: View detailed planting windows adjusted for Scottish conditions
- **Crop Rotation**: Smart rotation suggestions based on plant families

### 🤖 Your New AI Garden Buddy (Aitor)
Think of it as having a horticultural genius in your pocket, one who understands that "full sun" means something different at 56°N latitude. Ask it anything:
- "Will this variety actually ripen before September?"
- "Is blight inevitable or am I just paranoid?"
- "How do I convince my tomatoes that 15°C is actually warm?"

### ♻️ Compost Tracker
Turn garden waste into black gold:
- **Multiple Piles**: Track several compost piles simultaneously
- **Material Logging**: Record what goes into your compost
- **Event History**: Document turning, watering, and monitoring activities
- **Status Tracking**: Follow pile progress from active through curing to ready

## 🛠️ Built With Love (And Probably Too Much Coffee)

- **Next.js 16**: The latest and greatest from the Next.js team
- **React 19**: Cutting-edge React with all the new features
- **TypeScript**: For when JavaScript just isn't confusing enough
- **Tailwind CSS**: Making things pretty without the existential CSS crisis
- **Lucide Icons**: Tiny pictures that somehow make everything better
- **AI Integration**: The robot overlords, but for plants (powered by OpenAI)

## � Getting This Garden Party Started

*Warning: May cause excessive productivity and sudden urges to organize your tool shed*

1. **Grab the code** (it's free, unlike those expensive heritage seeds):

   ```bash
   git clone <repository-url>
   cd bonnie-wee-plot
   ```

2. **Feed it dependencies** (like fertilizer, but for code):

   ```bash
   npm install
   ```

3. **Wake up the development server** (it's not a morning person):

   ```bash
   npm run dev
   ```

4. **Witness the magic**:
   
   Point your browser to `http://localhost:3000` and prepare to have your mind blown by the sheer beauty of organized allotment chaos!

## 🏗️ Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with navigation
│   ├── page.tsx                # Today Dashboard (homepage)
│   ├── allotment/              # Plot planner with year-by-year tracking
│   ├── ai-advisor/             # AI chat redirect (opens modal)
│   ├── seeds/                  # Seed inventory and variety tracking
│   ├── compost/                # Compost pile tracking
│   ├── this-month/             # Seasonal calendar and tasks
│   ├── plants/                 # Plant guide index and detail pages
│   ├── settings/               # App settings, data management, tours
│   ├── receive/                # QR/code data import flow
│   ├── sign-in/ & sign-up/     # Clerk authentication pages
│   └── api/                    # API routes (ai-advisor, share, health, account)
├── components/
│   ├── dashboard/              # Today Dashboard components
│   ├── allotment/              # Allotment planner components
│   ├── ai-advisor/             # Chat interface components
│   ├── seeds/                  # Seed management components
│   ├── share/                  # Data sharing UI
│   ├── onboarding/             # Onboarding wizard and tours
│   └── ui/                     # Shared UI components
├── lib/
│   ├── vegetables/             # Vegetable database (index + per-category data)
│   ├── supabase/               # Cloud sync client and services
│   └── tours/                  # Guided tour definitions
└── services/
    └── allotment-storage.ts    # LocalStorage data persistence (barrel file)
```

## 🎨 The Pretty Stuff (Design System)

*Because even gardening apps deserve to look gorgeous*

We've got colors! We've got components! We've got enough CSS classes to make your head spin faster than a composting tumbler!

### 🌈 Color Scheme
- **Primary Green**: Like fresh lettuce, but more digital
- **Earthy Grays**: For when you need that "sophisticated soil" vibe
- **Accent Colors**: Orange (carrots!), Blue (water!), Green (more plants!), Purple (eggplant!)

## 🏠 What Lives Where (Page Guide)

### Today Dashboard (`/`)
Your homepage command center showing seasonal phase (adjusted for Scottish latitudes), smart task list with harvest and sowing reminders filtered by planting status, and quick actions to get you started.

### Plot Planner (`/allotment`)
The heart of the app - manage your growing space with physical bed layouts, yearly planting plans, rotation tracking, and bed notes.

### Seeds Catalog (`/seeds`)
Browse vegetables by category, track your seed inventory with per-year status (need/ordered/have/had), view detailed planting calendars, and learn about crop rotation families.

### Compost Tracker (`/compost`)
Track multiple compost piles with material logging, event history, and status management.

### This Month (`/this-month`)
Seasonal calendar showing what to plant, harvest, and maintain during the current month.

### Plant Guide (`/plants`)
Browse all 192 plants in the database with search and category filtering. Detail pages show planting calendars, care requirements, companion planting, and external links.

### Aitor - AI Garden Advisor (`/ai-advisor`)
Your personal garden guru that never sleeps, judges, or asks for payment in homegrown vegetables. Get personalized advice based on your plot data and Scottish growing conditions.

### Settings (`/settings`)
Manage app settings, export/import your data, and control guided tours. If signed in, you can also manage your account and cloud sync.

### Data Receiver (`/receive`)
Import allotment data from another device by scanning a QR code or entering a 6-character share code.

### Authentication (`/sign-in`, `/sign-up`)
Sign in or create an account to enable cloud sync for your garden data across multiple devices.

## 🔮 Future Dreams and Schemes

*Because every good project needs unrealistic expectations*

### Coming Eventually™
- **Scottish Weather Integration**: So you know when to rush out and cover your brassicas before the next storm

### Pie-in-the-Sky Features
- **Blight Early Warning System**: Know before the spores do
- **Frost Date Predictions**: Beyond the usual "expect frost until June" advice
- **Variety Success Ratings**: Crowdsourced data on what actually ripens at your latitude

## 🐛 Known Issues (The Hall of Shame)

- Sometimes the icons have commitment issues with the latest libraries
- A few forms are having an identity crisis about labels
- The linter occasionally throws temper tantrums about array keys
- The growing calendar assumes you're somewhere in central Scotland—Shetland folk, you know to adjust

## Want to Help?

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📜 License & Usage Policy

This project is **open source and free for personal, educational, and community use**.

### 🔑 **AI Token Setup**

The AI gardening advisor requires you to **bring your own ChatGPT API token**:

- 🎯 **No service costs** - you pay OpenAI directly for your AI usage
- 🔒 **Private tokens** - stored only in your browser session, never on servers
- ⚡ **Unlimited usage** - no artificial limits since you control your own costs
- 💰 **Cost transparency** - you see exactly what you pay (~$0.02-0.05 per query)

To set up:
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add funds to your OpenAI account
3. Enter your API key in the AI Advisor settings
4. Start chatting with your AI garden expert!

### 📄 **License**

This project uses a **custom non-commercial license** for third parties - see the [LICENSE](./LICENSE) file for details.

**What this means for you:**

- ✅ Use it for your plot, garden club, or personal projects
- ✅ Learn from the code and improve your programming skills
- ✅ Contribute improvements back to this project
- ✅ Modify and customize for your specific growing conditions
- ✅ Educational and research use is allowed
- ❌ Commercial use by third parties is **not permitted** without a separate license

**Note:** The copyright holder retains full commercial rights. For commercial licensing inquiries, see the LICENSE file for contact information.

---

**Now go forth and grow things! Despite the weather! 🌿🏴󠁧󠁢󠁳󠁣󠁴󠁿**

*P.S. - If this app actually helps you grow anything north of the wall, we expect photos. Bonus points for tomatoes that ripened outdoors.*
