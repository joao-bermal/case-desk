"""Labels for the CSV export, in the request language. The web app keeps its own copy."""

from app.i18n import current_lang
from app.models import CaseStatus, PracticeArea

_STATUS = {
    "pt": {
        CaseStatus.OPEN: "Aberto",
        CaseStatus.IN_PROGRESS: "Em andamento",
        CaseStatus.CLOSED: "Concluído",
        CaseStatus.ARCHIVED: "Arquivado",
    },
    "en": {
        CaseStatus.OPEN: "Open",
        CaseStatus.IN_PROGRESS: "In progress",
        CaseStatus.CLOSED: "Closed",
        CaseStatus.ARCHIVED: "Archived",
    },
}

_AREA = {
    "pt": {
        PracticeArea.CIVIL: "Cível",
        PracticeArea.LABOR: "Trabalhista",
        PracticeArea.TAX: "Tributário",
        PracticeArea.CORPORATE: "Empresarial",
        PracticeArea.CONSUMER: "Consumidor",
        PracticeArea.INTELLECTUAL_PROPERTY: "Propriedade intelectual",
    },
    "en": {
        PracticeArea.CIVIL: "Civil",
        PracticeArea.LABOR: "Labor",
        PracticeArea.TAX: "Tax",
        PracticeArea.CORPORATE: "Corporate",
        PracticeArea.CONSUMER: "Consumer",
        PracticeArea.INTELLECTUAL_PROPERTY: "Intellectual property",
    },
}

_CSV_HEADER = {
    "pt": [
        "ID",
        "Título",
        "Área",
        "Status",
        "Empresa",
        "CNPJ",
        "Advogado",
        "Criado em",
        "Atualizado em",
        "Descrição",
    ],
    "en": [
        "ID",
        "Title",
        "Area",
        "Status",
        "Company",
        "CNPJ",
        "Lawyer",
        "Created",
        "Updated",
        "Description",
    ],
}

_DATE = {"pt": "%d/%m/%Y", "en": "%m/%d/%Y"}


def status_label(status: CaseStatus) -> str:
    return _STATUS[current_lang.get()][status]


def area_label(area: PracticeArea) -> str:
    return _AREA[current_lang.get()][area]


def csv_header() -> list[str]:
    return _CSV_HEADER[current_lang.get()]


def date_format() -> str:
    return _DATE[current_lang.get()]


def format_cnpj(cnpj: str) -> str:
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
