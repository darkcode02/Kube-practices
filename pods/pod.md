📦 Creación de Pods simples en Kubernetes (YAML)
📌 Objetivo

Definir y desplegar pods básicos usando manifiestos YAML, sin controladores (sin ReplicaSet ni Deployment). Este enfoque es útil para pruebas, debugging o aprendizaje, pero no es adecuado para producción.

⚠️ Advertencia

Un Pod creado directamente:

No se autorecupera si falla
No escala
No tiene gestión declarativa de estado

Si estás usando esto fuera de laboratorio, estás tomando una mala decisión.

🧾 Ejemplo 1: Pod básico
apiVersion: v1
kind: Pod
metadata:
  name: pod-simple
  labels:
    app: demo
spec:
  containers:
  - name: nginx-container
    image: nginx:latest
    ports:
    - containerPort: 80
Aplicar:
kubectl apply -f pod.yml
🧾 Ejemplo 2: Pod con múltiples contenedores
apiVersion: v1
kind: Pod
metadata:
  name: pod-multicontainer
  labels:
    app: demo
spec:
  containers:
  - name: nginx
    image: nginx:latest
  - name: sidecar
    image: busybox
    command: ["sh", "-c", "while true; do echo sidecar running; sleep 5; done"]
Punto clave

Ambos contenedores:

Comparten red (localhost)
Comparten almacenamiento (si defines volumes)
🧾 Ejemplo 3: Pod con volumen
apiVersion: v1
kind: Pod
metadata:
  name: pod-volumen
spec:
  containers:
  - name: app
    image: nginx:latest
    volumeMounts:
    - mountPath: /usr/share/nginx/html
      name: html-volume
  volumes:
  - name: html-volume
    emptyDir: {}
🔍 Verificación
kubectl get pods
kubectl describe pod pod-simple
kubectl logs pod-simple
❓ Preguntas críticas
¿Qué pasa si el contenedor falla?
¿Quién lo recrea?
¿Cómo haces rollout de una nueva versión?

Si no tienes respuesta clara: necesitas un controlador, no un Pod directo.

✅ Conclusión

Los Pods directos son:

Útiles para pruebas
Peligrosos en producción
Limitados en resiliencia