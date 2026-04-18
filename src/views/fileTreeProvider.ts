import * as vscode from 'vscode';
import * as path from 'path';
import { ContextEngine } from '../engine/contextEngine';
import { FileNode } from '../types';

export class FileTreeProvider implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    constructor(private contextEngine: ContextEngine, private workspaceRoot: string) {
        contextEngine.onDidUpdate(() => this.refresh());
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: FileTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileTreeItem): FileTreeItem[] {
        const tree = this.contextEngine.lastTree;
        if (!tree) {
            return [new FileTreeItem(
                { name: 'Generate context first', path: '', type: 'file' },
                this.workspaceRoot,
                'crawlerSage.generate'
            )];
        }

        const node = element ? element.fileNode : tree;
        if (!node.children) { return []; }

        return node.children.map(child => new FileTreeItem(child, this.workspaceRoot));
    }
}

class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly fileNode: FileNode,
        private workspaceRoot: string,
        commandId?: string
    ) {
        super(
            fileNode.name,
            fileNode.type === 'directory'
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None
        );

        this.tooltip = fileNode.path || fileNode.name;

        if (fileNode.type === 'file') {
            this.iconPath = vscode.ThemeIcon.File;
            this.resourceUri = vscode.Uri.file(path.join(workspaceRoot, fileNode.path));
            this.command = {
                command: 'vscode.open',
                title: 'Open File',
                arguments: [this.resourceUri]
            };
            if (fileNode.language) {
                this.description = fileNode.language;
            }
        } else {
            this.iconPath = vscode.ThemeIcon.Folder;
            this.description = fileNode.children ? `${this.countFiles(fileNode)} files` : '';
        }

        if (commandId) {
            this.command = { command: commandId, title: fileNode.name };
        }
    }

    private countFiles(node: FileNode): number {
        let count = 0;
        if (node.children) {
            for (const child of node.children) {
                if (child.type === 'file') { count++; }
                else { count += this.countFiles(child); }
            }
        }
        return count;
    }
}
