# Ambiente Alembic: URL a partir de `Settings` (POSTGRES_PASSWORD no `.env` da raiz).

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

from valora_backend.config import Settings
from valora_backend.model import Base  # noqa: F401 — metadata; modelos via __init__

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

_settings = Settings()
config.set_main_option("sqlalchemy.url", _settings.database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera SQL sem conexão ao servidor (modo offline)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica migrations com conexão ao banco."""
    configuration = dict(config.get_section(config.config_ini_section, {}) or {})
    configuration["sqlalchemy.url"] = _settings.database_url
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
