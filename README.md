# Crawler Sage 🔭

**Real-time codebase context for AI agents — powered by Repomix + Gitingest**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/items?itemName=pudiish.crawler-sage)

---

## The Problem

Every AI coding session starts cold. Your agent wastes **37+ tool calls** and **79K+ tokens** just figuring out where things are — before writing a single line of code.

## The Solution

Install Crawler Sage → it watches your code → your AI agent always has fresh context.

Crawler Sage combines **two best-in-class context engines** — [Repomix](https://github.com/yamadashy/repomix) and [Gitingest](https://github.com/cyclotruc/gitingest) — with a **real-time file watcher** that auto-regenerates `.context.md` on every code change.

## Features

- **Dual-engine context generation** — Repomix (full codebase dump) + Gitingest (smart extraction)
- **Cross-engine verification** — Compare outputs to catch missing files
- **Real-time file watcher** — Auto-regenerates context on save (debounced)
- **VS Code native** — Sidebar panel, status bar, command palette
- **Agent-agnostic** — Works with GitHub Copilot, Cursor, Aider, Claude Code

## Quick Start

1. Install from VS Code Marketplace
2. Open any project
3. Run `Cmd+Shift+P` → **Crawler Sage: Generate Context**
4. The file watcher starts automatically — your `.context.md` stays fresh

## Requirements

- **Node.js** (for Repomix via npx)
- **Python 3** + `pip install gitingest` (optional, for Gitingest engine)

## Commands

| Command | Description |
|---------|-------------|
| `Crawler Sage: Generate Context` | Run both engines and generate `.context.md` |
| `Crawler Sage: Toggle File Watcher` | Enable/disable auto-regeneration on file changes |
| `Crawler Sage: Compare Engine Outputs` | Side-by-side comparison of Repomix vs Gitingest |
| `Crawler Sage: Open Context File` | Open the generated `.context.md` |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `crawlerSage.watchEnabled` | `true` | Auto-regenerate on file changes |
| `crawlerSage.debounceMs` | `2000` | Delay before regeneration |
| `crawlerSage.outputFile` | `.context.md` | Output file name |
| `crawlerSage.engines` | `["repomix", "gitingest"]` | Active engines |
| `crawlerSage.repomixStyle` | `markdown` | Repomix output format |
| `crawlerSage.excludePatterns` | `["node_modules", ".git", ...]` | Ignored patterns |

## Architecture

```
VS Code Extension
├── File Watcher (auto-trigger on save)
├── Context Engine
│   ├── Repomix Runner (npx repomix)
│   ├── Gitingest Runner (python3)
│   └── Cross-Checker (compare file lists)
├── Sidebar (status + engine details)
└── Status Bar (watching / generating / error)
```

## How It Works

1. **Repomix** scans your entire codebase using Tree-sitter and dumps all files into a structured format
2. **Gitingest** independently extracts a directory tree and file contents
3. **Cross-checker** compares both file lists, reports overlap accuracy
4. **Merger** combines the best of both outputs into a single `.context.md`
5. **File watcher** re-runs this pipeline on every save (debounced to avoid spam)

## Contributing

```bash
git clone https://github.com/pudiish/crawler-sage.git
cd crawler-sage
npm install
npm run watch
# Press F5 in VS Code to launch Extension Development Host
```

## License

MIT — see [LICENSE](LICENSE)

---

*Crawler Sage — Because your AI agent deserves better than a cold start.*
