# Checklist HQ

> **"Don’t write checklists. Fork them."**

Checklist HQ is the operating system for **Hybrid Intelligence**. It is the standard operating protocol for both human operators and AI agents. By treating SOPs as version-controlled code, we enable reliable execution across the carbon/silicon divide.

## 📚 Documentation Hub

### Core Philosophy
*   **[Manifesto](./MANIFESTO.md)**: The vision of **"Git for Process"** in an AI-first world. **Start here.**

### Implementation Guides
*   **[Agent Guide (AI)](./CLAUDE.md)**: The strict ruleset for AI assistance.
*   **[Design Philosophy](./DESIGN_PHILOSOPHY.md)**: Frontend architecture, design tokens, and UI principles.
*   **[Architecture](./ARCHITECTURE.md)**: Database schema, JSON models, and algorithms.
*   **[Product Roadmap](./ROADMAP.md)**: The path to Hybrid Teams (Humans + Agents).

## 🛠 Tech Stack (The "Ruthless MVP")

- **Frontend**: React 19 (Vite) + Tailwind CSS 4 + shadcn/ui
- **State**: Zustand (Local) + React Query (Server)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Drag & Drop**: @dnd-kit/core (Vertical list optimization)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Project

### Installation
1.  **Clone & Install**
    ```bash
    git clone https://github.com/yourusername/checklist-hq.git
    cd checklist-hq
    npm install
    ```

2.  **Environment Setup**
    Create `.env` based on `.env.example`:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

## License
MIT
