SHELL         := /bin/bash
REPOS         := trade-imports-animals-frontend trade-imports-animals-backend trade-imports-animals-tests trade-imports-animals-admin
REPOS_DIR     := repos
NODE_REPOS    := trade-imports-animals-frontend trade-imports-animals-tests trade-imports-animals-admin
JAVA_REPOS    := trade-imports-animals-backend
INFRA_SERVICES := mongodb redis localstack trade-imports-defra-id-stub
TESTS_COMPOSE := $(REPOS_DIR)/trade-imports-animals-tests/compose.yml
DEV_OVERRIDE  := docker/compose.dev.yml

.PHONY: setup update status install lint test test-e2e playwright-install \
        start stop logs ps dev dev-infra start-infra \
        start-frontend start-backend start-admin \
        scan-docs clean help

# --- Help ---

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Setup ---

setup: ## Clone all repos into repos/
	@bash scripts/setup.sh

update: ## Pull --rebase all repos
	@bash scripts/update.sh $(REPOS)

status: ## Show git status for all repos
	@for repo in $(REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir/.git" ]; then \
			echo "\n=== $$repo ==="; \
			git -C "$$dir" status -sb; \
		else \
			echo "\n=== $$repo === (not cloned)"; \
		fi; \
	done

install: ## Install dependencies in all repos (npm ci; mvn install -DskipTests)
	@pids=(); outs=(); names=(); \
	for repo in $(NODE_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		[ -d "$$dir" ] || continue; \
		out=$$(mktemp); \
		npm --prefix "$$dir" ci >"$$out" 2>&1 & \
		pids+=($$!); outs+=("$$out"); names+=("$$repo"); \
		echo "  $$repo — npm ci"; \
	done; \
	for repo in $(JAVA_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		[ -d "$$dir" ] || continue; \
		out=$$(mktemp); \
		mvn -f "$$dir/pom.xml" install -DskipTests >"$$out" 2>&1 & \
		pids+=($$!); outs+=("$$out"); names+=("$$repo"); \
		echo "  $$repo — mvn install"; \
	done; \
	status=0; \
	for i in "$${!pids[@]}"; do \
		if wait "$${pids[$$i]}"; then \
			echo "  $${names[$$i]} — done"; \
		else \
			echo "  $${names[$$i]} — FAILED:"; \
			cat "$${outs[$$i]}"; \
			status=1; \
		fi; \
		rm -f "$${outs[$$i]}"; \
	done; \
	exit $$status

clean: ## Remove node_modules in all Node repos and stop Docker stack
	@for repo in $(NODE_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir/node_modules" ]; then \
			echo "  $$repo — removing node_modules"; \
			rm -rf "$$dir/node_modules"; \
		fi; \
	done
	docker compose -f $(TESTS_COMPOSE) down --volumes --remove-orphans 2>/dev/null || true

# --- Lint & Test ---

lint: ## Run linting in all Node repos
	@pids=(); outs=(); names=(); \
	for repo in $(NODE_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		[ -d "$$dir" ] || continue; \
		out=$$(mktemp); \
		npm --prefix "$$dir" run lint --if-present >"$$out" 2>&1 & \
		pids+=($$!); outs+=("$$out"); names+=("$$repo"); \
		echo "  $$repo — lint"; \
	done; \
	status=0; \
	for i in "$${!pids[@]}"; do \
		if wait "$${pids[$$i]}"; then \
			echo "  $${names[$$i]} — done"; \
		else \
			echo "  $${names[$$i]} — FAILED:"; \
			cat "$${outs[$$i]}"; \
			status=1; \
		fi; \
		rm -f "$${outs[$$i]}"; \
	done; \
	exit $$status

test: ## Run unit tests in all repos
	@for repo in $(NODE_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir" ]; then \
			echo "\n=== $$repo — test ==="; \
			npm --prefix "$$dir" test --if-present; \
		fi; \
	done
	@for repo in $(JAVA_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir" ]; then \
			echo "\n=== $$repo — mvn verify ==="; \
			mvn -f "$$dir/pom.xml" verify; \
		fi; \
	done

playwright-install: ## Install Playwright browsers (run once before test-e2e)
	npx --prefix $(REPOS_DIR)/trade-imports-animals-tests playwright install chromium

test-e2e: ## Run Playwright e2e tests (starts stack, runs tests, tears down)
	$(MAKE) start
	npm --prefix $(REPOS_DIR)/trade-imports-animals-tests run test:local; \
	EXIT=$$?; $(MAKE) stop; exit $$EXIT

# --- Stack ---

start: ## Start full stack detached, wait for health checks (Docker Hub images)
	docker compose -f $(TESTS_COMPOSE) up --wait --detach

stop: ## Stop full stack
	docker compose -f $(TESTS_COMPOSE) down

logs: ## Tail logs for the full stack
	docker compose -f $(TESTS_COMPOSE) logs --follow

ps: ## Show running stack containers and health status
	docker compose -f $(TESTS_COMPOSE) ps

dev: ## Start full stack for local dev, detached (swap any service for a local process)
	docker compose -f $(TESTS_COMPOSE) -f $(DEV_OVERRIDE) up --wait --detach

dev-infra: ## Start infra only in dev mode (MongoDB, Redis, LocalStack, Defra ID stub)
	docker compose -f $(TESTS_COMPOSE) -f $(DEV_OVERRIDE) up --wait --detach $(INFRA_SERVICES)

start-infra: ## Start shared infra only, detached (MongoDB, Redis, LocalStack, Defra ID stub)
	docker compose -f $(TESTS_COMPOSE) up --wait --detach $(INFRA_SERVICES)

# --- Individual services (run make start-infra first) ---

start-frontend: ## Start frontend dev server from source
	npm --prefix $(REPOS_DIR)/trade-imports-animals-frontend run dev

start-backend: ## Start backend from source
	SPRING_PROFILES_ACTIVE=local mvn -f $(REPOS_DIR)/trade-imports-animals-backend/pom.xml spring-boot:run

start-admin: ## Start admin dev server from source
	npm --prefix $(REPOS_DIR)/trade-imports-animals-admin run dev

# --- Docs ---

scan-docs: ## Regenerate docs/<repo>.md tech overview for all repos using Claude
	@command -v claude >/dev/null 2>&1 || { echo "claude CLI not found — run: npm i -g @anthropic-ai/claude-code"; exit 1; }
	@skill=$$(cat skills/scan-repo-docs.md); \
	for repo in $(REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir" ]; then \
			echo "  $$repo — scanning..."; \
			claude -p "$$skill\n\nScan the repository at: $$dir\nWrite the output doc to: docs/$$repo.md"; \
		fi; \
	done
