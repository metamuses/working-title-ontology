# The Monomyth Ontology

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
The full documentation is available at [monomyth.metamuses.org/docs](https://monomyth.metamuses.org/docs).

The most important components are:

* **Narrative Work**: the story being analyzed, such as a film, poem, epic,
novel, or other narrative form.
* **Monomyth Expression**: the specific interpretation of a narrative work
through the hero's journey framework.
* **Acts** and **Stages**: the three broad phases of the monomyth, Departure,
Initiation, and Return, articulated through Campbell's seventeen stages.
* **Stage Realizations**: the concrete moments in a story where a monomyth stage
is realized, described, evaluated, and placed in the narrative sequence.
* **Characters** and **Archetypes**: the figures involved in the journey,
connected to functional roles such as hero, mentor, herald, shadow, ally,
trickster, or threshold guardian, based on Christopher Vogler's adaptation for
screenwriting of Campbell's work.
* **Fit Qualities**: a graded vocabulary for expressing how closely a narrative
moment corresponds to a monomyth stage, from perfect alignment to weak, absent,
or inverted realization.
* **Divergences**: explicit descriptions of how and why a story departs from the
expected monomyth pattern, distinguishing narrative, sequential, and semiotic
forms of variation.
* **Fit Notes**: prose annotations that preserve the reasoning behind each
mapping, especially where the relationship between the story and the monomyth
requires nuance rather than simple classification.

![Monomyth Ontology Graffoo](https://raw.githubusercontent.com/metamuses/monomyth/refs/heads/main/graffoo/ontology.png)

## Knowledge graphs

The repository also includes example knowledge graphs that apply the ontology to
specific narrative works. Each graph uses the monomyth framework to describe how
a story realizes, adapts, displaces, or resists the stages of the hero's
journey. These examples are intended both as case studies in comparative
narrative analysis and as practical models for creating new graphs with the
ontology.

The full knowledge graph is available at [monomyth.metamuses.org/graph/](https://monomyth.metamuses.org/graph/).

Analyzed works include:

* **Oedipus**: a classical myth about a king whose attempt to escape
prophecy leads him toward the discovery of his own hidden guilt.
* **Aeneid**: a Latin epic poem about Aeneas's journey from the ruins of
Troy toward the foundation of a new destiny in Italy.
* **Rostam and the Seven Labors**: an episode from the Persian *Shahnameh* about
the hero Rostam overcoming seven trials to rescue the Iranian king Kay Kāvus.
* **Orlando Furioso**: a chivalric epic poem about love, madness, war and
knightly adventure in the world of Charlemagne's paladins.
* **The Call of the Wild**: a novel about a domesticated dog taken into the
brutal world of the Klondike, where he gradually returns to a wilder state.
* **Batman: Year One**: a comic book arc about Bruce Wayne's first year as
Batman and James Gordon's struggle against corruption in Gotham City.
* **The Lion King**: an animated coming-of-age film about a young lion prince
who must confront his past and reclaim his kingdom.
* **The Legend of Zelda: Ocarina of Time**: a fantasy adventure game where a
young hero travels through time and battles evil to save Hyrule from darkness.
* **The Matrix**: a sci-fi thriller about a hacker who discovers humanity is
trapped inside a machine-controlled simulation hiding reality.
* **The Secret Life of Walter Mitty**: a film about an ordinary man whose
imagined adventures become a real journey of courage, discovery, and
self-transformation.
* **Lady Bird**: a sharp, heartfelt coming-of-age story about a Sacramento high
school senior navigating adolescence, family tensions, and self-discovery.
* **SABLE, fABLE**: a music album by Bon Iver that explores emotional fracture,
intimacy, renewal, and the passage from darkness toward connection.

## Acknowledgments

This work was developed as a group project for the "Knowledge Representation and
Extraction" course (2024/25) at University of Bologna.

## Team members

- [Tommaso Barbato](https://github.com/epistrephein)
- [Nicol D'Amelio](https://github.com/nicoldamelio)
- [Maryam Dadrasrazi](https://github.com/Maryamdadras)
- [Martina Uccheddu](https://github.com/martinaucch)

## License

This work is licensed under CC-BY-4.0. See the [LICENSE](LICENSE.txt) for details.
