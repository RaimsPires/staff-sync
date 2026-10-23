.PHONY: dev test stop reset i18n

dev:    ## start DB + Redis, migrate, run the API on :8000
	./scripts/dev.sh

test:   ## run the test suite (needs the containers up)
	docker compose up -d --wait && uv run pytest

stop:   ## stop the containers (data is kept)
	docker compose down

reset:  ## wipe the dev database and start over
	docker compose down -v

I18N_KEYWORDS = -k N_ -k NN_:1,2 -k gettext_ -k ValidationFailed -k Unauthenticated -k Forbidden -k NotFound -k Conflict -k BusinessRule -k UpgradeRequired -k RateLimited
I18N_DIR = src/staffsync/core/locales

i18n:   ## re-extract messages and merge them into the .po files (translate new entries, then commit)
	uv run pybabel extract -F babel.cfg $(I18N_KEYWORDS) --no-location -o $(I18N_DIR)/messages.pot src
	uv run pybabel update -i $(I18N_DIR)/messages.pot -d $(I18N_DIR) -D messages --no-fuzzy-matching
