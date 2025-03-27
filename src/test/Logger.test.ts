import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../services/Logger';

suite('Logger Test Suite', () => {
    let logger: Logger;
    let testContext: vscode.ExtensionContext;
    let logDir: string;

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
            replace: () => {},
            append: () => {},
            prepend: () => {},
            get: () => undefined,
            forEach: () => {},
            delete: () => {},
            has: () => false,
            clear: () => {},
            description: '',
            [Symbol.iterator]: () => ({ next: () => ({ done: true }) })
        } as unknown as vscode.EnvironmentVariableCollection;

        const mockMemento = {
            get: () => undefined,
            update: () => Promise.resolve(),
            setKeysForSync: () => {},
            keys: () => []
        } as unknown as vscode.Memento & { setKeysForSync(keys: readonly string[]): void };

        const mockSecretStorage = {
            get: () => Promise.resolve(undefined),
            store: () => Promise.resolve(),
            delete: () => Promise.resolve(),
            onDidChange: new vscode.EventEmitter<vscode.SecretStorageChangeEvent>().event
        } as unknown as vscode.SecretStorage;

        testContext = {
            logUri: vscode.Uri.file(logDir),
            subscriptions: [],
            extensionPath: '',
            globalStorageUri: vscode.Uri.file(''),
            storageUri: vscode.Uri.file(''),
            extensionUri: vscode.Uri.file(''),
            environmentVariableCollection: mockEnvVarCollection,
            extensionRuntime: vscode.ExtensionKind.Workspace,
            extensionMode: vscode.ExtensionMode.Development,
            globalState: mockMemento,
            workspaceState: mockMemento,
            secrets: mockSecretStorage,
            extension: {} as vscode.Extension<any>
        };

        logger = Logger.getInstance(testContext);
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