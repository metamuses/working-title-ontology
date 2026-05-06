#!/usr/bin/env python3

"""
Check Turtle graph files for ontology vocabulary consistency.

The script loads ontology/ontology.ttl to discover declared ontology terms,
then loads every .ttl file under ontology/graphs/ and validates Turtle syntax.

It reports three kinds of issues:
- Unknown predicates: ontology predicates used in graphs but not declared as properties
- Unknown classes: ontology classes used with rdf:type but not declared as classes
- Unknown objects: ontology terms used as objects but not declared in the ontology

For each issue, the script groups errors by graph file.

This catches common mistakes such as misspelled predicates, rdf:type values,
or ontology individuals used as objects.

The script exits with status 1 when syntax or vocabulary consistency issues
are found, making it suitable for local checks and CI pipelines.
"""

from pathlib import Path
import sys

from rdflib import Graph, URIRef
from rdflib.namespace import RDF, RDFS, OWL
from rdflib.plugins.parsers.notation3 import BadSyntax

ROOT_DIR = Path(__file__).resolve().parent.parent

ONTOLOGY_FILE = ROOT_DIR / "ontology" / "ontology.ttl"
GRAPH_DIR = ROOT_DIR / "ontology" / "graphs"

ONTOLOGY_URI = "https://monomyth.metamuses.org/ontology#"


def parse_turtle_file(rdf_graph, ttl_file):
    try:
        rdf_graph.parse(ttl_file, format="turtle")
    except BadSyntax as error:
        print(f"\nTurtle syntax error in: {ttl_file}")
        print(f"Line: {getattr(error, 'lines', 'unknown')}")
        print(error)
        sys.exit(1)


def is_ontology_term(node):
    return isinstance(node, URIRef) and str(node).startswith(ONTOLOGY_URI)


def label(rdf_graph, node):
    return rdf_graph.namespace_manager.normalizeUri(node)


def collect_declared_classes(rdf_graph):
    declared = set()

    class_types = [
        OWL.Class,
        RDFS.Class,
    ]

    for rdf_class_type in class_types:
        for term_uri in rdf_graph.subjects(RDF.type, rdf_class_type):
            if is_ontology_term(term_uri):
                declared.add(term_uri)

    return declared


def collect_declared_properties(rdf_graph):
    declared = set()

    property_types = [
        RDF.Property,
        OWL.ObjectProperty,
        OWL.DatatypeProperty,
        OWL.AnnotationProperty,
    ]

    for property_type in property_types:
        for term_uri in rdf_graph.subjects(RDF.type, property_type):
            if is_ontology_term(term_uri):
                declared.add(term_uri)

    return declared


def collect_declared_terms(rdf_graph):
    declared = set()

    for term_uri in rdf_graph.subjects():
        if is_ontology_term(term_uri):
            declared.add(term_uri)

    return declared


ontology = Graph()
parse_turtle_file(ontology, ONTOLOGY_FILE)

data_graph = Graph()

for prefix, namespace_uri in ontology.namespaces():
    data_graph.bind(prefix, namespace_uri)

known_classes = collect_declared_classes(ontology)
known_properties = collect_declared_properties(ontology)
known_terms = collect_declared_terms(ontology)

used_predicates = {}
used_classes = {}
used_object_terms = {}

for graph_file in sorted(GRAPH_DIR.glob("**/*.ttl")):
    print(f"Loading {graph_file}")

    file_graph = Graph()
    parse_turtle_file(file_graph, graph_file)

    for prefix, namespace_uri in ontology.namespaces():
        file_graph.bind(prefix, namespace_uri)

    for triple_subject, triple_predicate, triple_object in file_graph:
        if is_ontology_term(triple_predicate):
            used_predicates.setdefault(triple_predicate, set()).add(graph_file)

        if triple_predicate == RDF.type and is_ontology_term(triple_object):
            used_classes.setdefault(triple_object, set()).add(graph_file)

        elif is_ontology_term(triple_object):
            used_object_terms.setdefault(triple_object, set()).add(graph_file)

        data_graph.add((triple_subject, triple_predicate, triple_object))

unknown_predicates = set(used_predicates) - known_properties
unknown_classes = set(used_classes) - known_classes
unknown_object_terms = set(used_object_terms) - known_terms

unknown_predicates_by_file = {}
unknown_classes_by_file = {}
unknown_object_terms_by_file = {}

for predicate_uri in unknown_predicates:
    for graph_file in used_predicates[predicate_uri]:
        unknown_predicates_by_file.setdefault(graph_file, set()).add(predicate_uri)

for unknown_class_uri in unknown_classes:
    for graph_file in used_classes[unknown_class_uri]:
        unknown_classes_by_file.setdefault(graph_file, set()).add(unknown_class_uri)

for object_uri in unknown_object_terms:
    for graph_file in used_object_terms[object_uri]:
        unknown_object_terms_by_file.setdefault(graph_file, set()).add(object_uri)

has_errors = False

if unknown_predicates_by_file:
    has_errors = True

    print("\nUnknown predicates: ontology predicates used but not declared:\n")

    for graph_file in sorted(unknown_predicates_by_file):
        print(graph_file)

        for predicate_uri in sorted(unknown_predicates_by_file[graph_file]):
            print(f"  - {label(data_graph, predicate_uri)}")

if unknown_classes_by_file:
    has_errors = True

    print("\nUnknown classes: ontology classes used with rdf:type but not declared:\n")

    for graph_file in sorted(unknown_classes_by_file):
        print(graph_file)

        for unknown_class_uri in sorted(unknown_classes_by_file[graph_file]):
            print(f"  - {label(data_graph, unknown_class_uri)}")

if unknown_object_terms_by_file:
    has_errors = True

    print("\nUnknown object terms: ontology terms used as objects but not declared:\n")

    for graph_file in sorted(unknown_object_terms_by_file):
        print(graph_file)

        for object_uri in sorted(unknown_object_terms_by_file[graph_file]):
            print(f"  - {label(data_graph, object_uri)}")

if has_errors:
    sys.exit(1)

print("\nNo unknown predicates, unknown classes, or unknown object terms found.")
