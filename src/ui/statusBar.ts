import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left,
            100
        );
        this.statusBarItem.command = 'crawlerSage.toggleWatch';
        this.statusBarItem.text = '$(telescope) Sage: Ready';
        this.statusBarItem.tooltip = 'Crawler Sage — Click to toggle watcher';
        this.statusBarItem.show();
    }

    setReady(timestamp: Date): void {
        const time = timestamp.toLocaleTimeString();
        this.statusBarItem.text = `$(telescope) Sage: Updated ${time}`;
        this.statusBarItem.backgroundColor = undefined;
    }

    setGenerating(): void {
        this.statusBarItem.text = '$(loading~spin) Sage: Generating...';
        this.statusBarItem.backgroundColor = undefined;
    }

    setWatching(watching: boolean): void {
        if (watching) {
            this.statusBarItem.text = '$(eye) Sage: Watching';
            this.statusBarItem.tooltip = 'Crawler Sage — File watcher active. Click to disable.';
        } else {
            this.statusBarItem.text = '$(eye-closed) Sage: Paused';
            this.statusBarItem.tooltip = 'Crawler Sage — File watcher paused. Click to enable.';
        }
    }

    setError(): void {
        this.statusBarItem.text = '$(error) Sage: Error';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor(
            'statusBarItem.errorBackground'
        );
    }

    dispose(): void {
        this.statusBarItem.dispose();
    }
}
