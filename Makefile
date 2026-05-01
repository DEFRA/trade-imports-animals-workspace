SHELL         := /bin/bash
REPOS         := trade-imports-animals-frontend trade-imports-animals-backend trade-imports-animals-tests trade-imports-animals-admin
REPOS_DIR     := repos
NODE_REPOS    := trade-imports-animals-frontend trade-imports-animals-tests trade-imports-animals-admin
JAVA_REPOS    := trade-imports-animals-backend
TESTS_COMPOSE := $(REPOS_DIR)/trade-imports-animals-tests/compose.yml
LOCAL_COMPOSE := docker/local.compose.yml
LOCAL_DEV_COMPOSE := docker/local.dev.compose.yml

.PHONY: setup update reset status install lint test \
        start-frontend start-backend start-admin \
        docker-local-branches docker-compose-up docker-compose-dev docker-compose-down docker-logs docker-restart-backend clean help

# --- Help ---

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# --- Setup ---

setup: ## Clone all repos into repos/
	@bash scripts/setup.sh

update: ## Pull --rebase all repos
	@bash scripts/update.sh $(REPOS)

reset: ## Hard-reset all repos to origin/main (DISCARDS local changes — prompts first)
	@echo "WARNING: This will discard all local changes and uncommitted work in every repo."; \
	read -r -p "Are you sure? [y/N] " confirm; \
	[ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ] || { echo "Aborted."; exit 1; }; \
	for repo in $(REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir/.git" ]; then \
			echo "\n=== $$repo ==="; \
			git -C "$$dir" fetch origin; \
			git -C "$$dir" checkout main; \
			git -C "$$dir" reset --hard origin/main; \
		else \
			echo "\n=== $$repo === (not cloned, skipping)"; \
		fi; \
	done

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

clean: ## Remove node_modules in all Node repos
	@for repo in $(NODE_REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		if [ -d "$$dir/node_modules" ]; then \
			echo "  $$repo — removing node_modules"; \
			rm -rf "$$dir/node_modules"; \
		fi; \
	done

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

# --- Build ---

docker-compose-up: ## Start stack (edit docker/local.compose.yml to override image tags)
	docker compose -f $(TESTS_COMPOSE) -f $(LOCAL_COMPOSE) up --wait --detach

docker-compose-dev: ## Start stack with frontend+admin built from source (hot-reload + docker logs)
	docker compose -f $(TESTS_COMPOSE) -f $(LOCAL_COMPOSE) -f $(LOCAL_DEV_COMPOSE) up --wait --detach

docker-compose-down: ## Stop stack and wipe volumes (mongo data, localstack state) for a clean slate
	docker compose -f $(TESTS_COMPOSE) -f $(LOCAL_COMPOSE) -f $(LOCAL_DEV_COMPOSE) down --volumes --remove-orphans

docker-logs: ## Follow logs for frontend, admin, and backend (Ctrl-C to stop)
	docker compose -f $(TESTS_COMPOSE) -f $(LOCAL_COMPOSE) logs -f trade-imports-animals-frontend trade-imports-animals-admin trade-imports-animals-backend

docker-restart-backend: ## Restart backend container (recompiles Java source via mvn spring-boot:run)
	docker compose -f $(TESTS_COMPOSE) -f $(LOCAL_COMPOSE) -f $(LOCAL_DEV_COMPOSE) restart trade-imports-animals-backend

docker-local-branches: ## Build local/* Docker images for repos not on the default branch
	@built=0; \
	for repo in $(REPOS); do \
		dir=$(REPOS_DIR)/$$repo; \
		[ -d "$$dir/.git" ] || continue; \
		branch=$$(git -C "$$dir" symbolic-ref --short HEAD 2>/dev/null); \
		default=$$(git -C "$$dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|origin/||'); \
		[ -z "$$default" ] && default=main; \
		if [ "$$branch" != "$$default" ]; then \
			echo "  $$repo — building local/$$repo ($$branch)"; \
			docker build --platform linux/amd64 -t local/$$repo "$$dir"; \
			built=$$((built + 1)); \
		else \
			echo "  $$repo — on default branch ($$default), skipping"; \
		fi; \
	done; \
	[ "$$built" -eq 0 ] && echo "  nothing to build — all repos on default branch" || true

# --- Individual services ---

start-frontend: ## Start frontend dev server from source
	npm --prefix $(REPOS_DIR)/trade-imports-animals-frontend run dev

start-backend: ## Start backend from source
	SPRING_PROFILES_ACTIVE=local mvn -f $(REPOS_DIR)/trade-imports-animals-backend/pom.xml spring-boot:run

start-admin: ## Start admin dev server from source
	PORT=3001 npm --prefix $(REPOS_DIR)/trade-imports-animals-admin run dev

