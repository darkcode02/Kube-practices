# K8s Hands-On - Aplicación Distribuida con Kubernetes

Este proyecto es una práctica de Kubernetes que despliega una aplicación distribuida con un backend en Go y un frontend en Nginx.

## 📋 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        MINIKUBE CLUSTER                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐              ┌──────────────────┐   │
│  │   FRONTEND       │              │    BACKEND       │   │
│  │  (2 replicas)    │              │  (3 replicas)    │   │
│  │                  │              │                  │   │
│  │  Nginx:Alpine    │              │  Go:1.26-Alpine  │   │
│  │  Puerto 80       │              │  Puerto 8080     │   │
│  │                  │              │                  │   │
│  └────────┬─────────┘              └────────┬─────────┘   │
│           │                                 │             │
│  ┌────────▼─────────┐              ┌────────▼─────────┐   │
│  │ Service Frontend │              │ Service Backend  │   │
│  │ NodePort: 30007  │              │ NodePort: 30008  │   │
│  │ Tipo: NodePort   │              │ Tipo: NodePort   │   │
│  └──────────────────┘              └──────────────────┘   │
│           │                                 │             │
└───────────┼─────────────────────────────────┼─────────────┘
            │                                 │
            └─────────────────┬───────────────┘
                              │
                   http://192.168.49.2
                   (Minikube Node IP)
```

## 🏗️ Estructura del Proyecto

```
k8s-hands-on/
├── backend/
│   ├── Dockerfile              # Multi-stage: builder + runtime
│   ├── backend.yaml            # K8s Deployment + Service
│   ├── go.mod                  # Definición del módulo Go (versión 1.26.2)
│   └── src/
│       └── main.go             # API REST en Go (puerto 8080)
│
├── frontend/
│   ├── dockerfile              # Nginx Alpine
│   ├── frontend.yaml           # K8s Deployment + Service
│   ├── index.html              # SPA con consumo de API
│   └── (archivos servidos)
│
└── README.md                   # Este archivo
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Docker instalado
- Minikube instalado y configurado
- kubectl instalado
- Terminal bash

### Paso 1: Iniciar Minikube

```bash
minikube start
```

Verifica el estado:
```bash
minikube status
```

### Paso 2: Configurar Docker para usar Minikube

```bash
eval $(minikube docker-env)
```

Este comando configura Docker para compilar imágenes dentro del cluster de Minikube.

### Paso 3: Construir las imágenes Docker

**Backend:**
```bash
cd backend
docker build -t backend:latest .
cd ..
```

**Frontend:**
```bash
cd frontend
docker build -t frontend:latest .
cd ..
```

Verifica que se crearon:
```bash
docker images | grep -E 'backend|frontend'
```

### Paso 4: Desplegar en Kubernetes

**Backend:**
```bash
kubectl apply -f backend/backend.yaml
```

**Frontend:**
```bash
kubectl apply -f frontend/frontend.yaml
```

### Paso 5: Verificar el despliegue

```bash
# Ver pods
kubectl get pods

# Ver servicios
kubectl get svc

# Ver logs del backend
kubectl logs -l app=backend --tail=20
```

### Paso 6: Acceder a la aplicación

Abre tu navegador en:
```
http://192.168.49.2:30007
```

## 📝 Componentes Detallados

### Módulo Go (`backend/go.mod`)

El archivo `go.mod` es la **declaración de módulo del proyecto Go**. Es similar a `package.json` en Node.js.

```
module backend
go 1.26.2
```

- **`module backend`**: Nombre del módulo (namespace)
- **`go 1.26.2`**: Versión mínima de Go requerida para compilar

**¿Por qué está ahí?**
- Go necesita saber la versión mínima de Go que el código requiere
- Permite gestionar dependencias externas (aunque este proyecto no tiene)
- Lo genera automáticamente con `go mod init backend`

### Backend (Go)

**Ubicación:** `backend/src/main.go`

**Características:**
- API REST simple en Go
- Responde en puerto 8080
- Endpoints:
  - `GET /` - Retorna JSON con hora y hostname
  - `POST /` - Acepta solicitudes POST (CORS habilitado)
  
**Response:**
```json
{
  "time": "2026-04-30T15:30:00.123456789Z",
  "hostname": "backend-5fd758f8f7-45bd6"
}
```

