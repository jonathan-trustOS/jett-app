# Jett

**Rocket fuel for your imagination.**

The simplest app creator in existence. Describe what you want, and Jett builds it step by step.

## Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start development
npm run dev
```

### Scripts

- `npm run dev` - Start Vite dev server
- `npm run electron:dev` - Start Electron + Vite together
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
jett/
├── electron/
│   ├── main/           # Electron main process
│   └── preload/        # Preload scripts (bridge)
├── src/
│   ├── components/     # React components
│   ├── styles/         # CSS/Tailwind
│   ├── App.tsx         # Main app component
│   └── main.tsx        # React entry point
├── index.html          # HTML entry
└── package.json
```

## Tech Stack

- **Electron** - Desktop shell
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling

---

*Built with simplicity in mind.*
