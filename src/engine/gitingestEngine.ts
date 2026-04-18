import { execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { EngineResult } from '../types';

export class GitingestEngine {
    constructor(private workspaceRoot: string) {}

    async run(): Promise<EngineResult> {
        const start = Date.now();
        const outputPath = path.join(this.workspaceRoot, '.crawler-sage', 'gitingest-output.md');

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        return new Promise((resolve) => {
            // Run gitingest via Python
            const script = `
import sys
try:
    from gitingest import ingest
    summary, tree, content = ingest("${this.workspaceRoot.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")
    output = f"""# Gitingest Output

## Summary
{'{summary}'}

## Directory Tree
{'{tree}'}

## Content
{'{content}'}
"""
    with open("${outputPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}", "w") as f:
        f.write(output)
    print(f"SUCCESS|files={'{tree.count(chr(10))}'}|chars={'{len(content)}'}")
except ImportError:
    print("ERROR|gitingest not installed. Run: pip install gitingest")
    sys.exit(1)
except Exception as e:
    print(f"ERROR|{'{e}'}")
    sys.exit(1)
`;

            execFile('python3', ['-c', script], {
                cwd: this.workspaceRoot,
                maxBuffer: 50 * 1024 * 1024,
                timeout: 120000,
                env: process.env
            }, (error, stdout, stderr) => {
                const duration = Date.now() - start;

                if (error || stdout.startsWith('ERROR')) {
                    const errorMsg = error?.message || stdout.replace('ERROR|', '');
                    resolve({
                        engine: 'gitingest',
                        files: [],
                        fileCount: 0,
                        tokenCount: 0,
                        content: '',
                        duration,
                        timestamp: new Date(),
                        error: errorMsg
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
                    // File may not exist
                }

                // Parse stats from stdout
                const statsMatch = stdout.match(/SUCCESS\|files=(\d+)\|chars=(\d+)/);
                const fileCount = statsMatch ? parseInt(statsMatch[1]) : files.length;

                resolve({
                    engine: 'gitingest',
                    files,
                    fileCount,
                    tokenCount,
                    content,
                    duration,
                    timestamp: new Date()
                });
            });
        });
    }

    private extractFileList(content: string): string[] {
        const files: string[] = [];
        // Parse the directory tree section for file paths
        const treeSection = content.match(/## Directory Tree\n([\s\S]*?)(?=\n## )/);
        if (treeSection) {
            const lines = treeSection[1].split('\n');
            for (const line of lines) {
                const trimmed = line.replace(/^[│├└─\s]+/, '').trim();
                if (trimmed && !trimmed.endsWith('/') && trimmed.includes('.')) {
                    files.push(trimmed);
                }
            }
        }
        return files;
    }

    private estimateTokens(content: string): number {
        return Math.round(content.length / 4);
    }
}
