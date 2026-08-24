# Project Rules & Senior-Level Code Quality Standards

## 1. Reusable Component Architecture (DRY Principle)
- **Zero JSX Duplication**: Never hardcode repetitive `div` or `View` structures. Always extract repetitive UI elements into modular, reusable sub-components.
- **Single Responsibility**: Each component must do one thing well.

## 2. Strong TypeScript Typing & Props
- **Explicit Types**: Every component must have explicit TypeScript `interface` or `type` definitions for its Props.
- **No `any`**: Avoid using `any`. Define clear, structured schemas for data, API responses, and event handlers.

## 3. Dynamic Rendering & Performance Optimization
- **Array Mapping**: Always render list structures dynamically using `.map()` with stable, unique `key` props.
- **Memoization**: Use `useCallback` and `useMemo` for callbacks and heavy computations passed to child components.

## 4. Clean Architecture & Separation of Concerns
- **Logic vs View**: Keep API fetching, state management, and business logic cleanly separated from visual presentation components.
- **Custom Hooks**: Extract complex stateful or side-effect logic into reusable custom hooks (`use...`).
