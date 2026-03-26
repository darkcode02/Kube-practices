🔁 ReplicaSet y 🚀 Deployment en Kubernetes
📌 Objetivo

Entender cómo usar controladores para:

Mantener número de réplicas (ReplicaSet)
Gestionar despliegues y versiones (Deployment)
🔁 ReplicaSet (RS)
🧾 Ejemplo básico
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: rs-ejemplo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-rs
  template:
    metadata:
      labels:
        app: demo-rs
    spec:
      containers:
      - name: nginx
        image: nginx:latest
📌 Qué hace
Garantiza que siempre existan 3 pods
Si borras uno → lo recrea
Si hay más → elimina el exceso
⚠️ Problema real del ReplicaSet

No gestiona versiones.

Si cambias la imagen:

image: nginx:1.25

No hay rollback, ni estrategia de despliegue. Solo cambia el template para futuros pods.

🚀 Deployment
🧾 Ejemplo básico
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-ejemplo
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-deploy
  template:
    metadata:
      labels:
        app: demo-deploy
    spec:
      containers:
      - name: nginx
        image: nginx:latest
🔄 Ejemplo con Rolling Update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deployment-rolling
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: demo-deploy
  template:
    metadata:
      labels:
        app: demo-deploy
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
📌 Qué agrega Deployment sobre RS
Versionado (ReplicaSets internos)
Rollback automático/manual
Estrategias de despliegue
Historial de cambios
🔍 Comandos clave
kubectl apply -f deployment.yml
kubectl rollout status deployment deployment-ejemplo
kubectl rollout history deployment deployment-ejemplo
kubectl rollout undo deployment deployment-ejemplo
❗ Comparación directa
Recurso	Escala	Autorecuperación	Versionado	Rollout
Pod	❌	❌	❌	❌
ReplicaSet	✅	✅	❌	❌
Deployment	✅	✅	✅	✅
❓ Preguntas críticas
¿Por qué casi nunca deberías crear un ReplicaSet manualmente?
¿Qué pasa si editas un RS directamente mientras un Deployment lo controla?
¿Sabes qué es un rollout fallido y cómo detectarlo?
✅ Conclusión
Usa Pod solo para pruebas puntuales
Evita ReplicaSet directo salvo casos específicos
Usa Deployment como estándar en producción

Si estás usando RS manual en producción sin una razón clara, estás diseñando mal tu sistema.