**Headers CORS:**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`

**Dockerfile:**
- Base: `golang:1.26-alpine` (builder)
- Runtime: `alpine:3.19`
- Compilación multi-stage para imagen optimizada

### Frontend (Nginx)

**Ubicación:** `frontend/index.html`

**Características:**
- SPA (Single Page Application)
- Consume API del backend
- Interfaz HTML/CSS/JavaScript
- Dos botones: GET y POST
- Muestra respuesta del backend en tiempo real

**Conecta a:**
```
Backend URL: http://192.168.49.2:30008
```

**Dockerfile:**
- Base: `nginx:alpine`
- Sirve `index.html` en puerto 80

### Kubernetes Manifests

#### Backend Deployment (`backend/backend.yaml`)

```yaml
- 3 réplicas
- Imagen: backend:latest
- imagePullPolicy: IfNotPresent (busca localmente)
- Puerto del contenedor: 8080
- Service NodePort: 30008 → 8080
```

#### Frontend Deployment (`frontend/frontend.yaml`)

```yaml
- 2 réplicas
- Imagen: frontend:latest
- imagePullPolicy: IfNotPresent (busca localmente)
- Puerto del contenedor: 80
- Service NodePort: 30007 → 80
```

## 🔧 Comandos Útiles

### Gestión de Pods

```bash
# Listar pods
kubectl get pods

# Listar pods con más detalles
kubectl get pods -o wide

# Ver logs de un pod
kubectl logs POD_NAME

# Logs en tiempo real
kubectl logs -f POD_NAME

# Ejecutar comando en un pod
kubectl exec -it POD_NAME -- /bin/sh

# Eliminar pods (se recrearán automáticamente)
kubectl delete pods -l app=backend
```

### Gestión de Servicios

```bash
# Listar servicios
kubectl get svc

# Obtener detalles del servicio
kubectl describe svc backend

# Port-forward (acceso local)
kubectl port-forward svc/backend 8080:80
```

### Debugging

```bash
# Describir deployment
kubectl describe deployment backend

# Ver eventos del cluster
kubectl get events

# Conectar al backend internamente
kubectl exec -it POD_NAME -- wget -O- http://localhost:8080/

# Probar conectividad entre pods
kubectl exec -it FRONTEND_POD -- wget -O- http://backend:80/
```

## 🔄 Flujo de Comunicación

1. **Usuario abre navegador**: `http://192.168.49.2:30007`
   ↓
2. **Nginx sirve `index.html`** (frontend pod)
   ↓
3. **JavaScript en navegador hace fetch** a `http://192.168.49.2:30008/`
   ↓
4. **ServiceNodePort redirige** al backend Service (puerto 80)
   ↓
5. **Load Balancer elige un backend pod** (3 réplicas disponibles)
   ↓
6. **Backend responde con JSON** (hora + hostname)
   ↓
7. **Frontend muestra respuesta** en la página

## 📊 Escalado

### Aumentar réplicas del backend

```bash
kubectl scale deployment backend --replicas=5
```

### Ver scaling en tiempo real

```bash
kubectl get pods -w
```

## 🛑 Detener y Limpiar

```bash
# Eliminar todo
kubectl delete -f backend/backend.yaml -f frontend/frontend.yaml

# Parar Minikube (sin eliminar)
minikube stop

# Eliminar Minikube completamente
minikube delete
```

## 🐛 Troubleshooting

### El frontend no puede conectar al backend

**Causa:** Headers CORS no configurados

**Solución:** Reconstruir la imagen del backend
```bash
eval $(minikube docker-env)
cd backend
docker build -t backend:latest .
kubectl delete pods -l app=backend
```

### Los pods no inician

**Comando:**
```bash
kubectl describe pod POD_NAME
kubectl logs POD_NAME
```

### No puedo acceder a http://192.168.49.2:30007

**Solución:** Obtener IP correcta de Minikube
```bash
minikube ip
```

### Error de CORS en el navegador

**Solución:** Los headers CORS ya están configurados en el backend. Si persiste:
1. Limpiar caché del navegador (Ctrl+Shift+Del)
2. Recargar página (Ctrl+F5)
3. Verificar logs: `kubectl logs -l app=backend`

## 📚 Recursos Educativos

Este proyecto cubre:
- ✅ Deployments en Kubernetes
- ✅ Services (NodePort)
- ✅ Multi-stage Docker builds
- ✅ Réplicas y escalado
- ✅ CORS en APIs REST
- ✅ Comunicación inter-pod
- ✅ Manifests YAML de K8s

## 📝 Notas

- Los pods reciben nombres aleatorios que cambian cada vez que se recreen
- El hostname en la respuesta del backend refleja el nombre del pod que respondió
- Cada recarga puede conectar a un pod diferente (load balancing)
- Las imágenes se cachean localmente en Minikube

---

**Última actualización:** 30 de abril de 2026
