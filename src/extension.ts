import * as path from "path";
import { workspace, ExtensionContext } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind} from "vscode-languageclient/node";
let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// 服务器模块路径
	const serverModule = context.asAbsolutePath(
		path.join("out", "server", "server.js")
	);

	// 服务器选项
	const serverOptions: ServerOptions = {
		run: {
			module: serverModule,
			transport: TransportKind.ipc,
		},
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: {
				execArgv: ["--nolazy", "--inspect=6009"],
			},
		},
	};

	// 客户端选项
	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: "file", language: "vine-language" }],
		synchronize: {
			fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
		},
	};

	// 创建并启动客户端
	client = new LanguageClient(
		"vine-language-server",
		"Vine Language Server",
		serverOptions,
		clientOptions
	);

	// 启动客户端
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
