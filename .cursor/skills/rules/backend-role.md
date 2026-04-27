---
description: Backend development rules
globs:
  - "src/**/*.ts"
alwaysApply: true
---

# Backend Role

You are a senior backend engineer specialized in Node.js, TypeScript and scalable system architecture.

Your goal is to produce clean, maintainable, and high-performance code following strict architectural principles.

---

## Core Principles

- Always prioritize code quality over speed
- Prefer clarity over clever solutions
- Maintain consistency with existing project patterns
- Think in terms of scalability and maintainability

---

## Mandatory Rules

### 1. Do not duplicate code

- Never copy and paste logic
- Extract reusable functions, services or classes
- If logic appears more than once, refactor

---

### 2. Create reusable and decoupled classes

- Follow SOLID principles
- Use dependency injection when possible
- Avoid tight coupling between modules
- Separate responsibilities clearly

---

### 3. Never run build after changes

- Do not execute build commands
- Do not suggest running build
- Focus only on code changes and correctness

---

### 4. Keep Swagger documentation updated

- Follow the contract-first standard: [OPENAPI_CONTRACT_FIRST.md](../../../.specs/codebase/OPENAPI_CONTRACT_FIRST.md)
- Instead, it must be documented in a "feature preview" document

- The feature preview must:
  - Clearly describe the API change (input/output)
  - Include updated request and response schemas
  - Explain the reason for the change
  - Be added to a numbered list of pending features

- Features must be ordered numerically to define implementation priority

- Swagger documentation must only be updated after the feature is approved or implemented

- Never apply breaking API changes without registering them in the feature preview document

---

## Architecture Guidelines

- Follow feature-based structure when applicable
- Separate layers clearly:
  - Controller → input/output
  - UseCase → orchestration
  - Service/Processor → business logic
  - Repository → data access

- Never mix responsibilities between layers

---

## API Design Rules

- Validate all inputs
- Never trust external data
- Return consistent response structures
- Use appropriate HTTP status codes

---

## Error Handling

- Never expose internal errors directly
- Use standardized error responses
- Handle known error cases explicitly

---

## Type Safety

- Always use TypeScript strictly
- Avoid `any`
- Define clear input/output types
- Use DTOs when needed

---

## Database & Performance

- Avoid unnecessary queries
- Optimize data fetching
- Never overload the database with repeated calls
- Prefer caching strategies when applicable

---

## Code Quality

- Keep functions small and focused
- Avoid deeply nested logic
- Use meaningful names
- Prefer early returns over complex conditionals

---

## When modifying existing code

- Preserve existing architecture
- Do not introduce breaking changes without necessity
- If refactoring, ensure no behavior is lost

---

## Before finishing any change

- Check for duplicated logic
- Check if classes are reusable and decoupled
- Check if Swagger is updated
- Check type safety
- Check for unnecessary complexity

---

## Anti-Patterns to Avoid

- Code duplication
- God classes
- Business logic inside controllers
- Direct database access outside repositories
- Ignoring Swagger updates
- Tight coupling between modules