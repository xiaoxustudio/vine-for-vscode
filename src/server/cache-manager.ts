import { CompletionItem, CompletionItemKind } from 'vscode-languageserver/node';
import { Expr, FunctionDecl, Literal, VariableDecl } from "vine-lang/dist/node";
import { Keywords, Token } from "vine-lang/dist/keywords";
import { toRealValue } from "vine-lang";

interface DocumentCache {
    ast: Expr[];
    completionItems: CompletionItem[];
    version: number;
}

export class CacheManager {
    private static instance: CacheManager;
    private documentCaches: Map<string, DocumentCache> = new Map();
    private keywordCompletions: CompletionItem[];

    private constructor() {
        // 预先构建关键字补全项
        this.keywordCompletions = Object.keys(Keywords).map(key => ({
            label: key,
            kind: CompletionItemKind.Keyword
        }));
    }

    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }

    public updateDocument(uri: string, ast: Expr[], version: number): void {
        const completionItems = this.buildCompletionItems(ast);
        this.documentCaches.set(uri, {
            ast,
            completionItems,
            version
        });
    }

    public getCompletionItems(uri: string): CompletionItem[] {
        const cache = this.documentCaches.get(uri);
        if (!cache) {
            return this.keywordCompletions;
        }
        return [...cache.completionItems, ...this.keywordCompletions];
    }

    public getAST(uri: string): Expr[] | undefined {
        return this.documentCaches.get(uri)?.ast;
    }

    private buildCompletionItems(ast: Expr[]): CompletionItem[] {
        return ast
            .filter(node => [
                "FunctionDeclaration",
                "LambdaFunctionDecl",
                "VariableDeclaration"
            ].includes(node.type))
            .map((target: any) => {
                if (target.type === "FunctionDeclaration") {
                    const stmt = target as FunctionDecl;
                    return {
                        label: toRealValue(stmt.id) as string,
                        kind: CompletionItemKind.Function,
                        detail: this.buildFunctionSignature(stmt)
                    };
                } else {
                    const stmt = target as VariableDecl;
                    const isFunc = stmt.value.type === "LambdaFunctionDecl";
                    return {
                        label: toRealValue(stmt.id) as string,
                        kind: isFunc ? CompletionItemKind.Function : CompletionItemKind.Variable,
                        detail: isFunc ? this.buildFunctionSignature(stmt.value) : undefined
                    };
                }
            });
    }

    private buildFunctionSignature(func: FunctionDecl | any): string {
        const params = func.params?.map((p: Literal | Token) => toRealValue(p)) || [];
        return `(${params.join(', ')})`;
    }

    public clearCache(uri: string): void {
        this.documentCaches.delete(uri);
    }
}