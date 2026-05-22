# 🔍 Guía de Troubleshooting - Kubernetes Probes

## Problemas Comunes y Soluciones

### ❌ Problema: Pod permanentemente en estado "NotReady"

**Síntomas:**
```bash
kubectl get pods
# NAME                     READY   STATUS    RESTARTS   AGE
# myapp-5f7d6c9d8b-xyz     0/1     Running   0          2m
```

**Causas comunes:**

1. **Readiness Probe falla constantemente**
   ```bash
   # Ver logs
   kubectl logs myapp-xyz
   
   # Ver descripción (mostrar eventos)
   kubectl describe pod myapp-xyz
   ```
   
   **Solución:**
   - Aumentar `initialDelaySeconds` si la app tarda más en inicializar
   - Verificar que el endpoint está disponible: `kubectl exec -it myapp-xyz -- curl localhost:8080/readyz`
   - Revisar logs de la aplicación

2. **Probe apunta a puerto incorrecto**
   ```yaml
   # INCORRECTO - puerto no existe
   readinessProbe:
     httpGet:
       port: 9000  # ❌ La app escucha en 8080
   
   # CORRECTO
   readinessProbe:
     httpGet:
       port: 8080  # ✓
   ```

3. **Timeout muy corto**
   ```yaml
   # Si tu app es lenta en responder:
   readinessProbe:
     httpGet:
       path: /readyz
       port: 8080
     timeoutSeconds: 1  # ❌ Muy corto
     
   # Solución:
     timeoutSeconds: 5  # ✓ Más realista
   ```

---

### ❌ Problema: Pod reinicia continuamente (CrashLoopBackOff)

**Síntomas:**
```bash
kubectl get pods
# NAME              READY   STATUS             RESTARTS   AGE
# myapp-xyz         0/1     CrashLoopBackOff   5          1m
```

**Causas:**

1. **Liveness Probe muy agresiva**
   ```yaml
   # INCORRECTO - reinicia demasiado rápido
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
     periodSeconds: 2      # ❌ Muy frecuente
     failureThreshold: 1   # ❌ Una falla = reinicio
   
   # CORRECTO - más conservador
   livenessProbe:
     httpGet:
       path: /health
       port: 8080
     periodSeconds: 10     # ✓
     failureThreshold: 3   # ✓ 3 fallos antes de reiniciar
   ```

2. **Startup Probe vencido (failureThreshold alcanzado)**
   ```bash
   # Ver cuándo vence el startup probe
   kubectl describe pod myapp-xyz
   
   # Buscar en eventos:
   # Startup probe failed: ...
   ```
   
   **Solución:**
   ```yaml
   startupProbe:
     httpGet:
       path: /startup
       port: 8080
     failureThreshold: 30  # Aumentar intentos
     periodSeconds: 10     # Aumentar tiempo entre intentos
     # Total = 30 * 10 = 300 segundos = 5 minutos
   ```

3. **Aplicación en deadlock**
   ```bash
   # Ver logs en tiempo real
   kubectl logs -f myapp-xyz
   
   # Si no hay logs nuevos pero no falla, es probable deadlock
   # Liveness Probe detectará y reiniciará
   ```

---

### ❌ Problema: Tráfico se pierde durante deployments

**Síntomas:**
- Los requests fallan durante rolling updates
- Algunos requests obtienen "Connection refused"

**Causa:** Readiness Probe no configurada correctamente

**Solución:**
```yaml
# INCORRECTO - readiness pasa demasiado rápido
readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 0  # ❌ Empieza inmediatamente
  periodSeconds: 1        # ❌ Frecuencia muy alta

# CORRECTO - espera suficiente tiempo
readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 10   # ✓ Esperar a que app inicialice
  periodSeconds: 5          # ✓ Verificar cada 5 segundos
  failureThreshold: 3       # ✓ Permitir algunos fallos transitorios
```

---

## 🔧 Técnicas de Debugging

### 1. Conectarse al contenedor y probar manualmente

```bash
# Acceder a la shell del contenedor
kubectl exec -it <pod-name> -- /bin/sh

# Probar readiness endpoint
curl http://localhost:8080/readyz
curl -v http://localhost:8080/readyz  # Verbose para ver headers

# Ver archivos de configuración
cat /tmp/healthy  # Si es probe exec

# Revisar procesos
ps aux
```

### 2. Ver eventos en tiempo real

