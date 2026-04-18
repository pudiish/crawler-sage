import * as vscode from 'vscode';
import { ContextEngine } from '../engine/contextEngine';

export class FileWatcher implements vscode.Disposable {
    private watcher: vscode.FileSystemWatcher | null = null;
    private debounceTimer: NodeJS.Timeout | null = null;
    private _isWatching = false;

    constructor(
        private workspaceRoot: string,
        private contextEngine: ContextEngine
    ) {}

    get isWatching(): boolean {
        return this._isWatching;
    }

    start(): void {
        if (this._isWatching) {
            return;
        }

        const config = vscode.workspace.getConfiguration('crawlerSage');
        const excludePatterns = config.get<string[]>('excludePatterns', [
            'node_modules', '.git', 'dist', 'build', '.context.md'
        ]);

        // Watch all files except excluded patterns
        this.watcher = vscode.workspace.createFileSystemWatcher('**/*');

        const handler = (uri: vscode.Uri) => {
            // Skip excluded patterns
            const relativePath = vscode.workspace.asRelativePath(uri);
            for (const pattern of excludePatterns) {
                if (relativePath.includes(pattern)) {
                    return;
                }
            }
            // Skip our own output directory
            if (relativePath.includes('.crawler-sage')) {
                return;
            }

            this.debouncedGenerate();
        };

        this.watcher.onDidChange(handler);
        this.watcher.onDidCreate(handler);
        this.watcher.onDidDelete(handler);

        this._isWatching = true;
    }

    stop(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.watcher?.dispose();
        this.watcher = null;
        this._isWatching = false;
    }

    toggle(): boolean {
        if (this._isWatching) {
            this.stop();
        } else {
            this.start();
        }
        return this._isWatching;
    }

    private debouncedGenerate(): void {
        const config = vscode.workspace.getConfiguration('crawlerSage');
        const debounceMs = config.get<number>('debounceMs', 2000);

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(async () => {
            try {
                await this.contextEngine.generate();
            } catch (err: any) {
                console.error('Crawler Sage: Auto-generate failed:', err.message);
            }
        }, debounceMs);
    }

    dispose(): void {
        this.stop();
    }
}
