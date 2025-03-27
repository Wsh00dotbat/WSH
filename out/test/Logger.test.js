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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const Logger_1 = require("../services/Logger");
suite('Logger Test Suite', () => {
    let logger;
    let testContext;
    let logDir;
    setup(async () => {
        // Create a temporary directory for test logs
        logDir = path.join(os.tmpdir(), 'projectmind-test-logs');
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, { recursive: true });
        }
        fs.mkdirSync(logDir);
        // Create a mock extension context
        const mockEnvVarCollection = {
            persistent: true,
            replace: () => { },
            append: () => { },
            prepend: () => { },
            get: () => undefined,
            forEach: () => { },
            delete: () => { },
            has: () => false,
            clear: () => { },
            description: '',
            getScoped: () => ({
                persistent: true,
                replace: () => { },
                append: () => { },
                prepend: () => { },
                get: () => undefined,
                forEach: () => { },
                delete: () => { },
                has: () => false,
                clear: () => { },
                description: '',
                [Symbol.iterator]: () => ({ next: () => ({ done: true }) })
            }),
            [Symbol.iterator]: () => ({ next: () => ({ done: true }) })
        };
        const mockMemento = {
            get: () => undefined,
            update: () => Promise.resolve(),
            setKeysForSync: () => { },
            keys: () => []
        };
        const mockSecretStorage = {
            get: () => Promise.resolve(undefined),
            store: () => Promise.resolve(),
            delete: () => Promise.resolve(),
            onDidChange: new vscode.EventEmitter().event
        };
        testContext = {
            logUri: vscode.Uri.file(logDir),
            subscriptions: [],
            extensionPath: '',
            globalStorageUri: vscode.Uri.file(''),
            storageUri: vscode.Uri.file(''),
            extensionUri: vscode.Uri.file(''),
            environmentVariableCollection: mockEnvVarCollection,
            extensionMode: vscode.ExtensionMode.Development,
            globalState: mockMemento,
            workspaceState: mockMemento,
            secrets: mockSecretStorage,
            extension: {},
            asAbsolutePath: (relativePath) => path.join(logDir, relativePath),
            storagePath: logDir,
            globalStoragePath: logDir,
            logPath: logDir,
            languageModelAccessInformation: {}
        };
        logger = Logger_1.Logger.getInstance(testContext);
    });
    teardown(async () => {
        await logger.clearLogs();
        if (fs.existsSync(logDir)) {
            fs.rmSync(logDir, { recursive: true });
        }
    });
    test('Logger should create log file', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        assert.strictEqual(fs.existsSync(logFile), false);
        await logger.info('Test message');
        assert.strictEqual(fs.existsSync(logFile), true);
    });
    test('Logger should write log entries', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        await logger.info('Test message', { test: 'data' });
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(logContent.trim());
        assert.strictEqual(logEntry.message, 'Test message');
        assert.strictEqual(logEntry.level, 'INFO');
        assert.deepStrictEqual(logEntry.context, { test: 'data' });
        assert.ok(logEntry.timestamp);
        assert.ok(logEntry.sessionId);
    });
    test('Logger should rotate logs when size limit is reached', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        const largeMessage = 'x'.repeat(1024 * 1024); // 1MB message
        // Write enough messages to trigger rotation
        for (let i = 0; i < 6; i++) {
            await logger.info(largeMessage);
        }
        assert.strictEqual(fs.existsSync(logFile), true);
        assert.strictEqual(fs.existsSync(`${logFile}.1`), true);
    });
    test('Logger should maintain session ID', async () => {
        const sessionId = logger.getSessionId();
        assert.ok(sessionId);
        assert.strictEqual(typeof sessionId, 'string');
        assert.strictEqual(sessionId.length, 36); // UUID length
    });
    test('Logger should clear logs', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        await logger.info('Test message');
        assert.strictEqual(fs.existsSync(logFile), true);
        await logger.clearLogs();
        assert.strictEqual(fs.existsSync(logFile), false);
    });
    test('Logger should handle different log levels', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        await logger.debug('Debug message');
        await logger.info('Info message');
        await logger.warn('Warn message');
        await logger.error('Error message');
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logEntries = logContent.trim().split('\n').map(line => JSON.parse(line));
        assert.strictEqual(logEntries.length, 4);
        assert.strictEqual(logEntries[0].level, 'DEBUG');
        assert.strictEqual(logEntries[1].level, 'INFO');
        assert.strictEqual(logEntries[2].level, 'WARN');
        assert.strictEqual(logEntries[3].level, 'ERROR');
    });
    test('Logger should log commands', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        await logger.logCommand('test.command', { arg1: 'value1' });
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(logContent.trim());
        assert.strictEqual(logEntry.message, 'Command executed: test.command');
        assert.deepStrictEqual(logEntry.context, { args: { arg1: 'value1' } });
    });
    test('Logger should log errors with stack trace', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        const error = new Error('Test error');
        await logger.logError(error, { context: 'test' });
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(logContent.trim());
        assert.strictEqual(logEntry.message, 'Test error');
        assert.ok(logEntry.context.stack);
        assert.strictEqual(logEntry.context.context, 'test');
    });
    test('Logger should log performance metrics', async () => {
        const logFile = path.join(logDir, 'projectmind.log');
        await logger.logPerformance('test.operation', 100);
        const logContent = fs.readFileSync(logFile, 'utf-8');
        const logEntry = JSON.parse(logContent.trim());
        assert.strictEqual(logEntry.message, 'Performance: test.operation took 100ms');
        assert.strictEqual(logEntry.level, 'DEBUG');
    });
});
//# sourceMappingURL=Logger.test.js.map