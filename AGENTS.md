This project is a restaurant operating system — not just a marketing website. It serves two audiences from one codebase: **customers** (public website) and **staff** (waiter/kitchen dashboards). Both share the same database and real-time data.

Never make a design or architectural decision without checking the brand design philosophy in `CONTEXT.md`.

## Agent skills

### Issue tracker

Issues live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Labels use the default five canonical names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Core Priority & Teaching

- **Primary Goal**: Learning #1, Product Shipped #2.
- **Teaching Loop**: The user uses `/teach` before implementation (to build conceptual understanding) and after implementation (to reflect, reinforce storage strength, and document learning records in `teaching/learning-records/`).
- **Teaching Philosophy — Informed Knowledge & Informed Context**:
  - **Informed Context**: Establish the restaurant domain context naturally (why Sembilu needs this feature, operational risks, and system placement) through an intuitive, story-driven overview — without rigid or artificial "What/Why/How" headers.
  - **Informed Knowledge**: Transition smoothly from domain context into line-by-line code walk-throughs. Every line of code explained must connect back to the domain context, accompanied by a plain-English glossary of technical terms (`interface`, `middleware`, `type guard`, `next()`).
  - **Integrated Learning Unit**: Context and code feed into each other so the user gains a unified, deep understanding of both the software architecture and the implementation details.


