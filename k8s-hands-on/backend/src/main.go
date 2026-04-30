package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "time"
)

type HandsOn struct {
	Time     time.Time `json:"time"`
	Hostname string    `json:"hostname"`
}

func serveHTTP(w http.ResponseWriter, r *http.Request) {
    // Agregar headers CORS
    w.Header().Set("Access-Control-Allow-Origin", "*")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
    
    // Responder a preflight requests
    if r.Method == "OPTIONS" {
        return
    }
    
    hostname, err := os.Hostname()
    if err != nil {
        log.Printf("Error getting hostname: %v", err)
        hostname = "unknown"
    }

    resp := HandsOn{
        Time:     time.Now(),
        Hostname: hostname,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/", serveHTTP)
    log.Fatal(http.ListenAndServe(":8080", nil))
}