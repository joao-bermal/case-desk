"""Fictional demo data. Every name is invented and every email uses the reserved .example
domain. CNPJs use the alphanumeric format with a DEMO root, which no real company has."""

from datetime import timedelta

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Case, CaseStatus, Company, PracticeArea, Role, User
from app.security import now
from app.validators import cnpj_with_check_digits

S, L, C = Role.SECRETARY, Role.LAWYER, Role.CLIENT
OPEN, PROGRESS, CLOSED, ARCHIVED = (
    CaseStatus.OPEN,
    CaseStatus.IN_PROGRESS,
    CaseStatus.CLOSED,
    CaseStatus.ARCHIVED,
)

COMPANIES = [
    ("vale-verde", "Vale Verde Alimentos Ltda", "DEMO00010001", "juridico@valeverde.example"),
    ("rota-sul", "Rota Sul Transportes Ltda", "DEMO00020001", "contato@rotasul.example"),
    ("horizonte", "Horizonte Engenharia S.A.", "DEMO00030001", "obras@horizonte.example"),
    ("bem-viver", "Clínica Bem Viver Ltda", "DEMO00040001", "adm@bemviver.example"),
    ("nuvem-azul", "Nuvem Azul Software Ltda", "DEMO00050001", "legal@nuvemazul.example"),
]

# (key, name, email, role, company key, is_demo)
PEOPLE = [
    ("marina", "Marina Alves", "secretaria@casedesk.example", S, None, True),
    ("ana", "Ana Ribeiro", "ana.ribeiro@casedesk.example", L, None, True),
    ("carlos", "Carlos Mendes", "carlos.mendes@casedesk.example", L, None, False),
    ("juliana", "Juliana Costa", "juliana.costa@casedesk.example", L, None, False),
    ("roberto", "Roberto Lima", "roberto@valeverde.example", C, "vale-verde", True),
    ("patricia", "Patrícia Rocha", "patricia@nuvemazul.example", C, "nuvem-azul", False),
]

# (title, area, status, company, lawyer, days since opened, days since last update, description)
CASES = [
    (
        "Reclamação trabalhista de ex-operador de produção",
        PracticeArea.LABOR,
        PROGRESS,
        "vale-verde",
        "ana",
        64,
        3,
        "Pedido de horas extras e adicional de insalubridade. Audiência de instrução marcada.",
    ),
    (
        "Revisão do contrato de fornecimento de embalagens",
        PracticeArea.CORPORATE,
        OPEN,
        "vale-verde",
        "carlos",
        6,
        6,
        "Cliente quer cláusula de reajuste anual e multa por atraso na entrega.",
    ),
    (
        "Defesa em ação de consumidor por lote com defeito",
        PracticeArea.CONSUMER,
        CLOSED,
        "vale-verde",
        "ana",
        210,
        40,
        "Acordo homologado com reembolso do lote e sem indenização por dano moral.",
    ),
    (
        "Registro da marca Vale Verde Orgânicos",
        PracticeArea.INTELLECTUAL_PROPERTY,
        PROGRESS,
        "vale-verde",
        "juliana",
        120,
        15,
        "Pedido depositado no INPI. Aguardando o prazo de oposição.",
    ),
    (
        "Execução fiscal de ICMS sobre frete interestadual",
        PracticeArea.TAX,
        PROGRESS,
        "rota-sul",
        "carlos",
        150,
        9,
        "Embargos à execução apresentados com garantia por seguro.",
    ),
    (
        "Indenização por avaria de carga refrigerada",
        PracticeArea.CIVIL,
        OPEN,
        "rota-sul",
        "ana",
        4,
        2,
        "Embarcador cobra a carga perdida. Reunir laudo do baú e registros de temperatura.",
    ),
    (
        "Acordo coletivo de jornada dos motoristas",
        PracticeArea.LABOR,
        CLOSED,
        "rota-sul",
        "juliana",
        300,
        90,
        "Acordo assinado com o sindicato, válido por dois anos.",
    ),
    (
        "Contrato de empreitada do Residencial Aurora",
        PracticeArea.CORPORATE,
        PROGRESS,
        "horizonte",
        "carlos",
        45,
        1,
        "Negociação de marcos de pagamento e seguro garantia com a incorporadora.",
    ),
    (
        "Cobrança contra subcontratada de terraplenagem",
        PracticeArea.CIVIL,
        ARCHIVED,
        "horizonte",
        "ana",
        400,
        180,
        "Arquivado após a falência da devedora. Crédito habilitado no processo de falência.",
    ),
    (
        "Defesa em autuação ambiental da obra Jardim Leste",
        PracticeArea.CIVIL,
        OPEN,
        "horizonte",
        "juliana",
        10,
        10,
        "Auto de infração por descarte de entulho. Prazo de defesa de 20 dias.",
    ),
    (
        "Revisão do ISS sobre procedimentos ambulatoriais",
        PracticeArea.TAX,
        OPEN,
        "bem-viver",
        "carlos",
        12,
        12,
        "Levantar notas dos últimos cinco anos para pedido de restituição.",
    ),
    (
        "Ação de paciente por cobrança em duplicidade",
        PracticeArea.CONSUMER,
        PROGRESS,
        "bem-viver",
        "ana",
        30,
        5,
        "Contestação apresentada com os comprovantes de estorno.",
    ),
    (
        "Contratos de prestação de serviços dos médicos",
        PracticeArea.CORPORATE,
        CLOSED,
        "bem-viver",
        "carlos",
        180,
        60,
        "Modelo novo aprovado e assinado pelos doze profissionais.",
    ),
    (
        "Licenciamento do sistema para rede de farmácias",
        PracticeArea.INTELLECTUAL_PROPERTY,
        OPEN,
        "nuvem-azul",
        "juliana",
        3,
        1,
        "Minuta de licença SaaS com nível de serviço e limitação de responsabilidade.",
    ),
    (
        "Reclamação trabalhista de ex-desenvolvedor",
        PracticeArea.LABOR,
        PROGRESS,
        "nuvem-azul",
        "ana",
        75,
        7,
        "Pedido de vínculo de emprego em contrato PJ. Reunir histórico de entregas.",
    ),
    (
        "Adequação dos contratos de clientes à LGPD",
        PracticeArea.CORPORATE,
        CLOSED,
        "nuvem-azul",
        "juliana",
        240,
        120,
        "Cláusulas de tratamento de dados e acordo de operador revisados.",
    ),
]


def reset_demo_data(db: Session) -> None:
    """Replaces every row with the demo data set. Only for demo and local databases."""
    db.execute(
        text("TRUNCATE password_tokens, sessions, cases, users, companies RESTART IDENTITY CASCADE")
    )
    companies = {
        key: Company(legal_name=name, cnpj=cnpj_with_check_digits(root), email=email, phone=None)
        for key, name, root, email in COMPANIES
    }
    db.add_all(companies.values())
    db.flush()

    people = {
        key: User(
            full_name=name,
            email=email,
            role=role,
            company_id=companies[company].id if company else None,
            is_demo=is_demo,
        )
        for key, name, email, role, company, is_demo in PEOPLE
    }
    db.add_all(people.values())
    db.flush()

    current = now()
    for title, area, status, company, lawyer, opened, updated, description in CASES:
        db.add(
            Case(
                title=title,
                practice_area=area,
                status=status,
                description=description,
                company_id=companies[company].id,
                lawyer_id=people[lawyer].id,
                created_at=current - timedelta(days=opened),
                updated_at=current - timedelta(days=updated),
            )
        )
    db.commit()
