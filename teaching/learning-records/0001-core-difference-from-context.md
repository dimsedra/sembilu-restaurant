# Zustand vs React Context: core conceptual difference established

The user was introduced to Zustand's core API (`create`, `set`, selectors) and compared it to React Context + useReducer. The key insight they engaged with: Zustand avoids provider nesting and enables selector-based subscriptions, so components only re-render when their specific slice of state changes — unlike Context where every consumer re-renders on any change.

**Evidence:** User looked at `Reserve.tsx` to identify what state should be global vs local.

**Implications:** Lesson 2 can assume understanding of the basic `create` pattern and can focus on building a concrete cart store for Sembilu.
