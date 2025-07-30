import { toRealValue } from "vine-lang";
import { Expr } from "vine-lang/dist/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
	TextDocumentPositionParams,
	TextDocuments,
} from "vscode-languageserver/node";
import { getPos } from "./util";

export default (
	currentAST: Expr[],
	_textDocumentPosition: TextDocumentPositionParams,
	documents: TextDocuments<TextDocument>
) => {
	try {
		const position = _textDocumentPosition.position;
		// 获取当前文档
		const document = documents.get(_textDocumentPosition.textDocument.uri);
		if (!document) {
			return [];
		}
		const [lineText, start, end] = getPos(document, position);
		const currentChar = lineText.slice(start, end);
		const targets = currentAST
			.filter(
				node =>
					[
						"FunctionDeclaration",
						"LambdaFunctionDecl",
						"VariableDeclaration",
						"AssignmentExpression",
					].includes(node.type) &&
					toRealValue((node as any)?.id.value) === currentChar
			)
			.map((node: any) => {
				return {
					uri: _textDocumentPosition.textDocument.uri,
					range: {
						start: {
							line: node.id.value.line - 1,
							character: node.id.value.column,
						},
						end: {
							line: node.id.value.line - 1,
							character: node.id.value.column,
						},
					},
				};
			});
		if (targets) {
			return targets;
		}
		return [];
	} catch {
		return [];
	}
};
