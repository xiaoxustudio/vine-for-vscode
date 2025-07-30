// LSP server

import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult,
	Hover,
} from "vscode-languageserver/node";
import { tokenlize, Parser } from "vine-lang";
import CompletionHandle from "./completion";
import DefinitionHandle from "./definition";
import HoverHandle from "./hover";
import { TextDocument } from "vscode-languageserver-textdocument";

import { CacheManager } from './cache-manager';

// 创建连接
const connection = createConnection(ProposedFeatures.all);

// 管理文档
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
			},
			definitionProvider: true,
		},
	};

	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true,
			},
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		connection.client.register(
			DidChangeConfigurationNotification.type,
			undefined
		);
	}
});

// 配置
let globalSettings: VineLanguageSettings = { maxNumberOfProblems: 100 };

interface VineLanguageSettings {
	maxNumberOfProblems: number;
}

const documentSettings: Map<string, Thenable<VineLanguageSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = <VineLanguageSettings>(
			(change.settings.languageServerExample || globalSettings)
		);
	}
});

// 文档变更时校验
documents.onDidChangeContent(change => {
	// 重新计算ast
	try {
		const text = change.document.getText() ?? "";
		const token = tokenlize(text);
		const ast = new Parser().parse(token);
		CacheManager.getInstance().updateDocument(
			change.document.uri,
			ast.body,
			change.document.version
		);
	} catch {}
});

// 自动补全
connection.onCompletion(
	(
		_textDocumentPosition: TextDocumentPositionParams,
		_cancellationToken,
		_workDoneProgress,
		_resultProgress
	): CompletionItem[] => {
		return CacheManager.getInstance().getCompletionItems(_textDocumentPosition.textDocument.uri);
	}
);

connection.onCompletionResolve(item => {
	return item;
});

// 跳转定义
connection.onDefinition(
	(
		_textDocumentPosition: TextDocumentPositionParams,
		_token,
		_workDoneProgress
	) => {
		const ast = CacheManager.getInstance().getAST(_textDocumentPosition.textDocument.uri);
		return ast ? DefinitionHandle(ast, _textDocumentPosition, documents) : null;
	}
);

// Hover 定义
connection.onHover(
	(_textDocumentPosition: TextDocumentPositionParams) => {
		const ast = CacheManager.getInstance().getAST(_textDocumentPosition.textDocument.uri);
		return ast ? HoverHandle(ast, _textDocumentPosition, documents) as Hover : null;
	}
);

// 监听文档
documents.listen(connection);

// 启动服务
connection.listen();
