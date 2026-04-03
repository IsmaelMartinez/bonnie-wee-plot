# I Built a 51k-Line App With Claude Code in 7 Weeks. Here's What Actually Happened.

In June 2025, I started building a garden planning app for Scottish allotment gardeners. I got 23 commits in over two days, set up the Next.js skeleton, added an AI advisor, wrote some Playwright tests, and then... life happened. The project sat untouched for six months.

On December 30th, I sat down with Claude Code and started again. Seven weeks and 314 commits later, Bonnie Wee Plot is a fully functional PWA with 51,000 lines of TypeScript, 192 plant entries with RHS-aligned crop rotation data, 737 unit tests, an AI gardening advisor that can modify your garden plan, QR code data sharing between devices, and a design system called Zen. One person. No team.

This is not a success story about AI replacing developers. It's an honest account of what works, what fails spectacularly, and what kind of discipline it takes to build something real this way.

## What Bonnie Wee Plot actually is

Before getting into the process, some context on what I built. Bonnie Wee Plot is a garden planner tailored for Scottish growing conditions. You lay out your allotment beds, track what you plant each year, manage seed inventory, and get personalised sowing/harvest dates adjusted for Scottish weather. There's an AI advisor called Aitor who can answer gardening questions and directly modify your garden plan with your confirmation. Data lives in localStorage (no accounts needed), and you can share your allotment data between devices via QR codes.

It's built on Next.js 16 with React 19, TypeScript strict mode, Tailwind CSS, and it works as an installable PWA. The plant database covers 192 species with companion planting relationships, botanical names, RHS references, and Wikipedia links.

## The working relationship

The most common analogy for AI coding assistants is "like a junior developer." I don't like that comparison. It's overused, and more importantly, it's unfair to actual junior developers who bring curiosity, growth, and fresh perspectives that AI simply doesn't have.

What I found is that working with Claude Code is more like directing than delegating. I bring the vision, the taste, and the judgement calls. Claude Code brings speed and breadth. It can touch 33 files to standardise a colour system, or populate 192 plant entries with botanical names in a single session — work that would take days of careful, tedious effort otherwise. But it doesn't know what the app should feel like. It doesn't know when a feature is confusing, or that P2P sync is overengineered for the use case. That's all me.

This distinction matters because it changes how you work. You're not writing tickets for someone else to implement. You're having a conversation with a tool that can execute at the speed of thought, which means the bottleneck shifts entirely to your own clarity of thinking.

## The infrastructure that makes it safe

Early on I realised that AI-assisted development at speed needs guardrails, not because the AI is careless, but because the pace of change is so high that mistakes compound fast. Here's what I put in place.

A CLAUDE.md file sits in the repo root with project conventions, architecture decisions, and a "Simplicity First" design principle. Claude Code reads this at the start of every session, so it understands the codebase context without me re-explaining it each time. This file evolved constantly as we learned what needed to be explicit.

Branch protection on main requires pull requests and passing CI checks (build, lint, type-check, unit tests, e2e tests, plant data validation). Every change goes through a PR, even trivial ones. This saved me multiple times when Claude Code introduced subtle issues that passed in conversation but failed in CI.

Architecture Decision Records (24 of them) document every significant choice: why we chose localStorage over a database, why we use Serwist for the service worker, how the unified area system works. When Claude Code suggests something that contradicts a previous decision, the ADR is there to catch it.

A living plan document (`current-plan.md`) tracks what's done and what's next. This became the single source of truth that kept sessions coherent across days and weeks. Without it, each new conversation would start from scratch.

Git worktrees for parallel work. When I want Claude Code to work on two independent features simultaneously, each gets its own worktree so they don't trample each other's branches. I learned this the hard way when two parallel agents tried to share the same working directory.

## When it works brilliantly

The moments where AI-assisted development felt like a superpower all share a common pattern: well-defined, high-volume work that requires consistency across many files.

Populating 192 plant entries with Wikipedia URLs took a single session. Each entry needed a species-level Wikipedia URL, not just the common name but the actual botanical article. Doing this manually would mean 192 browser searches, verifying each URL, and editing a 6,700-line TypeScript file without breaking the syntax. Claude Code handled it methodically, and PR #175 landed clean.

Migrating the companion planting system from legacy string arrays to ID-based references touched every single plant entry in the database, refactored the validation module from 270 to 195 lines, and deleted the entire normalisation module. Net reduction of 450 lines with cleaner, more maintainable code. PR #178 was a single coherent change that would have been a week of careful, error-prone manual work.

