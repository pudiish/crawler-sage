import * as vscode from 'vscode';
import { ContextEngine } from './engine/contextEngine';
import { FileWatcher } from './watcher/fileWatcher';
import { StatusProvider } from './views/statusProvider';
import { FileTreeProvider } from './views/fileTreeProvider';
import { TreeWebviewProvider } from './views/treeWebview';
import { StatusBarManager } from './ui/statusBar';

let contextEngine: ContextEngine;
let fileWatcher: FileWatcher;
let statusBar: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) {
        vscode.window.showWarningMessage('Crawler Sage: No workspace folder open.');
        return;
    }

    contextEngine = new ContextEngine(workspaceRoot);
    fileWatcher = new FileWatcher(workspaceRoot, contextEngine);
    statusBar = new StatusBarManager();

    const statusProvider = new StatusProvider(contextEngine);
    const fileTreeProvider = new FileTreeProvider(contextEngine, workspaceRoot);
    const treeWebview = new TreeWebviewProvider(contextEngine, context.extensionUri);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('crawlerSage.status', statusProvider),
        vscode.window.registerTreeDataProvider('crawlerSage.fileTree', fileTreeProvider)
    );

    // Generate context
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.generate', async () => {
            statusBar.setGenerating();
            try {
                const result = await contextEngine.generate();
                statusBar.setReady(result.totalFiles, result.totalTokens);
                statusProvider.refresh();
                fileTreeProvider.refresh();
                vscode.window.showInformationMessage(
                    `Crawler Sage: ${result.totalFiles} files · ~${(result.totalTokens / 1000).toFixed(0)}K tokens · ${result.result.duration}ms`
                );
            } catch (err: any) {
                statusBar.setError(err.message);
                vscode.window.showErrorMessage(`Crawler Sage: ${err.message}`);
            }
        })
    );

    // Toggle file watcher
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.toggleWatch', () => {
            const watching = fileWatcher.toggle();
            statusBar.setWatching(watching);
            vscode.window.showInformationMessage(
                `Crawler Sage: Watcher ${watching ? 'enabled' : 'disabled'}`
            );
        })
    );

    // Open the generated context file
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.openContext', async () => {
            const config = vscode.workspace.getConfiguration('crawlerSage');
            const outputFile = config.get<string>('outputFile', '.context.md');
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, outputFile);
            try {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            } catch {
                vscode.window.showWarningMessage('Crawler Sage: No context file. Run Generate first.');
            }
        })
    );

    // Open the raw Repomix output
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.openRawOutput', async () => {
            const config = vscode.workspace.getConfiguration('crawlerSage');
            const style = config.get<string>('outputStyle', 'xml');
            const ext = style === 'xml' ? 'xml' : 'md';
            const filePath = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders![0].uri,
                `.crawler-sage/repomix-output.${ext}`
            );
            try {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            } catch {
                vscode.window.showWarningMessage('Crawler Sage: No output file. Run Generate first.');
            }
        })
    );

    // Show interactive tree visualization
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.viewTree', () => {
            if (!contextEngine.lastResult) {
                vscode.window.showWarningMessage('Crawler Sage: Generate context first to view the tree.');
                return;
            }
            treeWebview.show();
        })
    );

    // Refresh views
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.refresh', () => {
            statusProvider.refresh();
            fileTreeProvider.refresh();
        })
    );

    // Auto-start watcher
    const config = vscode.workspace.getConfiguration('crawlerSage');
    if (config.get<boolean>('watchEnabled', true)) {
        fileWatcher.start();
        statusBar.setWatching(true);
    }

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('crawlerSage')) {
                const c = vscode.workspace.getConfiguration('crawlerSage');
                if (c.get<boolean>('watchEnabled', true)) {
                    fileWatcher.start();
                    statusBar.setWatching(true);
                } else {
                    fileWatcher.stop();
                    statusBar.setWatching(false);
                }
            }
        })
    );

    context.subscriptions.push(fileWatcher, statusBar);
    console.log('Crawler Sage v2 activated');
}

export function deactivate() {
    fileWatcher?.dispose();
    statusBar?.dispose();
}
