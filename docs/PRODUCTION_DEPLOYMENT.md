# 🚀 Deployment a Producción - Guía Avanzada

## Pre-requisitos Producción

### Infrastructure Requirements

```
┌─────────────────────────────────────┐
│        PRODUCTION STACK             │
├─────────────────────────────────────┤
│                                     │
│  Option 1: Cloud (RECOMENDADO)     │
│  └─ AWS ECS / Google Cloud Run      │
│     └─ Managed containers           │
│     └─ Auto-scaling                 │
│     └─ Load balancing               │
│                                     │
│  Option 2: Kubernetes               │
│  └─ Self-managed or managed         │
│     └─ High availability            │
│     └─ Advanced networking          │
│                                     │
│  Option 3: VPS + Docker             │
│  └─ EC2/DigitalOcean/Linode         │
│     └─ Docker Compose (simple)      │
│     └─ Docker Swarm (clustering)    │
│                                     │
└─────────────────────────────────────┘
```

---

## 1. Opción 1: AWS ECS (Elastic Container Service)

### Architecture

```
┌─────────────────────────────────────────┐
│            Route 53 (DNS)               │
│         my-api.example.com              │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│        ALB (Application Load            │
│         Balancer) Port 80/443           │
│  └─► HTTPS termination                 │
│  └─► Path-based routing                │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
        ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ ECS    │ │ ECS    │ │ ECS    │
    │ Task 1 │ │ Task 2 │ │ Task 3 │
    │ Port   │ │ Port   │ │ Port   │
    │ 8080   │ │ 8080   │ │ 8080   │
    └────┬───┘ └────┬───┘ └────┬───┘
         │          │          │
         └──────────┼──────────┘
                    │
         ┌──────────▼──────────┐
         │   RDS MySQL 8.0     │
         │  (Managed)          │
         │  - Auto backups     │
         │  - Multi-AZ         │
         │  - Read replicas    │
         └─────────────────────┘
```

### Deployment Steps

```bash
# 1. Build image para ECR
docker build -t my-api:1.0 ./rust-actix
docker tag my-api:1.0 ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-api:1.0

# 2. Push a ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

docker push ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-api:1.0

# 3. Crear ECS Task Definition
cat > task-definition.json << EOF
{
  "family": "my-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "my-api",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/my-api:1.0",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DB_HOST",
          "value": "db.example.com"
        },
        {
          "name": "DB_PORT",
          "value": "3306"
        }
      ],
      "secrets": [
        {
          "name": "DB_USER",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:db-user"
        },
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# 4. Registrar task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 5. Crear ECS Service
aws ecs create-service \
  --cluster my-cluster \
  --service-name my-api \
  --task-definition my-api:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

### Benefits
```
✅ Fully managed
✅ Auto-scaling (target tracking)
✅ Load balancing included
✅ CloudWatch monitoring
✅ Parameter Store for secrets
✅ Automatic rolling updates
```

### Costs
```
~ $150/month (minimal setup)
~ $500/month (production)
~ $2000/month (high availability)
```

---

## 2. Opción 2: Kubernetes

### Manifest Ejemplos

**Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-api
  template:
    metadata:
      labels:
        app: my-api
    spec:
      containers:
      - name: api
        image: my-registry/my-api:1.0
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: db-config
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /db-status
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: my-api-service
spec:
  type: LoadBalancer
  selector:
    app: my-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
```

**Ingress:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-api-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.example.com
    secretName: api-tls
  rules:
  - host: api.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-api-service
            port:
              number: 80
```

### Deploy

```bash
# Crear namespace
kubectl create namespace my-api

# Crear secrets
kubectl create secret generic db-secret \
  --from-literal=password=YOUR_PASSWORD \
  -n my-api

# Crear configMap
kubectl create configmap db-config \
  --from-literal=host=db.example.com \
  -n my-api

# Deploy
kubectl apply -f deployment.yaml -n my-api
kubectl apply -f service.yaml -n my-api
kubectl apply -f ingress.yaml -n my-api

# Verificar
kubectl get pods -n my-api
kubectl get svc -n my-api
kubectl logs deployment/my-api -n my-api
```

### HPA (Auto-scaling)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Benefits
```
✅ Industry standard
✅ Highly scalable
✅ Multi-cloud ready
✅ Advanced networking
✅ GitOps ready
```

### Costs
```
~ $300/month (self-managed)
~ $500/month (GKE/EKS managed)
~ $2000+/month (HA production)
```

---

## 3. Opción 3: VPS + Docker Compose

### Setup Simple

```bash
# 1. Conectar a VPS
ssh root@your-ip

# 2. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 4. Clonar repo
git clone https://github.com/your-repo/backend-docker.git
cd backend-docker

# 5. Configurar variables
nano .env
# DB_USER=root
# DB_PASSWORD=secure-password-here
# etc.

