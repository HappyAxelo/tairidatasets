"""Citation string generation (APA, IEEE, BibTeX) for datasets."""
from __future__ import annotations

from app.models.dataset import Dataset
from app.utils import slugify


def _year(dataset: Dataset) -> str:
    return str(dataset.created_at.year) if dataset.created_at else "n.d."


def _authors(dataset: Dataset) -> str:
    return dataset.authors or (dataset.owner.full_name if dataset.owner else "TAIRI Lab")


def apa(dataset: Dataset, base_url: str) -> str:
    authors = _authors(dataset)
    year = _year(dataset)
    doi = f" https://doi.org/{dataset.doi}" if dataset.doi else f" {base_url}/datasets/{dataset.slug}"
    version = dataset.latest_version.version if dataset.latest_version else "1.0"
    return (
        f"{authors} ({year}). {dataset.title} (Version {version}) [Data set]. "
        f"TAIRI DataHub, University of Rwanda.{doi}"
    )


def ieee(dataset: Dataset, base_url: str) -> str:
    authors = _authors(dataset)
    year = _year(dataset)
    link = f"https://doi.org/{dataset.doi}" if dataset.doi else f"{base_url}/datasets/{dataset.slug}"
    return (
        f'{authors}, "{dataset.title}," TAIRI DataHub, University of Rwanda, '
        f"{year}. [Online]. Available: {link}"
    )


def bibtex(dataset: Dataset, base_url: str) -> str:
    key = slugify(f"{_authors(dataset).split(',')[0]}{_year(dataset)}{dataset.slug}").replace("-", "")
    year = _year(dataset)
    doi_line = f"  doi          = {{{dataset.doi}}},\n" if dataset.doi else ""
    url = f"https://doi.org/{dataset.doi}" if dataset.doi else f"{base_url}/datasets/{dataset.slug}"
    return (
        f"@dataset{{{key},\n"
        f"  title        = {{{dataset.title}}},\n"
        f"  author       = {{{_authors(dataset)}}},\n"
        f"  year         = {{{year}}},\n"
        f"  publisher    = {{TAIRI DataHub, University of Rwanda}},\n"
        f"{doi_line}"
        f"  url          = {{{url}}}\n"
        f"}}"
    )


def all_styles(dataset: Dataset, base_url: str) -> dict[str, str]:
    return {
        "apa": apa(dataset, base_url),
        "ieee": ieee(dataset, base_url),
        "bibtex": bibtex(dataset, base_url),
    }
