#!/usr/bin/env bash

# Merge multiple TTL graph files within a directory skipping the prefixes header
# from each source graph and append them to a single consolidated graph file.

set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(git rev-parse --show-toplevel)"
MAIN_GRAPH="$ROOT_DIR/ontology/graph.ttl"

SUBGRAPHS_DIR="$ROOT_DIR/ontology/graphs"
SUBGRAPH_FILES=(
  the-matrix.ttl
)

# Ensure the main graph file exists before attempting to append to it
if [ ! -f "$MAIN_GRAPH" ]; then
  echo "Error: $MAIN_GRAPH does not exist"
  exit 1
fi

# Remove all lines from the main graph starting from line 29
sed '29,$d' "$MAIN_GRAPH" > "$MAIN_GRAPH.tmp" && mv "$MAIN_GRAPH.tmp" "$MAIN_GRAPH"

# Add an extra blank line before appending the subgraph contents
echo >> "$MAIN_GRAPH"

for file in "${SUBGRAPH_FILES[@]}"; do
  # Construct the graph file path
  filepath="$SUBGRAPHS_DIR/$file"

  # Check if the file exists before processing
  [ -f "$filepath" ] || continue

  echo "Appending ${filepath#$ROOT_DIR/}"

  # Add an extra blank line before each individual graph contents
  echo >> "$MAIN_GRAPH"

  # Append the file content, skipping the headers up to the first blank line
  sed '1,/^$/d' "$filepath" >> "$MAIN_GRAPH"

  # Add an extra blank line after each individual graph contents
  echo >> "$MAIN_GRAPH"
done

# Remove the last blank line from the output file using a temporary file
sed '$d' "$MAIN_GRAPH" > "$MAIN_GRAPH.tmp" && mv "$MAIN_GRAPH.tmp" "$MAIN_GRAPH"

echo "Merged graph written to ${MAIN_GRAPH#$ROOT_DIR/}"
