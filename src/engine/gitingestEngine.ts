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
            // Write a temporary Python script to avoid shell escaping issues
            const scriptPath = path.join(outputDir, '_run_gitingest.py');
            const escapedRoot = this.workspaceRoot.replace(/\\/g, '\\\\');
            const escapedOutput = outputPath.replace(/\\/g, '\\\\');

            const script = [
                'import sys',
                'try:',
                '    from gitingest import ingest',
                `    summary, tree, content = ingest("${escapedRoot}")`,
                '    header = "# Gitingest Output\\n"',
                '    output = header',
                '    output += "\\n## Summary\\n" + str(summary) + "\\n"',
                '    output += "\\n## Directory Tree\\n" + str(tree) + "\\n"',
                '    output += "\\n## Content\\n" + str(content) + "\\n"',
                `    with open("${escapedOutput}", "w") as f:`,
                '        f.write(output)',
                '    file_count = tree.count("\\n") if tree else 0',
                '    char_count = len(content) if content else 0',
                '    print(f"SUCCESS|files={file_count}|chars={char_count}")',
                'except ImportError:',
                '    print("ERROR|gitingest not installed. Run: pip install gitingest")',
                '    sys.exit(1)',
                'except Exception as e:',
                '    print(f"ERROR|{e}")',
                '    sys.exit(1)',
            ].join('\n');

            fs.writeFileSync(scriptPath, script, 'utf-8');

            execFile('python3', [scriptPath], {
                cwd: this.workspaceRoot,
                maxBuffer: 50 * 1024 * 1024,
                timeout: 120000,
                env: process.env
            }, (error, stdout, stderr) => {
                // Clean up temp script
                try { fs.unlinkSync(scriptPath); } catch {}
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