The UX polish batch (PRs #180-188) was nine pull requests in rapid succession: harvest date calculation fixes, cross-section navigation links, data validation for sharing, loading states, colour system standardisation across 33 files, accessibility touch targets, seed inventory integration, and disabled state indicators. Each PR was focused, tested, and merged independently. This kind of systematic improvement pass is where AI assistance shines — the work isn't intellectually complex, but it requires touching many files with precision and consistency.

The Zen design system colour migration is a good example of the detail level. PR #184 replaced hardcoded Tailwind colours across 33 files to use semantic design tokens: red became `zen-kitsune`, amber became `zen-bamboo`, blue became `zen-water`, emerald became `zen-moss`. Every instance, every file, consistent naming. This is exactly the kind of work that's mind-numbing for humans but trivial for AI.

## When it fails

Here's where honesty matters, because the failures are just as instructive as the successes.

The P2P sync saga spans PRs #108 through #119. I wanted devices to sync allotment data directly, no server required. We started with WebRTC via PeerJS, added STUN servers, debugged ICE connection failures, added logging, fixed duplicate connections, fixed already-open connections, added more logging, implemented full-state sync, fixed CSP headers for PeerJS, tried html5-qrcode for the QR scanning, and after twelve commits of increasingly desperate debugging... scrapped the entire approach.

The replacement? A simple upload-to-Redis, share-a-6-character-code flow. It took one PR (#119) and works perfectly. The lesson isn't that AI gave bad advice — I was the one who wanted P2P sync. The lesson is that AI is fast enough to make wrong decisions at scale. We burned twelve PRs building something that should never have been built, and the speed of AI development made it feel productive right up until it wasn't.

Progressive disclosure was another feature that sounded right in theory. New users would start with a simplified interface and gradually unlock features as they used the app. We built it, shipped it, and immediately discovered it confused users and broke e2e tests because the test runner couldn't access gated features. PR #163 removed the entire system. Sometimes the best thing you can build is a delete commit.

I also learned that Claude Code has real limitations with very large files. The vegetable database is 6,700 lines of TypeScript with 192 structured entries. Asking a smaller AI model (Haiku) to edit specific entries in that file reliably didn't work — it would lose track of position, break syntax, or resort to scripting approaches that corrupted the file structure. The larger model (Sonnet/Opus) handles it fine, but the cost difference is significant. Knowing which model to use for which task is a skill you develop through painful experience.

## The discipline required

The single most important thing I learned: AI amplifies your direction, good or bad. If you have clear taste and strong opinions about what your software should be, AI helps you realise that vision faster than you ever could alone. If you don't, it will happily build you a sprawling, over-engineered mess at tremendous speed.

The CLAUDE.md file encodes a design principle — "Simplicity First" — that I enforce ruthlessly. Every feature must justify its existence. If a page tries to solve multiple problems, break it apart or remove the less essential one. Don't add error handling for scenarios that can't happen. Don't create abstractions for one-time operations. Don't design for hypothetical future requirements.

This discipline manifests as willingness to delete. Over the project's life, we removed progressive disclosure, removed P2P sync, removed legacy dead code, removed an entire companion plant normalisation module, removed icons from navigation, removed guided tour auto-start behaviour. Each removal made the app better. AI makes it easy to add things; the human's job is knowing when to take them away.

I review every PR. Not skimming — actually reading the diff, understanding the change, checking that it fits the architecture. The CI pipeline catches syntax and test failures, but only a human catches "this feature is confusing" or "this doesn't feel right on mobile." The two mobile bugs we fixed today (horizontal scroll on the allotment grid, cramped add-area form) were found by me using the app on my phone, not by any automated test.

## The numbers

Here's the raw data from the git history:

The project spans from June 19, 2025 to February 16, 2026. There are 337 total commits, 165 of which (49%) are AI co-authored. In the pre-AI phase (June 2025), there were 23 commits in 2 days before the project went dormant. In the AI-assisted phase (December 30, 2025 onwards), 314 commits landed across 42 active development days.

The codebase is 51,333 lines of TypeScript/TSX. There are 192 plant entries in the vegetable database, each with growing windows, companion relationships, botanical names, and external references. The test suite includes 31 unit test files with 737 tests and 8 Playwright e2e test suites. There are 24 Architecture Decision Records and 16 schema migrations with automatic backward-compatible upgrades.

Monthly commit distribution tells the acceleration story: 23 in June 2025, then 37 across the entire July-November gap (sporadic maintenance), 41 in December (AI collaboration starts on the 30th), 219 in January 2026, and 54 in February so far.

I don't want to claim a specific multiplier ("10x faster!") because the comparison isn't clean. Without AI, I might have built something smaller and simpler, or I might have abandoned it entirely like so many side projects. What I can say is that the scope of what I built — a complete, tested, accessible PWA with a 192-entry plant database and an AI advisor — would not have been feasible as a solo side project without AI assistance. Not in seven weeks, probably not in seven months.

## What I'd tell someone starting this way

Start with guardrails, not features. Set up your CI pipeline, branch protection, and CLAUDE.md before you write your first AI-assisted line of code. The speed you gain from AI development is wasted if you spend it fixing mistakes that automated checks would have caught.

Have opinions. The AI doesn't have taste. It will build whatever you describe, exactly as you describe it. If your description is vague, the result will be mediocre. The best sessions were the ones where I knew exactly what I wanted and could articulate it precisely.

Keep a living plan document. Without one, each conversation starts from zero. With one, you can pick up exactly where you left off, even weeks later.

Be willing to throw things away. The sunk cost fallacy hits harder when AI helped you build something fast. You think "but it only took an afternoon" as if that makes a bad feature worth keeping. It doesn't. Delete it.

Learn which tasks to delegate and which to keep. Bulk data entry, systematic refactors, colour migrations, test scaffolding — all great for AI. Product decisions, UX judgement, "does this feel right" — all yours.

## What's next

Bonnie Wee Plot is live and I'm looking for testers, especially Scottish allotment gardeners who want a simple, private tool for planning their plot. It's a PWA — install it from the browser, no app store needed. Your data stays on your device.

The codebase is open source at [github.com/IsmaelMartinez/bonnie-wee-plot](https://github.com/IsmaelMartinez/bonnie-wee-plot). Future plans include user accounts, cloud persistence, and removing the BYO API key requirement for the AI advisor, but those depend on whether people actually use it. I'm done building features speculatively.

If you're interested in the AI-assisted development workflow, the repo itself is the best documentation. Every PR, every ADR, every commit message tells the story of how this was built. The CLAUDE.md file shows how I communicate project conventions to an AI. The git log shows the pace. The deleted features show the discipline.

The most surprising thing about building with AI isn't the speed. It's how much it forces you to clarify your own thinking. When your collaborator can execute anything you describe in minutes, you quickly learn the difference between a clear idea and a vague one. That clarity, more than any line of code, is the real output of this process.
