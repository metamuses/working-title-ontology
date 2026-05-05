#!/usr/bin/env python3

"""
Check Turtle graph files for RDF consistency issues.

The script loads every .ttl file under ontology/graphs/, validates Turtle
syntax, and inspects local resources belonging to the configured BASE_URI.

It reports two kinds of issues:
- Missing definitions: resources referenced as objects but never defined as subjects
- Orphaned entities: resources defined as subjects but never referenced by another subject

The script exits with status 1 when syntax or consistency issues are found,
making it suitable for local checks and CI pipelines.
"""

import sys
from pathlib import Path
from rdflib import Graph, URIRef
from rdflib.plugins.parsers.notation3 import BadSyntax

# Resolve the project root from the script location
ROOT_DIR = Path(__file__).resolve().parent.parent

# Define the directory containing Turtle graph files
GRAPHS_DIR = ROOT_DIR / "ontology" / "graphs"

# Define the URI prefix used to identify local project resources
BASE_URI = "https://monomyth.metamuses.org/graph/"

# Create the RDF graph that will contain all parsed triples
g = Graph()

# Load every Turtle file in the graphs directory
for ttl_file in sorted(GRAPHS_DIR.glob("**/*.ttl")):
    print(f"Loading {ttl_file}")

    # Stop immediately if any Turtle file has invalid syntax
    try:
        g.parse(ttl_file, format="turtle")
    except BadSyntax as e:
        print(f"\nTurtle syntax error in: {ttl_file}")
        print(f"Line: {getattr(e, 'lines', 'unknown')}")
        print(e)
        sys.exit(1)


# Return true only for URI resources belonging to this project graph
def is_local_resource(node):
    return isinstance(node, URIRef) and str(node).startswith(BASE_URI)


# Collect local resources that appear as subjects or objects
subjects = set()
objects = set()

# Inspect all triples and classify local subject/object resources
for s, p, o in g:
    if is_local_resource(s):
        subjects.add(s)

    if is_local_resource(o):
        objects.add(o)

# Find local resources referenced as objects but never defined as subjects
missing_definitions = objects - subjects

# Collect local subjects that no other local resource points to
orphans = []

# Check whether each local subject has incoming links from local subjects
for resource in subjects:
    incoming_local_links = [
        (s, p) for s, p in g.subject_predicates(resource) if is_local_resource(s)
    ]

    # Mark resources without incoming local links as orphaned
    if not incoming_local_links:
        orphans.append(resource)

# Print missing local resource definitions
if missing_definitions:
    print("\nMissing definitions:")
    for resource in sorted(missing_definitions):
        print(f"  => {resource}")

# Print orphaned local resources
if orphans:
    print("\nOrphaned entities:")
    for resource in sorted(orphans):
        print(f"  => {resource}")

# Fail the script if any issue was found
if missing_definitions or orphans:
    sys.exit(1)

print("\nNo missing definitions or orphaned local resources found.")
