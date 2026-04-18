import * as vscode from 'vscode';
import { ContextEngine } from '../engine/contextEngine';
import { FileNode } from '../types';

export class TreeWebviewProvider {
    private panel: vscode.WebviewPanel | null = null;

    constructor(
        private contextEngine: ContextEngine,
        private extensionUri: vscode.Uri
    ) {
        contextEngine.onDidUpdate(() => {
            if (this.panel) {
                this.updateContent();
            }
        });
    }

    show(): void {
        if (this.panel) {
            this.panel.reveal();
            this.updateContent();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'crawlerSageTree',
            'Crawler Sage — Codebase Tree',
            vscode.ViewColumn.Beside,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        this.panel.onDidDispose(() => { this.panel = null; });
        this.updateContent();
    }

    private updateContent(): void {
        if (!this.panel) { return; }
        const result = this.contextEngine.lastResult;
        if (!result) {
            this.panel.webview.html = this.getEmptyHtml();
            return;
        }
        this.panel.webview.html = this.getHtml(result.result.tree, result);
    }

    private getEmptyHtml(): string {
        return `<!DOCTYPE html>
<html><body style="font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 20px;">
<h2>No context generated yet</h2>
<p>Run <code>Crawler Sage: Generate Context</code> from the command palette.</p>
</body></html>`;
    }

    private getHtml(tree: FileNode, result: any): string {
        const treeJson = JSON.stringify(tree);
        return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: var(--vscode-font-family, 'Segoe UI', sans-serif);
    font-size: 13px;
    color: var(--vscode-foreground, #ccc);
    background: var(--vscode-editor-background, #1e1e1e);
    padding: 16px;
}
.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
}
.stat-card {
    background: var(--vscode-sideBar-background, #252526);
    border: 1px solid var(--vscode-panel-border, #333);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
}
.stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--vscode-textLink-foreground, #4fc1ff);
}
.stat-label {
    font-size: 11px;
    opacity: 0.7;
    margin-top: 4px;
}
h2 {
    margin: 16px 0 8px;
    font-size: 14px;
    font-weight: 600;
}
.search-box {
    width: 100%;
    padding: 6px 10px;
    margin-bottom: 12px;
    background: var(--vscode-input-background, #3c3c3c);
    color: var(--vscode-input-foreground, #ccc);
    border: 1px solid var(--vscode-input-border, #555);
    border-radius: 4px;
    font-size: 13px;
    outline: none;
}
.search-box:focus {
    border-color: var(--vscode-focusBorder, #007acc);
}
.tree { padding-left: 0; }
.tree ul { padding-left: 18px; list-style: none; }
.tree li { padding: 2px 0; }
.node {
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 4px;
    border-radius: 3px;
    user-select: none;
}
.node:hover { background: var(--vscode-list-hoverBackground, #2a2d2e); }
.node.dir { font-weight: 500; }
.node.file { opacity: 0.85; }
.node .icon { width: 16px; text-align: center; font-size: 14px; }
.node .count { font-size: 11px; opacity: 0.5; margin-left: 4px; }
.hidden { display: none; }
.highlight { background: var(--vscode-editor-findMatchHighlightBackground, #ea5c0055); }
</style>
</head>
<body>
<div class="stats">
    <div class="stat-card">
        <div class="stat-value">${result.totalFiles}</div>
        <div class="stat-label">Files</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">${(result.totalTokens / 1000).toFixed(1)}K</div>
        <div class="stat-label">Tokens</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">${result.result.duration}ms</div>
        <div class="stat-label">Duration</div>
    </div>
    <div class="stat-card">
        <div class="stat-value">${new Date(result.timestamp).toLocaleTimeString()}</div>
        <div class="stat-label">Last Update</div>
    </div>
</div>

<h2>Codebase Tree</h2>
<input type="text" class="search-box" placeholder="Search files..." id="search">
<div class="tree" id="tree"></div>

<script>
const tree = ${treeJson};

function renderNode(node, container) {
    if (!node.children || node.children.length === 0) return;
    const ul = document.createElement('ul');
    for (const child of node.children) {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.className = 'node ' + child.type;
        
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = child.type === 'directory' ? '📁' : getFileIcon(child.name);
        
        const name = document.createElement('span');
        name.textContent = child.name;
        name.className = 'name';
        
        span.appendChild(icon);
        span.appendChild(name);
        
        if (child.type === 'directory' && child.children) {
            const count = document.createElement('span');
            count.className = 'count';
            count.textContent = '(' + countFiles(child) + ')';
            span.appendChild(count);
            
            span.addEventListener('click', () => {
                const sub = li.querySelector(':scope > ul');
                if (sub) sub.classList.toggle('hidden');
            });
        }
        
        li.appendChild(span);
        if (child.children) {
            renderNode(child, li);
        }
        ul.appendChild(li);
    }
    container.appendChild(ul);
}

function countFiles(node) {
    let c = 0;
    if (node.children) {
        for (const ch of node.children) {
            if (ch.type === 'file') c++;
            else c += countFiles(ch);
        }
    }
    return c;
}

function getFileIcon(name) {
    const ext = name.split('.').pop()?.toLowerCase();
    const icons = {
        ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
        py: '🐍', rs: '🦀', go: '🔵', java: '☕',
        html: '🌐', css: '🎨', scss: '🎨',
        json: '📋', yaml: '📋', yml: '📋', toml: '📋',
        md: '📝', sh: '⚙️', sql: '🗃️',
        png: '🖼️', jpg: '🖼️', svg: '🖼️', webp: '🖼️',
        vue: '💚', svelte: '🧡'
    };
    return icons[ext] || '📄';
}

const treeEl = document.getElementById('tree');
renderNode(tree, treeEl);

// Search
document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const nodes = treeEl.querySelectorAll('.node');
    const lists = treeEl.querySelectorAll('ul');
    
    if (!q) {
        nodes.forEach(n => { n.classList.remove('highlight'); n.closest('li').style.display = ''; });
        lists.forEach(l => l.classList.remove('hidden'));
        return;
    }
    
    // Hide all first
    treeEl.querySelectorAll('li').forEach(li => li.style.display = 'none');
    nodes.forEach(n => n.classList.remove('highlight'));
    
    // Show matches and their ancestors
    nodes.forEach(n => {
        const name = n.querySelector('.name')?.textContent?.toLowerCase() || '';
        if (name.includes(q)) {
            n.classList.add('highlight');
            let el = n.closest('li');
            while (el) {
                el.style.display = '';
                const parentUl = el.parentElement;
                if (parentUl) parentUl.classList.remove('hidden');
                el = parentUl?.closest('li') || null;
            }
        }
    });
});
</script>
</body>
</html>`;
    }
}
