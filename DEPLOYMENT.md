# Padel API - GitHub Actions Deployment

## 📋 Project Overview
This is a Flask-based Padel court reservation API with automated deployment using GitHub Actions.

## 🔄 Deployment Workflow

### Workflow File: `.github/workflows/deploy.yml`
This workflow automatically runs on:
- Push to `main` branch
- Pull requests to `main` branch
- Manual trigger from GitHub UI

### Steps Performed:
1. **Checkout code** - Gets latest code from repository
2. **Set up Python 3.11** - Configures environment
3. **Install dependencies** - Installs packages from requirements.txt
4. **Verify application** - Checks if Flask app can be imported
5. **Build Docker image** - Creates container from Dockerfile
6. **Test Docker container** - Runs container and checks health
7. **Success report** - Outputs completion message

## 🐳 Docker Configuration
- **Base image**: Python 3.11-slim
- **Port**: 5000
- **Database**: SQLite at `/app/padel.db`

## ✅ Success Criteria
- All GitHub Actions steps show green checkmarks
- Docker image builds without errors
- Container starts and runs successfully
- No critical errors in workflow logs

## 📸 Screenshots for Verification
1. GitHub Actions tab showing workflow run
2. All steps with green checkmarks
3. Docker build success message
4. Container test completion

## 🚀 How to Deploy
1. Make changes to code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main