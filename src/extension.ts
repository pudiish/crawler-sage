import * as vscode from 'vscode';
import { ContextEngine } from './engine/contextEngine';
import { FileWatcher } from './watcher/fileWatcher';
import { StatusProvider } from './views/statusProvider';
import { EngineProvider } from './views/engineProvider';
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

    // Initialize core components
    contextEngine = new ContextEngine(workspaceRoot);
    fileWatcher = new FileWatcher(workspaceRoot, contextEngine);
    statusBar = new StatusBarManager();

    // Tree view providers
    const statusProvider = new StatusProvider(contextEngine);
    const engineProvider = new EngineProvider(contextEngine);

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('crawlerSage.status', statusProvider),
        vscode.window.registerTreeDataProvider('crawlerSage.engines', engineProvider)
    );

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('crawlerSage.generate', async () => {
            statusBar.setGenerating();
            try {
                const result = await contextEngine.generate();
                statusBar.setReady(result.timestamp);
                statusProvider.refresh();
                engineProvider.refresh();
                vscode.window.showInformationMessage(
                    `Crawler Sage: Context generated — ${result.totalFiles} files, ${result.totalTokens} tokens`
                );
            } catch (err: any) {
                statusBar.setError();
                vscode.window.showErrorMessage(`Crawler Sage: ${err.message}`);
            }
        }),

        vscode.commands.registerCommand('crawlerSage.toggleWatch', () => {
            const watching = fileWatcher.toggle();
            statusBar.setWatching(watching);
            vscode.window.showInformationMessage(
                `Crawler Sage: File watcher ${watching ? 'enabled' : 'disabled'}`
            );
        }),

        vscode.commands.registerCommand('crawlerSage.compareEngines', async () => {
            statusBar.setGenerating();
            try {
                const comparison = await contextEngine.compareEngines();
                statusBar.setReady(new Date());
                engineProvider.refresh();

                const doc = await vscode.workspace.openTextDocument({
                    content: comparison,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(doc, { preview: true });
            } catch (err: any) {
                statusBar.setError();
                vscode.window.showErrorMessage(`Crawler Sage: ${err.message}`);
            }
        }),

        vscode.commands.registerCommand('crawlerSage.openContext', async () => {
            const config = vscode.workspace.getConfiguration('crawlerSage');
            const outputFile = config.get<string>('outputFile', '.context.md');
            const filePath = vscode.Uri.joinPath(
                vscode.workspace.workspaceFolders![0].uri,
                outputFile
            );
            try {
                const doc = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(doc);
            } catch {
                vscode.window.showWarningMessage('Crawler Sage: No context file found. Run "Generate Context" first.');
            }
        }),

        vscode.commands.registerCommand('crawlerSage.refresh', () => {
            statusProvider.refresh();
            engineProvider.refresh();
        })
    );

    // Start file watcher if enabled
    const config = vscode.workspace.getConfiguration('crawlerSage');
    if (config.get<boolean>('watchEnabled', true)) {
        fileWatcher.start();
        statusBar.setWatching(true);
    }

    // Listen for config changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('crawlerSage')) {
                const newConfig = vscode.workspace.getConfiguration('crawlerSage');
                if (newConfig.get<boolean>('watchEnabled', true)) {
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

    console.log('Crawler Sage activated');
}

export function deactivate() {
    fileWatcher?.dispose();
    statusBar?.dispose();
}
