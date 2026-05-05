#!/usr/bin/env python3

"""
Check Turtle graph files for inverse property consistency.

The script loads ontology/ontology.ttl to discover owl:inverseOf declarations
and rdfs:subPropertyOf relationships, then loads every .ttl file under
ontology/graphs/ and validates Turtle syntax.

It checks that every use of a property with an inverse is mirrored by the
corresponding inverse triple. Subproperties are handled automatically, so a
specific property such as monomyth:hasSequentialDivergence is accepted when
its parent property is declared as the inverse.

It reports inverse property inconsistencies, for example when resource A points
to resource B through one property, but resource B points back to a different
resource through the inverse property.

The script exits with status 1 when syntax or inverse consistency issues are
found, making it suitable for local checks and CI pipelines.
"""

from pathlib import Path
from rdflib import Graph, Namespace
from rdflib.namespace import OWL, RDFS
from rdflib.plugins.parsers.notation3 import BadSyntax
import sys

ROOT_DIR = Path(__file__).resolve().parent.parent

ONTOLOGY_FILE = ROOT_DIR / "ontology" / "ontology.ttl"
GRAPH_DIR = ROOT_DIR / "ontology" / "graphs"

MONOMYTH = Namespace("https://monomyth.metamuses.org/ontology#")


def parse_turtle_file(graph, ttl_file):
    try:
        graph.parse(ttl_file, format="turtle")
    except BadSyntax as e:
        print(f"\nTurtle syntax error in: {ttl_file}")
        print(f"Line: {getattr(e, 'lines', 'unknown')}")
        print(e)
        sys.exit(1)


def label(graph, node):
    return graph.namespace_manager.normalizeUri(node)


def collect_subproperties(graph, property_):
    subproperties = {property_}

    changed = True

    while changed:
        changed = False

        for candidate in graph.subjects(RDFS.subPropertyOf, None):
            parents = set(graph.objects(candidate, RDFS.subPropertyOf))

            if parents & subproperties and candidate not in subproperties:
                subproperties.add(candidate)
                changed = True

    return subproperties


def build_inverse_rules(ontology_graph):
    rules = []

    for left, right in ontology_graph.subject_objects(OWL.inverseOf):
        left_properties = collect_subproperties(ontology_graph, left)
        right_properties = collect_subproperties(ontology_graph, right)

        rules.append(
            {
                "left": left_properties,
                "right": right_properties,
            }
        )

    return rules


def has_any_triple(graph, s, ps, o):
    return any((s, p, o) in graph for p in ps)


ontology = Graph()
parse_turtle_file(ontology, ONTOLOGY_FILE)

data = Graph()

for ttl in sorted(GRAPH_DIR.glob("**/*.ttl")):
    print(f"Loading {ttl}")
    parse_turtle_file(data, ttl)

# Use ontology prefixes also when printing data graph nodes
for prefix, namespace in ontology.namespaces():
    data.bind(prefix, namespace)

inverse_rules = build_inverse_rules(ontology)

errors = []

for rule in inverse_rules:
    left_predicates = rule["left"]
    right_predicates = rule["right"]

    # Check left -> right
    #
    # Example:
    # <divergence> monomyth:divergenceOf <stage> .
    #
    # Requires:
    # <stage> monomyth:hasDivergence|hasSequentialDivergence|... <divergence> .
    for left_predicate in left_predicates:
        for subject, object_ in data.subject_objects(left_predicate):
            if not has_any_triple(data, object_, right_predicates, subject):
                expected = " OR ".join(
                    label(data, predicate) for predicate in sorted(right_predicates)
                )

                errors.append(
                    {
                        "source": subject,
                        "predicate": left_predicate,
                        "target": object_,
                        "expected_source": object_,
                        "expected_predicate": expected,
                        "expected_target": subject,
                    }
                )

    # Check right -> left
    #
    # Example:
    # <stage> monomyth:hasSequentialDivergence <divergence> .
    #
    # Requires:
    # <divergence> monomyth:divergenceOf <stage> .
    for right_predicate in right_predicates:
        for subject, object_ in data.subject_objects(right_predicate):
            if not has_any_triple(data, object_, left_predicates, subject):
                expected = " OR ".join(
                    label(data, predicate) for predicate in sorted(left_predicates)
                )

                errors.append(
                    {
                        "source": subject,
                        "predicate": right_predicate,
                        "target": object_,
                        "expected_source": object_,
                        "expected_predicate": expected,
                        "expected_target": subject,
                    }
                )

if errors:
    print("\nInverse property inconsistencies found:\n")

    for error in errors:
        print("Found:")
        print(f"  {label(data, error['source'])}")
        print(f"      {label(data, error['predicate'])}")
        print(f"      {label(data, error['target'])}")

        print("Expected inverse:")
        print(f"  {label(data, error['expected_source'])}")
        print(f"      {error['expected_predicate']}")
        print(f"      {label(data, error['expected_target'])}")
        print()

    sys.exit(1)

print("\nNo inverse property inconsistencies found.")
