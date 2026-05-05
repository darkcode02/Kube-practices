# Vanta Wear

Tienda de ropa con frontend, API Node.js y PostgreSQL, lista para correr en Minikube.

## Requisitos

- Docker
- Minikube
- kubectl

## Correr en Minikube

Desde la raíz del proyecto:

```bash
minikube start
minikube image build -t vanta-wear:1.0.0 .
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/app.yaml
```

Espera a que los deployments queden listos:

```bash
kubectl rollout status deployment/vanta-postgres
kubectl rollout status deployment/vanta-store
```

Abre la tienda:

```bash
minikube service vanta-store
```

O consulta la URL directamente:

```bash
minikube service vanta-store --url
```

El servicio también está publicado como NodePort en el puerto `30080`, así que puedes usar:

```bash
http://$(minikube ip):30080
```

## Verificar que funciona

```bash
kubectl get pods
curl http://$(minikube ip):30080/healthz
```

La respuesta esperada del healthcheck es:

```json
{"ok":true}
```

## Reiniciar el despliegue después de cambios

Si modificas el frontend o el backend:

```bash
minikube image build -t vanta-wear:1.0.0 .
kubectl rollout restart deployment/vanta-store
kubectl rollout status deployment/vanta-store
```

## Eliminar la aplicación

```bash
kubectl delete -f k8s/app.yaml
kubectl delete -f k8s/postgres.yaml
```

Esto elimina también el PVC definido en `k8s/postgres.yaml`, por lo que se perderán los datos de PostgreSQL.

## Componentes

- `Dockerfile`: imagen de la app Node.
- `k8s/postgres.yaml`: PostgreSQL con Secret, PVC, Deployment y Service.
- `k8s/app.yaml`: Deployment y Service NodePort para la tienda.
- `server.js`: API REST, migración inicial y datos semilla.
- `public/`: frontend de la tienda.
