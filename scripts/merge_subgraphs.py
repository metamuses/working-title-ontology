#!/usr/bin/env python3

"""
Merge selected Turtle subgraph files into the main project graph.

The script preserves the header/prefix section of ontology/graph.ttl, removes
any previously merged graph body, then appends the body of each configured
subgraph from ontology/graphs/.

Each subgraph is expected to contain a prefix/header section followed by a
blank line and then its graph triples. Only the content after the first blank
line is merged.

The operation is idempotent: running the script multiple times produces the same
graph.ttl output, as long as the source files do not change.
"""

import sys
from pathlib import Path

# Resolve the project root from the script location
ROOT_DIR = Path(__file__).resolve().parent.parent

# Define the main graph and subgraphs paths
MAIN_GRAPH = ROOT_DIR / "ontology" / "graph.ttl"
SUBGRAPHS_DIR = ROOT_DIR / "ontology" / "graphs"

# List subgraphs in merge order.
SUBGRAPH_FILES = [
    "the-call-of-the-wild.ttl",
    "the-lion-king.ttl",
    "the-matrix.ttl",
]

# Define the separator between subgraphs
SEPARATOR = "\n\n\n"

# Check if the main graph exists before proceeding
if not MAIN_GRAPH.exists():
    sys.exit(f"Error: {MAIN_GRAPH} does not exist")

# Read the current main graph without counting the final LF as a blank line
main_lines = MAIN_GRAPH.read_text(encoding="utf-8").splitlines()

# Find true blank lines
blank_lines = [index for index, line in enumerate(main_lines) if line.strip() == ""]

# Keep only the stable header, up to the second blank line if present
if len(blank_lines) >= 2:
    main_header = "\n".join(main_lines[: blank_lines[1]])
else:
    main_header = "\n".join(main_lines)

# Collect subgraph bodies before rewriting the main graph
subgraph_bodies = []

for filename in SUBGRAPH_FILES:
    path = SUBGRAPHS_DIR / filename

    # Skip missing subgraphs
    if not path.exists():
        continue

    print(f"Appending {path.relative_to(ROOT_DIR)}")

    # Read the subgraph without preserving trailing LF noise
    lines = path.read_text(encoding="utf-8").splitlines()

    # Find the first blank line separating prefixes from body
    first_blank_line = next(
        (index for index, line in enumerate(lines) if line.strip() == ""),
        None,
    )

    # Skip files without a clear header/body separator
    if first_blank_line is None:
        continue

    # Keep only the body after the prefix/header section
    body = "\n".join(lines[first_blank_line + 1 :]).strip()

    # Store non-empty bodies
    if body:
        subgraph_bodies.append(body)

# Join sections with two visible empty lines between them
merged_graph = SEPARATOR.join(
    [
        main_header.rstrip(),
        *subgraph_bodies,
    ]
)

# Rewrite the main graph in one pass
MAIN_GRAPH.write_text(f"{merged_graph}\n", encoding="utf-8")

print(f"\nMerged graph written to {MAIN_GRAPH.relative_to(ROOT_DIR)}")
