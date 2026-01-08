# ==========================================
# Monopoly Companion - Makefile
# ==========================================
# Simplifica tareas comunes de desarrollo

.PHONY: help install dev-web dev-api db-init

help:
	@echo "Comandos disponibles:"
	@echo "  make install    - Instala dependencias de backend y frontend"
	@echo "  make dev-web    - Inicia el servidor de desarrollo de Next.js"
	@echo "  make dev-api    - Inicia el servidor de desarrollo de Rust (API)"
	@echo "  make db-init    - Inicializa la base de datos (requiere psql)"

install:
	@echo "Instalando dependencias de Frontend..."
	cd apps/web && npm install
	@echo "Verificando dependencias de Backend..."
	cd apps/api && cargo fetch

dev-web:
	cd apps/web && npm run dev

dev-api:
	cd apps/api && cargo run

db-init:
	@echo "Inicializando base de datos local..."
	psql -U monopoly_user -d monopoly_companion -f infrastructure/db/init.sql
