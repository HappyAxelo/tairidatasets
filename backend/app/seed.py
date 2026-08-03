"""Database bootstrap & seed script.

Run with ``python -m app.seed`` (or via the Docker entrypoint). It is
idempotent: existing rows are left untouched, so it is safe to re-run.

Seeds:
  * All tables (create_all)
  * Roles + permissions with RBAC mapping
  * Departments, research areas, categories, licenses
  * The three super-administrator accounts
  * Five student researcher accounts + one demo researcher
  * A handful of demo datasets so the UI is populated on first launch
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import (  # noqa: F401 - ensures metadata is populated
    Category,
    Dataset,
    DatasetVersion,
    Department,
    License,
    Permission,
    ResearchArea,
    Role,
    Tag,
    User,
)
from app.models.enums import DatasetStatus, RoleName, UserStatus, Visibility
from app.services.datasets import resolve_tags, unique_slug

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tairi.seed")


PERMISSIONS = [
    ("user.manage", "Create, suspend and delete users"),
    ("dataset.approve", "Approve or reject datasets"),
    ("dataset.delete_any", "Delete or restore any dataset"),
    ("dataset.upload", "Upload datasets"),
    ("dataset.manage_own", "Manage own datasets"),
    ("access.decide", "Approve or reject access requests"),
    ("stats.view", "View platform statistics"),
    ("logs.view", "View audit logs"),
    ("storage.manage", "Manage storage and backups"),
    ("taxonomy.manage", "Manage categories and research areas"),
    ("dataset.browse", "Browse and search datasets"),
    ("access.request", "Request access to datasets"),
    ("dataset.download", "Download datasets"),
]

ROLE_PERMISSIONS = {
    RoleName.SUPER_ADMIN: [p[0] for p in PERMISSIONS],
    RoleName.STUDENT_RESEARCHER: [
        "dataset.upload", "dataset.manage_own", "access.decide",
        "dataset.browse", "dataset.download", "access.request",
    ],
    RoleName.RESEARCHER: ["dataset.browse", "access.request", "dataset.download"],
    RoleName.GUEST: ["dataset.browse"],
}

DEPARTMENTS = [
    ("Computer Science", "College of Science and Technology"),
    ("Electrical and Electronics Engineering", "College of Science and Technology"),
    ("Information Systems", "College of Science and Technology"),
    ("Biomedical Engineering", "College of Medicine and Health Sciences"),
    ("Agricultural Engineering", "College of Agriculture"),
    ("Data Science", "African Center of Excellence in Data Science"),
]

RESEARCH_AREAS = [
    "Artificial Intelligence", "Machine Learning", "Healthcare", "Agriculture",
    "IoT", "Computer Vision", "Natural Language Processing", "Cybersecurity",
    "Robotics", "GIS", "Remote Sensing", "Climate", "Education", "Energy",
    "Smart Cities", "Others",
]

CATEGORIES = [
    "Tabular", "Image", "Video", "Audio", "Text", "Time Series",
    "Geospatial", "Medical", "Sensor", "Mixed",
]

LICENSES = [
    ("CC-BY-4.0", "Creative Commons Attribution 4.0", "https://creativecommons.org/licenses/by/4.0/"),
    ("CC-BY-SA-4.0", "Creative Commons Attribution-ShareAlike 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"),
    ("CC-BY-NC-4.0", "Creative Commons Attribution-NonCommercial 4.0", "https://creativecommons.org/licenses/by-nc/4.0/"),
    ("CC0-1.0", "Creative Commons Zero (Public Domain)", "https://creativecommons.org/publicdomain/zero/1.0/"),
    ("MIT", "MIT License", "https://opensource.org/licenses/MIT"),
    ("Apache-2.0", "Apache License 2.0", "https://www.apache.org/licenses/LICENSE-2.0"),
    ("TAIRI-Restricted", "TAIRI Restricted Access (request required)", None),
]


def seed_roles_permissions(db) -> dict[RoleName, Role]:
    perms: dict[str, Permission] = {}
    for code, desc in PERMISSIONS:
        p = db.scalar(select(Permission).where(Permission.code == code))
        if not p:
            p = Permission(code=code, description=desc)
            db.add(p)
        perms[code] = p
    db.flush()

    roles: dict[RoleName, Role] = {}
    descriptions = {
        RoleName.SUPER_ADMIN: "Full platform administration (max 3 accounts)",
        RoleName.STUDENT_RESEARCHER: "Uploads and manages own datasets",
        RoleName.RESEARCHER: "Browses and requests access to datasets",
        RoleName.GUEST: "Unauthenticated read-only access",
    }
    for role_name in RoleName:
        role = db.scalar(select(Role).where(Role.name == role_name.value))
        if not role:
            role = Role(name=role_name.value, description=descriptions[role_name])
            db.add(role)
            db.flush()
        role.permissions = [perms[c] for c in ROLE_PERMISSIONS[role_name]]
        roles[role_name] = role
    db.flush()
    return roles


def seed_taxonomy(db) -> None:
    for name, faculty in DEPARTMENTS:
        if not db.scalar(select(Department).where(Department.name == name)):
            db.add(Department(name=name, faculty=faculty))
    from app.utils import slugify

    for name in RESEARCH_AREAS:
        if not db.scalar(select(ResearchArea).where(ResearchArea.name == name)):
            db.add(ResearchArea(name=name, slug=slugify(name)))
    for name in CATEGORIES:
        if not db.scalar(select(Category).where(Category.name == name)):
            db.add(Category(name=name, slug=slugify(name)))
    for code, name, url in LICENSES:
        if not db.scalar(select(License).where(License.code == code)):
            db.add(License(code=code, name=name, url=url))
    db.flush()


def seed_users(db, roles: dict[RoleName, Role]) -> list[User]:
    # Super admins (exactly three).
    for i, email in enumerate(settings.SUPERADMIN_EMAILS[:3], start=1):
        if not db.scalar(select(User).where(User.email == email)):
            db.add(User(
                email=email, username=f"superadmin{i}",
                full_name=f"TAIRI Administrator {i}",
                hashed_password=hash_password(settings.SUPERADMIN_DEFAULT_PASSWORD),
                role_id=roles[RoleName.SUPER_ADMIN].id,
                status=UserStatus.ACTIVE, is_email_verified=True,
                affiliation="TAIRI Lab, University of Rwanda",
            ))

    students: list[User] = []
    student_names = [
        ("Aline Uwase", "aline.uwase"),
        ("Eric Niyonzima", "eric.niyonzima"),
        ("Chantal Mukamana", "chantal.mukamana"),
        ("Jean-Paul Habimana", "jp.habimana"),
        ("Diane Ingabire", "diane.ingabire"),
    ]
    for full_name, username in student_names:
        email = f"{username}@student.ur.ac.rw"
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(
                email=email, username=username, full_name=full_name,
                hashed_password=hash_password("Student#2026"),
                role_id=roles[RoleName.STUDENT_RESEARCHER].id,
                status=UserStatus.ACTIVE, is_email_verified=True,
                affiliation="TAIRI Lab, University of Rwanda",
            )
            db.add(user)
        students.append(user)

    # One demo researcher (request-only role).
    if not db.scalar(select(User).where(User.email == "researcher@ur.ac.rw")):
        db.add(User(
            email="researcher@ur.ac.rw", username="researcher",
            full_name="Demo Researcher",
            hashed_password=hash_password("Researcher#2026"),
            role_id=roles[RoleName.RESEARCHER].id,
            status=UserStatus.ACTIVE, is_email_verified=True,
            affiliation="University of Rwanda",
        ))
    db.flush()
    return students


DEMO_DATASETS = [
    {
        "title": "Rice Disease Image Dataset (Rwanda)",
        "description": "High-resolution field images of rice leaves labelled across "
                       "five disease classes, collected across paddies in the Eastern "
                       "Province of Rwanda for computer-vision research.",
        "authors": "A. Uwase, E. Niyonzima",
        "keywords": "rice, plant disease, agriculture, computer vision, Rwanda",
        "research_area": "Computer Vision",
        "category": "Image",
        "license": "CC-BY-4.0",
        "tags": ["agriculture", "images", "plant-disease", "rwanda"],
        "visibility": Visibility.RESTRICTED,
    },
    {
        "title": "Kinyarwanda Speech Corpus",
        "description": "A curated corpus of transcribed Kinyarwanda speech recordings "
                       "for automatic speech recognition and NLP research.",
        "authors": "C. Mukamana",
        "keywords": "kinyarwanda, speech, ASR, NLP, low-resource",
        "research_area": "Natural Language Processing",
        "category": "Audio",
        "license": "CC-BY-SA-4.0",
        "tags": ["nlp", "audio", "kinyarwanda", "speech"],
        "visibility": Visibility.PUBLIC,
    },
    {
        "title": "Kigali Air Quality Sensor Readings",
        "description": "Time-series PM2.5 and PM10 readings from low-cost IoT sensors "
                       "deployed across Kigali, supporting urban climate research.",
        "authors": "J. Habimana, D. Ingabire",
        "keywords": "air quality, IoT, sensors, climate, smart cities",
        "research_area": "IoT",
        "category": "Time Series",
        "license": "CC0-1.0",
        "tags": ["iot", "climate", "sensors", "kigali"],
        "visibility": Visibility.PUBLIC,
    },
    {
        "title": "Malaria Cell Microscopy Images",
        "description": "Annotated blood-smear microscopy images for malaria parasite "
                       "detection, curated for medical machine-learning research.",
        "authors": "TAIRI Health AI Group",
        "keywords": "malaria, medical imaging, healthcare, diagnosis",
        "research_area": "Healthcare",
        "category": "Medical",
        "license": "TAIRI-Restricted",
        "tags": ["healthcare", "medical", "images", "malaria"],
        "visibility": Visibility.RESTRICTED,
    },
]


def seed_datasets(db, students: list[User]) -> None:
    if db.scalar(select(Dataset.id)):
        return  # Datasets already present; skip demo content.

    for i, spec in enumerate(DEMO_DATASETS):
        owner = students[i % len(students)]
        area = db.scalar(select(ResearchArea).where(ResearchArea.name == spec["research_area"]))
        category = db.scalar(select(Category).where(Category.name == spec["category"]))
        lic = db.scalar(select(License).where(License.code == spec["license"]))
        dataset = Dataset(
            slug=unique_slug(db, spec["title"]),
            title=spec["title"],
            description=spec["description"],
            authors=spec["authors"],
            affiliation="TAIRI Lab, University of Rwanda",
            contact_email=owner.email,
            keywords=spec["keywords"],
            owner_id=owner.id,
            research_area_id=area.id if area else None,
            category_id=category.id if category else None,
            license_id=lic.id if lic else None,
            visibility=spec["visibility"],
            status=DatasetStatus.APPROVED,
            approved_at=datetime.now(timezone.utc),
            readme=f"# {spec['title']}\n\n{spec['description']}\n\n"
                   "## Usage\nRequest access and cite appropriately.",
            download_count=(i + 1) * 17,
            view_count=(i + 1) * 130,
            like_count=(i + 1) * 4,
        )
        dataset.tags = resolve_tags(db, spec["tags"])
        db.add(dataset)
        db.flush()
        db.add(DatasetVersion(dataset_id=dataset.id, version="1.0", is_current=True,
                              created_by_id=owner.id))
    db.flush()


def run() -> None:
    log.info("Creating tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        roles = seed_roles_permissions(db)
        seed_taxonomy(db)
        students = seed_users(db, roles)
        db.commit()
        seed_datasets(db, students)
        db.commit()
        log.info("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
