[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.18211768.svg)](https://doi.org/10.5281/zenodo.18211768)

# Tal om Kvinnor: Corpus Reader

A client-side single-page application for browsing Swedish parliamentary debates from **1900–1940**. The reader is the public-facing interface for the *Tal om Kvinnor* ("Speech about Women") corpus — a digitised, annotated record of utterances from both chambers of the Swedish Riksdag (*Första kammaren* and *Andra kammaren*).

Per-year SQLite databases are downloaded on demand and executed in the browser via [sql.js](https://github.com/sql-js/sql.js) (WebAssembly), so no backend is required.

## Features

- **Browse** debates chronologically with a chained reader (prev/next utterance navigation).
- **Search** within a year by free text, party, gender, speaker, chamber, and *kvinna*-tag annotations.
- **Per-utterance metadata**: speaker, party, gender, date, chamber, and three layers of *kvinna*-keyword annotations.
- **Cross-year navigation** to follow individual speakers across the corpus.

## Tech stack

React 18 · TypeScript · Vite · TailwindCSS · sql.js · React Router DOM

## Local development

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173/
npm run build      # Type-check (tsc) and build for production
npm run preview    # Preview production build
```

Place per-year SQLite files in `./dbs/` (named `ToK_data_<year>.sqlite3`) for local dev, or set `VITE_USE_REMOTE_DB=true` to fetch from the production source.

## Deployment

`main` is auto-deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push. The production base path is `/ToK-Reader/`.

## Data schema

Two tables per year:

- `person(id, name, gender, party)`
- `utterance(id, content, prev, next, person_id, year, date, kammare, kvinna_1, kvinna_2, kvinna_3)`

Utterances form a linked list via `prev`/`next`. `kammare` is `1` (Första kammaren) or `2` (Andra kammaren).

## License

Code and derivative data are released under [CC-BY-NC-4.0](https://creativecommons.org/licenses/by-nc/4.0/).

## Citation

If you use this site or its derivative data, please cite it. Machine-readable metadata is provided in [`CITATION.cff`](./CITATION.cff).

**Plain text:**

> Johansson, M., & Holgersson, U. (2025). *Tal om Kvinnor: Corpus Reader*
> [Software]. https://doi.org/10.5281/zenodo.18211768

**BibTeX:**

```bibtex
@software{johansson_tok_reader_2025,
  author    = {Johansson, Mathias and Holgersson, Ulrika},
  title     = {Tal om Kvinnor: Corpus Reader},
  year      = {2025},
  month     = {12},
  url       = {https://github.com/DigitalHistory-Lund/ToK-Reader},
  doi       = {10.5281/zenodo.18211768},
  license   = {CC-BY-NC-4.0}
}
```
And make sure to cite the original source of the data:

```bib
@inproceedings{yrjanainen-etal-2024-swedish,
    title = "The {S}wedish Parliament Corpus 1867 {--} 2022",
    author = {Yrj{\"a}n{\"a}inen, V{\"a}in{\"o} Aleksi  and
      Mohammadi Nor{\'e}n, Fredrik  and
      Borges, Robert  and
      Jarlbrink, Johan  and
      {\r{A}}berg Brorsson, Lotta  and
      Olsson, Anders P.  and
      Snickars, Pelle  and
      Magnusson, M{\r{a}}ns},
    editor = "Calzolari, Nicoletta  and
      Kan, Min-Yen  and
      Hoste, Veronique  and
      Lenci, Alessandro  and
      Sakti, Sakriani  and
      Xue, Nianwen",
    booktitle = "Proceedings of the 2024 Joint International Conference on Computational Linguistics, Language Resources and Evaluation (LREC-COLING 2024)",
    month = may,
    year = "2024",
    address = "Torino, Italia",
    publisher = "ELRA and ICCL",
    url = "https://aclanthology.org/2024.lrec-main.1400/",
    pages = "16100--16112",
}
```

**Zenodo DOI:**
[10.5281/zenodo.18211768](https://doi.org/10.5281/zenodo.18211768)

## Authors

- **Mathias Johansson** — [ORCID 0000-0002-3338-0551](https://orcid.org/0000-0002-3338-0551) · MathiasJohansson@kultur.lu.se
- **Ulrika Holgersson** — [ORCID 0000-0002-0672-6166](https://orcid.org/0000-0002-0672-6166)
