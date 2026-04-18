# Crawler Sage 🔭

**Instant codebase context for AI agents — powered by Repomix + Tree-sitter**

[![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)](https://marketplace.visualstudio.com/items?itemName=pudiish.crawler-sage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What It Does

One click → your entire codebase is indexed, compressed with Tree-sitter, and ready for any AI agent to consume. No more cold starts.

## Features

- **Repomix + Tree-sitter compression** — ~70% token reduction, machine-readable XML output
- **Interactive tree visualization** — Webview panel with search, file icons, stats dashboard  
- **Sidebar file tree** — Browse your indexed codebase structure with click-to-open
- **Real-time file watcher** — Auto-regenerates context on save
- **Agent-friendly output** — XML format optimized for LLM parsing and querying

## Quick Start

1. Install from VS Code Marketplace
2. Open any project
3. Click the Crawler Sage icon in the sidebar
4. Hit the ▶️ play button to generate context

## Commands

| Command | Description |
|---------|-------------|
| `Crawler Sage: Generate Context` | Index codebase with Repomix + Tree-sitter |
| `Crawler Sage: Visualize Codebase Tree` | Open interactive tree webview |
| `Crawler Sage: Open Context File` | Open the `.context.md` summary |
| `Crawler Sage: Open Raw Repomix Output` | Open full XML/MD output |
| `Crawler Sage: Toggle File Watcher` | Enable/disable auto-regeneration |

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `outputStyle` | `xml` | Output format (`xml`, `markdown`, `plain`) |
| `compress` | `true` | Tree-sitter compression |
| `watchEnabled` | `true` | Auto-regenerate on file changes |
| `debounceMs` | `2000` | Delay before regeneration |
| `outputFile` | `.context.md` | Summary file name |

## Requirements

- **Node.js** (for Repomix via npx)

## License

MIT
