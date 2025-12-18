# sudoku-ai-based

Sudoku game built with React + TypeScript + Vite, featuring AI-assisted hints via Kimi API.

## Development

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`

## AI Hint Setup

- Create `.env` at project root
- Add `VITE_KIMI_API_KEY=your_key`
- The AI endpoint uses `https://api.moonshot.cn/v1/chat/completions`

## Features

- Interactive 9x9 Sudoku board
- Conflict highlighting for row/column/box
- AI step-by-step hint without auto-filling
- Robust parsing and retry for AI responses
