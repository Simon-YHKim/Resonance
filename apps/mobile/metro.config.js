/* eslint-env node */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// pnpm workspace — apps/* 의 node_modules + root node_modules 둘 다 검색
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// pnpm 의 symlink 모듈 처리
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
});
