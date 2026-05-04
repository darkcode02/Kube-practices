# Ejercicios de Recursos y Scheduling

## Objetivo

Entender como `requests`, `limits`, probes y reglas de scheduling afectan la estabilidad de una carga.

## Ejercicio 1: Requests, limits y probes

Aplicar:

```bash
kubectl apply -f resources/requests-limits-probes.yaml
```

Verificar:

```bash
kubectl get deploy resource-demo
kubectl describe pod -l app=resource-demo
kubectl top pod -l app=resource-demo
```

Preguntas:

* Que recursos reserva el scheduler?
* Que ocurre si el contenedor supera su limite de memoria?
* Que diferencia hay entre readiness y liveness?

## Ejercicio 2: nodeSelector

Lista tus nodos:

```bash
kubectl get nodes --show-labels
```

Agrega una etiqueta de laboratorio a un nodo:

```bash
kubectl label node <node-name> lab=scheduling
```

Aplica:

```bash
kubectl apply -f resources/nodeselector.yaml
```

Verifica donde quedo programado:

```bash
kubectl get pod -l app=nodeselector-demo -o wide
```

Quita la etiqueta y observa el efecto al recrear el Pod:

```bash
kubectl label node <node-name> lab-
kubectl delete pod -l app=nodeselector-demo
kubectl describe pod -l app=nodeselector-demo
```

## Limpieza

```bash
kubectl delete -f resources/
```
