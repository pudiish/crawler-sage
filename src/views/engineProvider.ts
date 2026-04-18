import * as vscode from 'vscode';
import { ContextEngine } from '../engine/contextEngine';

export class EngineProvider implements vscode.TreeDataProvider<EngineItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<EngineItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private contextEngine: ContextEngine) {
        contextEngine.onDidUpdate(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: EngineItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: EngineItem): EngineItem[] {
        if (!element) {
            return this.getRootItems();
        }
        return this.getEngineDetails(element.engineName);
    }

    private getRootItems(): EngineItem[] {
        const result = this.contextEngine.lastResult;
        if (!result) {
            return [new EngineItem('No data', '', 'info', false)];
        }

        return result.engines.map(engine => {
            const icon = engine.error ? 'error' : 'check';
            const label = engine.error
                ? `${engine.engine} (error)`
                : `${engine.engine} — ${engine.fileCount} files`;
            const item = new EngineItem(label, engine.engine, icon, true);
            return item;
        });
    }

    private getEngineDetails(engineName: string): EngineItem[] {
        const result = this.contextEngine.lastResult;
        if (!result) { return []; }

        const engine = result.engines.find(e => e.engine === engineName);
        if (!engine) { return []; }

        const items: EngineItem[] = [];

        if (engine.error) {
            items.push(new EngineItem(`Error: ${engine.error}`, '', 'error', false));
            return items;
        }

        items.push(new EngineItem(`Files: ${engine.fileCount}`, '', 'file', false));
        items.push(new EngineItem(`Tokens: ~${engine.tokenCount.toLocaleString()}`, '', 'symbol-number', false));
        items.push(new EngineItem(`Duration: ${engine.duration}ms`, '', 'clock', false));

        return items;
    }
}

class EngineItem extends vscode.TreeItem {
    constructor(
        label: string,
        public readonly engineName: string,
        icon: string,
        expandable: boolean
    ) {
        super(label, expandable
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None
        );
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}
