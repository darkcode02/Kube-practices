# Ejercicios de Debugging

## Objetivo

Practicar diagnostico con eventos, logs, probes y comandos dentro de Pods.

## Ejercicio 1: CrashLoopBackOff intencional

Aplicar:

```bash
kubectl apply -f debugging/crashloop.yaml
```

Inspeccionar:

```bash
kubectl get pods -l app=crashloop-demo
kubectl describe pod -l app=crashloop-demo
kubectl logs -l app=crashloop-demo --previous
kubectl get events --sort-by='.lastTimestamp'
```

Preguntas:

* Cual es el codigo de salida?
* Cuanto tiempo espera Kubernetes antes de reiniciar?
* Que diferencia hay entre logs actuales y `--previous`?

## Ejercicio 2: Readiness rota

Aplicar:

```bash
kubectl apply -f debugging/broken-readiness.yaml
```

Verificar:

```bash
kubectl get pods -l app=broken-readiness-demo
kubectl describe pod -l app=broken-readiness-demo
kubectl get endpoints broken-readiness-service
```

Punto clave: un Pod puede estar `Running` pero no recibir trafico si no esta `Ready`.

## Limpieza

```bash
kubectl delete -f debugging/
```
