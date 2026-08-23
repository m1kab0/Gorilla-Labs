#!/bin/sh
# Ustawia resolver DNS nginxa na ten, którego faktycznie używa kontener.
#
# Adres serwera DNS różni się w zależności od środowiska: Docker Compose daje
# 127.0.0.11, Kubernetes adres CoreDNS (np. 10.43.0.10). Zapisanie któregoś
# z nich na sztywno sprawia, że obraz działa tylko w jednym z nich.
set -e

ns=$(awk '/^nameserver/ { print $2; exit }' /etc/resolv.conf)

if [ -n "$ns" ]; then
    # valid=10s, nie dłużej: pod Compose kontener api dostaje nowy adres IP
    # przy każdym `up -d`, a nginx trzyma poprzedni aż do wygaśnięcia wpisu -
    # czyli tyle sekund zwraca 502 po wdrożeniu. W Kubernetesie problem nie
    # występuje, bo Service ma stały ClusterIP.
    echo "resolver ${ns} valid=10s ipv6=off;" > /etc/nginx/conf.d/00-resolver.conf
    echo "resolver DNS ustawiony na ${ns}"
fi
