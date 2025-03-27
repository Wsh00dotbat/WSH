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
exports.CodebaseView = void 0;
const vscode = __importStar(require("vscode"));
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
class CodebaseView {
    constructor(extensionUri, context) {
        this.fileTree = [];
        this.extensionUri = extensionUri;
        this.context = context;
    }
    static getInstance(extensionUri, context) {
        if (!CodebaseView.instance) {
            CodebaseView.instance = new CodebaseView(extensionUri, context);
        }
        return CodebaseView.instance;
    }
    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('codebaseView', 'Codebase Explorer', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refresh':
                    await this.refreshFileTree();
                    break;
                case 'openFile':
                    this.openFile(message.path);
                    break;
            }
        }, undefined, this.context.subscriptions);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.context.subscriptions);
    }
    async refreshFileTree() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;
        try {
            // Use glob.sync instead of glob for synchronous operation
            const files = glob.sync('**/*', {
                cwd: rootPath,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
                dot: false
            });
            this.fileTree = this.buildFileTree(files, rootPath);
            this.updateWebview();
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to refresh file tree: ${error}`);
        }
    }
    buildFileTree(files, rootPath) {
        const tree = [];
        const fileMap = new Map();
        // First pass: create all nodes
        for (const file of files) {
            const fullPath = path.join(rootPath, file);
            const parts = file.split(path.sep);
            let currentPath = '';
            for (let i = 0; i < parts.length; i++) {
                currentPath = currentPath ? path.join(currentPath, parts[i]) : parts[i];
                const fullCurrentPath = path.join(rootPath, currentPath);
                if (!fileMap.has(fullCurrentPath)) {
                    const isDirectory = i < parts.length - 1;
                    const node = {
                        name: parts[i],
                        path: fullCurrentPath,
                        isDirectory,
                        children: isDirectory ? [] : undefined
                    };
                    fileMap.set(fullCurrentPath, node);
                    if (i === 0) {
                        tree.push(node);
                    }
                    else {
                        const parentPath = path.join(rootPath, currentPath.slice(0, -parts[i].length - 1));
                        const parent = fileMap.get(parentPath);
                        if (parent && parent.children) {
                            parent.children.push(node);
                        }
                    }
                }
            }
        }
        return tree;
    }
    openFile(filePath) {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }
    updateWebview() {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updateTree',
                tree: this.fileTree
            });
        }
    }
    getWebviewContent() {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Codebase Explorer</title>
            <style>
                body {
                    padding: 20px;
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .file-tree {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                .file-tree li {
                    margin: 5px 0;
                }
                .file-tree .folder {
                    cursor: pointer;
                    color: var(--vscode-editor-foreground);
                }
                .file-tree .file {
                    cursor: pointer;
                    color: var(--vscode-editor-foreground);
                }
                .file-tree .folder:hover,
                .file-tree .file:hover {
                    color: var(--vscode-textLink-foreground);
                }
                .file-tree .children {
                    margin-left: 20px;
                    display: none;
                }
                .file-tree .folder.open > .children {
                    display: block;
                }
                .refresh-button {
                    margin-bottom: 10px;
                    padding: 5px 10px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    cursor: pointer;
                }
                .refresh-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
            </style>
        </head>
        <body>
            <button class="refresh-button" onclick="refreshTree()">Refresh</button>
            <ul class="file-tree" id="fileTree"></ul>
            <script>
                const vscode = acquireVsCodeApi();
                let fileTree = [];

                function refreshTree() {
                    vscode.postMessage({ command: 'refresh' });
                }

                function renderTree(tree) {
                    const ul = document.getElementById('fileTree');
                    ul.innerHTML = '';
                    
                    tree.forEach(node => {
                        const li = document.createElement('li');
                        if (node.isDirectory) {
                            li.innerHTML = \`
                                <span class="folder" onclick="toggleFolder(this)">
                                    📁 \${node.name}
                                    <span class="children"></span>
                                </span>
                            \`;
                            const childrenUl = li.querySelector('.children');
                            childrenUl.appendChild(renderTree(node.children));
                        } else {
                            li.innerHTML = \`
                                <span class="file" onclick="openFile('\${node.path}')">
                                    📄 \${node.name}
                                </span>
                            \`;
                        }
                        ul.appendChild(li);
                    });
                    
                    return ul;
                }

                function toggleFolder(element) {
                    element.parentElement.classList.toggle('open');
                }

                function openFile(path) {
                    vscode.postMessage({ command: 'openFile', path });
                }

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'updateTree':
                            fileTree = message.tree;
                            renderTree(fileTree);
                            break;
                    }
                });

                // Initial render
                renderTree(fileTree);
            </script>
        </body>
        </html>`;
    }
}
exports.CodebaseView = CodebaseView;
//# sourceMappingURL=CodebaseView.js.map