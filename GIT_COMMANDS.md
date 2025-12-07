# 🚀 Git Commands Quick Reference

Essential Git commands for managing your AL-baz Delivery project.

---

## 📋 **Initial Setup (One-Time)**

```powershell
# Navigate to project directory
cd e:\nn\albazdelivery

# Initialize Git repository
git init

# Configure your identity
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Add all files
git add .

# Create first commit
git commit -m "🎉 Initial commit: AL-baz Delivery Platform"

# Add GitHub as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/albazdelivery.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔄 **Daily Workflow**

### **Check Status**
```powershell
# See what files changed
git status

# See differences
git diff
```

### **Stage Changes**
```powershell
# Add all changes
git add .

# Add specific file
git add app/api/orders/route.ts

# Add multiple files
git add app/api/*.ts
```

### **Commit Changes**
```powershell
# Commit with message
git commit -m "✨ Add new feature"

# Commit with detailed message
git commit -m "✨ Add customer reviews feature

- Add review form component
- Create review API endpoint
- Update customer page
- Add rating stars display"
```

### **Push to GitHub**
```powershell
# Push to main branch
git push

# Push specific branch
git push origin feature-branch
```

### **Pull Latest Changes**
```powershell
# Get latest from GitHub
git pull

# Or with rebase
git pull --rebase
```

---

## 🌿 **Branch Management**

### **Create Branch**
```powershell
# Create and switch to new branch
git checkout -b feature/customer-reviews

# Or in two steps
git branch feature/customer-reviews
git checkout feature/customer-reviews
```

### **List Branches**
```powershell
# Show all local branches
git branch

# Show all branches (including remote)
git branch -a
```

### **Switch Branches**
```powershell
# Switch to existing branch
git checkout main

# Or using new command
git switch main
```

### **Merge Branches**
```powershell
# Switch to main
git checkout main

# Merge feature branch
git merge feature/customer-reviews

# Push merged changes
git push
```

### **Delete Branch**
```powershell
# Delete local branch
git branch -d feature/customer-reviews

# Force delete
git branch -D feature/customer-reviews

# Delete remote branch
git push origin --delete feature/customer-reviews
```

---

## 📝 **Commit Message Guidelines**

### **Format**
```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types**
- ✨ `feat`: New feature
- 🐛 `fix`: Bug fix
- 📝 `docs`: Documentation
- 💄 `style`: Formatting, styling
- ♻️ `refactor`: Code restructuring
- ⚡ `perf`: Performance improvement
- ✅ `test`: Adding tests
- 🔧 `chore`: Maintenance
- 🚀 `deploy`: Deployment

### **Examples**
```powershell
# Simple
git commit -m "✨ Add chat feature"

# With scope
git commit -m "fix(api): Fix order status update"

# Detailed
git commit -m "✨ feat(auth): Add two-factor authentication

- Add OTP generation
- Implement SMS sending
- Create verification UI
- Update user schema

Closes #123"
```

---

## 🔍 **View History**

```powershell
# View commit history
git log

# Pretty format
git log --oneline --graph --all

# Last 10 commits
git log -10

# Search commits
git log --grep="payment"

# See what changed
git log -p

# Who changed what
git blame app/api/orders/route.ts
```

---

## ↩️ **Undo Changes**

### **Discard Uncommitted Changes**
```powershell
# Discard changes in specific file
git checkout -- app/api/orders/route.ts

# Discard all changes
git checkout -- .

# Or using restore
git restore app/api/orders/route.ts
```

### **Unstage Files**
```powershell
# Unstage specific file
git reset HEAD app/api/orders/route.ts

# Unstage all
git reset HEAD
```

### **Undo Last Commit (Keep Changes)**
```powershell
git reset --soft HEAD~1
```

### **Undo Last Commit (Discard Changes)**
```powershell
git reset --hard HEAD~1
```

### **Revert Commit (Create New Commit)**
```powershell
# Safer option - creates new commit
git revert abc123

# Revert last commit
git revert HEAD
```

---

## 🔧 **Remote Management**

```powershell
# View remotes
git remote -v

# Add remote
git remote add origin https://github.com/user/repo.git

# Change remote URL
git remote set-url origin https://github.com/user/new-repo.git

# Remove remote
git remote remove origin

# Fetch from remote
git fetch origin

# Pull from remote
git pull origin main
```

---

## 🚨 **Emergency Commands**

### **Accidentally Committed Sensitive Data**
```powershell
# Remove file from Git but keep locally
git rm --cached .env

# Add to .gitignore
echo ".env" >> .gitignore

# Commit removal
git commit -m "🔒 Remove sensitive file"

# Push
git push

# CRITICAL: Rotate all exposed secrets!
```

### **Need to Reset Everything**
```powershell
# WARNING: This discards ALL local changes
git reset --hard origin/main

# Pull latest
git pull
```

### **Merge Conflict**
```powershell
# 1. Open conflicting files
# 2. Look for <<<<<<< HEAD markers
# 3. Edit to resolve
# 4. Remove conflict markers
# 5. Add resolved files
git add .

# 6. Complete merge
git commit -m "🔀 Resolve merge conflicts"
```

---

## 🏷️ **Tags & Releases**

```powershell
# Create tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tags
git push --tags

# List tags
git tag

# Delete tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

---

## 🔍 **Search & Find**

```powershell
# Find in commit history
git log --all --grep="payment"

# Find in code
git grep "TODO"

# Find in specific files
git grep "TODO" -- "*.ts"

# Show who changed each line
git blame app/api/orders/route.ts

# Search commit content
git log -S"payment gateway"
```

---

## 📊 **Statistics**

```powershell
# Lines of code by author
git ls-files | xargs wc -l

# Commit count by author
git shortlog -sn

# Files changed in last commit
git show --name-only

# Repository size
git count-objects -vH
```

---

## 🛠️ **Advanced**

### **Stash Changes**
```powershell
# Save work temporarily
git stash

# Save with message
git stash save "Work in progress on reviews"

# List stashes
git stash list

# Apply stash
git stash apply

# Apply and remove stash
git stash pop

# Clear all stashes
git stash clear
```

### **Cherry Pick**
```powershell
# Apply specific commit to current branch
git cherry-pick abc123
```

### **Rebase**
```powershell
# Rebase current branch onto main
git rebase main

# Interactive rebase (edit last 3 commits)
git rebase -i HEAD~3
```

### **Clean Untracked Files**
```powershell
# Show what would be deleted
git clean -n

# Delete untracked files
git clean -f

# Delete directories too
git clean -fd
```

---

## 📚 **GitHub Specific**

### **Clone Repository**
```powershell
# Clone via HTTPS
git clone https://github.com/user/repo.git

# Clone specific branch
git clone -b branch-name https://github.com/user/repo.git
```

### **Fork Workflow**
```powershell
# Add upstream remote
git remote add upstream https://github.com/original/repo.git

# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main
git push
```

### **Pull Requests**
```powershell
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "✨ Add new feature"

# Push branch
git push -u origin feature/new-feature

# Then create PR on GitHub website
```

---

## 🎯 **Best Practices**

1. **Commit Often**: Small, focused commits
2. **Write Good Messages**: Clear, descriptive commit messages
3. **Pull Before Push**: Always pull latest before pushing
4. **Use Branches**: Don't commit directly to main
5. **Review Changes**: Use `git diff` before committing
6. **Never Force Push**: Unless you're absolutely sure
7. **Keep `.gitignore` Updated**: Protect sensitive files
8. **Tag Releases**: Use semantic versioning (v1.0.0)

---

## 🚀 **Quick Commands Reference**

```powershell
# Daily workflow
git status                    # Check status
git add .                     # Stage all
git commit -m "message"       # Commit
git push                      # Push to GitHub
git pull                      # Pull from GitHub

# Branch work
git checkout -b new-branch    # Create branch
git checkout main             # Switch to main
git merge feature-branch      # Merge branch
git branch -d feature-branch  # Delete branch

# Undo
git reset --soft HEAD~1       # Undo commit, keep changes
git checkout -- file.ts       # Discard changes in file
git reset HEAD file.ts        # Unstage file

# Remote
git remote -v                 # Show remotes
git fetch origin              # Fetch updates
git log --oneline             # View history
```

---

## 🆘 **Get Help**

```powershell
# Help for any command
git help
git help commit
git help branch

# Quick help
git commit --help
git branch --help
```

---

## 📱 **GUI Tools**

If you prefer visual interfaces:

1. **GitHub Desktop**: https://desktop.github.com
2. **GitKraken**: https://www.gitkraken.com
3. **SourceTree**: https://www.sourcetreeapp.com
4. **VS Code Built-in**: Source Control panel

---

**Happy Coding!** 🚀

Keep this file for quick reference when working with Git!
