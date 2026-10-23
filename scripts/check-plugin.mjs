#!/usr/bin/env node

/**
 * Checks the DataGrout GitHub Copilot plugin against the Agent Plugins 1.0 manifest
 * rules and awesome-copilot's external plugin quality gates
 * (eng/external-plugin-quality-gates.mjs): allowed fields only, the 1.0.0 `$schema`
 * on plugin.json and mcp.json, one Streamable HTTP server at the DataGrout gateway,
 * matching versions, skill front matter, a square PNG icon, and no hooks, scripts or
 * package files shipped inside the plugin.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const pluginRel = "plugins/datagrout";
const pluginDir = path.join(repoRoot, pluginRel);
const serverUrl = "https://gateway.datagrout.ai/connect";
const pluginSchema = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const mcpSchema = "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json";
const pluginFields = new Set([
  "$schema", "name", "version", "description", "author", "homepage", "repository",
  "license", "keywords", "extensions",
]);
const authorFields = new Set(["name", "email", "url"]);
const forbiddenEntries = [
  "hooks", "scripts", "bin", "agents", "commands", ".claude-plugin", ".cursor-plugin",
  ".mcp.json", "package.json", "package-lock.json", ".npmrc",
];
const errors = [];

function addError(message) {
  errors.push(message);
}

async function readText(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8").catch(() => {
    addError(`${relativePath} is missing.`);
    return null;
  });
}

async function readJson(relativePath) {
  const text = await readText(relativePath);
  if (text === null) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    addError(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

async function pathExists(targetPath) {
  return fs.lstat(targetPath).then(() => true, () => false);
}

function isHttps(value) {
  return typeof value === "string" && value.startsWith("https://");
}

function checkManifest(manifest) {
  if (!manifest) {
    return;
  }
  if (manifest.$schema !== pluginSchema) {
    addError(`plugin.json "$schema" must be "${pluginSchema}"; without it Copilot CLI ignores mcp.json.`);
  }
  for (const field of Object.keys(manifest)) {
    if (!pluginFields.has(field)) {
      addError(`plugin.json field "${field}" is not part of Agent Plugins 1.0.`);
    }
  }
  if (manifest.name !== "datagrout") {
    addError('plugin.json "name" must stay "datagrout"; it is the plugin\'s permanent identity.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
    addError('plugin.json "version" must be MAJOR.MINOR.PATCH.');
  }
  for (const field of ["description", "license"]) {
    if (!manifest[field]) {
      addError(`plugin.json must set "${field}".`);
    }
  }
  for (const field of ["homepage", "repository"]) {
    if (!isHttps(manifest[field])) {
      addError(`plugin.json "${field}" must be an https:// URL.`);
    }
  }
  if (!manifest.author?.name) {
    addError('plugin.json must set "author.name".');
  }
  for (const field of Object.keys(manifest.author ?? {})) {
    if (!authorFields.has(field)) {
      addError(`plugin.json field "author.${field}" is not part of Agent Plugins 1.0.`);
    }
  }
  for (const keyword of manifest.keywords ?? []) {
    if (!/^[a-z0-9-]+$/.test(keyword)) {
      addError(`plugin.json keyword "${keyword}" must be lowercase letters, digits and hyphens.`);
    }
  }
}

function checkMcpConfig(mcp) {
  if (!mcp) {
    return;
  }
  if (mcp.$schema !== mcpSchema) {
    addError(`mcp.json "$schema" must be "${mcpSchema}", the same Agent Plugins version as plugin.json.`);
  }
  const extraKeys = Object.keys(mcp).filter((key) => key !== "$schema" && key !== "mcpServers");
  if (extraKeys.length > 0) {
    addError(`mcp.json allows only "$schema" and "mcpServers" (found: ${extraKeys.join(", ")}).`);
  }
  const names = Object.keys(mcp.mcpServers ?? {});
  if (names.length !== 1 || names[0] !== "datagrout") {
    addError(`mcp.json must define exactly one server, "datagrout" (found: ${names.join(", ") || "none"}).`);
    return;
  }
  const server = mcp.mcpServers.datagrout;
  if (server.type !== "streamable-http") {
    addError('mcp.json "datagrout" must use "type": "streamable-http"; Copilot CLI skips "http".');
  }
  if (server.url !== serverUrl) {
    addError(`mcp.json "datagrout" url must be ${serverUrl}.`);
  }
  const extraServerKeys = Object.keys(server).filter((key) => key !== "type" && key !== "url");
  if (extraServerKeys.length > 0) {
    addError(`mcp.json "datagrout" allows only "type" and "url"; OAuth needs no headers (found: ${extraServerKeys.join(", ")}).`);
  }
}

// awesome-copilot's version-match gate compares the form's version with plugin.json at the tag.
async function checkVersions(manifest) {
  const pkg = await readJson("package.json");
  const changelog = await readText(`${pluginRel}/CHANGELOG.md`);
  if (!manifest?.version) {
    return;
  }
  if (pkg && pkg.version !== manifest.version) {
    addError(`package.json version (${pkg.version}) must match plugin.json (${manifest.version}).`);
  }
  if (changelog !== null && !changelog.includes(`## ${manifest.version}`)) {
    addError(`${pluginRel}/CHANGELOG.md has no "## ${manifest.version}" entry.`);
  }
}

async function checkSkills() {
  const skillsDir = path.join(pluginDir, "skills");
  const entries = await fs.readdir(skillsDir, { withFileTypes: true }).catch(() => []);
  const skills = entries.filter((entry) => entry.isDirectory());
  if (skills.length === 0) {
    addError(`${pluginRel}/skills has no skill folders.`);
  }
  for (const skill of skills) {
    const relative = `${pluginRel}/skills/${skill.name}/SKILL.md`;
    const text = await readText(relative);
    const frontMatter = text?.match(/^---\n([\s\S]*?)\n---\n/)?.[1];
    if (text !== null && !frontMatter) {
      addError(`${relative} must start with YAML front matter.`);
      continue;
    }
    if (frontMatter && frontMatter.match(/^name:\s*(.+)$/m)?.[1].trim() !== skill.name) {
      addError(`${relative} front matter "name" must equal the folder name "${skill.name}".`);
    }
    if (frontMatter && !/^description:\s*\S/m.test(frontMatter)) {
      addError(`${relative} front matter must set "description".`);
    }
  }
}

async function checkIcon() {
  const iconPath = path.join(pluginDir, "assets", "logo.png");
  const icon = await fs.readFile(iconPath).catch(() => null);
  if (!icon) {
    addError(`${pluginRel}/assets/logo.png is missing.`);
    return;
  }
  // Width and height are big-endian uint32s in the IHDR chunk at bytes 16-23.
  if (icon.subarray(1, 4).toString("ascii") !== "PNG" || icon.readUInt32BE(16) !== icon.readUInt32BE(20)) {
    addError(`${pluginRel}/assets/logo.png must be a square PNG.`);
  }
}

async function checkPluginFolder() {
  for (const name of forbiddenEntries) {
    if (await pathExists(path.join(pluginDir, name))) {
      addError(`${pluginRel}/${name} exists; the Copilot plugin ships only plugin.json, mcp.json, skills, docs and the icon.`);
    }
  }
  for (const name of ["README.md", "LICENSE"]) {
    if (!(await pathExists(path.join(pluginDir, name)))) {
      addError(`${pluginRel}/${name} is missing.`);
    }
  }
}

async function main() {
  const manifest = await readJson(`${pluginRel}/plugin.json`);
  checkManifest(manifest);
  checkMcpConfig(await readJson(`${pluginRel}/mcp.json`));
  await checkVersions(manifest);
  await checkSkills();
  await checkIcon();
  await checkPluginFolder();

  if (errors.length > 0) {
    console.error("DataGrout Copilot plugin checks failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("DataGrout Copilot plugin checks passed.");
}

await main();
