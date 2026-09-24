# Todo corre en Docker con la imagen oficial node:24: no hace falta Node en el
# equipo. Las demás versiones de Node las prueba el CI.
#
# La caché de npm queda en ~/.cache/npm, compartida entre ejecuciones.

TTY   := $(shell [ -t 0 ] && echo -t)
CACHE := $(HOME)/.cache/npm
RUN    = docker run --rm -i $(TTY) -u $$(id -u):$$(id -g) \
         -v $(CURDIR):/app -v $(CACHE):/tmp/cache \
         -e npm_config_cache=/tmp/cache -e npm_config_update_notifier=false \
         -w /app node:24

.PHONY: help install test typecheck lint format build datos publicar npm shell

help:           ## Lista los comandos
	@grep -hE '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-10s %s\n", $$1, $$2}'

$(CACHE):
	@mkdir -p $@

install: | $(CACHE) ## Instala las dependencias
	$(RUN) npm install

test:           ## Corre Vitest (make test a="monedas")
	$(RUN) npm test -- $(a)

typecheck:      ## Revisa los tipos con tsc
	$(RUN) npm run typecheck

lint:           ## Revisa el formato y el lint sin cambiar nada (como el CI)
	$(RUN) npm run lint

format:         ## Formatea con Biome
	$(RUN) npm run format

build:          ## Compila a dist/
	$(RUN) npm run build

datos:          ## Descarga los JSON de la etiqueta del paquete PHP (ver package.json)
	$(RUN) npm run datos

# Solo para la primera versión: las siguientes las publica el CI al crear un
# release. El login vive dentro del contenedor y se pierde al salir.
publicar:       ## Publica en npm a mano, con login y 2FA
	$(RUN) sh -c 'export HOME=/tmp && npm ci && npm test && npm login && npm publish --access public'

npm: | $(CACHE) ## make npm c="outdated"
	$(RUN) npm $(c)

shell:          ## sh dentro del contenedor
	$(RUN) sh
