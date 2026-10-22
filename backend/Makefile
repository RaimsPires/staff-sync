.PHONY: dev test stop reset

dev:    ## start DB + Redis, migrate, run the API on :8000
	./scripts/dev.sh

test:   ## run the test suite (needs the containers up)
	docker compose up -d --wait && uv run pytest

stop:   ## stop the containers (data is kept)
	docker compose down

reset:  ## wipe the dev database and start over
	docker compose down -v
