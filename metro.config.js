const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// WatermelonDBのネストされたnode_modulesをMetroに認識させる
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, 'node_modules/@nozbe/watermelondb/node_modules'),
];

config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths || []),
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, 'node_modules/@nozbe/watermelondb/node_modules'),
];

// ウェブ環境でNode.js専用モジュールをスタブに置き換え
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'better-sqlite3': path.resolve(__dirname, 'src/stubs/empty.js'),
  'fs': path.resolve(__dirname, 'src/stubs/empty.js'),
};

module.exports = config;
