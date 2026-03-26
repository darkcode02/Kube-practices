# 🧪 Kubernetes ReplicaSet – Reutilización de Pods por Labels

## 📌 Descripción

En este ejercicio se demuestra cómo un **ReplicaSet (RS)** puede **adoptar pods existentes** si estos cumplen con el `selector` definido, en lugar de crear todos los pods desde cero.

Esto es un comportamiento clave en Kubernetes que muchas veces se pasa por alto: el controlador no distingue si los pods fueron creados por él o no, solo evalúa **labels**.

---

## ⚙️ Escenario

Inicialmente se tenían dos pods creados manualmente:

```bash
kubectl get pod

NAME      READY   STATUS    RESTARTS   AGE
podtest1  1/1     Running   0          ...
podtest2  1/1     Running   0          ...
```

A estos pods se les agregó el mismo label:

```bash
kubectl label pods podtest1 app=pod-label
kubectl label pods podtest2 app=pod-label
```

---

## 📄 ReplicaSet aplicado

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: rs-test
  labels:
    app: rs-test
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pod-label
  template:
    metadata:
      labels:
        app: pod-label
    spec:
      containers:
      - name: container1
        image: nginx:latest
```

---

## 🚀 Resultado

Al aplicar el ReplicaSet:

```bash
kubectl apply -f replicaSets/rs.yml
```

Kubernetes detecta que:

* Ya existen **2 pods** con el label `app=pod-label`
* El ReplicaSet requiere **3 replicas**

Por lo tanto:

* **Adopta automáticamente** los 2 pods existentes
* **Solo crea 1 pod adicional** (`rs-test-xxxxx`) para completar el estado deseado

```bash
kubectl get pod

NAME            READY   STATUS    RESTARTS   AGE
podtest1        1/1     Running   0          ...
podtest2        1/1     Running   0          ...
rs-test-xxxxx   1/1     Running   0          ...
```

---

## 🧠 Concepto clave

El ReplicaSet funciona bajo este principio:

> “No me importa quién creó el pod. Si cumple mi selector, es mío.”

Esto se llama **pod adoption**.

---

## ⚠️ Implicaciones importantes

### 1. Riesgo de colisión de labels

Si usas labels genéricos (ej: `app=backend`), podrías
