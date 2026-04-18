import * as vscode from 'vscode';
import { ContextEngine } from '../engine/contextEngine';

export class StatusProvider implements vscode.TreeDataProvider<StatusItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<StatusItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private contextEngine: ContextEngine) {
        contextEngine.onDidUpdate(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: StatusItem): vscode.TreeItem {
        return element;
    }

    getChildren(): StatusItem[] {
        const result = this.contextEngine.lastResult;
        if (!result) {
            return [
                new StatusItem('$(zap) Generate context to get started', '', 'crawlerSage.generate')
            ];
        }

        return [
            new StatusItem(
                `$(file) ${result.totalFiles} files`,
                `Indexed ${result.totalFiles} files`
            ),
            new StatusItem(
                `$(symbol-number) ~${result.totalTokens.toLocaleString()} tokens`,
                `Estimated token count for AI agents`
            ),
            new StatusItem(
                `$(text-size) ${result.totalChars.toLocaleString()} chars`,
                `Total character count`
            ),
            new StatusItem(
                `$(clock) ${result.result.duration}ms`,
                `Generation took ${result.result.duration}ms`
            ),
            new StatusItem(
                `$(calendar) ${result.timestamp.toLocaleTimeString()}`,
                `Last updated: ${result.timestamp.toISOString()}`
            ),
        ];
    }
}

class StatusItem extends vscode.TreeItem {
    constructor(label: string, tooltip: string, command?: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = tooltip;
        if (command) {
            this.command = { command, title: label };
        }
    }
}
