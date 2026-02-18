# Documentation Index

Welcome to Checklist HQ documentation. This index helps you find the right doc for your needs.

---

## Getting Started

| Document | Description |
|----------|-------------|
| [USER_GUIDE.md](./USER_GUIDE.md) | Complete user workflows - from sign-up to running checklists |
| [MCP_GUIDE.md](./MCP_GUIDE.md) | Connect AI tools (Claude, Cursor) to your checklists |

---

## Architecture & Development

| Document | Description |
|----------|-------------|
| [ORGS_ARCHITECTURE.md](./ORGS_ARCHITECTURE.md) | Technical architecture - data models, permissions, API design |
| [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) | What's been built - feature completion status |
| [CONSOLIDATED_ROADMAP.md](./CONSOLIDATED_ROADMAP.md) | Product roadmap and future plans |

---

## Quick Reference

### Running the App
```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Production build
npm run lint      # Run ESLint
npm run db:push   # Push database migrations
```

### Key Files (in root)
- `README.md` - Project overview
- `ARCHITECTURE.md` - Core data models and "Git for Process" logic
- `DESIGN_PHILOSOPHY.md` - Visual design tokens and UI patterns
- `CLAUDE.md` - AI agent context
- `AGENTS.md` - Developer guidelines for AI agents

---

## Need Help?

1. **For user questions** → Start with [USER_GUIDE.md](./USER_GUIDE.md)
2. **For technical questions** → Start with [ARCHITECTURE.md](../ARCHITECTURE.md)
3. **For AI integration** → Start with [MCP_GUIDE.md](./MCP_GUIDE.md)
4. **For contributing** → Read root `AGENTS.md`

---

*This folder contains supplementary documentation. Core project docs are in the root directory.*
