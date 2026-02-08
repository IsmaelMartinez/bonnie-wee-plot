<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Bonnie Wee Plot

A Next.js application for garden planning and AI-powered gardening advice.

## Key Features:

- **Garden Planner**: Visual allotment layout with drag-and-drop bed management
- **AI Plant Advisor**: Integrated AI advisor "Aitor" for plant advice, powered by OpenAI (BYO API key)
- **Planting Calendar**: Track plantings, harvests, and seasonal tasks by year
- **Seeds & Varieties Tracker**: Manage seed inventory and plan yearly plantings
- **Companion Planting**: Data-driven companion plant recommendations
- **Modern UI**: Built with Tailwind CSS for responsive design

## Technology Stack:

- Next.js 16 with TypeScript
- React 19
- Tailwind CSS for styling
- Lucide React for icons
- App Router for modern Next.js routing
- localStorage for data persistence (Supabase migration planned)

## Prerequisites:

- Node.js 22+ installed
- npm package manager
- Tests with Playwright (E2E) and Vitest (unit)
- **All tests must pass**: Run `npm run test:all` before pushing
- Run `npm run dev` to start the development server on http://localhost:3000

## Code Conventions:

- Use TypeScript for all components and utilities
- Playwright and Vitest tests need to be 100% success before pushing
- Test feedback should be clear, fast and reliable
- Prefer simple solutions over complex ones
- Commit and push often
- Follow Next.js App Router patterns
- Use Tailwind CSS classes for styling
- Implement proper error handling and loading states
- Focus on accessibility and responsive design
- Use server components where possible for better performance

## AI Integration Guidelines:

- BYO (Bring Your Own) OpenAI API key for AI features
- Prioritize plant-specific advice (vegetables, herbs, seasonal tasks)
- Include UK climate-specific recommendations
- Provide practical, actionable advice for gardeners

## Data Storage:

- Currently uses localStorage with schema versioning (v16)
- Unified data model in `src/types/unified-allotment.ts`
- State managed via `useAllotment` hook
- Supabase integration considered for future multi-device sync (contingent on user adoption)
