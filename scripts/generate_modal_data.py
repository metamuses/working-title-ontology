#!/usr/bin/env python3

"""
Generate website modal data from Turtle subgraphs.

The script loads each configured .ttl file from graph/subgraphs/ and extracts
the data needed by the website modal stage interaction:
- Stage realization labels and realizationDescription text
- Divergence labels and divergenceRationale text
- Journey grouping via monomyth:MonomythExpression

For each modal, output is grouped into one or more journeys (for example
Batman's Bruce Wayne and Jim Gordon journeys), each keyed by stage order.

The resulting JSON is written to website/data/modal_data.json and consumed
client-side by website/js/main.js, so modal behavior no longer depends on
runtime Turtle parsing in the browser.

The operation is deterministic and idempotent: running the script multiple
times produces the same JSON output as long as the source Turtle files do not
change.
"""

import json
import sys
from pathlib import Path

from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import RDF, RDFS

ROOT_DIR = Path(__file__).resolve().parent.parent
SUBGRAPHS_DIR = ROOT_DIR / "graph" / "subgraphs"
ONTOLOGY_FILE = ROOT_DIR / "ontology" / "ontology.ttl"
OUTPUT_JSON = ROOT_DIR / "website" / "data" / "modal_data.json"

MONOMYTH = Namespace("https://monomyth.metamuses.org/ontology#")

MODAL_TTL_MAP = {
    "kg-modal-matrix": "the-matrix.ttl",
    "kg-modal-lion-king": "the-lion-king.ttl",
    "kg-modal-call-of-wild": "the-call-of-the-wild.ttl",
    "kg-modal-rostam": "rostam-haft-khan.ttl",
    "kg-modal-waltermitty": "walter-mitty.ttl",
    "kg-modal-batman": "batman.ttl",
    "kg-modal-oedipus": "oedipus.ttl",
    "kg-modal-sable-fable": "sable-fable.ttl",
    "kg-modal-ladybird": "lady-bird.ttl",
    "kg-modal-aeneid": "aeneid.ttl",
    "kg-modal-zelda": "ocarina-of-time.ttl",
    "kg-modal-orlando": "orlando-furioso.ttl",
}

PRED_MONOMYTH_EXPRESSION = MONOMYTH.MonomythExpression
PRED_STAGE_REALIZATION = MONOMYTH.StageRealization
PRED_STAGE_REALIZATION_OF = MONOMYTH.stageRealizationOf
PRED_STAGE_REALIZATION_ORDER = MONOMYTH.stageRealizationOrder
PRED_REALIZATION_DESCRIPTION = MONOMYTH.realizationDescription
PRED_REALIZES_STAGE = MONOMYTH.realizesStage
PRED_DIVERGENCE_RATIONALE = MONOMYTH.divergenceRationale

PRED_HAS_NARRATIVE_DIVERGENCE = MONOMYTH.hasNarrativeDivergence
PRED_HAS_SEQUENTIAL_DIVERGENCE = MONOMYTH.hasSequentialDivergence
PRED_HAS_SEMIOTIC_DIVERGENCE = MONOMYTH.hasSemioticDivergence

PRED_NARRATIVE_DIVERGENCE = MONOMYTH.NarrativeDivergence
PRED_SEQUENTIAL_DIVERGENCE = MONOMYTH.SequentialDivergence
PRED_SEMIOTIC_DIVERGENCE = MONOMYTH.SemioticDivergence

DIVERGENCE_TYPES = {
    PRED_NARRATIVE_DIVERGENCE: "narrative",
    PRED_SEQUENTIAL_DIVERGENCE: "sequential",
    PRED_SEMIOTIC_DIVERGENCE: "semiotic",
}

STAGE_DIVERGENCE_PREDICATES = (
    ("narrative", PRED_HAS_NARRATIVE_DIVERGENCE),
    ("sequential", PRED_HAS_SEQUENTIAL_DIVERGENCE),
    ("semiotic", PRED_HAS_SEMIOTIC_DIVERGENCE),
)


def normalize_text(value: str | None) -> str | None:
    """Collapse whitespace so multiline literals become compact sentences."""
    if value is None:
        return None
    return " ".join(value.split())


def iri_tail(iri: str) -> str:
    """Return a readable fallback from an IRI string."""
    parts = iri.rstrip("/").split("/")
    return parts[-1] if parts else iri


def literal_value(graph: Graph, subject: URIRef, predicate: URIRef) -> str | None:
    """Return the first literal object value for a subject/predicate pair."""
    for obj in graph.objects(subject, predicate):
        return str(obj)
    return None


def parse_order(graph: Graph, stage_iri: URIRef) -> int | None:
    """Read a numeric stage order from a stage realization node."""
    for obj in graph.objects(stage_iri, PRED_STAGE_REALIZATION_ORDER):
        try:
            return int(obj)
        except (TypeError, ValueError):
            return None
    return None


def stage_term_value(graph: Graph, stage_term_iri: URIRef) -> str:
    """Return compact QName or fallback tail for a canonical stage URI."""
    if not isinstance(stage_term_iri, URIRef):
        return str(stage_term_iri)

    normalized = graph.namespace_manager.normalizeUri(stage_term_iri)

    if normalized and ":" in normalized:
        return normalized

    return iri_tail(str(stage_term_iri))


