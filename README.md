# 🌱 Bonnie Wee Plot - Gardening for the Bold and Weather-Beaten!

*Because growing anything in Scottish weather is already a form of extreme sport!*

Welcome to your personal digital garden assistant, specifically tuned for those brave souls who garden where horizontal rain is a lifestyle choice. Plan your plot, get AI-powered advice, and learn proven techniques for growing in Scotland's "interesting" climate—all in one place.

## 🤖 AI-Generated Code Disclaimer

**This entire project was created using Claude Sonnet (Anthropic's AI assistant) via VS Code's agent mode.** Every line of code, configuration, test, and documentation was generated through AI assistance, demonstrating the current capabilities of AI-powered software development.

This serves as an example of what's possible when AI agents have access to development tools and can iterate on complex projects. The code quality, architecture decisions, and feature implementations represent the state of AI coding capabilities as of June 2025. I did guide the AI, as it does like to be a bit too creative at times, and too lazy at others, but the AI did the heavy lifting.

## 🎉 What Does This Thing Actually Do?

### 📅 Today Dashboard
Your personal growing command center that answers "what should I do today?" (weather permitting, obviously):
- **Seasonal Insights**: Current seasonal phase with actionable suggestions for Scottish growing conditions
- **Daily Tasks**: Maintenance tasks and care reminders for your perennial plants
- **Bed Alerts**: Problem beds and harvest-ready crops at a glance
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
- **Material Logging**: Record greens and browns with automatic C:N ratio tracking
- **Event History**: Document turning, watering, and monitoring activities
- **Status Tracking**: Follow pile progress from active through curing to ready

## 🛠️ Built With Love (And Probably Too Much Coffee)

- **Next.js 15**: The latest and greatest from the Next.js team
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
   npm install --legacy-peer-deps
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
│   ├── globals.css             # Global styles
│   ├── allotment/
│   │   └── page.tsx            # Allotment planner with year-by-year tracking
│   ├── ai-advisor/
│   │   └── page.tsx            # AI-powered plant advice chat (Aitor)
│   ├── seeds/
│   │   └── page.tsx            # Seed catalog and planting calendar
│   ├── compost/
│   │   └── page.tsx            # Compost pile tracking
│   ├── plan-history/
│   │   └── page.tsx            # Historical plan viewer
│   ├── this-month/
│   │   └── page.tsx            # Seasonal calendar and tasks
│   └── about/
│       └── page.tsx            # About page
├── components/
│   ├── dashboard/              # Today Dashboard components
│   ├── allotment/              # Allotment planner components
│   ├── ai-advisor/             # Chat interface components
│   └── ui/                     # Shared UI components
├── lib/
│   ├── vegetables/             # Vegetable database
│   ├── seasons.ts              # Seasonal phase calculations
│   └── ai-suggestions.ts       # AI topic generation
└── services/
    └── allotment-storage.ts    # LocalStorage data persistence
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
Your homepage command center showing seasonal phase (adjusted for Scottish latitudes), daily tasks, bed alerts, and quick actions to get you started.

### Plot Planner (`/allotment`)
The heart of the app - manage your growing space with physical bed layouts, yearly planting plans, rotation tracking, and bed notes.

### Seeds Catalog (`/seeds`)
Browse vegetables by category, view detailed planting calendars, and learn about crop rotation families.

### Compost Tracker (`/compost`)
Track multiple compost piles with material logging, C:N ratio tracking, event history, and status management.

### Plan History (`/plan-history`)
Review historical planting plans year by year to inform future decisions.

### Aitor - AI Garden Advisor (`/ai-advisor`)
Your personal garden guru that never sleeps, judges, or asks for payment in homegrown vegetables. Get personalized advice based on your plot data and Scottish growing conditions.

### This Month (`/this-month`)
Seasonal calendar showing what to plant, harvest, and maintain during the current month.

### About (`/about`)
Learn about the project and its AI-powered origins.

## 🔮 Future Dreams and Schemes

*Because every good project needs unrealistic expectations*

### Coming Eventually™
- **Scottish Weather Integration**: So you know when to rush out and cover your brassicas before the next storm
- **Mobile App**: For when you need garden advice while standing in your actual plot (in the rain, obviously)
- **Multi-language Support**: Including Scots and Gaelic, naturally
- **Garden Data Persistence**: Cloud sync for your garden plans

### Pie-in-the-Sky Features
- **Blight Early Warning System**: Know before the spores do
- **Frost Date Predictions**: Beyond the usual "expect frost until June" advice
- **Variety Success Ratings**: Crowdsourced data on what actually ripens at your latitude

## 🐛 Known Issues (The Hall of Shame)

- Sometimes the icons have commitment issues with the latest libraries
- A few forms are having an identity crisis about labels
- The linter occasionally throws temper tantrums about array keys
- The growing calendar assumes you're somewhere in central Scotland—Shetland folk, you know to adjust

## 🤝 Want to Help Make This Less Ridiculous?

1. Fork it (the code, not your actual garden fork)
2. Branch it (again, the code)
3. Fix something or break something new
4. Test it (please, for the love of all things green)
5. Send us a pull request with your improvements

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
