# Checklist HQ

> **"Don’t write checklists. Fork them."**

Checklist HQ is the strategic blueprint for the "GitHub for Process" ecosystem. It moves beyond simple to-do lists to a platform for the **standardization of excellence**. By treating Standard Operating Procedures (SOPs) not as static documents but as dynamic, versioned code repositories, we unlock a mechanism for distributed process improvement.

## The Core Concept
The market has fundamentally misunderstood operational work. The challenge isn't remembering to do a task; it's knowing the *optimal* way to perform it.
Checklist HQ leverages the mental model of software development—version control, forking, and merging—to revolutionize business operations.

- **Repositories**: Processes are code-like repositories, not docs.
- **Commits**: Every change is an immutable snapshot.
- **Forks**: Don't start from a blank page. Fork an existing process and adapt it.
- **Runs**: Execute specific versions of a process with full auditability.

## 📚 Documentation Hub

*   **[Agent Guide (AI)](./CLAUDE.md)**: The strict ruleset for AI assistance.
*   **[Design Philosophy](./DESIGN_PHILOSOPHY.md)**: Frontend architecture, design tokens, and UI principles.
*   **[Architecture](./ARCHITECTURE.md)**: Database schema, JSON models, and "Git-like" algorithms.
*   **[Product Roadmap](./ROADMAP.md)**: Vision and phased execution plan.

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
