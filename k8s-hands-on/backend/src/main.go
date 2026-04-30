package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "time"
)

type HanssOn struct {
	Time	 time.Time `json:"time"`
	Hostname string    `json:"hostname"`
}

func serveHTTP(w http.ResponseWriter, r *http.Request) {
    hostname, err := os.Hostname()
    if err != nil {
        hostname = "unknown"
    }

    resp := HanssOn{
        Time:     time.Now(),
        Hostname: hostname,
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/", serveHTTP)
    log.Fatal(http.ListenAndServe(":9090", nil))
}