# Ejercicios de Networking: DNS y NetworkPolicy

## Objetivo

Practicar resolucion DNS interna y aislamiento de trafico entre Pods.

## Ejercicio 1: DNS interno de Services

Aplicar:

```bash
kubectl apply -f networking/dns-service.yaml
```

Probar desde un cliente temporal:

```bash
kubectl run dns-client --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- http://echo-service
```

Tambien puedes probar el nombre completo:

```bash
kubectl run dns-client --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- http://echo-service.default.svc.cluster.local
```

Pregunta clave: por que el Service tiene IP estable aunque los Pods cambien?

## Ejercicio 2: NetworkPolicy

Aplica el backend, el cliente permitido y la politica:

```bash
kubectl apply -f networking/networkpolicy-demo.yaml
```

Probar desde el cliente permitido:

```bash
kubectl exec deploy/allowed-client -- wget -qO- --timeout=2 http://secure-backend
```

Probar desde un Pod sin label permitido:

```bash
kubectl run blocked-client --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- --timeout=2 http://secure-backend
```

Resultado esperado: el cliente permitido accede; el cliente sin label falla si tu CNI soporta `NetworkPolicy`.

## Limpieza

```bash
kubectl delete -f networking/
kubectl delete pod blocked-client --ignore-not-found
```
