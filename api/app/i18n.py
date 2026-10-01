"""User-facing API messages in Portuguese (default) and English.

The web app sends `Accept-Language`; a middleware in main.py stores the language in a
context variable, so validators and routers can call `t()` without passing it around.
"""

from contextvars import ContextVar
from typing import Literal

Lang = Literal["pt", "en"]

current_lang: ContextVar[Lang] = ContextVar("current_lang", default="pt")


def parse_accept_language(header: str | None) -> Lang:
    """English only when the first preference is English; everything else is Portuguese."""
    first = (header or "").split(",")[0].strip().lower()
    return "en" if first.startswith("en") else "pt"


MESSAGES: dict[str, dict[Lang, str]] = {
    # Validation
    "check_fields": {"pt": "Confira os campos destacados.", "en": "Check the highlighted fields."},
    "missing": {"pt": "Campo obrigatório.", "en": "Required."},
    "string_too_short": {
        "pt": "Mínimo de {min_length} caracteres.",
        "en": "At least {min_length} characters.",
    },
    "string_too_long": {
        "pt": "Máximo de {max_length} caracteres.",
        "en": "At most {max_length} characters.",
    },
    "enum": {"pt": "Opção inválida.", "en": "Invalid option."},
    "number": {"pt": "Informe um número.", "en": "Enter a number."},
    "invalid": {"pt": "Valor inválido.", "en": "Invalid value."},
    "email_invalid": {"pt": "E-mail inválido.", "en": "Invalid email."},
    "name_required": {"pt": "Informe o nome.", "en": "Enter the name."},
    "cnpj_invalid": {"pt": "CNPJ inválido.", "en": "Invalid CNPJ."},
    "cnpj_check_digits": {
        "pt": "CNPJ inválido: dígitos verificadores não conferem.",
        "en": "Invalid CNPJ: the check digits do not match.",
    },
    "phone_invalid": {
        "pt": "Telefone inválido: use DDD e número.",
        "en": "Invalid phone: use the area code and number.",
    },
    "oab_invalid": {
        "pt": "Número da OAB inválido. Exemplo: OAB/SP 123.456",
        "en": "Invalid OAB number. Example: OAB/SP 123.456",
    },
    # Auth
    "session_expired": {
        "pt": "Sessão expirada. Entre novamente.",
        "en": "Your session expired. Sign in again.",
    },
    "forbidden": {
        "pt": "Seu perfil não tem acesso a esta ação.",
        "en": "Your role cannot do this.",
    },
    "invalid_login": {"pt": "E-mail ou senha inválidos.", "en": "Wrong email or password."},
    "locked": {
        "pt": "Muitas tentativas seguidas. Tente de novo em alguns minutos.",
        "en": "Too many attempts in a row. Try again in a few minutes.",
    },
    "demo_restarting": {
        "pt": "A demo está sendo reiniciada. Tente de novo em instantes.",
        "en": "The demo is restarting. Try again in a moment.",
    },
    "wrong_current_password": {
        "pt": "A senha atual não confere.",
        "en": "The current password is wrong.",
    },
    "reset_sent": {
        "pt": "Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.",
        "en": "If the email is registered, you will get a link to set a new password.",
    },
    "link_invalid": {
        "pt": "Este link é inválido ou expirou. Peça um novo.",
        "en": "This link is invalid or expired. Ask for a new one.",
    },
    # Demo
    "demo_cap": {
        "pt": "A demo chegou ao limite de {cap} registros deste tipo. "
        "Os dados voltam ao original todos os dias.",
        "en": "The demo reached its limit of {cap} records of this kind. "
        "The data resets every day.",
    },
    "demo_account": {
        "pt": "As contas de demonstração não podem ser alteradas. "
        "Crie um cadastro novo para testar esta ação.",
        "en": "Demo accounts cannot be changed. Create a new record to try this action.",
    },
    # Cases
    "case_not_found": {"pt": "Processo não encontrado.", "en": "Case not found."},
    "company_not_found": {"pt": "Empresa não encontrada.", "en": "Company not found."},
    "lawyer_inactive": {"pt": "Escolha um advogado ativo.", "en": "Choose an active lawyer."},
    "lawyer_required": {
        "pt": "Escolha o advogado responsável.",
        "en": "Choose the lawyer in charge.",
    },
    "lawyer_own_cases": {
        "pt": "Advogados só abrem processos em seu próprio nome.",
        "en": "Lawyers can only open cases in their own name.",
    },
    "transfer_secretary": {
        "pt": "Só a secretaria pode transferir um processo.",
        "en": "Only the secretary can transfer a case.",
    },
    # Companies and people
    "cnpj_taken": {
        "pt": "Já existe uma empresa com este CNPJ.",
        "en": "A company with this CNPJ already exists.",
    },
    "email_taken": {"pt": "Este e-mail já está em uso.", "en": "This email is already in use."},
    "company_has_cases": {
        "pt": "Esta empresa tem processos. Exclua ou transfira os processos antes.",
        "en": "This company has cases. Delete or transfer them first.",
    },
    "access_not_found": {"pt": "Acesso não encontrado.", "en": "Access not found."},
    "lawyer_not_found": {"pt": "Advogado não encontrado.", "en": "Lawyer not found."},
    "lawyer_has_cases": {
        "pt": "Este advogado tem {count} processo(s) em andamento. "
        "Transfira os processos antes de desativar o acesso.",
        "en": "This lawyer has {count} active case(s). "
        "Transfer them before deactivating the access.",
    },
    "person_not_found": {"pt": "Pessoa não encontrada.", "en": "Person not found."},
    "password_already_set": {
        "pt": "Esta pessoa já criou a senha. Se esqueceu, ela pode usar o 'Esqueci a senha'.",
        "en": "This person already set a password. If it is lost, they can use 'Forgot password'.",
    },
    "invite_resent": {
        "pt": "Convite reenviado para {email}.",
        "en": "Invite sent again to {email}.",
    },
}


def t(key: str, **values: object) -> str:
    template = MESSAGES[key][current_lang.get()]
    return template.format(**values) if values else template
