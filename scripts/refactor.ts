import { Project, SyntaxKind, CallExpression } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths(['app/**/*.ts', 'app/**/*.tsx', 'lib/**/*.ts']);

const files = project.getSourceFiles();

for (const sourceFile of files) {
  let fileChanged = false;

  // 1. replace `result.lastInsertRowid as number`
  sourceFile.getDescendantsOfKind(SyntaxKind.AsExpression).forEach(asExpr => {
    if (asExpr.getText() === 'result.lastInsertRowid as number') {
      asExpr.replaceWithText('Number(result.lastInsertRowid)');
      fileChanged = true;
    }
  });

  sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach(propAccess => {
    if (propAccess.getText() === 'result.lastInsertRowid' && propAccess.getParentIfKind(SyntaxKind.VariableDeclaration)) {
      // It might not be an AsExpression, maybe just `const x = result.lastInsertRowid;`
      // For now, let's just do a string replace at the end if needed.
    }
  });

  // Find all .get(), .all(), .run() calls
  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  
  // We need to iterate backwards to avoid position shifting issues
  const callsToReplace: { expr: CallExpression, newText: string }[] = [];

  for (const callExpr of callExprs) {
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      const methodName = propAccess.getName();
      
      if (['get', 'all', 'run'].includes(methodName)) {
        const caller = propAccess.getExpression(); // should be db.prepare(...)
        
        if (caller.getKind() === SyntaxKind.CallExpression) {
          const prepareCall = caller.asKindOrThrow(SyntaxKind.CallExpression);
          const prepareExpr = prepareCall.getExpression();
          
          if (prepareExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
            const prepareProp = prepareExpr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
            
            if (prepareProp.getName() === 'prepare') {
              // We have a match! db.prepare(SQL).get|all|run(ARGS)
              const sqlArg = prepareCall.getArguments()[0]?.getText();
              if (!sqlArg) continue;

              const runArgs = callExpr.getArguments().map(a => a.getText());
              
              let newText = '';
              const hasArgs = runArgs.length > 0;
              
              const executeCall = hasArgs 
                ? `await db.execute({ sql: ${sqlArg}, args: [${runArgs.join(', ')}] })`
                : `await db.execute(${sqlArg})`;

              if (methodName === 'get') {
                newText = `(${executeCall}).rows[0]`;
              } else if (methodName === 'all') {
                newText = `(${executeCall}).rows`;
              } else if (methodName === 'run') {
                newText = executeCall;
              }
              
              callsToReplace.push({ expr: callExpr, newText });
            }
          }
        }
      }
    }
  }

  // Replace from bottom up
  callsToReplace.reverse().forEach(({ expr, newText }) => {
    expr.replaceWithText(newText);
    fileChanged = true;
  });

  // Ensure functions containing `await` are marked `async`
  // Actually, TS will complain and we can manually fix them or just let the AST do it?
  // We can just find the nearest function and make it async!
  if (fileChanged) {
    sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach(func => {
      const hasAwait = func.getDescendantsOfKind(SyntaxKind.AwaitExpression).length > 0;
      if (hasAwait && !func.isAsync()) {
        func.setIsAsync(true);
      }
    });

    sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction).forEach(func => {
      const hasAwait = func.getDescendantsOfKind(SyntaxKind.AwaitExpression).length > 0;
      if (hasAwait && !func.isAsync()) {
        func.setIsAsync(true);
      }
    });

    sourceFile.saveSync();
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
}
