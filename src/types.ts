export interface FileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileNode[];
    tokenCount?: number;
    language?: string;
}

export interface EngineResult {
    files: string[];
    fileCount: number;
    tokenCount: number;
    charCount: number;
    content: string;
    duration: number;
    timestamp: Date;
    tree: FileNode;
    error?: string;
}

export interface GenerateResult {
    totalFiles: number;
    totalTokens: number;
    totalChars: number;
    timestamp: Date;
    result: EngineResult;
    outputPath: string;
}
