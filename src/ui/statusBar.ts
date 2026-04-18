import * as vscode from 'vscode';

export class StatusBarManager implements vscode.Disposable {
    private item: vscode.StatusBarItem;

    constructor() {
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.item.command = 'crawlerSage.generate';
        this.item.text = '$(telescope) Sage';
        this.item.tooltip = 'Crawler Sage — Click to generate context';
        this.item.show();
    }

    setReady(files: number, tokens: number): void {
        this.item.text = `$(telescope) Sage: ${files} files · ${(tokens / 1000).toFixed(0)}K tokens`;
        this.item.tooltip = 'Crawler Sage — Click to regenerate';
        this.item.backgroundColor = undefined;
    }

    setGenerating(): void {
        this.item.text = '$(loading~spin) Sage: Generating...';
        this.item.backgroundColor = undefined;
    }

    setWatching(watching: boolean): void {
        const icon = watching ? '$(eye)' : '$(eye-closed)';
        this.item.text = `${icon} Sage: ${watching ? 'Watching' : 'Paused'}`;
        this.item.tooltip = `Crawler Sage — Watcher ${watching ? 'active' : 'paused'}`;
    }

    setError(msg: string): void {
        this.item.text = '$(error) Sage: Error';
        this.item.tooltip = msg;
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }

    dispose(): void {
        this.item.dispose();
    }
}
