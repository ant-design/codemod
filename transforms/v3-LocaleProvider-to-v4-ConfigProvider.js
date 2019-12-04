const { printOptions } = require('./utils/config');
const { removeEmptyModuleImport, addSubmoduleImport } = require('./utils');

module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const root = j(file.source);
  const antdPkgNames = options.antdPkgNames || ['antd'];

  // rename old LocaleProvider imports
  function renameAntdLocaleProviderImport(j, root) {
    let hasChanged = false;

    // import { LocaleProvider } from 'antd';
    root
      .find(j.Identifier)
      .filter(
        path =>
          path.node.name === 'LocaleProvider' &&
          path.parent.node.type === 'ImportSpecifier' &&
          antdPkgNames.includes(path.parent.parent.node.source.value),
      )
      .forEach(path => {
        const antdPkgName = path.parent.parent.node.source.value;
        hasChanged = true;
        const localComponentName = path.parent.node.local.name;

        const importDeclaration = path.parent.parent.node;
        importDeclaration.specifiers = importDeclaration.specifiers.filter(
          specifier =>
            !specifier.imported || specifier.imported.name !== 'LocaleProvider',
        );

        if (localComponentName === 'LocaleProvider') {
          root
            .findJSXElements(localComponentName)
            .find(j.JSXIdentifier, {
              name: localComponentName,
            })
            .forEach(nodePath => {
              nodePath.node.name = 'ConfigProvider';

              addSubmoduleImport(j, root, antdPkgName, 'ConfigProvider');
            });
        } else {
          addSubmoduleImport(
            j,
            root,
            antdPkgName,
            'ConfigProvider',
            localComponentName,
          );
        }
      });

    return hasChanged;
  }

  // step1. remove LocaleProvider import from antd
  // step2. add ConfigProvider import from antd
  // step3. cleanup antd import if empty
  let hasChanged = false;
  hasChanged = renameAntdLocaleProviderImport(j, root) || hasChanged;

  if (hasChanged) {
    antdPkgNames.forEach(antdPkgName => {
      removeEmptyModuleImport(j, root, antdPkgName);
    });
  }

  return hasChanged
    ? root.toSource(options.printOptions || printOptions)
    : null;
};
