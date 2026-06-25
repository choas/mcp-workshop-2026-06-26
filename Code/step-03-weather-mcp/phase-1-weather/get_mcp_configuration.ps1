#!/usr/bin/env pwsh
#
# get_mcp_configuration.ps1 — print this folder's MCP server configuration.
#
# Copy the output into your MCP client config (Claude Desktop, Cursor, ...).
#
# Usage:
#   ./get_mcp_configuration.ps1 [--use-npx] [--add-mcpServer]
#
# Options:
#   --use-npx        Run the server via `npx tsx` instead of the default
#                    `node --import tsx`.
#   --add-mcpServer  Emit a full { "mcpServers": { ... } } document instead of
#                    just the bare { "<name>": { ... } } entry.
#
$ErrorActionPreference = "Stop"

$ServerName = "weather"

$UseNpx = $false
$AddWrapper = $false
foreach ($arg in $args) {
  switch ($arg) {
    "--use-npx" { $UseNpx = $true }
    "--add-mcpServer" { $AddWrapper = $true }
    { $_ -in @("-h", "--help") } {
      Get-Content $PSCommandPath |
        Where-Object { $_ -match "^# " } |
        ForEach-Object { $_ -replace "^# ?", "" }
      exit 0
    }
    default { Write-Error "Unknown option: $arg"; exit 1 }
  }
}

# Absolute path to this folder's MCP entry point (forward slashes work on Windows too).
$ScriptDir = Split-Path -Parent $PSCommandPath
$Entry = (Join-Path $ScriptDir "src/index.ts") -replace "\\", "/"

if ($UseNpx) {
  $Command = "npx"
  $ArgsJson = "`"tsx`", `"$Entry`""
} else {
  $Command = "node"
  $ArgsJson = "`"--import`", `"tsx`", `"$Entry`""
}

if ($AddWrapper) {
  @"
{
  "mcpServers": {
    "$ServerName": {
      "command": "$Command",
      "args": [$ArgsJson]
    }
  }
}
"@
} else {
  @"
{
  "$ServerName": {
    "command": "$Command",
    "args": [$ArgsJson]
  }
}
"@
}
