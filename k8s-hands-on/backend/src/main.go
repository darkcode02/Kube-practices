// Backend de laboratorio para Kubernetes: API HTTP sin base de datos externa.
// Expone endpoints de salud, métricas simples y CRUD básico en memoria para practicar Services y probes.
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

type task struct {
	// task es el recurso principal que devuelve la API en /api/tasks.
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Owner     string    `json:"owner"`
	Priority  string    `json:"priority"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type taskInput struct {
	Title    string `json:"title"`
	Owner    string `json:"owner"`
	Priority string `json:"priority"`
}

type server struct {
	// server concentra estado en memoria y metadatos útiles para observar réplicas en Kubernetes.
	startedAt time.Time
	hostname  string
	version   string
	cluster   string

	mu       sync.RWMutex
	tasks    []task
	nextID   int
	requests int64
}

func main() {
	// El hostname permite identificar qué Pod respondió cuando hay varias réplicas.
	hostname, err := os.Hostname()
	if err != nil {
		hostname = "unknown"
	}

	s := &server{
		startedAt: time.Now().UTC(),
		hostname:  hostname,
		version:   envOrDefault("APP_VERSION", "dev"),
		cluster:   envOrDefault("CLUSTER_NAME", "minikube"),
		nextID:    4,
		tasks: []task{
			newSeedTask(1, "Construir imagen del backend", "platform", "alta", true),
			newSeedTask(2, "Publicar frontend con NodePort", "frontend", "media", false),
			newSeedTask(3, "Validar probes y logs", "sre", "alta", false),
		},
	}

	mux := http.NewServeMux()
	// Rutas públicas para probar conectividad, healthchecks y operaciones de la API.
	mux.HandleFunc("/", s.handleRoot)
	mux.HandleFunc("/api", s.handleRoot)
	mux.HandleFunc("/api/", s.routeAPI)
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/readyz", s.handleHealth)

	addr := ":8080"
	log.Printf("backend listening on %s hostname=%s version=%s cluster=%s", addr, s.hostname, s.version, s.cluster)
	log.Fatal(http.ListenAndServe(addr, s.withMiddleware(mux)))
}

func (s *server) withMiddleware(next http.Handler) http.Handler {
	// Middleware mínimo: cuenta requests, habilita CORS y escribe logs por petición.
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		s.mu.Lock()
		s.requests++
		s.mu.Unlock()

		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

func (s *server) routeAPI(w http.ResponseWriter, r *http.Request) {
	// Router manual suficiente para el ejemplo, sin dependencias externas.
	path := strings.TrimPrefix(r.URL.Path, "/api")
	switch {
	case path == "/healthz" || path == "/readyz":
		s.handleHealth(w, r)
	case path == "/info":
		s.handleInfo(w, r)
	case path == "/metrics":
		s.handleMetrics(w, r)
	case path == "/tasks":
		s.handleTasks(w, r)
	case strings.HasPrefix(path, "/tasks/"):
		s.handleTaskByID(w, r, strings.TrimPrefix(path, "/tasks/"))
	default:
		writeError(w, http.StatusNotFound, "endpoint not found")
	}
}

func (s *server) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/api" {
		writeError(w, http.StatusNotFound, "endpoint not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"service":   "k8s-hands-on-api",
		"message":   "API disponible en /api/info, /api/tasks, /api/metrics y /api/healthz",
		"hostname":  s.hostname,
		"timestamp": time.Now().UTC(),
	})
}

func (s *server) handleHealth(w http.ResponseWriter, r *http.Request) {
	// Endpoint usado por readinessProbe y livenessProbe en los manifiestos.
	writeJSON(w, http.StatusOK, map[string]any{
		"status":    "ok",
		"hostname":  s.hostname,
		"timestamp": time.Now().UTC(),
	})
}

func (s *server) handleInfo(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	totalRequests := s.requests
	taskCount := len(s.tasks)
	s.mu.RUnlock()

	writeJSON(w, http.StatusOK, map[string]any{
		"service":       "k8s-hands-on-api",
		"version":       s.version,
		"cluster":       s.cluster,
		"hostname":      s.hostname,
		"uptimeSeconds": int(time.Since(s.startedAt).Seconds()),
		"tasks":         taskCount,
		"requests":      totalRequests,
		"serverTime":    time.Now().UTC(),
	})
}

func (s *server) handleMetrics(w http.ResponseWriter, r *http.Request) {
	// Métricas didácticas para observar estado del proceso sin Prometheus.
	s.mu.RLock()
	defer s.mu.RUnlock()

	done := 0
	for _, item := range s.tasks {
		if item.Done {
			done++
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"requests":      s.requests,
		"uptimeSeconds": int(time.Since(s.startedAt).Seconds()),
		"tasksTotal":    len(s.tasks),
		"tasksDone":     done,
		"tasksPending":  len(s.tasks) - done,
		"pod":           s.hostname,
	})
}

func (s *server) handleTasks(w http.ResponseWriter, r *http.Request) {
	// GET lista tareas; POST crea una nueva tarea en memoria.
	switch r.Method {
	case http.MethodGet:
		s.mu.RLock()
		items := append([]task(nil), s.tasks...)
		s.mu.RUnlock()
		writeJSON(w, http.StatusOK, map[string]any{"items": items})
	case http.MethodPost:
		var input taskInput
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			writeError(w, http.StatusBadRequest, "invalid JSON body")
			return
		}
		item, err := s.createTask(input)
		if err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, item)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *server) handleTaskByID(w http.ResponseWriter, r *http.Request, rawID string) {
	id, err := strconv.Atoi(strings.Trim(rawID, "/"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid task id")
		return
	}

	switch r.Method {
	case http.MethodPatch, http.MethodPut:
		item, err := s.toggleTask(id)
		if err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, item)
	case http.MethodDelete:
		if err := s.deleteTask(id); err != nil {
			writeError(w, http.StatusNotFound, err.Error())
			return
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (s *server) createTask(input taskInput) (task, error) {
	// Valida entrada y usa mutex porque varias requests pueden modificar el slice.
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return task{}, errors.New("title is required")
	}

	owner := strings.TrimSpace(input.Owner)
	if owner == "" {
		owner = "platform"
	}

	priority := strings.ToLower(strings.TrimSpace(input.Priority))
	if priority == "" {
		priority = "media"
	}
	if priority != "baja" && priority != "media" && priority != "alta" {
		return task{}, fmt.Errorf("priority must be baja, media or alta")
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now().UTC()
	item := task{
		ID:        s.nextID,
		Title:     title,
		Owner:     owner,
		Priority:  priority,
		Done:      false,
		CreatedAt: now,
		UpdatedAt: now,
	}
	s.nextID++
	s.tasks = append([]task{item}, s.tasks...)
	return item, nil
}

func (s *server) toggleTask(id int) (task, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.tasks {
		if s.tasks[i].ID == id {
			s.tasks[i].Done = !s.tasks[i].Done
			s.tasks[i].UpdatedAt = time.Now().UTC()
			return s.tasks[i], nil
		}
	}
	return task{}, errors.New("task not found")
}

func (s *server) deleteTask(id int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	for i := range s.tasks {
		if s.tasks[i].ID == id {
			s.tasks = append(s.tasks[:i], s.tasks[i+1:]...)
			return nil
		}
	}
	return errors.New("task not found")
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	// Helper central para responder JSON con status explícito.
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("error writing JSON: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func envOrDefault(key, fallback string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	return value
}

func newSeedTask(id int, title, owner, priority string, done bool) task {
	now := time.Now().UTC()
	return task{
		ID:        id,
		Title:     title,
		Owner:     owner,
		Priority:  priority,
		Done:      done,
		CreatedAt: now,
		UpdatedAt: now,
	}
}
