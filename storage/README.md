# Ejercicios de Storage: emptyDir y PersistentVolumeClaim

## Objetivo

Comparar almacenamiento efimero con almacenamiento persistente.

## Ejercicio 1: `emptyDir`

Aplicar:

```bash
kubectl apply -f storage/emptydir-pod.yaml
```

Escribir un archivo:

```bash
kubectl exec emptydir-demo -- sh -c 'date > /data/created-at.txt'
kubectl exec emptydir-demo -- cat /data/created-at.txt
```

Eliminar el Pod:

```bash
kubectl delete pod emptydir-demo
kubectl apply -f storage/emptydir-pod.yaml
kubectl exec emptydir-demo -- ls /data
```

Pregunta clave: por que el archivo desaparece?

## Ejercicio 2: PVC con Deployment

Aplicar:

```bash
kubectl apply -f storage/pvc-deployment.yaml
```

Verificar:

```bash
kubectl get pvc
kubectl exec deploy/pvc-demo -- sh -c 'echo persistent-data > /usr/share/nginx/html/index.html'
kubectl port-forward deploy/pvc-demo 8080:80
```

En otra terminal:

```bash
curl http://localhost:8080
```

Recrear el Pod:

```bash
kubectl delete pod -l app=pvc-demo
kubectl get pods -l app=pvc-demo
```

Vuelve a leer el contenido. Si tu cluster tiene un `StorageClass` funcional, el dato debe seguir presente.

## Limpieza

```bash
kubectl delete -f storage/
```
