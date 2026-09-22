---
name: test-suite-planner
description: Plans a risk-based test suite for a user story in Gherkin and stores it in the repository. Use when explicitly invoked (for example /test-suite-planner) or when the user asks to plan test scenarios before implementation.
disable-model-invocation: true
---

# Test Suite Planner

Plan a test suite in Gherkin and persist it as a repo document. Do not implement tests or run red-green loops here.

## Hard rules

- Plan only: analysis and test-suite specification.
- English for Gherkin scenarios unless the user requests another language.
- Repo-first output: write or update `docs/test-suites/<feature-slug>.md`.
- GitHub is optional: create/update issue only if the user explicitly asks.
- Confirm every write before creating or editing tracking artifacts.
- Gherkin is specification, not executable Cucumber contract by default.

## Workflow

Copy and track:

```
Progress:
- [ ] 1. Orient
- [ ] 2. Resolve user story
- [ ] 3. Map existing coverage
- [ ] 4. Propose suite and confirm
- [ ] 5. Persist in repo
- [ ] 6. Optional tracker sync
```

### 1. Orient

Collect context from branch, recent commits, relevant diffs, related issues, and current conversation.

### 2. Resolve user story

Identify one canonical user story source (issue, PRD file, or chat decision). If sources conflict, ask the user to pick.

### 3. Map existing coverage

Summarize what is already covered and the highest-risk gaps by seam.

### 4. Propose suite and confirm

Define seams, priorities, and slice order. Produce one Feature with tagged Scenarios:

- Layer tag: `@unit` or `@integration` or `@security` or `@e2e`
- Priority tag: `@critical` or `@high` or `@medium`

Use `Given`, `When`, `Then`, `And`, `But`.

### 5. Persist in repo

Write/update `docs/test-suites/<feature-slug>.md` using this template:

```markdown
# Test Suite: <Feature name>

## User Story Source
- <issue/file/link>

## Seams Under Test
- Seam 1
- Seam 2

## Coverage Notes
- Existing coverage summary
- Key gaps

## Slice Order
1. Slice 1
2. Slice 2

## Gherkin
Feature: <feature name>

  @integration @critical
  Scenario: <scenario name>
    Given ...
    When ...
    Then ...
```

### 6. Optional tracker sync

If the user asks for GitHub tracking, propose title/body/metadata first, then create or update the issue after explicit approval. The issue should link back to the repo spec file.

## Out of scope

- Implementing tests
- Running test suites
- Closing tracker issues based on implementation status
