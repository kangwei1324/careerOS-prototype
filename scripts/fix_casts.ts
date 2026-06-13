import { Project, SyntaxKind, AsExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths(['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts']);

const files = project.getSourceFiles();

for (const sourceFile of files) {
  let fileChanged = false;

  const asExprs = sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression);
  
  for (const asExpr of asExprs) {
    const typeNode = asExpr.getTypeNode();
    const typeText = typeNode?.getText() || '';
    
    if (typeText !== 'any' && typeText !== 'number' && typeText !== 'string' && typeText !== 'boolean' && typeText !== 'unknown') {
      const expr = asExpr.getExpression().getText();
      // Only do this if the expression is likely a DB row
      if (expr.includes('db.execute') || expr.includes('rows')) {
        asExpr.replaceWithText(`${expr} as unknown as ${typeText}`);
        fileChanged = true;
      }
    }
  }

  if (fileChanged) {
    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
