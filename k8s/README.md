# Kubernetes (k3s)

Alternatywa dla `docker-compose.yml` — ten sam zestaw kontenerów, tylko
zarządzany przez Kubernetesa. Przydatne do nauki; przy dwóch kontenerach na
jednej maszynie nie daje żadnej przewagi operacyjnej nad Compose.

## Zanim zaczniesz

**Nie uruchamiaj tego równolegle z Compose.** Oba chcą portu 80, a na maszynie
z 2 GB RAM zabraknie pamięci. Najpierw:

```bash
docker compose down
```

Warto też wyłączyć automatyczne wdrożenia, bo `deploy.sh` wołałby Compose'a
z powrotem:

```bash
sudo systemctl disable --now gorilla-deploy.timer
```

**Pamięć.** k3s zjada ok. 512 MB. Na `t4g.small` (2 GB) zostaje dość na aplikację,
ale budowanie obrazów na tej samej maszynie robi się ciasne. Jeśli chcesz się
uczyć bez walki z OOM-em, rozważ `t4g.medium` (4 GB).

## Instalacja k3s

```bash
curl -sfL https://get.k3s.io | sh -
```

```bash
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $USER ~/.kube/config
```

Sprawdzenie:

```bash
kubectl get nodes
```

## Obrazy

k3s używa containerd, nie Dockera — obrazy zbudowane przez `docker build` nie są
dla niego automatycznie widoczne. Trzeba je przenieść:

```bash
docker compose build
```

```bash
docker save gorilla-api:latest gym-app-api:latest 2>/dev/null | sudo k3s ctr images import -
```

Nazwy obrazów zależą od tego, jak je zbudowałeś. Jeśli budujesz przez Compose,
powstają jako `gym-app-api` i `gym-app-web` — wtedy albo przetaguj je na
`gorilla-api` / `gorilla-web`, albo popraw pole `image:` w manifestach:

```bash
docker tag gym-app-api:latest gorilla-api:latest && docker tag gym-app-web:latest gorilla-web:latest
```

```bash
docker save gorilla-api:latest gorilla-web:latest | sudo k3s ctr images import -
```

## Sekrety

Nie trzymamy ich w repo — tworzysz je z pliku `.env`, który już masz:

```bash
kubectl create secret generic gorilla-secrets --from-env-file=backend/app/.env
```

## Uruchomienie

```bash
kubectl apply -f k8s/
```

Migracje jako jednorazowe zadanie:

```bash
kubectl run migracje --rm -it --image=gorilla-api:latest --image-pull-policy=Never --overrides='{"spec":{"containers":[{"name":"migracje","image":"gorilla-api:latest","imagePullPolicy":"Never","command":["alembic","upgrade","head"],"envFrom":[{"secretRef":{"name":"gorilla-secrets"}}]}]}}' --restart=Never
```

## Sprawdzenie

```bash
kubectl get pods,svc,ingress
```

Aplikacja wychodzi przez Traefika wbudowanego w k3s, na porcie 80 — czyli pod
tym samym publicznym adresem co wcześniej.

## Komendy przydatne przy nauce

```bash
kubectl describe pod -l app=api
```

```bash
kubectl logs -l app=api --tail=50 -f
```

```bash
kubectl exec -it deploy/web -- sh
```

Skalowanie — tu widać przewagę nad Compose:

```bash
kubectl scale deployment/web --replicas=3
```

Podmiana obrazu po przebudowaniu:

```bash
kubectl rollout restart deployment/api && kubectl rollout status deployment/api
```

Cofnięcie nieudanego wdrożenia:

```bash
kubectl rollout undo deployment/api
```

## Jak to się ma do wersji Compose

Ruch wchodzi przez Ingress (Traefik) na Service `web`, a `/api/` przekazuje
nginx wewnątrz poda `web` na Service `api` — dokładnie tak jak w Compose.
Dlatego Ingress ma tylko jedną regułę.

Jedna rzecz różni się w konfiguracji i jest łatwa do przeoczenia: resolver
nginxa **nie stosuje** listy `search` z `/etc/resolv.conf`, więc gołe `api`
(działające pod Compose) w Kubernetesie się nie rozwiązuje. Dlatego
`k8s/web.yaml` podaje pełną nazwę `api.<namespace>.svc.cluster.local` przez
zmienną `API_UPSTREAM`, a namespace bierze z Downward API.
