
---

# 🤖 WiChat · ES4C

<p>
  <img src="webapp/src/assets/images/WIChat.png" width="300" alt="WiChat Logo">
</p>

[![Actions Status](https://github.com/arquisoft/wichat_es4c/workflows/CI%20for%20wichat_es4c/badge.svg)](https://github.com/arquisoft/wichat_es4c/actions)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es4c&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es4c)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_wichat_es4c&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_wichat_es4c)
[![CodeScene Average Code Health](https://codescene.io/projects/65544/status-badges/average-code-health)](https://codescene.io/projects/65544)
[![CodeScene System Mastery](https://codescene.io/projects/65544/status-badges/system-mastery)](https://codescene.io/projects/65544)

<p float="left">
  <img src="https://blog.wildix.com/wp-content/uploads/2020/06/react-logo.jpg" height="100">
  <img src="https://miro.medium.com/max/365/1*Jr3NFSKTfQWRUyjblBSKeg.png" height="100">
</p>

---

## 📌 Project Description

**WiChat** is a project developed for the Software Architecture course (2024/2025). It is a distributed system composed of several services working together to build a question game application.

---

## 👥 Development Team

Meet the amazing team behind WiChat:


- **Adrián Mahía**     
- **Andrés Carballo**  
- **Bruno Pérez**
- **Miguel Gutiérrez**

---

### 🧩 Microservices

- **User Service**: Manages user creation and storage.
- **Auth Service**: Handles user authentication.
- **LLM Service**: Interfaces with a Large Language Model.
- **Gateway Service**: Acts as a public proxy for the other services.
- **Question Service**: Gathers information from Wikidata and generates questions.
- **Webapp**: A React frontend that interacts with the backend via the gateway.

The user and auth services share a MongoDB instance accessed via Mongoose.

---

## 🚀 Quick Start Guide

### Clone the repository

```bash
git clone git@github.com:arquisoft/wichat_es4c.git
```

### 🔐 LLM API Key Configuration

In order to use the LLM integrations (Gemini and Empaphy), you must provide a valid API key in two `.env` files:

- In the `webapp/` directory (for `npm start`):
```env
REACT_APP_LLM_API_KEY="YOUR-API-KEY"
```

- In the project root (for Docker Compose):
```env
LLM_API_KEY="YOUR-API-KEY"
```

> **Note:** These files are ignored by Git and should **not** be committed. When deploying, the key must be added as a repository secret (`LLM_API_KEY`) to be used in GitHub Actions.

---

### 🐳 Launching with Docker

```bash
docker compose --profile dev up --build
```

---

### 🧱 Launching Component by Component

Start the database:

```bash
docker run -d -p 27017:27017 --name=my-mongo mongo:latest
```

Or use services like MongoDB Atlas.

Then launch each service individually:

```bash
# Inside each service folder:
npm install
npm start
```

Finally, run the webapp the same way:

```bash
cd webapp
npm install
npm start
```

> The application will be available at `http://localhost:3000`.

---

## ☁️ Deployment

The application can be deployed using a virtual machine and GitHub Actions. The recommended setup includes:

- Ubuntu 20.04+ (preferably 24.04)
- Docker & Docker Compose
- Open ports: `3000` (webapp), `8000` (gateway)

You can set up Docker on your VM using:

```bash
sudo apt update
sudo apt install apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
sudo apt update
sudo apt install docker-ce
sudo usermod -aG docker ${USER}
```

---

## 🔄 Continuous Delivery (GitHub Actions)

A GitHub Actions workflow automatically deploys the app when a new release is published. It builds, tests, pushes images, and deploys via SSH.

Example of the deploy step:

```yml
- name: Deploy over SSH
  uses: fifsky/ssh-action@master
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    user: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_KEY }}
    command: |
      wget https://raw.githubusercontent.com/arquisoft/wichat_es4c/master/docker-compose.yml -O docker-compose.yml
      docker compose --profile prod down
      docker compose --profile prod up -d --pull always
```

Secrets required:
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`





