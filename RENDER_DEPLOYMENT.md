# Akshar Marbles — Render Deployment Guide (Docker & External MySQL)

This guide provides step-by-step instructions to deploy the **Akshar Marbles** e-commerce web application onto **Render's free Web Service plan** using Docker, Java 17, Apache Tomcat 10.1, and an external cloud MySQL database.

---

## 1. Important Architecture & Hosting Realities

### Render Free Web Service
- **Platform**: Render provides a free Web Service tier (0.1 CPU, 512 MB RAM, spins down after 15 minutes of inactivity).
- **Health Check**: Render requires a container liveness endpoint. The application provides `GET /api/health`, which responds with HTTP 200 immediately without executing database queries or initializing Hibernate.

### Database Hosting Reality
- **Render does NOT provide a free MySQL database.**
- An external MySQL or MySQL-compatible database must be provisioned separately.
- **Do not rely on obsolete "free for life" claims**: Cloud providers regularly revise their free tiers (for example, Aiven no longer offers a free MySQL plan to new sign-ups). Always check current provider terms.

### Recommended External Database Options

#### A. Native MySQL Providers
| Provider | Current Tier Details | Notes |
| :--- | :--- | :--- |
| **Clever Cloud** ([clever-cloud.com](https://www.clever-cloud.com/)) | Free shared MySQL add-on (up to 25 MB) | Native MySQL 8.0, assigns database name and user automatically. Ideal for this catalog schema. |
| **Railway** ([railway.app](https://railway.app/)) | $5 free trial credits | Instant 1-click native MySQL 8.0 container. |
| **AWS RDS Free Tier** ([aws.amazon.com/rds/free/](https://aws.amazon.com/rds/free/)) | 12 months free for new AWS accounts (db.t3.micro, 20 GB) | Production-grade native MySQL 8.0. |
| **Self-Hosted / VPS** (e.g. DigitalOcean, Hetzner, Linode) | Standard VPS starting at $4–$5/mo | Full control over native MySQL 8.0 or MariaDB. |

#### B. MySQL-Compatible Alternatives
| Provider | Current Tier Details | Notes |
| :--- | :--- | :--- |
| **TiDB Cloud Serverless** ([pingcap.com/tidb-cloud/](https://www.pingcap.com/tidb-cloud/)) | Free Starter cluster (5 GB storage) | Wire-compatible with MySQL 8.0 protocol. *Note*: Distributed SQL engines have slight behavioral differences with specific DDL locks or foreign key constraints; test with `schema_safe_import.sql` before deploying. |

---

## 2. Required Local Software

Ensure you have the following installed:
- **Git**: [git-scm.com](https://git-scm.com/)
- **Java Development Kit (JDK 17)**: Eclipse Temurin or Oracle JDK 17
- **Apache Maven (3.9+)**
- **MySQL Client CLI** (`mysql`) for importing the schema to your remote database

---

## 3. Safe Database Import Procedure

Cloud database providers often:
1. Assign a random database name (e.g. `bxyz1234_db`).
2. Do **not** grant `CREATE DATABASE` privileges.
3. Forbid dropping system tables.

To accommodate this safely without overwriting any existing databases, use the dedicated safe import script:
[schema_safe_import.sql](schema_safe_import.sql).

### Key Features of `schema_safe_import.sql`:
- **No `CREATE DATABASE` / `USE` statements**: Executes directly against your provider's assigned database.
- **Non-destructive (`CREATE TABLE IF NOT EXISTS`)**: Never drops existing tables.
- **Idempotent (`INSERT IGNORE INTO`)**: Can be safely re-run without throwing duplicate key errors.
- **Preserves all 22 tables and showroom seed data** (categories, products, specs, images, prices, ratings).

### Safe Import Command:
Connect to your remote database and import:
```bash
mysql -h <HOST> -P <PORT> -u <USER> -p <ASSIGNED_DATABASE_NAME> < schema_safe_import.sql
```

#### Example with Clever Cloud / Remote Host:
```bash
mysql -h bxyz123.clever-cloud.com -P 3306 -u u987654 -p bxyz1234_db < schema_safe_import.sql
```

Verify that the tables exist:
```sql
SHOW TABLES;
SELECT product_code, product_name, stock_status FROM products;
```

---

## 4. Local Build & WAR Verification

Before committing, verify that the Maven WAR plugin packages all components:
```bash
mvn clean package -DskipTests
```

Verify the generated WAR:
1. `target/ROOT.war` exists.
2. `WEB-INF/web.xml` exists inside the WAR.
3. Root HTML (`home.html`, `browse.html`, `product.html`, etc.), CSS, JS, and `assets/` are present.

You can inspect the contents using:
```bash
jar -tf target/ROOT.war | grep "WEB-INF/web.xml"
```

---

## 5. Uploading the Project to GitHub

1. Initialize git and commit your files (`application.properties` and secrets are in `.gitignore`):
```bash
git init
git add .
git commit -m "Configure Akshar Marbles for Render Docker deployment"
```
2. Create a repository on [GitHub](https://github.com/new) (e.g. `akshar-marbles`).
3. Push your repository:
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/akshar-marbles.git
git branch -M main
git push -u origin main
```

---

## 6. Configuring Render Web Service

1. Log in to [Render](https://render.com/).
2. Click **New +** $\rightarrow$ **Web Service**.
3. Connect your GitHub repository (`akshar-marbles`).
4. Configure the settings:
   - **Name**: `akshar-marbles`
   - **Region**: Any (choose the region closest to your external database host)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`
   - **Health Check Path**: `/api/health`

---

## 7. Configuring Environment Variables

In your Render service dashboard under the **Environment** tab, configure the following variables:

| Variable Name | Recommended Value | Purpose |
| :--- | :--- | :--- |
| `DB_URL` | `jdbc:mysql://<HOST>:<PORT>/<DATABASE>?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Kolkata&useSSL=true&allowPublicKeyRetrieval=true` | JDBC connection URL with SSL enabled |
| `DB_USERNAME` | `<YOUR_DATABASE_USERNAME>` | Remote database user |
| `DB_PASSWORD` | `<YOUR_DATABASE_PASSWORD>` | Remote database password |
| `APP_ENVIRONMENT` | `production` | Enforces `Secure` session cookies over HTTPS |
| `HIKARI_MAXIMUMPOOLSIZE` | `5` | Prevents JVM memory exhaustion on 512 MB RAM |
| `HIBERNATE_HBM2DDL_AUTO` | `validate` | Validates entity mappings against database |
| `HIBERNATE_DIALECT` | `auto` | Auto-detects `MySQLDialect` vs `MariaDBDialect` |

> [!IMPORTANT]
> Always prefer separate `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` variables. If your provider supplies a combined URI (`mysql://user:pass@host:port/db`), `AppConfig` will decode it, but credentials with special characters are safest when defined as separate variables.

---

## 8. Health Checks Explained

- **Container Liveness Probe (`GET /api/health`)**:
  - Used by Render to verify container responsiveness.
  - Returns HTTP 200 immediately (`{"status":"UP","service":"Akshar Marbles Backend API"}`).
  - **Does NOT** call the database or initialize Hibernate, preventing premature container restarts during database cold starts.
- **Database Readiness Probe (`GET /api/health?probe=readiness`)**:
  - Tests live database connectivity using a direct lightweight JDBC ping (`SELECT 1`).
  - Catches connection failures safely without triggering or relying on Hibernate's static initializer.
  - Returns HTTP 200 when connected, or HTTP 503 (`{"status":"DEGRADED","database":"UNAVAILABLE"}`) when disconnected.
  - Never leaks credentials or stack traces.

---

## 9. Verification & Live Testing

Once Render shows **Live**:
1. **Liveness**: `https://<YOUR-APP>.onrender.com/api/health` $\rightarrow$ returns HTTP 200.
2. **Readiness**: `https://<YOUR-APP>.onrender.com/api/health?probe=readiness` $\rightarrow$ returns `"database":"CONNECTED"`.
3. **Categories API**: `https://<YOUR-APP>.onrender.com/api/categories` $\rightarrow$ returns categories with product counts.
4. **Products API**: `https://<YOUR-APP>.onrender.com/api/products` $\rightarrow$ returns paginated products.
5. **Storefront**: `https://<YOUR-APP>.onrender.com/home.html` and `browse.html` $\rightarrow$ loads showroom with live database records.

---

## 10. Troubleshooting Common Issues

### Issue 1: Container OOM-Killed (Exit Code 137)
- **Cause**: Render's free tier has a hard 512 MB memory limit.
- **Solution**: The Dockerfile bounds JVM heap to `-Xms128m -Xmx300m -XX:+UseG1GC` and sets connection pool size to 5. Never increase heap beyond 320m on the free plan.

### Issue 2: SSL Handshake or Connection Failure
- **Cause**: Remote MySQL requires SSL.
- **Solution**: Ensure your `DB_URL` contains `useSSL=true&allowPublicKeyRetrieval=true`.

### Issue 3: Schema Validation Error on Startup
- **Cause**: Tables or columns missing in the remote database.
- **Solution**: Re-run [schema_safe_import.sql](schema_safe_import.sql) against your remote database.
