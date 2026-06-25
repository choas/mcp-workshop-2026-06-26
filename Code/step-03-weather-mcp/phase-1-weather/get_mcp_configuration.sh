#!/usr/bin/env bash
#
# get_mcp_configuration.sh — print this folder's MCP server configuration.
#
# Copy the output into your MCP client config (Claude Desktop, Cursor, ...).
#
# Usage:
#   ./get_mcp_configuration.sh [--use-npx] [--add-mcpServer]
#
# Options:
#   --use-npx        Run the server via `npx tsx` instead of the default
#                    `node --import tsx`.
#   --add-mcpServer  Emit a full { "mcpServers": { ... } } document instead of
#                    just the bare { "<name>": { ... } } entry.
#
set -euo pipefail

SERVER_NAME="weather"

use_npx=0
add_wrapper=0
for arg in "$@"; do
  case "$arg" in
    --use-npx) use_npx=1 ;;
    --add-mcpServer) add_wrapper=1 ;;
    -h|--help)
      grep -E '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 1 ;;
  esac
done

# Absolute path to this folder's MCP entry point.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
entry="$script_dir/src/index.ts"

if [ "$use_npx" -eq 1 ]; then
  command="npx"
  args="\"tsx\", \"$entry\""
else
  command="node"
  args="\"--import\", \"tsx\", \"$entry\""
fi

if [ "$add_wrapper" -eq 1 ]; then
  cat <<EOF
{
  "mcpServers": {
    "$SERVER_NAME": {
      "command": "$command",
      "args": [$args]
    }
  }
}
EOF
else
  cat <<EOF
{
  "$SERVER_NAME": {
    "command": "$command",
    "args": [$args]
  }
}
EOF
fi
