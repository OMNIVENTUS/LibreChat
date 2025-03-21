# Project Structure Overview

## Main Components

Description: Vue d'ensemble du projet montrant les dépendances des fichiers de configuration.

```mermaid
graph TD;
    A[LibreChat Project]
    A --> B[api]
    A --> C[client]
    A --> D[packages]
    B --> E[.env file]
    B --> F[librechat.yml]
    C --> E
    C --> F
```

## Core Architecture

Description: Structure de base du projet montrant les composants principaux.

```mermaid
graph TD;
    A[LibreChat Project]
    A --> B[api]
    A --> C[client]
    A --> D[packages]
```

## Configuration change flow

Description: Processus de modification des fichiers de configuration.

```mermaid
flowchart TD;
    A[Change Approaches] -->|Customize| B[.env file]
    A -->|Customize| C[librechat.yml]
    A -->|Update Code| D[api folder]
    A -->|Update Code| E[client folder]
    B --> F[Impact on API]
    C --> G[Impact on Client]
    D --> H[Backend Functionality]
    E --> I[Frontend Functionality]
```

## Feature Implementation Quadrant

Description: Répartition des modifications nécessaires par fonctionnalité.

```mermaid
quadrantChart
    title Feature Implementation Areas
    x-axis Low Code Changes --> High Code Changes
    y-axis Low Config Changes --> High Config Changes
    quadrant-1 Full Stack Changes
    quadrant-2 Config Heavy
    quadrant-3 Minor Changes
    quadrant-4 Code Heavy
    "Social Login Integration": [0.3, 0.2]
    "User Administration": [0.9, 0.3]
    "File Sharing": [0.7, 0.4]
    "Local Models (Ollama)": [0.3, 0.8]
    "Rate Limiting": [0.2, 0.7]
    "UI Customization": [0.6, 0.2]
    "New user Permissions": [0.8, 0.9]
    "New API routes ": [0.8, 0.1]
```

## Local Development Architecture

Description: Architecture de développement local avec Docker.

```mermaid
graph TD;
    A[Docker Compose] --> B[API Container]
    A --> C[Client Container]
    A --> D[MongoDB Container]
    A --> E[Meilisearch Container]
    A --> F[VectorDB Container]
    A --> G[RAG API Container]
    A --> H[Ollama Container]

    B --> I[Hot Reload]
    C --> J[Vite Dev Server]

    K[Local Files] -->|Volume Mount| B
    K -->|Volume Mount| C

    L[.env] -->|Config| B
    M[librechat.yml] -->|Config| B

    N[Browser] -->|localhost:3080| C
    N -->|localhost:3000| G

    O[Dev Tools] -->|ngrok| P[External Access]
    O -->|make commands| Q[Build/Test]
```

Cette architecture montre :

1. Les conteneurs Docker nécessaires
2. Les montages de volumes
3. Les configurations
4. Les points d'accès développeur
5. Les outils de développement

Le diagramme quadrant montre que :

1. Les fonctionnalités comme l'intégration des réseaux sociaux nécessitent principalement des modifications de configuration
2. L'administration des utilisateurs et le partage de fichiers nécessitent des modifications importantes du code
3. La personnalisation de l'interface utilisateur est principalement axée sur le code frontend
4. L'intégration d'Ollama et la limitation du débit nécessitent principalement des modifications de configuration

## Query Flow Sequence

Description: Flux d'une requête utilisateur depuis l'interface de chat jusqu'à la réponse.

```mermaid
sequenceDiagram
actor User
participant Chat UI
participant API Server
participant Vector Store
participant LLM Provider
participant RAG API
participant File System
User->>Chat UI: Envoie une requête
Note over Chat UI: Vérifie si des fichiers<br/>sont attachés
alt Requête avec fichiers
Chat UI->>API Server: POST /query avec file_ids
API Server->>RAG API: Recherche contextuelle
RAG API->>Vector Store: Similarity search
Vector Store-->>RAG API: Résultats pertinents
RAG API-->>API Server: Contexte enrichi
else Requête simple
Chat UI->>API Server: POST /chat/completions
end
API Server->>LLM Provider: Envoi prompt + contexte
LLM Provider-->>API Server: Réponse générée
alt Réponse avec génération de fichiers
API Server->>File System: Sauvegarde fichiers
File System-->>API Server: Fichier IDs
end
API Server-->>Chat UI: Réponse formatée
Chat UI-->>User: Affiche la réponse
```

Ce diagramme montre :
Le flux principal d'une requête utilisateur
La gestion différenciée des requêtes avec/sans fichiers
L'interaction avec le système RAG
Le processus de génération de réponse
La gestion des fichiers générés
