# K8s Hands-On - App Frontend + Backend en Minikube

Practica de Kubernetes con una aplicacion distribuida mas completa:

- Backend en Go con API REST, health checks, metricas simples y tareas en memoria.
- Frontend estatico servido por Nginx con dashboard, formulario y consumo de API.
- Nginx proxy interno: el navegador llama a `/api` y el frontend resuelve el Service `backend` dentro del cluster.
- Manifests con replicas, probes, requests/limits y servicios pensados para Minikube.

## Arquitectura

```text
Usuario -> NodePort frontend:30007 -> Pod Nginx
                                      |-- /          -> index.html
                                      `-- /api/*     -> Service backend:80 -> Pods Go:8080
```

El backend ya no necesita exponerse con `NodePort`; queda como `ClusterIP` y solo el frontend lo consume dentro del cluster.

## Estructura

```text
k8s-hands-on/
├── backend/
│   ├── Dockerfile
│   ├── backend.yaml
│   ├── go.mod
│   └── src/main.go
├── frontend/
│   ├── dockerfile
│   ├── frontend.yaml
│   ├── index.html
│   └── nginx/default.conf
└── README.md
```

## Ejecutar en Minikube

1. Inicia Minikube:

```bash
minikube start
```

2. Usa el Docker daemon de Minikube:

```bash
eval $(minikube docker-env)
```

3. Construye las imagenes:

```bash
docker build -t backend:latest ./backend
docker build -t frontend:latest ./frontend
```

4. Despliega:

```bash
kubectl apply -f backend/backend.yaml
kubectl apply -f frontend/frontend.yaml
```

5. Verifica:

```bash
kubectl get pods
kubectl get svc
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
```

6. Abre la app:

```bash
minikube service frontend --url
```

Tambien puedes entrar por el NodePort fijo si tu Minikube usa la IP habitual:

```text
http://$(minikube ip):30007
```

## API

Endpoints principales:

- `GET /api/info`: metadata del servicio, pod que respondio, version y uptime.
- `GET /api/metrics`: requests, tareas totales, pendientes y completadas.
- `GET /api/tasks`: lista tareas.
- `POST /api/tasks`: crea una tarea.
- `PATCH /api/tasks/{id}`: alterna completada/pendiente.
- `DELETE /api/tasks/{id}`: elimina una tarea.
- `GET /api/healthz` y `GET /readyz`: health checks para Kubernetes.

Ejemplo:

```bash
curl http://$(minikube ip):30007/api/info
```

## Comandos utiles

```bash
kubectl logs -l app=backend --tail=50
kubectl describe pod -l app=frontend
kubectl rollout restart deployment/backend
kubectl rollout restart deployment/frontend
kubectl delete -f frontend/frontend.yaml
kubectl delete -f backend/backend.yaml
```

## Notas de practica

- El estado de tareas vive en memoria por pod. Con 3 replicas de backend veras respuestas desde distintos hostnames y cada pod puede tener su propio estado.
- Eso es intencional para observar balanceo, replicas y la diferencia entre workloads stateless y stateful.
- Para persistencia real, el siguiente paso seria agregar PostgreSQL, un `Secret`, un `ConfigMap` y migraciones.
