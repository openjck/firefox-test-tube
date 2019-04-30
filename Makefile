.PHONY: build clean migrate shell stop test up

HOSTUSER := $(shell id -u):$(shell id -g)

help:
	@echo "The list of commands for local development:\n"
	@echo "  build         Builds the docker images for the docker-compose setup"
	@echo "  clean         Stops and removes all docker containers"
	@echo "  migrate       Runs the Django database migrations"
	@echo "  shell         Opens a Bash shell"
	@echo "  stop          Stops the docker containers"
	@echo "  test          Runs the Python test suite"
	@echo "  up            Runs the whole stack, served under http://localhost:8000/\n"

build:
	docker-compose build

clean: stop
	docker-compose rm -f
	rm -rf coverage/ .coverage

migrate:
	docker-compose run -u ${HOSTUSER} server python manage.py migrate --run-syncdb

shell:
	docker-compose run -u ${HOSTUSER} server bash

stop:
	docker-compose stop

test:
	docker-compose run -u ${HOSTUSER} server test

up:
	docker-compose up
