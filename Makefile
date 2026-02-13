IMAGE_FRONT = riper3d/docere_frontend
IMAGE_BACK  = riper3d/docere_backend

# краткий SHA для тегов
SHORT_SHA   = $(shell git rev-parse --short HEAD)

.PHONY: all build-frontend push-frontend build-backend push-backend

all: push-backend push-frontend
	@echo "All images were built & pushed"

# === фронтенд ===
build-frontend:
	@echo "🐳 Building & pushing frontend image…"
	docker build -t $(IMAGE_FRONT) ./frontend

push-frontend: build-frontend
	docker push $(IMAGE_FRONT)

# === бэкенд ===
build-backend:
	@echo "🐳 Building Docker image for backend..."
	docker build -t $(IMAGE_BACK) .

push-backend: build-backend
	@echo "🚀 Pushing backend images..."
	docker push $(IMAGE_BACK)
