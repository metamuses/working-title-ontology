# Repository Guidelines

## Project Structure & Module Organization
- `ontology/ontology.ttl`: core ontology vocabulary.
- `ontology/graph.ttl`: merged project knowledge graph.
- `ontology/graphs/*.ttl`: per-work subgraphs (one narrative work per file).
- `scripts/`: Python maintenance/validation utilities (`check_rdf_issues.py`, `check_rdf_inverses.py`, `check_rdf_entities.py`, `merge_subgraphs.py`).
- `website/`: static site assets (`index.html`, `css/`, `js/`, `kg-descriptions/`).
- `config/monomyth.nginx`: deployment server config.

## Build, Test, and Development Commands
- `python -m venv .venv && source .venv/bin/activate`: create and activate local environment.
- `pip install -r requirements.txt`: install Python dependency (`rdflib`).
- `python scripts/check_rdf_issues.py`: detect missing definitions and orphaned local entities.
- `python scripts/check_rdf_inverses.py`: validate inverse-property consistency.
- `python scripts/check_rdf_entities.py`: validate entity-level RDF constraints.
- `python scripts/merge_subgraphs.py`: rebuild `ontology/graph.ttl` from selected subgraphs.
- `rapper -i turtle ontology/ontology.ttl -c` and `rapper -i turtle ontology/graph.ttl -c`: Turtle syntax checks (matches CI).

## Coding Style & Naming Conventions
- Follow `.editorconfig`: UTF-8, LF, final newline, no trailing whitespace.
- Indentation: 2 spaces by default; 4 spaces for `*.py`, `*.ttl`, `*.nginx`, and Markdown.
- Python: max line length 120 (`.pylintrc`), descriptive snake_case identifiers.
- Turtle graph filenames use lowercase kebab-case (for example, `the-lion-king.ttl`).

## Testing Guidelines
- This repository uses validation scripts and CI checks rather than unit-test suites.
- Before opening a PR, run all RDF checks locally:
  `python scripts/check_rdf_issues.py && python scripts/check_rdf_inverses.py && python scripts/check_rdf_entities.py`
- Validate Turtle syntax for changed files, especially under `ontology/graphs/`.

## Commit & Pull Request Guidelines
- Keep commit messages short, imperative, and specific (for example, `Fix reveal of about stages boxes`, `Rename footer project name`).
- Scope each commit to one logical change (ontology data, validation script, or website content).
- PRs should include:
  - concise summary of what changed and why,
  - affected paths (for example, `ontology/graphs/oedipus.ttl`),
  - screenshots for `website/` UI changes,
  - confirmation that RDF and Turtle checks pass.

## Security & Configuration Tips
- Do not commit secrets or deployment credentials.
- Treat `.github/workflows/*.yml` and `config/monomyth.nginx` edits as high-impact; validate carefully before merge.
