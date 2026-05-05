# The Monomyth Ontology

Group project for the Knowledge Representation and Extraction 2024/25 course.

The **Monomyth Ontology** is an RDF/OWL ontology for modeling narrative works
through **Joseph Campbell**'s theory of the hero's journey, developed in *The
Hero with a Thousand Faces* (1949) within the broader field of comparative
mythology. The monomyth describes a **recurring narrative pattern** in which a
hero leaves the ordinary world, enters a realm of trials and transformation,
gains some form of knowledge or power, and returns changed. This project uses
that framework to study how different works **repeat, adapt, or challenge**
inherited mythic structures across cultures, genres, and historical periods.

The site of the project is live at [monomyth.metamuses.org](https://monomyth.metamuses.org).

## Ontology design

The ontology is designed to model the monomyth as an interpretive structure that
can be applied to individual narrative works. Its core idea is to separate the
abstract pattern of the hero's journey from the concrete way that pattern
appears in a specific story. This makes it possible to compare narratives
without reducing them to the same template: each work can follow, adapt, weaken,
invert, displace, or omit parts of the Campbellian structure.

The ontology is available at [monomyth.metamuses.org/ontology](https://monomyth.metamuses.org/ontology).

The most important components are:

* **Narrative work**: the story being analyzed, such as a film, poem, epic,
novel, or other narrative form.
* **Monomyth expression**: the specific interpretation of a narrative work
through the hero's journey framework.
* **Acts and stages**: the three broad phases of the monomyth, Departure,
Initiation, and Return, articulated through Campbell's seventeen stages.
* **Stage realizations**: the concrete moments in a story where a monomyth stage
is realized, described, evaluated, and placed in the narrative sequence.
* **Characters and archetypes**: the figures involved in the journey, connected
to functional roles such as hero, mentor, herald, shadow, ally, trickster, or
threshold guardian, based on Vogler's adaptation for screenwriting of Campbell's
work.
* **Fit qualities**: a graded vocabulary for expressing how closely a narrative
moment corresponds to a monomyth stage, from perfect alignment to weak, absent,
or inverted realization.
* **Divergences**: explicit descriptions of how and why a story departs from the
expected monomyth pattern, distinguishing narrative, sequential, and semiotic
forms of variation.
* **Interpretive notes**: prose annotations that preserve the reasoning behind
each mapping, especially where the relationship between the story and the
monomyth requires nuance rather than simple classification.

## Knowledge graphs

The repository also includes example knowledge graphs that apply the ontology to
specific narrative works. Each graph uses the monomyth framework to describe how
a story realizes, adapts, displaces, or resists the stages of the hero's
journey. These examples are intended both as case studies in comparative
narrative analysis and as practical models for creating new graphs with the
ontology.

The full knowledge graph is available at [monomyth.metamuses.org/graph/](https://monomyth.metamuses.org/graph/).

Analyzed works include:

* **The Oedipus myth**: a classical myth about a king whose attempt to escape
prophecy leads him toward the discovery of his own hidden guilt.
* **Rostam's Seven Labours**: an episode from the Persian *Shahnameh* about the
hero Rostam overcoming seven trials to rescue the Iranian king Kay Kāvus.
* **The Call of the Wild**: a novel about a domesticated dog taken into the
brutal world of the Klondike, where he gradually returns to a wilder state.
* **Batman: Year One**: a comic book arc about Bruce Wayne's first year as
Batman and James Gordon's struggle against corruption in Gotham City.
* **The Lion King**: an animated coming-of-age film about a young lion prince
who must confront his past and reclaim his kingdom.
* **The Matrix**: a science-fiction film about a hacker who discovers that
reality is a simulated world controlled by machines.
* **The Secret Life of Walter Mitty**: a film about an ordinary man whose
imagined adventures become a real journey of courage, discovery, and
self-transformation.
* **SABLE, fABLE**: a music album by Bon Iver that explores emotional fracture,
intimacy, renewal, and the passage from darkness toward connection.

## Team members

- [Tommaso Barbato](https://github.com/epistrephein)
- [Nicol D'Amelio](https://github.com/nicoldamelio)
- [Maryam Dadrasrazi](https://github.com/Maryamdadras)
- [Martina Uccheddu](https://github.com/martinaucch)

## License

This work is licensed under CC-BY-4.0. See the [LICENSE](LICENSE.txt) for details.
