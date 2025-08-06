import { toRealValue } from "vine-lang";
import { Keywords } from "vine-lang/dist/keywords";
import { Expr, FunctionDecl, VariableDecl } from "vine-lang/dist/node";
import {
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
} from "vscode-languageserver/node";

export default (
	currentAST: Expr[],
	_textDocumentPosition: TextDocumentPositionParams
): CompletionItem[] => {
	try {
		const completions: CompletionItem[] = [];
		const targets = currentAST
			.filter(node =>
				[
					"FunctionDeclaration",
					"LambdaFunctionDecl",
					"VariableDeclaration",
				].includes(node.type)
			)
			.map((target: any) => {
				if (target.type === "FunctionDeclaration") {
					const stmt = target as FunctionDecl;
					return {
						label: toRealValue(stmt.id) as string,
						kind: CompletionItemKind.Function,
					};
				} else {
					const stmt = target as VariableDecl;
					const isFunc = stmt.value.type === "LambdaFunctionDecl";
					return {
						label: toRealValue(stmt.id) as string,
						kind: isFunc
							? CompletionItemKind.Function
							: CompletionItemKind.Variable,
					};
				}
			});
		completions.push(...targets);
		for (const key of Object.keys(Keywords)) {
			completions.push({
				label: key,
				kind: CompletionItemKind.Keyword,
			});
		}
		return completions;
	} catch {
		return [];
	}
};
