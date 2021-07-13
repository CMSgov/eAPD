#!/usr/bin/env sh

docker-compose -f ../docker-compose.yml up -d

docker-compose -f ../docker-compose.yml exec db sh -c 'PGPASSWORD=cms psql -U postgres -tc "DROP DATABASE IF EXISTS apd_cypress_test;"'
docker-compose -f ../docker-compose.yml exec db sh -c 'PGPASSWORD=cms psql -U postgres -tc "CREATE DATABASE apd_cypress_test;"'

docker-compose -f ../docker-compose.yml exec -e NODE_ENV=development -e DEV_DB_NAME=apd_cypress_test api npm run migrate
docker-compose -f ../docker-compose.yml exec -e NODE_ENV=development -e DEV_DB_NAME=apd_cypress_test api npm run seed
