# AGENTS.md — Bridge Memory System Rules

## Objective
You are implementing a production-grade memory system for a multi-agent AI Bridge.

Follow the architecture defined in documentation (Sections 1–14).

---

## Core Rules

- Do NOT implement everything at once
- Work milestone by milestone
- Always follow clean architecture (separation of concerns)
- Prefer modular, testable code
- Do NOT skip steps (ingestion, retrieval, storage)

---

## Architecture Rules

- Memory must be agent-agnostic
- Use adapter pattern for agents
- Memory system must be separate from Bridge core
- Use hybrid storage (Relational + Vector)

---

## Coding Rules

- Write small, focused modules
- Avoid monolithic files
- Use clear naming (MemoryOrchestrator, IngestionPipeline, etc.)
- Add basic logging
- Add type safety (TypeScript or Python typing)

---

## Workflow Rules

For every task:

1. Understand requirement
2. Propose file structure
3. Implement minimal working version
4. Ensure it runs
5. Wait for next instruction

---

## DO NOT

- Do not build UI
- Do not over-engineer
- Do not skip storage layer
- Do not mix responsibilities

---

## OUTPUT FORMAT

Always provide:
- Files created/modified
- Code
- Short explanation