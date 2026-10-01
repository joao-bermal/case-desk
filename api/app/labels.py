"""Portuguese labels for exports. The web app keeps its own copy for the UI."""

from app.models import CaseStatus, PracticeArea, Role

STATUS = {
    CaseStatus.OPEN: "Aberto",
    CaseStatus.IN_PROGRESS: "Em andamento",
    CaseStatus.CLOSED: "Concluído",
    CaseStatus.ARCHIVED: "Arquivado",
}

PRACTICE_AREA = {
    PracticeArea.CIVIL: "Cível",
    PracticeArea.LABOR: "Trabalhista",
    PracticeArea.TAX: "Tributário",
    PracticeArea.CORPORATE: "Empresarial",
    PracticeArea.CONSUMER: "Consumidor",
    PracticeArea.INTELLECTUAL_PROPERTY: "Propriedade intelectual",
}

ROLE = {
    Role.SECRETARY: "Secretaria",
    Role.LAWYER: "Advogado",
    Role.CLIENT: "Cliente",
}


def format_cnpj(cnpj: str) -> str:
    return f"{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}"
