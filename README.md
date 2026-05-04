# Kube-practices

## 📌 Overview

This repository explores Kubernetes from a practical perspective, focusing on how its core concepts behave under real conditions rather than just how they are defined.

Kubernetes is not a simple tool; it is a distributed system that operates through declarative state and continuous reconciliation. Understanding it requires more than applying YAML files — it requires questioning how and why the system reacts the way it does.

---

## 🧠 What This Repository Covers

At a high level, Kubernetes can be understood as a set of abstractions built to manage containerized workloads at scale. This repository touches, directly or indirectly, on the following areas:

## 🧪 Practical Exercises

The repository now includes hands-on labs grouped by topic:

* [Pods](./pods/pod.md): direct Pod creation, labels, multi-container Pods, and basic limitations.
* [ReplicaSets](./replicaSets/rs.md): selector behavior and Pod adoption through labels.
* [Deployments](./deployments/README.md): rollout, rollback, scaling, labels, and troubleshooting commands.
* [Services](./services/): ClusterIP and NodePort examples for stable access to workloads.
* [Configuration](./configuration/README.md): ConfigMaps and Secrets consumed through environment variables and mounted files.
* [Storage](./storage/README.md): `emptyDir` versus persistent storage with PersistentVolumeClaims.
* [Resources and Scheduling](./resources/README.md): requests, limits, probes, and `nodeSelector`.
* [Networking](./networking/README.md): Service DNS and NetworkPolicy isolation.
* [Debugging](./debugging/README.md): CrashLoopBackOff, broken readiness, logs, events, and endpoints.
* [K8s Hands-On App](./k8s-hands-on/README.md): distributed frontend/backend application running on Kubernetes.

---

### Workload Management

The foundation of Kubernetes revolves around how applications run:

* **Pods** as the smallest deployable unit
* Higher-level controllers like **ReplicaSets**, **Deployments**, and others that ensure desired state
* Concepts like scaling, self-healing, and rollout strategies

A critical point often missed: controllers do not “execute actions”, they continuously try to reconcile reality with a declared state.

---

### Networking

Kubernetes abstracts networking in a way that removes much of the manual configuration, but introduces its own complexity:

* Pod-to-pod communication
* Stable access through Services
* External exposure via Ingress or LoadBalancers

If you don’t understand how traffic flows inside the cluster, debugging becomes guesswork.

---

### Storage

Applications are rarely stateless in real environments:

* Volumes provide ephemeral or persistent storage
* PersistentVolume and PersistentVolumeClaim abstractions decouple storage from workloads

A common mistake is assuming storage behaves like local disk. It does not.

---

### Configuration Management

Applications need dynamic configuration:

* ConfigMaps for non-sensitive data
* Secrets for sensitive information

Mismanaging these leads to tight coupling, insecure deployments, or brittle systems.

---

### Scheduling and Resource Management

Kubernetes decides where workloads run:

* Resource requests and limits
* Node selection, taints, and tolerations
* Affinity and anti-affinity rules

If you ignore this layer, you lose control over performance and stability.

---

### Observability and Debugging

Understanding system state is not optional:

* Logs, events, and metrics
* `kubectl describe`, `logs`, and cluster-level monitoring

If your only tool is `kubectl get pods`, you are operating blind.

---

### Security

Often underestimated, but critical:

* RBAC (who can do what)
* Network policies
* Secret handling

Most clusters are far more permissive than they should be.

---

### Controller Model

This is the core of Kubernetes:

* Everything is driven by controllers
* Controllers watch state and act to reconcile differences
* Behavior emerges from interactions between multiple controllers

If you don’t understand this, many “weird” behaviors will seem random — they are not.

---

## ⚠️ What You Should Question

While working with this repository, you should constantly challenge your understanding:

* Why did Kubernetes create or delete this pod?
* Which controller is responsible for this behavior?
* What happens if I change labels or selectors dynamically?
* Is the system behaving deterministically, or am I missing something?

If you cannot answer these, you are interacting with Kubernetes at a superficial level.

---

## 🎯 Purpose

The goal is not to memorize commands or YAML structures, but to:

* Build a correct mental model of Kubernetes
* Understand how components interact
* Identify failure modes before they happen in real environments

---

## ✅ Final Note

Kubernetes rewards precision and punishes assumptions.

If you treat it as a black box that “just works”, you will eventually hit scenarios that you cannot explain or fix. This repository exists to reduce that gap.

---
