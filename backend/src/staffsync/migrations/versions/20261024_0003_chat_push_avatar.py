"""In-app chat, push delivery marker, profile photo

Revision ID: 0003
Revises: 0002
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None

NEW_TABLES = ('chat_conversations', 'chat_messages', 'chat_reads')


def upgrade() -> None:
    op.add_column('notifications', sa.Column('pushed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('avatar_key', sa.String(), nullable=True))

    stamps = lambda: [  # noqa: E731
        sa.Column('company_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('id', sa.Uuid(), nullable=False),
    ]
    op.create_table(
        'chat_conversations', *stamps(),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('site_id', sa.Uuid(), nullable=True),
        sa.Column('user_a', sa.Uuid(), nullable=True),
        sa.Column('user_b', sa.Uuid(), nullable=True),
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_message_preview', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['site_id'], ['sites.id']),
        sa.ForeignKeyConstraint(['user_a'], ['users.id']),
        sa.ForeignKeyConstraint(['user_b'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_conversations_company_id'), 'chat_conversations', ['company_id'])
    op.create_index('uq_chat_site', 'chat_conversations', ['company_id', 'site_id'], unique=True, postgresql_where=sa.text("kind = 'site'"))
    op.create_index('uq_chat_direct', 'chat_conversations', ['company_id', 'user_a', 'user_b'], unique=True, postgresql_where=sa.text("kind = 'direct'"))
    op.create_table(
        'chat_messages', *stamps(),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('sender_user_id', sa.Uuid(), nullable=False),
        sa.Column('body', sa.String(), nullable=False),
        sa.Column('attachments', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id']),
        sa.ForeignKeyConstraint(['sender_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_messages_company_id'), 'chat_messages', ['company_id'])
    op.create_index('ix_chat_msg_conv', 'chat_messages', ['conversation_id', 'created_at'])
    op.create_table(
        'chat_reads', *stamps(),
        sa.Column('conversation_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('last_read_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_reads_company_id'), 'chat_reads', ['company_id'])
    op.create_index('uq_chat_read', 'chat_reads', ['conversation_id', 'user_id'], unique=True)

    # Same tenant isolation and runtime grants as every other company table (see 0002).
    cond = "(current_setting('app.bypass_rls', true) = 'on' OR company_id = nullif(current_setting('app.company_id', true), '')::uuid)"
    for table in NEW_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(f"CREATE POLICY tenant_isolation ON {table} USING {cond} WITH CHECK {cond}")
    op.execute(
        """
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'staffsync_app') THEN
            EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations, chat_messages, chat_reads TO staffsync_app';
          END IF;
        END $$
        """
    )


def downgrade() -> None:
    for table in reversed(NEW_TABLES):
        op.drop_table(table)
    op.drop_column('users', 'avatar_key')
    op.drop_column('notifications', 'pushed_at')
