"""Row-Level Security on company_id and runtime grants

Revision ID: 0002
Revises: 0001
"""
from alembic import op

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    _tenant_security()


def _tenant_security() -> None:
    """Row-Level Security on company_id (second guard behind the repository filters) and runtime grants."""
    cond = (
        "(current_setting('app.bypass_rls', true) = 'on' "
        "OR {col} = nullif(current_setting('app.company_id', true), '')::uuid)"
    )
    op.execute(
        f"""
        DO $$
        DECLARE t record;
        BEGIN
          FOR t IN SELECT table_name FROM information_schema.columns
                   WHERE table_schema = 'public' AND column_name = 'company_id' LOOP
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t.table_name);
            EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t.table_name);
            EXECUTE format('CREATE POLICY tenant_isolation ON %I USING {cond.format(col="company_id").replace(chr(39), chr(39) * 2)} WITH CHECK {cond.format(col="company_id").replace(chr(39), chr(39) * 2)}', t.table_name);
          END LOOP;
        END $$
        """
    )
    op.execute("ALTER TABLE companies ENABLE ROW LEVEL SECURITY")
    op.execute("ALTER TABLE companies FORCE ROW LEVEL SECURITY")
    op.execute(f"CREATE POLICY tenant_isolation ON companies USING {cond.format(col='id')} WITH CHECK {cond.format(col='id')}")
    op.execute(
        """
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'staffsync_app') THEN
            EXECUTE 'GRANT USAGE ON SCHEMA public TO staffsync_app';
            EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO staffsync_app';
            EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO staffsync_app';
            EXECUTE 'REVOKE UPDATE, DELETE ON audit_logs FROM staffsync_app';
          END IF;
        END $$
        """
    )


def downgrade() -> None:
    pass
