# 🌱 Community Allotment App - Where Gardens Get Social! 

*Because managing an allotment community shouldn't be harder than growing tomatoes in winter!*

Welcome to the most delightfully overengineered solution to the age-old problem of "Did anyone mention when the compost delivery is arriving?" Now featuring **actual AI** (not just your neighbor Dave pretending to know about soil pH).

## 🤖 AI-Generated Code Disclaimer

**This entire project was created using Claude Sonnet (Anthropic's AI assistant) via VS Code's agent mode.** Every line of code, configuration, test, and documentation was generated through AI assistance, demonstrating the current capabilities of AI-powered software development.

This serves as an example of what's possible when AI agents have access to development tools and can iterate on complex projects. The code quality, architecture decisions, and feature implementations represent the state of AI coding capabilities as of June 2025. I did guide the AI, as it does like to be a bit too creative at times, and too lazy at others, but the AI did the heavy lifting.

## 🎉 What Does This Thing Actually Do?

Ever been to a community allotment meeting? Remember that chaos when someone mentioned bark chips and everyone suddenly became a logistics expert? Well, we've digitized that beautiful madness!

### 📢 The Announcement Zone
- **🚚 Delivery Alerts**: "The mulch truck is coming! Hide your children and small garden tools!"
- **📝 Seed Orders**: Coordinate group buys because apparently we all need 47 varieties of lettuce
- **💡 Garden Wisdom**: Monthly tips like "Maybe stop watering your cactus collection"
- **🎉 Social Shenanigans**: BBQs, workshops, and the annual "Who Grew The Weirdest Vegetable" contest

### 🤖 Your New AI Garden Buddy
Think of it as having a horticultural genius in your pocket, except this one won't judge you for killing that "supposedly unkillable" succulent. Ask it anything:
- "Why are my tomatoes plotting against me?"
- "Is this normal plant behavior or should I call an exorcist?"
- "What's this green fuzzy stuff, and should I be worried?"

### 📅 Calendar of Garden Chaos
Never again forget that it's "Prune The Roses Week" or miss the legendary community potluck where someone always brings that surprisingly delicious beetroot cake (trust us, it's better than it sounds).

## 🛠️ Built With Love (And Probably Too Much Coffee)

- **Next.js 14**: Because we're fancy like that
- **TypeScript**: For when JavaScript just isn't confusing enough
- **Tailwind CSS**: Making things pretty without the existential CSS crisis
- **Lucide Icons**: Tiny pictures that somehow make everything better
- **AI Integration**: The robot overlords, but for plants

## � Getting This Garden Party Started

*Warning: May cause excessive productivity and sudden urges to organize your tool shed*

1. **Grab the code** (it's free, unlike those expensive heritage seeds):

   ```bash
   git clone <repository-url>
   cd community-allotment
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
│   ├── page.tsx                # Home page with overview
│   ├── globals.css             # Global styles
│   ├── announcements/
│   │   └── page.tsx            # Announcements listing and filtering
│   ├── ai-advisor/
│   │   └── page.tsx            # AI-powered plant advice chat
│   ├── calendar/
│   │   └── page.tsx            # Interactive calendar with events
│   └── admin/
│       └── page.tsx            # Admin dashboard for management
```

## 🎨 The Pretty Stuff (Design System)

*Because even gardening apps deserve to look gorgeous*

We've got colors! We've got components! We've got enough CSS classes to make your head spin faster than a composting tumbler!

### 🌈 Color Scheme
- **Primary Green**: Like fresh lettuce, but more digital
- **Earthy Grays**: For when you need that "sophisticated soil" vibe
- **Accent Colors**: Orange (carrots!), Blue (water!), Green (more plants!), Purple (eggplant!)

## 🏠 What Lives Where (Page Guide)

### Home Sweet Home (`/`)
Your digital allotment entrance hall. Includes a virtual welcome mat and everything you need to feel at home.

### The Announcement Board (`/announcements`)
Think village noticeboard, but with better typography and fewer thumbtacks.

### AI Plant Whisperer (`/ai-advisor`)
Your personal garden guru that never sleeps, judges, or asks for payment in homegrown vegetables.

### The Social Calendar (`/calendar`)
Never again miss the Great Slug Hunt of 2025 or forget it's National Compost Appreciation Day.

### The Control Room (`/admin`)
Where the magic happens and the announcements get born. Admin access required (sorry, regular plot holders).

## 🔮 Future Dreams and Schemes

*Because every good project needs unrealistic expectations*

### Coming Eventually™
- **Actual Database**: No more JSON files pretending to be professional storage
- **Push Notifications**: "URGENT: The tomatoes are staging a revolt!"
- **Weather Integration**: So the AI can judge your watering schedule with actual meteorological data
- **Mobile App**: For when you need to check announcements while standing in your actual allotment
- **Multi-language Support**: Because plants grow everywhere

### Pie-in-the-Sky Features
- **Plant Disease Photo Recognition**: Point, shoot, panic appropriately
- **Automated Seasonal Tips**: The AI becomes your personal garden calendar
- **Community Marketplace**: "Will trade zucchini for literally anything else"

## 🐛 Known Issues (The Hall of Shame)

- Sometimes the icons have commitment issues with the latest libraries
- A few forms are having an identity crisis about labels
- The linter occasionally throws temper tantrums about array keys
- Some community members still need help navigating the digital world

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

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

**What this means:**

- ✅ Use it for your community allotment, garden club, or personal projects
- ✅ Learn from the code and improve your programming skills  
- ✅ Contribute improvements back to this project
- ✅ Modify and customize for your specific needs
- ✅ Commercial use is allowed

---

**Now go forth and grow things! Both plants and codebases! 🌿✨**

*P.S. - If this app actually helps organize your allotment community, we expect photos of the resulting garden chaos. The good kind of chaos.*
