# Task Board Application (Docker & CI/CD Sandbox)

Welcome! This repository contains a complete, dockerized **Task Board (Kanban Board) Application** consisting of:
- **Backend**: Java Spring Boot 3/4 + Spring Data JPA (Java 21) exposing a RESTful CRUD API.
- **Frontend**: React + Vite + TypeScript, styled with custom Vanilla CSS featuring a glassmorphism theme and native HTML5 drag-and-drop.
- **Database**: MySQL 8.0, preconfigured with automatic mock data initialization.
- **CI/CD & Docker**: Fully working `Dockerfile` configurations, a `docker-compose.yml` coordinator, and a GitHub Actions workflow (`deploy.yml`).

This project is specifically designed to run out-of-the-box and serve as a sandbox for practicing **Docker**, **Docker Compose**, **CI/CD**, and **Ubuntu Virtual Machine (VM) deployment**.

---

## Project Structure

```text
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions CI/CD template for Ubuntu VM
├── db/
│   └── init.sql            # MySQL schema & dummy tasks (auto-imports in docker)
├── frontend/
│   ├── src/
│   │   ├── App.tsx         # React state, drag-and-drop actions, API integration
│   │   ├── index.css       # Custom dark-theme glassmorphism styling
│   │   └── main.tsx        # React mounting script
│   ├── Dockerfile          # Multi-stage production Nginx frontend Dockerfile
│   ├── nginx.conf          # Nginx routing configuration (routes /api/ to backend)
│   ├── vite.config.ts      # Vite dev configuration (proxies /api/ to port 8080)
│   └── package.json        # Frontend dependencies
├── src/main/               # Spring Boot Backend code
├── Dockerfile              # Multi-stage JRE runtime backend Dockerfile
├── docker-compose.yml      # Service coordinator (MySQL + Spring Boot + React/Nginx)
├── pom.xml                 # Maven POM configuration (Java 21, Spring Boot)
└── README.md               # Setup and practice instructions
```

---

## 1. Running Locally (Without Docker)

You can run each component in your IDE/local system to modify code and see instant updates (Hot Module Replacement for React, standard Spring DevTools reload for backend).

### Prerequisites
- **Java JDK 21** installed.
- **Node.js** (v20+) installed.
- **MySQL Server** running on port 3306 (create database `taskdb` and set user/password to `root`/`root`, or update `src/main/resources/application.properties` to match your local credentials).
- *Optional*: Run the SQL statements inside `db/init.sql` manually on your database to import the initial mock data.

### Run Backend
At the project root directory:
```bash
./mvnw spring-boot:run
```
Or run `DemoApplication.java` directly inside your IDE (IntelliJ IDEA, VS Code, Eclipse, etc.). The API will run on `http://localhost:8080`.

### Run Frontend
Navigate to the `frontend` folder:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
*Note: Any request to `/api/*` will automatically be proxied to `http://localhost:8080/api/*` via the Vite proxy configuration in `vite.config.ts`.*

---

## 2. Running Locally with Docker Compose

Running with Docker Compose simulates a complete deployment on your local computer. It is the best way to verify that your Dockerfiles and networking configurations are correct before deploying to a VM.

Ensure you have **Docker Desktop** (or Docker Engine) installed and running.

At the project root directory:
```bash
# Build and start all services in the background (-d)
docker compose up --build -d
```

### What happens?
1. **db**: Spins up a MySQL container, loads the `db/init.sql` schema and initial tasks, and exposes port `3306`.
2. **backend**: Compiles the Spring Boot application using a Maven base image, packages the jar, runs it using a lightweight JRE image, and connects to the MySQL container using Docker inner dns hostname `db`.
3. **frontend**: Installs npm dependencies, builds Vite static files, packs them inside an Nginx image, and listens on port `80`. Nginx handles routing static files and proxies `/api/*` requests to the `backend` container on port `8080`.

Open your browser and visit: `http://localhost`.

### Useful Docker Compose commands:
```bash
# Check status of running containers
docker compose ps

# View real-time logs of all containers
docker compose logs -f

# View logs for a specific container
docker compose logs -f backend

# Stop and remove all containers, keeping database volumes
docker compose down

# Stop and remove all containers AND delete the MySQL volumes (resets database)
docker compose down -v
```

---

## 3. Deploying to an Ubuntu Virtual Machine (VM)

This section explains how to run this application on an Ubuntu virtual machine (either locally on VirtualBox or on a cloud provider like AWS EC2, Google Cloud, Azure, DigitalOcean, etc.).

### Step 3.1: Install Docker on your Ubuntu VM
Log into your Ubuntu VM via SSH:
```bash
ssh username@your_vm_ip
```
Run the following commands to install Docker and Docker Compose on Ubuntu:
```bash
# Update package database
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release

# Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the stable repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

### Step 3.2: Allow running Docker without sudo (Optional but Recommended)
To run docker commands without typing `sudo` every time:
```bash
sudo usermod -aG docker $USER
# Log out and log back in for changes to take effect
exit
```

### Step 3.3: Manual Deployment on VM
If you want to manually run the app on your VM before testing CI/CD:
1. Clone this repository to your VM:
   ```bash
   git clone <your-repo-url> task-board-app
   cd task-board-app
   ```
2. Build and start services:
   ```bash
   docker compose up --build -d
   ```
3. Open your browser and navigate to your Virtual Machine's IP address (e.g., `http://your_vm_ip`). Make sure port `80` is open in your VM's security group/firewall settings.

---

## 4. Practicing CI/CD with GitHub Actions

A sample CI/CD file is provided in `.github/workflows/deploy.yml`. When you push code changes to the `main` branch, GitHub Actions will automatically compile the code and execute the deployment commands on your Ubuntu VM.

### How to set it up:
1. Create a GitHub repository and push this project to it.
2. Generate an SSH Keypair for deployment:
   ```bash
   ssh-keygen -t rsa -b 4096 -f id_rsa_deploy -N ""
   ```
3. Copy the contents of the public key (`id_rsa_deploy.pub`) and add it to the `authorized_keys` on your Ubuntu VM:
   ```bash
   cat id_rsa_deploy.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Navigate to your GitHub repository on github.com.
5. Go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret** and add the following secret values:
   - `VM_IP`: The public IP address of your Ubuntu VM.
   - `VM_USERNAME`: The SSH login username (e.g., `ubuntu` or `root`).
   - `SSH_PRIVATE_KEY`: Paste the entire content of the private key (`id_rsa_deploy` file).
6. When you push to the `main` branch, GitHub Actions will trigger, run Maven build, run npm build, connect to your VM via SSH, pull the latest code, and execute `docker compose up --build -d`.
