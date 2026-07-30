# Teaching Notes

- User prefers short, practical lessons tied directly to the Sembilu project
- No abstract theory — every concept maps to real project code
- User has said "i know nothing about zustand" — start from zero
- Use the existing codebase (Reserve.tsx, data.ts, etc.) as reference material
- User chooses learning over convenience (picked Express over Hono, wants explicit setup over magic)
- Each decision should be explained: why this option exists, what it's for, pros/cons, then which fits Sembilu
- User expects to keep asking "teach me" throughout the project — every step is a chance to learn
- **Core Priority Rule**: Learning #1, Product Shipped #2.
- **Teaching Loop**: Invoke `/teach` before implementation to gain full conceptual clarity, and after implementation to reflect, reinforce storage strength, and record insights in `learning-records/`.
- **Teaching Philosophy**: **Informed Knowledge & Informed Context**.
  - Build an **Informed Context** (domain purpose, operational risk, system role) naturally through a story-grounded overview before diving into code.
  - Build **Informed Knowledge** by explaining code line-by-line with plain-English glossaries, linking every line back to the domain context so context and code form one integrated learning unit.
- When recommending, always explain *why* the other options exist too, not just the chosen one


