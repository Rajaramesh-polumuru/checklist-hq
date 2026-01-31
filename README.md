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

## Tech Stack (The "Ruthless MVP")

- **Frontend**: React (Vite) + Tailwind CSS + shadcn/ui
- **State**: Zustand (for high-performance, transient editor state)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Drag & Drop**: @dnd-kit/core (Vertical list optimization)

## Getting Started

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

3.  **Database Migration**
    Run the SQL scripts in `supabase/migrations` against your Supabase SQL Editor.

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## Roadmap

- **Phase 1: The Foundation** (Current)
    - Editor with nested indentation (Tab/Shift+Tab)
    - "Git-like" Schema Implementation
    - Forking Mechanism (Deep Copy)

- **Phase 2: The Network**
    - Public ecosystem
    - "Forks per User" metrics

- **Phase 3: The Enterprise**
    - Upstream Merging
    - Role-Based Access Control (RBAC)

## License
MIT
