# PowerShell Commands for Admin App

## Common Commands

### Clear Next.js Cache
```powershell
# PowerShell (Windows)
Remove-Item -Recurse -Force .next

# Or if .next doesn't exist, it's fine
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

### Install Dependencies
```powershell
cd apps\admin
npm install
```

### Start Dev Server
```powershell
cd apps\admin
npm run dev
```

### Check if Recharts is Installed
```powershell
npm list recharts
```

### Clear Cache and Restart
```powershell
cd apps\admin
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run dev
```

## Note
- `rm -rf` is a Unix/Linux command
- In PowerShell, use `Remove-Item -Recurse -Force` instead
- Or use `rmdir /s /q .next` (Windows CMD style)

