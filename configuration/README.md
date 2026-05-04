# Ejercicios de Configuracion: ConfigMaps y Secrets

## Objetivo

Practicar como Kubernetes inyecta configuracion en los Pods sin reconstruir imagenes.

Estos ejercicios separan:

* Configuracion no sensible con `ConfigMap`
* Datos sensibles con `Secret`
* Consumo mediante variables de entorno y archivos montados

## Ejercicio 1: ConfigMap como variables de entorno

Aplicar:

```bash
kubectl apply -f configuration/configmap-env.yaml
```

Verificar:

```bash
kubectl get pods -l app=configmap-env-demo
kubectl exec deploy/configmap-env-demo -- env | grep APP_
```

Preguntas:

* Que pasa si editas el ConfigMap?
* El Pod ve el cambio automaticamente en variables de entorno?
* Que tendrias que reiniciar para tomar la nueva configuracion?

## Ejercicio 2: ConfigMap como archivo

Aplicar:

```bash
kubectl apply -f configuration/configmap-volume.yaml
```

Verificar:

```bash
kubectl exec deploy/configmap-volume-demo -- cat /etc/app-config/app.properties
```

Prueba un cambio:

```bash
kubectl edit configmap app-file-config
kubectl exec deploy/configmap-volume-demo -- cat /etc/app-config/app.properties
```

Punto clave: los ConfigMaps montados como volumen pueden actualizarse en el Pod, pero no debes asumir que la aplicacion releera el archivo por si sola.

## Ejercicio 3: Secret como variable de entorno

Aplicar:

```bash
kubectl apply -f configuration/secret-env.yaml
```

Verificar:

```bash
kubectl get secret db-credentials -o yaml
kubectl exec deploy/secret-env-demo -- sh -c 'echo "$DB_USER" && test -n "$DB_PASSWORD"'
```

Preguntas:

* Por que el valor aparece codificado en base64 y no cifrado?
* Quien puede leer este Secret en el namespace?
* Como cambiaria esto con RBAC?

## Limpieza

```bash
kubectl delete -f configuration/
```