```bash
# Mostrar eventos del Pod
kubectl describe pod <pod-name>

# Ver eventos en tiempo real (requiere watch)
kubectl get events --sort-by='.lastTimestamp' --watch

# Filtrar solo eventos del Pod
kubectl get events --field-selector involvedObject.name=<pod-name>
```

### 3. Verificar configuración actual

```bash
# Ver definición completa del Pod
kubectl get pod <pod-name> -o yaml

# Ver solo la sección de probes
kubectl get pod <pod-name> -o jsonpath='{.spec.containers[0].livenessProbe}'

# Ver status actual
kubectl get pod <pod-name> -o jsonpath='{.status.conditions}'
```

### 4. Logs con contexto

```bash
# Últimas 100 líneas
kubectl logs <pod-name> --tail=100

# Logs en tiempo real
kubectl logs -f <pod-name>

# Logs del contenedor anterior (si fue reiniciado)
kubectl logs <pod-name> --previous

# Incluir timestamps
kubectl logs <pod-name> --timestamps=true
```

---

## ✅ Checklist de Configuración

Antes de deploying a producción:

- [ ] ¿Probe apunta al endpoint correcto?
- [ ] ¿Endpoint devuelve status code 200 exitosamente?
- [ ] ¿`initialDelaySeconds` es suficiente para tu app?
- [ ] ¿`timeoutSeconds` < `periodSeconds`?
- [ ] ¿`failureThreshold` es razonable? (3-5 es típico)
- [ ] ¿Liveness probe es diferente de readiness probe?
- [ ] ¿Startup probe configurado para apps lentas?
- [ ] ¿Probaste localmente antes de deploying?
- [ ] ¿Revisaste los eventos del Pod después de deploy?
- [ ] ¿Monitoreaste reincios anormales en la primera hora?

---

## 📊 Valores Recomendados por Tipo de Aplicación

### API REST Rápida
```yaml
startupProbe:
  httpGet:
    path: /health
    port: 8080
  failureThreshold: 10
  periodSeconds: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 2
  periodSeconds: 5
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

### Base de Datos (Postgres, MySQL)
```yaml
startupProbe:
  exec:
    command: ["pg_isready", "-U", "postgres"]
  failureThreshold: 30
  periodSeconds: 10

readinessProbe:
  exec:
    command: ["pg_isready", "-U", "postgres"]
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3

livenessProbe:
  exec:
    command: ["pg_isready", "-U", "postgres"]
  initialDelaySeconds: 10
  periodSeconds: 15
  failureThreshold: 3
```

### Aplicación Java (JVM)
```yaml
startupProbe:
  httpGet:
    path: /actuator/health
    port: 8080
  failureThreshold: 30  # JVM tarda más
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30  # Dar tiempo a JIT compilation
  periodSeconds: 10
  failureThreshold: 5

livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10
  failureThreshold: 3
```

### Aplicación Node.js
```yaml
startupProbe:
  httpGet:
    path: /health
    port: 3000
  failureThreshold: 20
  periodSeconds: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
```

---

## 🚨 Señales de Problemas en Producción

**Monitorear estas métricas:**

1. **Pod restart rate**
   ```bash
   # Si RESTARTS está aumentando, hay problema con liveness probe
   kubectl get pods
   ```

2. **Ready pods vs Total pods**
   ```bash
   # Si READY < DESIRED, readiness probe está fallando
   kubectl get deployment
   ```

3. **Event rate**
   ```bash
   # Muchos eventos = problemas con probes
   kubectl get events -A --sort-by='.lastTimestamp'
   ```

4. **Latencia de readiness**
   - Si startup + readiness tarda > 5 minutos, revisar umbrales
   - Si durante deployments hay downtime, readiness no está bien configurada

---

## 💡 Pro Tips

1. **Usa namespaces separados para debugging**
   ```bash
   kubectl create namespace debug
   kubectl apply -f probes/ -n debug
   ```

2. **Copia una definición y modifica una cosa a la vez**
   - Esto ayuda a identificar qué parámetro causa problemas

3. **Documenta tus decisiones en annotations**
   ```yaml
   metadata:
     annotations:
       probes-rationale: "Startup lento por JIT compilation, readiness espera a cache"
   ```

4. **Prueba los endpoints manualmente primero**
   ```bash
   # Antes de crear probe
   kubectl run -it --rm debug --image=curlimages/curl -- \
     curl http://myapp:8080/health
   ```

5. **Usa `describe` antes de `logs`**
   - `describe` muestra eventos que explican qué salió mal
   - `logs` muestra solo salida de la aplicación
