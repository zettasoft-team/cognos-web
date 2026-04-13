#!/bin/bash
set -e

WEB_DIR="/home/zetta/cognos-web"
NETWORK_NAME="cognosfm-net"

docker network inspect $NETWORK_NAME > /dev/null 2>&1 || docker network create $NETWORK_NAME

git -C $WEB_DIR pull origin main
docker compose -f $WEB_DIR/docker-compose.staging.yml down
docker compose -f $WEB_DIR/docker-compose.staging.yml up -d --build

echo ">>> 배포 완료"
docker ps --filter "name=cognosfm-web"