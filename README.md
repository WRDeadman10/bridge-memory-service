# Bridge Memory Service

> Persistent memory layer for multi-agent AI workflows — gives your AI agents long-term recall across sessions.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## What Is This?

**Bridge Memory Service** is a standalone REST API that provides persistent memory to any AI agent or orchestrator. It was designed as a companion service for the [Codex-Aider Bridge](https://github.com/vinayak-vc/codex-aider-bridge-app) but works with any system that can make HTTP requests.

### The Problem

AI agents are stateless — every session starts from scratch. When an agent fixes a bug, discovers a pattern, or learns which approach works best for a specific codebase, that knowledge disappears the moment the session ends. The next session re-discovers the same things, wastes the same tokens, and makes the same mistakes.

### The Solution

Bridge Memory Service acts as an external brain:

```
AI Agent (any framework)
  ↓ POST /bridge/ingest   — "I fixed bug X by doing Y"
Memory Service
  ↓ classifies, embeds, stores
  
Next Session:
AI Agent
  ↓ POST /bridge/enhance  — "Fix the login timeout issue"
Memory Service
  ↓ searches past memories, injects relevant context
  ↓ returns: "[MEMORY CONTEXT] Previously fixed similar timeout by..."
  ↓ + "[USER PROMPT] Fix the login timeout issue"
AI Agent
  → makes better decisions with historical context
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express REST API                      │
│  /bridge/enhance  /bridge/ingest  /memory/*  /health     │
├─────────────────────────────────────────────────────────┤
│                   Core Intelligence                      │
│  MemoryMiddleware → QueryUnderstanding → TokenController │
│  PromptInjector ← SearchCache ← IngestionPipeline       │
├─────────────────────────────────────────────────────────┤
│                    Storage Layer                         │
│  ┌──────────────────┐    ┌───────────────────────┐      │
│  │  SQLite (always)  │    │  Qdrant (optional)    │      │
│  │  Relational store │    │  Vector similarity    │      │
│  │  Keyword search   │    │  Semantic search      │      │
│  └──────────────────┘    └───────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│                   Embedding Layer                        │
│  Ollama API (nomic-embed-text) → 1536-dim vectors       │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Why |
|---|---|
| **Hybrid storage** (SQLite + Qdrant) | SQLite for durability and keyword search; Qdrant for semantic similarity. Service works with SQLite alone if Qdrant is unavailable. |
| **Agent-agnostic** | Any AI agent (Claude, GPT, Ollama, custom) can use it — just HTTP POST/GET. |
| **Local-first** | All data stays on your machine. No cloud dependency. |
| **Graceful degradation** | Qdrant down? Falls back to SQLite keyword search. Embedding service down? Retries with backoff. |
| **Token-aware** | Never floods the prompt — `TokenController` trims memory context to fit within configurable limits. |

---

## Memory Types

The service classifies memories into three cognitive types:

| Type | Enum Value | Used For | Example |
|---|---|---|---|
| **Episodic** | `0` | Bug fixes, errors, debugging sessions | "Fixed OOM by reducing batch size to 32" |
| **Semantic** | `1` | Facts, architecture knowledge, conventions | "This project uses Flask + SQLite" |
| **Procedural** | `2` | How-to steps, build procedures, workflows | "Deploy by running `npm run build && npm start`" |

The `QueryUnderstanding` module automatically selects the best memory type based on the query:
- Queries with "error", "bug", "fix", "crash" → search **Episodic** memories
- Queries with "how", "steps", "implement", "create" → search **Procedural** memories
- Everything else → search all types

---

## Quick Start

### Prerequisites

| Requirement | Version | Required? |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | Yes |
| [Ollama](https://ollama.com) | any | Yes (for embeddings) |
| [Docker](https://docker.com) | any | No (only for Qdrant) |

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd bridge-memory-service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` as needed:

```env
PORT=3000                                    # API server port
SQLITE_PATH=./data/memory.db                 # SQLite database path
QDRANT_URL=http://localhost:6333             # Qdrant vector DB URL
QDRANT_COLLECTION=memories                   # Qdrant collection name
VECTOR_SIZE=1536                             # Embedding vector dimensions
EMBED_URL=http://localhost:11434/api/embeddings  # Ollama embedding endpoint
EMBED_MODEL=nomic-embed-text                 # Ollama embedding model
ENABLE_MEMORY=true                           # Master switch
MAX_MEMORY_TOKENS=800                        # Max tokens injected per prompt
ENABLE_TOOL_TRACKING=true                    # Track tool calls as memories
```

### 3. Start Dependencies

**Ollama** (required — for embeddings):
```bash
ollama serve
ollama pull nomic-embed-text
```

**Qdrant** (optional — for semantic search):
```bash
docker compose up -d
```

> **Without Qdrant**: The service runs in **SQLite-only mode** — memories are stored and searched via keyword matching. This is perfectly functional but lacks semantic similarity search. To explicitly disable vector search: set `ENABLE_VECTOR=false` in `.env`.

### 4. Run the Service

**Development** (with hot-reload via ts-node):
```bash
npm run dev
```

**Production**:
```bash
npm run build
npm start
```

The service will start on `http://localhost:3000` (or your configured `PORT`).

### 5. Verify

```bash
curl http://localhost:3000/health
# → {"status":"ok","service":"bridge-memory-service"}
```

---

## API Reference

### Bridge Integration Endpoints

These are the primary endpoints used by AI agents and the Codex-Aider Bridge.

#### `POST /bridge/enhance`

Enhance a prompt with relevant memory context. Call this **before** sending a prompt to your AI agent.

**Request:**
```json
{
  "prompt": "Fix the login timeout issue in auth.py",
  "agentName": "aider",
  "limit": 5
}
```

**Response:**
```json
{
  "enhancedPrompt": "[MEMORY CONTEXT]\n- Previously fixed auth timeout by increasing SESSION_TIMEOUT to 3600\n- auth.py uses Flask-Login with custom session backend\n\n[USER PROMPT]\nFix the login timeout issue in auth.py"
}
```

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | Yes | — | The user's original prompt |
| `agentName` | string | No | — | Name of the calling agent (for filtering) |
| `limit` | number | No | `5` | Max memory entries to retrieve |

#### `POST /bridge/ingest`

Store a new memory from a completed task. Call this **after** an AI agent successfully completes work.

**Request:**
```json
{
  "input": "Fix the login timeout issue in auth.py",
  "output": "Increased SESSION_TIMEOUT from 300 to 3600 in config.py. Added session.permanent = True in auth.py login route.",
  "agent": "aider"
}
```

**Response:**
```json
{
  "status": "ok"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `input` | string | Yes | The original task instruction |
| `output` | string | Yes | What the agent did (diff summary, result) |
| `agent` | string | Yes | Name of the agent that performed the work |

The ingestion pipeline automatically:
1. Classifies the memory type (episodic vs procedural) based on content
2. Generates a compact summary
3. Computes an embedding vector (if Qdrant is available)
4. Checks for near-duplicates (>0.9 cosine similarity → skips)
5. Stores to SQLite + Qdrant via async queue

---

### Low-Level Memory Endpoints

For direct memory management — typically used for debugging or custom integrations.

#### `POST /memory/save`

Save a memory entry directly (bypasses the ingestion pipeline).

**Request:**
```json
{
  "type": 0,
  "content": "The auth module uses bcrypt for password hashing",
  "summary": "Auth uses bcrypt",
  "tags": ["auth", "security"]
}
```

**Response:** `201 Created` with the full `MemoryEntry` object.

#### `GET /memory/search`

Search memories by keyword (SQLite) or semantic similarity (Qdrant).

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | string | Yes | — | Search query |
| `limit` | number | No | `10` | Max results |
| `type` | number | No | — | Filter by memory type (0=episodic, 1=semantic, 2=procedural) |

**Example:**
```bash
curl "http://localhost:3000/memory/search?query=auth%20timeout&limit=5&type=0"
```

**Response:** Array of `SearchResult` objects sorted by composite score.

#### `GET /health`

Health check endpoint.

```bash
curl http://localhost:3000/health
# → {"status":"ok","service":"bridge-memory-service"}
```

#### `GET /metrics`

Operational metrics (saves count, searches count).

```bash
curl http://localhost:3000/metrics
# → {"saves":42,"searches":156}
```

---

## Integration with Codex-Aider Bridge

The Bridge Memory Service was built as the memory backend for the [Codex-Aider Bridge](https://github.com/vinayak-vc/codex-aider-bridge-app). Here's how they connect:

### How It Works

```
Bridge starts a task
  ↓
Bridge calls POST /bridge/enhance with the task instruction
  ↓
Memory service returns enhanced prompt with relevant past context
  ↓
Bridge sends enhanced prompt to Aider (local LLM)
  ↓
Aider completes the task
  ↓
Bridge calls POST /bridge/ingest with {input, output, agent}
  ↓
Memory service stores the result for future sessions
```

### Python Client (in the Bridge)

The bridge includes a lightweight Python client at `memory/memory_client.py`:

```python
from memory.memory_client import enhance_prompt, ingest_result

# Before sending to Aider — enhance with memory
enhanced = enhance_prompt("Fix the auth bug in login.py")

# After Aider completes — store the result
ingest_result(
    input_text="Fix the auth bug in login.py",
    output_text="Added try/except around session.commit()",
    agent="aider"
)
```

### Configuration

Set the memory service URL in the bridge's environment:

```bash
# Windows
set MEMORY_SERVICE_URL=http://localhost:3000

# Unix
export MEMORY_SERVICE_URL=http://localhost:3000
```

The bridge automatically degrades gracefully if the memory service is unavailable — the original prompt is used unchanged, and ingestion is skipped with a warning.

---

## Project Structure

```
bridge-memory-service/
├── src/
│   ├── index.ts                    # Entry point — wires everything together
│   ├── api/
│   │   ├── bridge.routes.ts        # /bridge/enhance, /bridge/ingest
│   │   └── memory.routes.ts        # /memory/save, /memory/search, /health, /metrics
│   ├── config/
│   │   └── config.ts               # Zod-validated environment config
│   ├── core/
│   │   ├── types/
│   │   │   └── MemoryTypes.ts      # MemoryEntry, MemoryType enum, SearchResult
│   │   ├── IngestionPipeline.ts    # Classifies + saves memories via async queue
│   │   ├── IngestionQueue.ts       # FIFO async queue with error isolation
│   │   ├── MemoryMiddleware.ts     # Orchestrates enhance + ingest flows
│   │   ├── PromptInjector.ts       # Formats [MEMORY CONTEXT] + [USER PROMPT]
│   │   ├── QueryUnderstanding.ts   # Intent detection (debug/procedure/general)
│   │   ├── TokenController.ts      # Trims results to fit token budget
│   │   ├── SearchCache.ts          # TTL-based in-memory cache (60s default)
│   │   ├── RetryHelper.ts          # Generic async retry with exponential backoff
│   │   ├── ToolWrapper.ts          # Wraps any tool function with auto-ingestion
│   │   └── Metrics.ts              # Simple counter-based operational metrics
│   ├── embedding/
│   │   └── EmbeddingClient.ts      # Ollama embedding API client with retry
│   ├── storage/
│   │   ├── MemoryRepository.ts     # Unified save/search across SQLite + Qdrant
│   │   ├── relational/
│   │   │   └── SqliteClient.ts     # better-sqlite3 wrapper with auto-migration
│   │   └── vector/
│   │       └── VectorClient.ts     # Qdrant REST client (upsert, search, collection mgmt)
│   └── utils/
│       └── logger.ts               # Structured console logger with timestamps
├── tests/
│   ├── memory.test.ts              # MemoryRepository integration tests
│   ├── embedding.test.ts           # EmbeddingClient unit tests
│   ├── intelligence.test.ts        # QueryUnderstanding + TokenController tests
│   └── middleware.test.ts          # MemoryMiddleware end-to-end tests
├── data/
│   └── memory.db                   # SQLite database (auto-created)
├── docker-compose.yml              # Qdrant vector database
├── package.json
├── tsconfig.json
├── .env.example
└── AGENTS.md                       # AI agent coding guidelines
```

---

## Search Ranking

When both SQLite and Qdrant are available, search results are ranked by a **composite score**:

```
score = (semantic_similarity × 0.4)
      + (importance_score × 0.3)
      + (recency_score × 0.2)
      + (type_priority × 0.1)
```

Where:
- **semantic_similarity** — cosine similarity from Qdrant (0–1)
- **importance_score** — defaults to 0.5 (future: auto-adjust based on usage)
- **recency_score** — defaults to 1.0 (future: decay over time)
- **type_priority** — Episodic: 1.0, Semantic: 0.7, Procedural: 0.5

In SQLite-only mode (no Qdrant), ranking uses:
```
score = (importance_score × 0.5) + (recency_score × 0.3) + (type_priority × 0.2)
```

---

## Deduplication

The service prevents storing duplicate memories:

| Mode | Strategy |
|---|---|
| **Full mode** (Qdrant available) | Computes embedding of new content → searches Qdrant → if top match has >0.9 cosine similarity, the save is skipped |
| **SQLite-only mode** | Exact content match (`WHERE content = ?`) → if found, the save is skipped |

---

## Testing

```bash
npm test
```

Tests use an in-memory SQLite database and mock vector clients — no external services needed.

| Test File | Coverage |
|---|---|
| `memory.test.ts` | Save, search, duplicate detection |
| `embedding.test.ts` | Embedding client, retry logic |
| `intelligence.test.ts` | Query understanding, token trimming |
| `middleware.test.ts` | Full enhance + ingest pipeline |

---

## Running Modes

| Mode | Qdrant | Embedding | Search Type | Use Case |
|---|---|---|---|---|
| **Full** | ✅ Running | ✅ Running | Semantic similarity | Best quality — understands meaning, not just keywords |
| **SQLite-only** | ❌ Offline | ❌ Optional | Keyword (`LIKE`) | Zero-dependency mode — works everywhere |
| **Explicit disable** | `ENABLE_VECTOR=false` | ❌ Skipped | Keyword (`LIKE`) | When you explicitly don't want vector search |

The service auto-detects the running mode at startup and logs which mode it's using.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `SQLITE_PATH` | `./data/memory.db` | Path to SQLite database file |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant server URL |
| `QDRANT_COLLECTION` | `memories` | Qdrant collection name |
| `VECTOR_SIZE` | `1536` | Embedding vector dimensions |
| `EMBED_URL` | `http://localhost:11434/api/embeddings` | Ollama embedding API URL |
| `EMBED_MODEL` | `nomic-embed-text` | Ollama model for embeddings |
| `ENABLE_MEMORY` | `true` | Master switch to enable/disable memory |
| `MAX_MEMORY_TOKENS` | `800` | Max tokens of memory context injected per prompt |
| `ENABLE_TOOL_TRACKING` | `true` | Auto-track tool calls as memories |
| `ENABLE_VECTOR` | `true` | Set to `false` to force SQLite-only mode |

---

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.4 (strict mode) |
| Web framework | Express 4 |
| Relational DB | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Vector DB | [Qdrant](https://qdrant.tech) via [@qdrant/js-client-rest](https://github.com/qdrant/qdrant-js) |
| Embeddings | Ollama (`nomic-embed-text` by default) |
| Validation | [Zod](https://zod.dev) (config schema) |
| Testing | Jest + Supertest |
| IDs | UUID v4 |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Follow the coding rules in `AGENTS.md`
4. Write tests for new features
5. Run `npm test` to verify
6. Submit a pull request

---

## License

MIT

---

*Built as part of the [Codex-Aider Bridge](https://github.com/vinayak-vc/codex-aider-bridge-app) ecosystem — separating AI thinking from AI coding.*
