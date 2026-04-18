# Crawler Sage — V1 Product Summary

> **Version:** v1.0.0-alpha  
> **Date:** April 18, 2026  
> **Author:** Ishwar Swarnapudi  
> **License:** MIT  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Journey: What Came Before](#journey-what-came-before)
3. [Market Research](#market-research)
4. [Product Vision: Crawler Sage](#product-vision-crawler-sage)
5. [Architecture](#architecture)
6. [V1 Feature Set](#v1-feature-set)
7. [Roadmap](#roadmap)

---

## 1. Executive Summary

**Crawler Sage** is an open-source VS Code extension that provides real-time, always-fresh codebase context for AI coding agents (GitHub Copilot, Cursor, Aider, etc.). It combines two best-in-class context generators — **Repomix** and **Gitingest** — with a file watcher that auto-regenerates context on every code change, so your AI assistant never works blind.

**The problem:** AI agents waste 37+ tool calls and 79K+ tokens exploring a codebase before writing a single line of code. Every session starts cold.

**The solution:** Crawler Sage watches your code, generates structured context using dual engines, cross-checks for accuracy, and keeps a `.context.md` file always fresh — ready for any AI agent.

---

## 2. Journey: What Came Before

### Phase 1: Crawler Agent (Python CLI Tool)

**What it was:**  
A Python-based codebase intelligence agent that parsed source files using AST, built knowledge graphs, and generated `.context.md` files for AI consumption.

**Tech Stack:**  
- Python 3.12, `ast` module, `pyyaml`, `python-hcl2`
- Parsers: Python AST, YAML (GitHub Actions, Docker Compose, K8s), Terraform (HCL2)
- Output: Knowledge graph (nodes/edges) → rendered to `.context.md`

**Results on test project:**  
- On its own Python codebase: 42 nodes, 58 edges ✅
- On a MERN stack project (`retro-tv-mern`): **Only 2 files found** (1 Python, 1 YAML) ❌

**Packaging:**  
- Installable Python package via `pyproject.toml`
- CLI entry point: `crawler-agent analyze <path>`
- Dockerized and pushed to Docker Hub: `pudiish/crawler-agent:latest`

**Verdict:** Works for Python/YAML/Terraform projects only. Completely fails on JavaScript, TypeScript, React, Go, Rust, Java, and every other language.

### Phase 2: Discovery of Repomix

Searched for better tools and found **Repomix** (23.6K stars, MIT):
- Ran on the same MERN project: **180 files, 314,929 tokens**
- Tree-sitter based compression (~70% token reduction)
- Supports XML, Markdown, JSON output
- Has MCP server mode
- Security scanning built-in

**Repomix vs Crawler Agent on `retro-tv-mern`:**

| Metric | Crawler Agent | Repomix |
|--------|--------------|---------|
| Files found | 2 | 180 |
| Languages | Python/YAML only | All |
| Token output | ~500 | 314,929 |
| Time | ~2s | ~5s |

### Phase 3: Competitive Research

Evaluated the full landscape of codebase context tools:

| Tool | Stars | Type | Languages | Real-time? | VS Code? |
|------|-------|------|-----------|-----------|----------|
| **Repomix** | 23.6K | CLI + MCP | All (Tree-sitter) | No | No (Runner ext exists) |
| **Gitingest** | 14.4K | CLI + Web + SDK | All | No | No |
| **code2prompt** | 7.3K | CLI + MCP (Rust) | All | No | No |
| **Stacklit** | 50 | CLI + MCP (Go) | 11 (Tree-sitter) | Git hook | No |
| **CodeCortex** | 5 | CLI + MCP (TS) | 27 (Tree-sitter) | Git hook | No |
| **Ctxo** | 25 | CLI + MCP (TS) | TS/Go/C# deep | File watcher | No |
| **Repomix Runner** | 13K installs | VS Code ext | All (via Repomix) | Manual only | **Yes** |

**Key Finding:** No tool combines dual-engine context generation + real-time file watching + VS Code extension + marketplace publishing.

---

## 3. Market Research

### The Gap in the Market

| Capability | Stacklit | CodeCortex | Ctxo | Repomix Runner | **Crawler Sage** |
|-----------|----------|------------|------|----------------|-----------------|
| Full codebase packing | ❌ (index only) | ❌ (index only) | ❌ (graph only) | ✅ | ✅ |
| Structural analysis | ✅ | ✅ | ✅ | ❌ | ✅ |
| Dual-engine cross-check | ❌ | ❌ | ❌ | ❌ | ✅ |
| Real-time file watcher | ❌ | ❌ | ✅ | ❌ | ✅ |
| VS Code extension | ❌ | ❌ | ❌ | ✅ | ✅ |
| Auto-update on save | ❌ | ❌ | ✅ | ❌ | ✅ |
| Token-optimized output | ✅ (~250) | ✅ (~4K) | ❌ | ❌ | ✅ |
| Open source / Marketplace | ❌ | ❌ | ❌ | ✅ | ✅ |

### Why Crawler Sage is Different

1. **Dual-engine verification** — Runs both Repomix (full dump) and Gitingest (smart extraction), cross-checks results for accuracy
2. **Real-time, not on-demand** — File watcher triggers re-generation on save, not just on manual command or git commit
3. **VS Code native** — Sidebar panel, status bar, settings UI, marketplace distribution
4. **Agent-agnostic** — Outputs `.context.md` that works with Copilot, Cursor, Aider, Claude Code, or any LLM

---

## 4. Product Vision: Crawler Sage

### Mission Statement
> Make every AI coding agent instantly productive by providing always-fresh, verified codebase context — zero setup, zero maintenance.

### Target Users
- Developers using GitHub Copilot, Cursor, or Aider daily
- Teams working on large codebases (1K+ files)
- Open source maintainers who want contributors' AI tools to understand their repo

### Core Value Proposition
Install the extension → it watches your code → your AI agent always has fresh context.

---

## 5. Architecture

```
┌──────────────────────────────────────────────────────┐
│                  VS Code Extension                    │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ File     │  │ Command  │  │ Sidebar Panel     │  │
│  │ Watcher  │  │ Palette  │  │ (Status + Config) │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │              │                                │
│       ▼              ▼                                │
│  ┌─────────────────────────────┐                     │
│  │     Context Engine          │                     │
│  │                             │                     │
│  │  ┌─────────┐ ┌──────────┐  │                     │
│  │  │ Repomix │ │Gitingest │  │                     │
│  │  │ Runner  │ │ Runner   │  │                     │
│  │  └────┬────┘ └────┬─────┘  │                     │
│  │       │           │        │                     │
│  │       ▼           ▼        │                     │
│  │  ┌─────────────────────┐   │                     │
│  │  │  Cross-Checker /    │   │                     │
│  │  │  Merge Engine       │   │                     │
│  │  └─────────┬───────────┘   │                     │
│  └────────────┼───────────────┘                     │
│               ▼                                      │
│  ┌─────────────────────────┐                        │
│  │  .context.md (output)   │                        │
│  │  Always fresh, verified │                        │
│  └─────────────────────────┘                        │
└──────────────────────────────────────────────────────┘
```

### Tech Stack
- **Language:** TypeScript
- **Framework:** VS Code Extension API
- **Engines:** Repomix (via npx), Gitingest (via Python subprocess)
- **Bundler:** esbuild
- **Package Manager:** npm
- **Testing:** Mocha + VS Code test runner

---

## 6. V1 Feature Set

### Core Features (v1.0)
- [x] Dual-engine context generation (Repomix + Gitingest)
- [x] File watcher with debounced auto-regeneration
- [x] Cross-check engine comparing file trees from both tools
- [x] `.context.md` output — always up-to-date
- [x] VS Code sidebar panel showing status + last update time
- [x] Status bar indicator (watching / generating / error)
- [x] Command palette commands (Generate, Toggle Watch, Compare Engines)
- [x] Configuration via VS Code settings

### Settings
| Setting | Default | Description |
|---------|---------|-------------|
| `crawlerSage.watchEnabled` | `true` | Enable/disable file watcher |
| `crawlerSage.debounceMs` | `2000` | Debounce delay before regeneration |
| `crawlerSage.outputFile` | `.context.md` | Output file path |
| `crawlerSage.engines` | `["repomix", "gitingest"]` | Which engines to run |
| `crawlerSage.repomixStyle` | `markdown` | Repomix output style |
| `crawlerSage.excludePatterns` | `["node_modules", ".git"]` | Patterns to exclude |

---

## 7. Roadmap

### v1.0 — Foundation (Current)
- Dual-engine context generation
- File watcher + auto-update
- VS Code sidebar + status bar
- Marketplace publishing

### v1.1 — Intelligence
- Token count display and budget management
- Smart diffing (only regenerate changed sections)
- Engine accuracy scoring dashboard

### v1.2 — Integrations
- MCP server mode (serve context to any MCP client)
- GitHub Actions for CI context freshness checks
- `.cursorrules` and `CLAUDE.md` auto-injection

### v2.0 — AI-Native
- LLM-powered context summarization
- Semantic search over context
- Multi-repo / monorepo workspace support
- Context sharing via URL (like gitingest.com)

---

## Appendix: Artifacts from Previous Versions

| Artifact | Location | Status |
|----------|----------|--------|
| Crawler Agent (Python) | `crawler-agent/` | Archived — superseded by Crawler Sage |
| Docker Image | `pudiish/crawler-agent:latest` | Published on Docker Hub |
| Repomix test output | `retro-tv-mern/repomix-output.md` | Reference only |
| Portfolio site | `porfolio/index.html` | Active |

---

*Crawler Sage — Because your AI agent deserves better than a cold start.*
