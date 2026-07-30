# Project layout options understood

The user learned about three project layout patterns: two folders with single package.json (Option A), monorepo with workspaces (Option B), and flat everything in src/ (Option C). The deciding factors for Sembilu: single developer, existing src/ should not be restructured, minimal tooling overhead, and learning-focused project.

**Implication:** Option A (two folders, one package.json) is the right choice. Server code goes in `/server`, client stays in `/src`. This is the simplest path forward.
