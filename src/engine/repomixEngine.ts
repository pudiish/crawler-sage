import { execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EngineResult, FileNode } from '../types';

export class RepomixEngine {
    constructor(private workspaceRoot: string) {}

    async run(style: string = 'xml', compress: boolean = true): Promise<EngineResult> {
        const start = Date.now();
        const ext = style === 'xml' ? 'xml' : 'md';
        const outputPath = path.join(this.workspaceRoot, '.crawler-sage', `repomix-output.${ext}`);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve) => {
            const args = [
                'repomix@latest',
                this.workspaceRoot,
                '--style', style,
                '--ignore', '**/.git/**,.crawler-sage/**',
                '-o', outputPath
            ];

            if (compress) {
                args.push('--compress');
            }

            execFile('npx', args, {
                cwd: this.workspaceRoot,
                maxBuffer: 50 * 1024 * 1024,
                timeout: 300000,
                env: { ...process.env, NODE_NO_WARNINGS: '1' }
            }, (error, stdout, stderr) => {
                const duration = Date.now() - start;
                const allOutput = `${stdout}\n${stderr}`;

                if (error) {
                    resolve({
                        files: [],
                        fileCount: 0,
                        tokenCount: 0,
                        charCount: 0,
                        content: '',
                        duration,
                        timestamp: new Date(),
                        tree: { name: 'root', path: '', type: 'directory', children: [] },
                        error: error.message
                    });
                    return;
                }

                let content = '';
                let files: string[] = [];
                let tokenCount = 0;

                try {
                    content = fs.readFileSync(outputPath, 'utf-8');
                    files = this.extractFileList(content, style);
                    tokenCount = this.estimateTokens(content);
                } catch {
                    // silent
                }

                const fileMatch = allOutput.match(/(\d+)\s+file/i);
                const tokenMatch = allOutput.match(/([\d,]+)\s+token/i);
                const charMatch = allOutput.match(/([\d,]+)\s+char/i);

                const tree = this.buildTree(content, style);

                resolve({
                    files,
                    fileCount: fileMatch ? parseInt(fileMatch[1]) : files.length,
                    tokenCount: tokenMatch ? parseInt(tokenMatch[1].replace(/,/g, '')) : tokenCount,
                    charCount: charMatch ? parseInt(charMatch[1].replace(/,/g, '')) : content.length,
                    content,
                    duration,
                    timestamp: new Date(),
                    tree
                });
            });
        });
    }

    private extractFileList(content: string, style: string): string[] {
        const files: string[] = [];
        if (style === 'xml') {
            const regex = /<file\s+path="([^"]+)"/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                files.push(match[1].trim());
            }
        } else {
            const regex = /^##\s+File:\s+(.+)$/gm;
            let match;
            while ((match = regex.exec(content)) !== null) {
                files.push(match[1].trim());
            }
        }
        return files;
    }

    buildTree(content: string, style: string): FileNode {
        const root: FileNode = { name: path.basename(this.workspaceRoot), path: '', type: 'directory', children: [] };
        const files = this.extractFileList(content, style);

        for (const filePath of files) {
            const parts = filePath.split('/');
            let current = root;

            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                const isFile = i === parts.length - 1;

                if (!current.children) {
                    current.children = [];
                }

                let existing = current.children.find(c => c.name === part);
                if (!existing) {
                    existing = {
                        name: part,
                        path: parts.slice(0, i + 1).join('/'),
                        type: isFile ? 'file' : 'directory',
                        children: isFile ? undefined : []
                    };
                    if (isFile) {
                        const ext = path.extname(part).slice(1);
                        existing.language = this.detectLanguage(ext);
                    }
                    current.children.push(existing);
                }
                current = existing;
            }
        }

        this.sortTree(root);
        return root;
    }

    private sortTree(node: FileNode): void {
        if (!node.children) { return; }
        node.children.sort((a, b) => {
            if (a.type !== b.type) { return a.type === 'directory' ? -1 : 1; }
            return a.name.localeCompare(b.name);
        });
        for (const child of node.children) {
            this.sortTree(child);
        }
    }

    private detectLanguage(ext: string): string {
        const map: Record<string, string> = {
            ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
            py: 'python', rs: 'rust', go: 'go', java: 'java', rb: 'ruby', php: 'php',
            c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', swift: 'swift',
            kt: 'kotlin', scala: 'scala', vue: 'vue', svelte: 'svelte',
            html: 'html', css: 'css', scss: 'scss', less: 'less',
            json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
            md: 'markdown', sh: 'shellscript', bash: 'shellscript',
            sql: 'sql', graphql: 'graphql', proto: 'protobuf',
            dockerfile: 'dockerfile', tf: 'terraform', hcl: 'terraform'
        };
        return map[ext.toLowerCase()] || ext;
    }

    private estimateTokens(content: string): number {
        return Math.round(content.length / 4);
    }
}
