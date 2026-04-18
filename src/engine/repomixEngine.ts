import { execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EngineResult } from '../types';

export class RepomixEngine {
    constructor(private workspaceRoot: string) {}

    async run(style: string = 'markdown'): Promise<EngineResult> {
        const start = Date.now();
        const outputPath = path.join(this.workspaceRoot, '.crawler-sage', 'repomix-output.md');

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve, reject) => {
            const args = [
                'repomix@latest',
                this.workspaceRoot,
                '--style', style,
                '-o', outputPath
            ];

            execFile('npx', args, {
                cwd: this.workspaceRoot,
                maxBuffer: 50 * 1024 * 1024, // 50MB
                timeout: 120000, // 2 min
                env: { ...process.env, NODE_NO_WARNINGS: '1' }
            }, (error, stdout, stderr) => {
                const duration = Date.now() - start;

                if (error) {
                    resolve({
                        engine: 'repomix',
                        files: [],
                        fileCount: 0,
                        tokenCount: 0,
                        content: '',
                        duration,
                        timestamp: new Date(),
                        error: error.message
                    });
                    return;
                }

                let content = '';
                let files: string[] = [];
                let tokenCount = 0;

                try {
                    content = fs.readFileSync(outputPath, 'utf-8');
                    files = this.extractFileList(content);
                    tokenCount = this.estimateTokens(content);
                } catch {
                    // Output file might not exist if repomix failed silently
                }

                // Parse stats from stdout
                const fileMatch = stdout.match(/(\d+)\s+file/i);
                const tokenMatch = stdout.match(/([\d,]+)\s+token/i);

                resolve({
                    engine: 'repomix',
                    files,
                    fileCount: fileMatch ? parseInt(fileMatch[1]) : files.length,
                    tokenCount: tokenMatch ? parseInt(tokenMatch[1].replace(/,/g, '')) : tokenCount,
                    content,
                    duration,
                    timestamp: new Date()
                });
            });
        });
    }

    private extractFileList(content: string): string[] {
        const files: string[] = [];
        // Repomix markdown format uses ## File: path/to/file
        const regex = /^##\s+File:\s+(.+)$/gm;
        let match;
        while ((match = regex.exec(content)) !== null) {
            files.push(match[1].trim());
        }
        // Also try XML format <file path="...">
        const xmlRegex = /<file\s+path="([^"]+)"/g;
        while ((match = xmlRegex.exec(content)) !== null) {
            files.push(match[1].trim());
        }
        return files;
    }

    private estimateTokens(content: string): number {
        // Rough estimate: ~4 chars per token
        return Math.round(content.length / 4);
    }
}
