const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const requiredModules = ["express"];
const modulesDir = path.join(__dirname, "..", "node_modules");

function isInstalled(moduleName) {
  return fs.existsSync(path.join(modulesDir, moduleName));
}

const missing = requiredModules.filter((moduleName) => !isInstalled(moduleName));

if (missing.length === 0) {
  console.log("Dependency check passed.");
  process.exit(0);
}

console.log(`Missing dependencies detected: ${missing.join(", ")}`);
console.log("Installing backend dependencies...");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(npmCmd, ["install"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log("Dependencies installed successfully.");
