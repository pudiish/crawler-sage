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
        const items: StatusItem[] = [];

        if (!result) {
            items.push(new StatusItem(
                'No context generated yet',
                'Run "Crawler Sage: Generate Context" to start',
                'info'
            ));
            return items;
        }

        items.push(new StatusItem(
            `Files: ${result.totalFiles}`,
            `Total files processed`,
            'file'
        ));

        items.push(new StatusItem(
            `Tokens: ~${result.totalTokens.toLocaleString()}`,
            `Estimated token count`,
            'symbol-number'
        ));

        items.push(new StatusItem(
            `Last update: ${result.timestamp.toLocaleTimeString()}`,
            result.timestamp.toISOString(),
            'clock'
        ));

        items.push(new StatusItem(
            `Output: ${result.outputPath.split('/').pop()}`,
            result.outputPath,
            'output'
        ));

        const comparison = this.contextEngine.lastComparison;
        if (comparison) {
            items.push(new StatusItem(
                `Accuracy: ${comparison.accuracy}%`,
                `Cross-engine overlap accuracy`,
                comparison.accuracy > 80 ? 'pass' : 'warning'
            ));
        }

        return items;
    }
}

class StatusItem extends vscode.TreeItem {
    constructor(
        label: string,
        tooltip: string,
        icon: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = tooltip;
        this.iconPath = new vscode.ThemeIcon(icon);
    }
}
