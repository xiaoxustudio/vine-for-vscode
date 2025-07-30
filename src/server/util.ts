import { Position, TextDocument } from "vscode-languageserver-textdocument";

/**
 * @description: 获取光标所在单词位置
 * @param {TextDocument} document
 * @param {Position} position
 * @return {*}
 */
export function getPos(
	document: TextDocument,
	position: Position
): [string, number, number] {
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
	return [lineText, start, end];
}
