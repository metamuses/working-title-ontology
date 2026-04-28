import sys
from pathlib import Path
from rdflib import Graph, URIRef
from rdflib.plugins.parsers.notation3 import BadSyntax

ROOT_DIR = Path(__file__).resolve().parent.parent
GRAPHS_DIR = ROOT_DIR / "ontology" / "graphs"

BASE_URI = "https://monomyth.metamuses.org/graph/"

g = Graph()

for ttl_file in sorted(GRAPHS_DIR.glob("**/*.ttl")):
    print(f"Loading {ttl_file}")
    try:
        g.parse(ttl_file, format="turtle")
    except BadSyntax as e:
        print(f"\nTurtle syntax error in: {ttl_file}")
        print(f"Line: {getattr(e, 'lines', 'unknown')}")
        print(e)
        sys.exit(1)


def is_local_resource(node):
    return isinstance(node, URIRef) and str(node).startswith(BASE_URI)


subjects = set()
objects = set()

for s, p, o in g:
    if is_local_resource(s):
        subjects.add(s)

    if is_local_resource(o):
        objects.add(o)

# Local entity referenced as object, but never defined as subject
missing_definitions = objects - subjects

# Local entity defined as subject, but never referenced by another local subject
orphans = []

for resource in subjects:
    incoming_local_links = [
        (s, p) for s, p in g.subject_predicates(resource) if is_local_resource(s)
    ]

    if not incoming_local_links:
        orphans.append(resource)

if missing_definitions:
    print("\nMissing definitions:")
    for resource in sorted(missing_definitions):
        print(f"  => {resource}")

if orphans:
    print("\nOrphaned entities:")
    for resource in sorted(orphans):
        print(f"  => {resource}")

if missing_definitions or orphans:
    sys.exit(1)

print("\nNo missing definitions or orphaned local resources found.")
