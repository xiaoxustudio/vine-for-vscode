import { toRealValue } from "vine-lang";
import { Expr } from "vine-lang/dist/node";
import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
	TextDocumentPositionParams,
	TextDocuments,
} from "vscode-languageserver/node";

export default (
	currentAST: Expr[],
	_textDocumentPosition: TextDocumentPositionParams,
	documents: TextDocuments<TextDocument>
) => {
	const { textDocument, position } = _textDocumentPosition;
	const document = documents.get(textDocument.uri);
	if (!document) {
		return null;
	}
	return {};
};
