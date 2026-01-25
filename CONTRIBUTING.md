# Contributing to Bonnie Wee Plot

We welcome contributions!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/bonnie-wee-plot.git
   cd bonnie-wee-plot
   ```
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Start development:
   ```bash
   npm run dev
   ```

## Development Workflow

### Before Making Changes

- Run `npm run lint` to check code style
- Run `npm run type-check` to verify TypeScript
- Read `CLAUDE.md` for architecture context

### Making Changes

1. Create a feature branch
2. Follow existing code style
3. Run tests: `npm run test:all`
4. Commit with descriptive message

### Pull Requests

1. Ensure all tests pass
2. Update docs if needed
3. Submit PR with clear description

## Code Style

- TypeScript strict mode
- Tailwind CSS for styling
- Server Components where possible
- `'use client'` only when needed

## Testing

- Unit tests: `npm run test:unit`
- E2E tests: `npm run test`
- Both: `npm run test:all`

## Questions?

Open an issue for help or questions.
