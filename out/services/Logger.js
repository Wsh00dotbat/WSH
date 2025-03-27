"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
class Logger {
    constructor(context) {
        this.MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
        this.MAX_LOG_FILES = 5;
        this.sessionId = (0, uuid_1.v4)();
        this.logFile = path.join(context.logUri.fsPath, 'projectmind.log');
        this.ensureLogDirectory();
    }
    static getInstance(context) {
        if (!Logger.instance) {
            Logger.instance = new Logger(context);
        }
        return Logger.instance;
    }
    ensureLogDirectory() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
    rotateLogs() {
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
    formatLogEntry(level, message, context) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            sessionId: this.sessionId
        };
    }
    async writeLog(entry) {
        this.rotateLogs();
        const logLine = JSON.stringify(entry) + '\n';
        await fs.promises.appendFile(this.logFile, logLine);
    }
    async debug(message, context) {
        const entry = this.formatLogEntry(LogLevel.DEBUG, message, context);
        await this.writeLog(entry);
        console.debug(`[ProjectMind] ${message}`, context);
    }
    async info(message, context) {
        const entry = this.formatLogEntry(LogLevel.INFO, message, context);
        await this.writeLog(entry);
        console.info(`[ProjectMind] ${message}`, context);
    }
    async warn(message, context) {
        const entry = this.formatLogEntry(LogLevel.WARN, message, context);
        await this.writeLog(entry);
        console.warn(`[ProjectMind] ${message}`, context);
    }
    async error(message, context) {
        const entry = this.formatLogEntry(LogLevel.ERROR, message, context);
        await this.writeLog(entry);
        console.error(`[ProjectMind] ${message}`, context);
        vscode.window.showErrorMessage(`ProjectMind: ${message}`);
    }
    async logCommand(command, args) {
        await this.info(`Command executed: ${command}`, { args });
    }
    async logError(error, context) {
        await this.error(error.message, {
            ...context,
            stack: error.stack
        });
    }
    async logPerformance(operation, duration) {
        await this.debug(`Performance: ${operation} took ${duration}ms`);
    }
    getSessionId() {
        return this.sessionId;
    }
    async clearLogs() {
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
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map