def collect_ontology_stage_labels() -> dict[str, str]:
    """Load ontology stage labels keyed by stage URI string."""
    if not ONTOLOGY_FILE.exists():
        sys.exit(f"Error: missing ontology file {ONTOLOGY_FILE}")

    ontology_graph = Graph()
    ontology_graph.parse(ONTOLOGY_FILE, format="turtle")

    stage_labels: dict[str, str] = {}
    for stage_iri in ontology_graph.subjects(RDF.type, MONOMYTH.Stage):
        label = literal_value(ontology_graph, stage_iri, RDFS.label)
        if label:
            stage_labels[str(stage_iri)] = label

    return stage_labels


def collect_divergence_data(graph: Graph) -> dict[str, dict[str, str | None]]:
    """Build divergence metadata lookup keyed by divergence IRI string."""
    divergences: dict[str, dict[str, str | None]] = {}

    for divergence_type_iri, divergence_key in DIVERGENCE_TYPES.items():
        for divergence_iri in graph.subjects(RDF.type, divergence_type_iri):
            iri_str = str(divergence_iri)
            label = literal_value(graph, divergence_iri, RDFS.label) or iri_tail(
                iri_str
            )
            rationale = normalize_text(
                literal_value(graph, divergence_iri, PRED_DIVERGENCE_RATIONALE)
            )
            divergences[iri_str] = {
                "type": divergence_key,
                "label": label,
                "rationale": rationale,
            }

    return divergences


def build_stage_payload(
    graph: Graph,
    stage_iri: URIRef,
    divergence_lookup: dict[str, dict[str, str | None]],
    ontology_stage_labels: dict[str, str],
) -> dict[str, object]:
    """Build one stage payload used in the modal data JSON output."""
    payload: dict[str, object] = {
        "label": literal_value(graph, stage_iri, RDFS.label),
        "description": normalize_text(
            literal_value(graph, stage_iri, PRED_REALIZATION_DESCRIPTION)
        ),
    }

    for realized_stage_iri in graph.objects(stage_iri, PRED_REALIZES_STAGE):
        stage_uri = str(realized_stage_iri)
        payload["realizesStage"] = stage_term_value(graph, realized_stage_iri)
        payload["realizesStageLabel"] = ontology_stage_labels.get(
            stage_uri
        ) or iri_tail(stage_uri)
        break

    for divergence_key, divergence_predicate in STAGE_DIVERGENCE_PREDICATES:
        for divergence_iri in graph.objects(stage_iri, divergence_predicate):
            divergence_data = divergence_lookup.get(str(divergence_iri))
            if divergence_data is None:
                continue
            payload[divergence_key] = {
                "label": divergence_data["label"],
                "rationale": divergence_data["rationale"],
            }
            break

    return payload


def collect_expression_stages(
    graph: Graph,
    divergence_lookup: dict[str, dict[str, str | None]],
    ontology_stage_labels: dict[str, str],
) -> dict[str, dict[int, dict[str, object]]]:
    """Group stages by monomyth expression and stage order."""
    expression_stages: dict[str, dict[int, dict[str, object]]] = {}

    for stage_iri in graph.subjects(RDF.type, PRED_STAGE_REALIZATION):
        stage_order = parse_order(graph, stage_iri)
        if stage_order is None:
            continue

        stage_payload = build_stage_payload(
            graph,
            stage_iri,
            divergence_lookup,
            ontology_stage_labels,
        )
        for expression_iri in graph.objects(stage_iri, PRED_STAGE_REALIZATION_OF):
            expression_key = str(expression_iri)
            expression_stages.setdefault(expression_key, {})[
                stage_order
            ] = stage_payload

    return expression_stages


def build_modal_payload(
    ttl_filename: str,
    ontology_stage_labels: dict[str, str],
) -> dict[str, object]:
    """Parse a single subgraph and convert it into modal-friendly data JSON."""
    ttl_path = SUBGRAPHS_DIR / ttl_filename
    if not ttl_path.exists():
        sys.exit(f"Error: missing subgraph file {ttl_path}")

    graph = Graph()
    graph.parse(ttl_path, format="turtle")

    divergence_lookup = collect_divergence_data(graph)
    expression_stages = collect_expression_stages(
        graph,
        divergence_lookup,
        ontology_stage_labels,
    )

    journeys = []
    expression_iris = sorted(
        str(iri) for iri in graph.subjects(RDF.type, PRED_MONOMYTH_EXPRESSION)
    )

    for expression_iri in expression_iris:
        stage_map = expression_stages.get(expression_iri, {})
        ordered_stages: dict[str, dict[str, object]] = {}
        for stage_order in sorted(stage_map):
            ordered_stages[str(stage_order)] = stage_map[stage_order]

        journeys.append(
            {
                "id": expression_iri,
                "label": literal_value(graph, URIRef(expression_iri), RDFS.label)
                or iri_tail(expression_iri),
                "stages": ordered_stages,
            }
        )

    if not journeys:
        sys.exit(f"Error: no monomyth expressions found in {ttl_path}")

    return {
        "ttlFile": ttl_filename,
        "journeys": journeys,
    }


modals: dict[str, dict[str, object]] = {}
ONTOLOGY_STAGE_LABELS = collect_ontology_stage_labels()

for modal_id, modal_ttl_filename in MODAL_TTL_MAP.items():
    print(f"Parsing graph/subgraphs/{modal_ttl_filename}")
    modals[modal_id] = build_modal_payload(
        modal_ttl_filename,
        ONTOLOGY_STAGE_LABELS,
    )

output = modals

OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
OUTPUT_JSON.write_text(f"{json.dumps(output, indent=2)}\n", encoding="utf-8")

print(f"\nWrote modal data to {OUTPUT_JSON.relative_to(ROOT_DIR)}")