# 6. Start
docker-compose up -d

# 7. Verificar
docker-compose ps
curl http://localhost:8080/health
```

### Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/default
upstream backend {
  server localhost:8080;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

  client_max_body_size 10M;

  location / {
    proxy_pass http://backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # Health check endpoint (sin logging)
  location /health {
    proxy_pass http://backend;
    access_log off;
  }
}

# Redirect HTTP a HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$server_name$request_uri;
}
```

### Certbot para SSL

```bash
# Instalar Certbot
apt update && apt install -y certbot python3-certbot-nginx

# Generar certificado
certbot certonly --nginx -d api.example.com

# Auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Monitoring Simple

```bash
# health check script
cat > /opt/health-check.sh << 'EOF'
#!/bin/bash
RESPONSE=$(curl -s http://localhost:8080/health)
if [[ $RESPONSE == *"running"* ]]; then
  echo "✅ API health check passed"
else
  echo "❌ API health check failed"
  docker-compose restart
fi
EOF

chmod +x /opt/health-check.sh

# Cron job (every 5 minutes)
*/5 * * * * /opt/health-check.sh
```

### Backup Database

```bash
# Backup script
cat > /opt/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec db-mysql mysqldump \
  -u root -pmysecurepassword dbapp > /backups/dbapp_$DATE.sql

# Keep only last 30 days
find /backups -name "dbapp_*.sql" -mtime +30 -delete
EOF

chmod +x /opt/backup.sh

# Daily backup at 2 AM
0 2 * * * /opt/backup.sh
```

### Benefits
```
✅ Simple setup
✅ Full control
✅ Cost-effective
✅ Familiar tools
```

### Costs
```
~ $50/month (DigitalOcean Basic)
~ $150/month (general purpose)
~ $500/month (multi-region)
```

---

## 4. Comparativa Deployment

| Aspecto | ECS | Kubernetes | VPS |
|---------|-----|-----------|-----|
| **Setup** | 30 min | 2-4 horas | 15 min |
| **Scaling** | Automático | Automático | Manual |
| **HA** | Built-in | Built-in | Manual |
| **Cost** | $150-2000 | $300-2000 | $50-500 |
| **Learning** | Fácil | Difícil | Fácil |
| **Production-ready** | ✅ | ✅✅ | ⚠️ |
| **Control** | Limitado | Completo | Completo |

---

## 5. CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Test Rust
        run: |
          cd rust-actix
          cargo test --release

      - name: Test Node
        run: |
          cd nodejs-express
          npm ci
          npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Build Rust image
        run: |
          docker build -t my-api:${{ github.sha }} ./rust-actix

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | \
            docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag my-api:${{ github.sha }} my-api:latest
          docker push my-api:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecs update-service \
            --cluster my-cluster \
            --service my-api \
            --force-new-deployment
```

---

## 6. Monitoring en Producción

### Prometheus + Grafana

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  # En tu backend Rust, agregar:
  # metrics: ["actix_web_requests_total", "actix_web_request_duration"]
```

### Logging Centralizado

```yaml
# docker-compose.yml con ELK
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.0.0
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    command: filebeat -e -strict.perms=false
```

---

## 7. Security Checklist

```
✅ HTTPS/TLS enforced
✅ Secrets in AWS Secrets Manager (no .env)
✅ Database in private subnet
✅ API in private subnet + ALB
✅ WAF enabled on ALB
✅ Rate limiting configured
✅ SQL injection prevention (prepared statements)
✅ CORS properly configured
✅ HSTS headers enabled
✅ X-Content-Type-Options set
✅ Container image scanning
✅ Vulnerability scanning (Trivy)
✅ Network policies defined
✅ Regular backups automated
✅ Disaster recovery plan documented
```

---

## 8. Performance Tuning

### Rust/Actix

```rust
// Aumentar timeouts
.client_request_timeout(Duration::from_secs(30))
.client_disconnect_timeout(Duration::from_secs(10))

// Connection pool size
Pool::with_config(conn_config, pool_options)

// Enable compression
HttpServer::new(|| {
    App::new()
        .wrap(middleware::Compress::default())
})

// Keep-alive
.keep_alive(Duration::from_secs(30))
```

### MySQL

```sql
-- Connection pool
SET max_connections = 1000;

-- Query optimization
CREATE INDEX idx_items_created ON items(created_at);

-- Buffer pool
SET innodb_buffer_pool_size = 4G;

-- Log slow queries
SET long_query_time = 2;
```

---

## Recomendación Final

```
Desarrollo/Testing:  VPS + Docker Compose
Startup/MVP:         AWS ECS (simple)
Producción escalada: Kubernetes (GKE/EKS)
Enterprise:          Multi-region Kubernetes
```

---

**Documento**: Production Deployment
**Versión**: 1.0
**Status**: Guía de referencia ✅
