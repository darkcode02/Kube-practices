# Comandos de Kubernetes Deployments

Este documento contiene todos los comandos esenciales para trabajar con deployments en Kubernetes.

## Crear y Aplicar Deployments

### Crear un deployment desde un archivo YAML
```bash
kubectl apply -f deployment.yaml
```

### Crear un deployment desde línea de comandos
```bash
kubectl create deployment <nombre-deployment> --image=<imagen>
```

### Crear un deployment con réplicas especificadas
```bash
kubectl create deployment <nombre-deployment> --image=<imagen> --replicas=3
```

## Ver Información de Deployments

### Listar todos los deployments
```bash
kubectl get deployments
```

### Listar deployments con más detalles
```bash
kubectl get deployments -o wide
```

### Listar deployments con formato YAML
```bash
kubectl get deployment <nombre-deployment> -o yaml
```

### Listar deployments con formato JSON
```bash
kubectl get deployment <nombre-deployment> -o json
```

### Ver detalles detallados de un deployment
```bash
kubectl describe deployment <nombre-deployment>
```

### Ver deployments en todos los namespaces
```bash
kubectl get deployments --all-namespaces
```

### Ver deployments en un namespace específico
```bash
kubectl get deployments -n <namespace>
```

## Actualizar Deployments

### Actualizar un deployment desde un archivo YAML
```bash
kubectl apply -f deployment.yaml
```

### Actualizar la imagen de un deployment
```bash
kubectl set image deployment/<nombre-deployment> <contenedor>=<nueva-imagen>
```

### Actualizar la imagen con un tag específico
```bash
kubectl set image deployment/<nombre-deployment> <contenedor>=nginx:1.19
```

### Actualizar recursos (CPU, memoria)
```bash
kubectl set resources deployment <nombre-deployment> --limits=cpu=200m,memory=512Mi --requests=cpu=100m,memory=256Mi
```

### Reemplazar completamente un deployment
```bash
kubectl replace -f deployment.yaml
```

### Reemplazar forzadamente un deployment
```bash
kubectl replace --force -f deployment.yaml
```

## Rollouts - Historial y Seguimiento

### Ver el historial de rollouts de un deployment
```bash
kubectl rollout history deployment/<nombre-deployment>
```

### Ver el historial con detalles de cambios
```bash
kubectl rollout history deployment/<nombre-deployment> --revision=2
```

### Ver el estado actual del rollout
```bash
kubectl rollout status deployment/<nombre-deployment>
```

### Ver el estado del rollout con seguimiento en tiempo real
```bash
kubectl rollout status deployment/<nombre-deployment> --watch
```

### Esperar a que se complete el rollout
```bash
kubectl rollout status deployment/<nombre-deployment> --watch=true
```

## Rollback - Revertir Cambios

### Revertir al revision anterior
```bash
kubectl rollout undo deployment/<nombre-deployment>
```

### Revertir a una revision específica
```bash
kubectl rollout undo deployment/<nombre-deployment> --to-revision=2
```

### Revertir con un tiempo específico (últimos 5 minutos)
```bash
kubectl rollout undo deployment/<nombre-deployment> --to-revision=1
```

### Ver qué cambió en una revisión específica
```bash
kubectl rollout history deployment/<nombre-deployment> --revision=1
```

## Escalar Deployments

### Escalar un deployment a un número específico de réplicas
```bash
kubectl scale deployment <nombre-deployment> --replicas=5
```

### Escalar desde un archivo YAML
```bash
kubectl scale -f deployment.yaml --replicas=3
```

### Ver el número actual de réplicas
```bash
kubectl get deployment <nombre-deployment> -o wide
```

## Editar Deployments

### Editar un deployment directamente
```bash
kubectl edit deployment <nombre-deployment>
```

### Editar en un namespace específico
```bash
kubectl edit deployment -n <namespace> <nombre-deployment>
```

## Pausa y Reanudación de Rollouts

### Pausar un rollout
```bash
kubectl rollout pause deployment/<nombre-deployment>
```

### Reanudar un rollout pausado
```bash
kubectl rollout resume deployment/<nombre-deployment>
```

## Eliminar Deployments

### Eliminar un deployment
```bash
kubectl delete deployment <nombre-deployment>
```

### Eliminar un deployment de un archivo YAML
```bash
kubectl delete -f deployment.yaml
```

### Eliminar deployments por etiqueta
```bash
kubectl delete deployment -l app=<etiqueta>
```

### Eliminar todos los deployments en un namespace
```bash
kubectl delete deployments --all
```

## Ver Pods Generados por un Deployment

### Listar todos los pods de un deployment
```bash
kubectl get pods -l app=<etiqueta-del-deployment>
```

### Ver logs de un pod generado por deployment
```bash
kubectl logs <nombre-pod>
```

### Ver logs en tiempo real
```bash
kubectl logs -f <nombre-pod>
```

### Ver logs de todos los pods del deployment
```bash
kubectl logs -l app=<etiqueta-del-deployment>
```

## Debugging

### Ver eventos del deployment
```bash
kubectl describe deployment <nombre-deployment>
```

### Ver los eventos recientes
```bash
kubectl get events --sort-by='.lastTimestamp'
```

### Ejecutar comando en un pod del deployment
```bash
kubectl exec -it <nombre-pod> -- /bin/bash
```

### Ver recursos del pod
```bash
kubectl top pod <nombre-pod>
```

### Ver recursos del nodo
```bash
kubectl top nodes
```

## Etiquetas y Selectores

### Ver las etiquetas de un deployment
```bash
kubectl get deployment <nombre-deployment> --show-labels
```

### Agregar etiqueta a un deployment
```bash
kubectl label deployment <nombre-deployment> <clave>=<valor>
```

### Eliminar etiqueta de un deployment
```bash
kubectl label deployment <nombre-deployment> <clave>-
```

### Seleccionar deployments por etiqueta
```bash
kubectl get deployments -l <clave>=<valor>
```

## Anotaciones

### Ver anotaciones de un deployment
```bash
kubectl describe deployment <nombre-deployment>
```

### Agregar anotación a un deployment
```bash
kubectl annotate deployment <nombre-deployment> <clave>=<valor>
```

## Estrategias de Despliegue

### Ver estrategia actual de un deployment
```bash
kubectl get deployment <nombre-deployment> -o yaml | grep -A 10 strategy:
```

### Tipos de estrategia disponibles
- **RollingUpdate** (por defecto): Reemplaza pods de forma gradual
- **Recreate**: Elimina todos los pods antes de crear nuevos

## Recursos Relacionados

Ver también:
- [pods/pod.md](../pods/pod.md) - Comandos para trabajar con pods
- [replicaSets/rs.md](../replicaSets/rs.md) - Comandos para ReplicaSets
- [services-1.yaml](./services-1.yaml) - Configuración de servicios

## Tips Útiles

### Aplicar múltiples archivos YAML
```bash
kubectl apply -f ./deployments/
```

### Ver cambios antes de aplicar
```bash
kubectl diff -f deployment.yaml
```

### Obtener YAML de un deployment actual
```bash
kubectl get deployment <nombre-deployment> -o yaml > deployment-backup.yaml
```

### Crear un deployment desde una imagen con salida YAML
```bash
kubectl create deployment <nombre> --image=<imagen> --dry-run=client -o yaml > deployment.yaml
```

### Monitorear cambios en tiempo real
```bash
kubectl get deployments --watch
```

### Monitorear pods específicos
```bash
kubectl get pods -l app=<app> --watch
```
