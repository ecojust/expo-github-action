#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// 获取当前时间
const now = new Date();
const buildTime = now
  .toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    // hour: "2-digit",
    // minute: "2-digit",
    // second: "2-digit",
    // hour12: false,
  })
  .replace(/\//g, "-");

// 读取 package.json 获取版本号
const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const version = packageJson.version;

// 生成构建号（基于时间戳）
const buildNumber = Math.floor(now.getTime() / 1000).toString();

// 生成新的 build.ts 内容
const buildContent = `// 构建版本信息
export const BUILD_INFO = {
  version: "${version}",
  buildTime: "${buildTime}",
  buildNumber: "${buildNumber}",
};`;

// 写入 build.ts 文件
fs.writeFileSync("build.ts", buildContent, "utf8");

console.log(`✅ 构建信息已更新:`);
console.log(`   版本: ${version}`);
console.log(`   构建时间: ${buildTime}`);
console.log(`   构建号: ${buildNumber}`);
