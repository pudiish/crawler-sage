export interface EngineResult {
    engine: 'repomix' | 'gitingest';
    files: string[];
    fileCount: number;
    tokenCount: number;
    content: string;
    duration: number;
    timestamp: Date;
    error?: string;
}

export interface GenerateResult {
    totalFiles: number;
    totalTokens: number;
    timestamp: Date;
    engines: EngineResult[];
    outputPath: string;
}

export interface ComparisonResult {
    onlyInRepomix: string[];
    onlyInGitingest: string[];
    inBoth: string[];
    repomixFileCount: number;
    gitingestFileCount: number;
    accuracy: number;
}
