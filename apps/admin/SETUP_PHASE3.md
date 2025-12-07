# Phase 3 Setup Instructions

## Quick Fix: Get Changes Working

The Phase 3 changes are all in place, but you need to:

### 1. Install Dependencies
```bash
cd apps/admin
npm install
```

This will install `recharts` which is required for the charts.

### 2. Restart Dev Server
Stop the current dev server (Ctrl+C) and restart:
```bash
npm run dev
```

### 3. Clear Next.js Cache (if needed)
If you still don't see changes:
```bash
rm -rf .next
npm run dev
```

## What Was Added

### New API Endpoints:
- ✅ `/api/admin/analytics` - Analytics data
- ✅ `/api/admin/export` - Export functionality

### New Components:
- ✅ `AnalyticsDashboard.tsx` - Full analytics dashboard with charts

### Modified Files:
- ✅ `app/admin/page.tsx` - Added AnalyticsDashboard
- ✅ `components/AuditLogView.tsx` - Added export button
- ✅ `package.json` - Added recharts dependency

## Verification

After installing and restarting:
1. Go to admin panel: http://localhost:3003/admin
2. Click "Tableau de Bord" tab
3. Scroll down - you should see the Analytics Dashboard with charts
4. Try the export button in Analytics Dashboard
5. Try the export button in Audit Logs tab

## If Still Not Working

Check browser console for errors. Common issues:
- Missing recharts: Run `npm install` in `apps/admin`
- Import errors: Check that `@/root/components/ui/chart` path is correct
- Build errors: Clear `.next` folder and rebuild

