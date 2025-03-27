import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: any;
    sessionId: string;
}

export class Logger {
    private static instance: Logger;
    private logFile: string;
    private sessionId: string;
    private readonly MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
    private readonly MAX_LOG_FILES = 5;

    private constructor(context: vscode.ExtensionContext) {
        this.sessionId = uuidv4();
        this.logFile = path.join(context.logUri.fsPath, 'projectmind.log');
        this.ensureLogDirectory();
    }

    public static getInstance(context: vscode.ExtensionContext): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(context);
        }
        return Logger.instance;
    }

    private ensureLogDirectory(): void {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    private rotateLogs(): void {
        if (fs.existsSync(this.logFile)) {
            const stats = fs.statSync(this.logFile);
            if (stats.size >= this.MAX_LOG_SIZE) {
                // Rotate existing log files
                for (let i = this.MAX_LOG_FILES - 1; i > 0; i--) {
                    const oldFile = `${this.logFile}.${i}`;
                    const newFile = `${this.logFile}.${i + 1}`;
                    if (fs.existsSync(oldFile)) {
                        fs.renameSync(oldFile, newFile);
                    }
                }
                // Move current log to .1
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }
        }
    }

    private formatLogEntry(level: LogLevel, message: string, context?: any): LogEntry {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            sessionId: this.sessionId
        };
    }

    private async writeLog(entry: LogEntry): Promise<void> {
        this.rotateLogs();
        const logLine = JSON.stringify(entry) + '\n';
        await fs.promises.appendFile(this.logFile, logLine);
    }

    public async debug(message: string, context?: any): Promise<void> {
        const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
        await this.writeLog(entry);
        console.debug(`[ProjectMind] ${message}`, context);
    }

    public async info(message: string, context?: any): Promise<void> {
        const entry = this.formatLogEntry(LogLevel.INFO, message, context);
        await this.writeLog(entry);
        console.info(`[ProjectMind] ${message}`, context);
    }

    public async warn(message: string, context?: any): Promise<void> {
        const entry = this.formatLogEntry(LogLevel.WARN, message, context);
        await this.writeLog(entry);
        console.warn(`[ProjectMind] ${message}`, context);
    }

    public async error(message: string, context?: any): Promise<void> {
        const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
        await this.writeLog(entry);
        console.error(`[ProjectMind] ${message}`, context);
        vscode.window.showErrorMessage(`ProjectMind: ${message}`);
    }

    public async logCommand(command: string, args?: any): Promise<void> {
        await this.info(`Command executed: ${command}`, { args });
    }

    public async logError(error: Error, context?: any): Promise<void> {
        await this.error(error.message, {
            ...context,
            stack: error.stack
        });
    }

    public async logPerformance(operation: string, duration: number): Promise<void> {
        await this.debug(`Performance: ${operation} took ${duration}ms`);
    }

    public getSessionId(): string {
        return this.sessionId;
    }

    public async clearLogs(): Promise<void> {
        if (fs.existsSync(this.logFile)) {
            await fs.promises.unlink(this.logFile);
        }
        for (let i = 1; i <= this.MAX_LOG_FILES; i++) {
            const file = `${this.logFile}.${i}`;
            if (fs.existsSync(file)) {
                await fs.promises.unlink(file);
            }
        }
    }
} 