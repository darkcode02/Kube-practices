# Kubernetes Probes - Ejemplos Detallados

Este directorio contiene ejemplos completos y comentados de los tres tipos de probes en Kubernetes.

## 📋 Tipos de Probes

### 1. **Liveness Probe**
- **Propósito**: Verifica si el contenedor está vivo
- **Acción al fallar**: Reinicia el contenedor
- **Caso de uso**: Detectar aplicaciones en deadlock o en estado corrupto
- **Ubicación**: `liveness/`

**Archivos:**
- `liveness-http.yaml` - Verificación mediante HTTP GET
- `liveness-exec.yaml` - Verificación mediante comando
- `liveness-tcp.yaml` - Verificación mediante conexión TCP

---

### 2. **Readiness Probe**
- **Propósito**: Verifica si el contenedor está listo para recibir tráfico
- **Acción al fallar**: Elimina el Pod de los endpoints del servicio
- **Caso de uso**: Aplicaciones que necesitan tiempo para inicializar o calentar
- **Ubicación**: `readiness/`

**Archivos:**
- `readiness-http.yaml` - Verificación mediante HTTP GET
- `readiness-exec.yaml` - Verificación mediante comando
- `readiness-tcp.yaml` - Verificación mediante conexión TCP

---

### 3. **Startup Probe**
- **Propósito**: Verifica si la aplicación ha completado su inicialización
- **Acción**: Desactiva liveness y readiness hasta que pase
- **Caso de uso**: Aplicaciones con tiempo de startup muy largo
- **Ubicación**: `startup/`

**Archivos:**
- `startup-http.yaml` - Verificación mediante HTTP GET
- `startup-exec.yaml` - Verificación mediante comando
- `startup-tcp.yaml` - Verificación mediante conexión TCP

---

## 🔄 Flujo de Ejecución

```
┌─────────────────────────────────────┐
│      Contenedor inicia               │
└────────────┬────────────────────────┘
             │
             ▼
    ┌─────────────────────┐
    │  Startup Probe      │ ◄─── Si falla después de failureThreshold,
    │  (ejecutándose)     │      el Pod falla
    └────────┬────────────┘
             │
             ▼ (Startup exitoso)
    ┌─────────────────────┐
    │  Liveness Probe     │ ◄─── Si falla, reinicia contenedor
    │  Readiness Probe    │      Si falla, elimina del servicio
    │  (ejecutándose)     │
    └─────────────────────┘
```

---

## 📊 Tabla Comparativa

| Probe | Propósito | Acción al fallar | Cuándo usar |
|-------|-----------|-----------------|------------|
| **Startup** | Verifica inicialización | Reinicia Pod | Apps con startup lento (>30s) |
| **Liveness** | Verifica si está vivo | Reinicia contenedor | Detectar deadlock/corrupción |
| **Readiness** | Verifica si puede recibir tráfico | Quita del servicio | Apps que necesitan prepararse |

---

## 🛠️ Parámetros Clave

### Tiempos
- **`initialDelaySeconds`**: Espera antes de inicio de chequeos
- **`periodSeconds`**: Intervalo entre chequeos
- **`timeoutSeconds`**: Tiempo máximo para que el probe responda

### Umbrales
- **`failureThreshold`**: Número de fallos antes de marcar como fallido
- **`successThreshold`**: Número de éxitos para marcar como exitoso (generalmente 1)

---

## 🚀 Ejemplos de Uso

### Ejecutar un ejemplo
```bash
kubectl apply -f liveness/liveness-http.yaml
kubectl apply -f readiness/readiness-exec.yaml
kubectl apply -f startup/startup-tcp.yaml
```

### Ver logs del Pod
```bash
kubectl logs <pod-name>
kubectl logs <pod-name> --previous  # Logs del contenedor anterior
```

### Ver eventos
```bash
kubectl describe pod <pod-name>
```

### Ver si está listo
```bash
kubectl get pods <pod-name> -o wide
# READY column mostrará 0/1 si no está listo, 1/1 si está listo
```

---

## 💡 Consejos Prácticos

1. **Startup Probe**: Usa con apps que tardan en iniciar (JVM, Node, etc)
2. **Readiness Probe**: Úsala cuando tu app necesite "calentar" (caches, conexiones)
3. **Liveness Probe**: Úsala para detectar problemas durante ejecución
4. **Timeouts**: Mantén timeoutSeconds < periodSeconds para evitar probes solapados
5. **Thresholds**: Aumenta failureThreshold en redes inestables

---

## 📚 Referencias Oficiales

- [Kubernetes Probes Documentation](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
