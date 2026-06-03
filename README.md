# Jenkins CI/CD Pipeline

End-to-end CI/CD pipeline using Jenkins, Docker, and Kubernetes. The `Jenkinsfile` defines a multi-stage pipeline that builds, tests, containerises, and deploys a Node.js application to an EKS cluster.

## Pipeline Stages

```
Checkout → Install → Test → Code Quality → Docker Build → Push → Deploy (dev) → Smoke Test → Deploy (prod)
```

| Stage | What it does |
|-------|-------------|
| Checkout | Pull source from GitHub |
| Install | `npm ci` with dependency cache |
| Test | Unit tests + coverage report |
| Code Quality | SonarQube scan (non-blocking) |
| Docker Build | Multi-stage image build, tag with commit SHA |
| Push | Push to ECR (or Docker Hub) |
| Deploy Dev | `helm upgrade` to `myapp-dev` namespace |
| Smoke Test | `curl` health check against dev endpoint |
| Deploy Prod | `helm upgrade` to `myapp-prod` (manual approval gate) |

## Prerequisites

- Jenkins >= 2.400 with plugins: Pipeline, Docker Pipeline, Kubernetes CLI, SonarQube Scanner
- Jenkins credentials: `aws-credentials`, `docker-credentials`, `kubeconfig`
- SonarQube server configured in Jenkins (optional)

## Repository Structure

```
.
├── Jenkinsfile              # Declarative pipeline
├── Dockerfile               # Multi-stage Docker build
├── src/
│   └── server.js            # Express app
├── tests/
│   └── server.test.js       # Jest unit tests
├── k8s/
│   ├── deployment.yaml
│   └── service.yaml
└── scripts/
    └── smoke-test.sh        # Post-deploy health check
```

## Running Locally

```bash
npm install
npm test
docker build -t myapp:local .
docker run -p 8080:8080 myapp:local
curl http://localhost:8080/health
```