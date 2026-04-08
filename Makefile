SHELL         := /bin/bash
REPOS         := trade-imports-animals-frontend trade-imports-animals-backend trade-imports-animals-tests trade-imports-animals-admin
REPOS_DIR     := repos
NODE_REPOS    := trade-imports-animals-frontend trade-imports-animals-tests trade-imports-animals-admin
JAVA_REPOS    := trade-imports-animals-backend

.PHONY: setup update status install lint test \
        start-frontend start-backend start-admin \
        clean help

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

# --- Individual services ---

start-frontend: ## Start frontend dev server from source
	npm --prefix $(REPOS_DIR)/trade-imports-animals-frontend run dev

start-backend: ## Start backend from source
	SPRING_PROFILES_ACTIVE=local mvn -f $(REPOS_DIR)/trade-imports-animals-backend/pom.xml spring-boot:run

start-admin: ## Start admin dev server from source
	PORT=3001 npm --prefix $(REPOS_DIR)/trade-imports-animals-admin run dev

