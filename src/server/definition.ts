import { toRealValue } from "vine-lang";
import { Expr } from "vine-lang/dist/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
	TextDocumentPositionParams,
	TextDocuments,
} from "vscode-languageserver/node";

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
		const lineText = document.getText({
			start: { line: position.line, character: 0 },
			end: { line: position.line + 1, character: 0 },
		});
		let charIdx = position.character;
		let start = charIdx;
		let end = charIdx;
		while (start > 0 && /[a-zA-Z0-9_]/.test(lineText[start - 1])) {
			start--;
		}
		while (end < lineText.length && /[a-zA-Z0-9_]/.test(lineText[end])) {
			end++;
		}

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
			console.log(targets);
			return targets;
		}
		return [];
	} catch {
		return [];
	}
};
