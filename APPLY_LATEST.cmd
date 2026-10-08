@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ======================================================
echo   StudyFlow - Sync + Reward + Admin v13
echo ======================================================
echo.

if not exist package.json goto :wrongfolder
if not exist .git goto :wrongfolder
if not exist src\App.tsx goto :missing
if not exist src\pages\Admin.tsx goto :missing
if not exist src\utils\reward.ts goto :missing
if not exist src\utils\syncConflict.ts goto :missing
if not exist supabase\migrations\005_cross_device_admin.sql goto :missing

for %%F in (APPLY_*.cmd) do (
  if /I not "%%~nxF"=="APPLY_LATEST.cmd" del /q "%%F" >nul 2>nul
)

echo [1/9] Installing dependencies...
call npm.cmd install
if errorlevel 1 goto :fail

echo [2/9] Linting...
call npm.cmd run lint
if errorlevel 1 goto :fail

echo [3/9] Type checking...
call npm.cmd run typecheck
if errorlevel 1 goto :fail

echo [4/9] Running tests...
call npm.cmd run test
if errorlevel 1 goto :fail

echo [5/9] Building production PWA...
call npm.cmd run build
if errorlevel 1 goto :fail

echo [6/9] Verifying v13 production files...
if not exist dist goto :nodist
powershell -NoProfile -ExecutionPolicy Bypass -Command "$needed=@('src/pages/Admin.tsx','src/utils/reward.ts','src/utils/syncConflict.ts','src/lib/sync.ts','supabase/migrations/005_cross_device_admin.sql'); foreach($f in $needed){if(-not (Test-Path $f)){Write-Host ('Missing: '+$f); exit 1}}; $files=Get-ChildItem -Path 'dist' -Recurse -File -ErrorAction SilentlyContinue; if(-not $files){exit 1}; Write-Host ('Production files: '+$files.Count); Write-Host 'v13 file check passed.'"
if errorlevel 1 goto :fail

echo [7/9] Staging v13...
git add src supabase\migrations\005_cross_device_admin.sql ADMIN_SETUP_V13.md FEATURES_V13.md SYNC_QA_V13.md PHONE_INSTALL_V13.md APPLY_LATEST.cmd
if errorlevel 1 goto :fail

echo [8/9] Committing...
git diff --cached --quiet
if not errorlevel 1 (
  echo No new v13 changes to commit.
) else (
  git commit -m "Add cross-device sync rewards and admin dashboard"
  if errorlevel 1 goto :fail
)

echo [9/9] Pushing to GitHub...
git push
if errorlevel 1 goto :fail

echo.
echo SUCCESS: StudyFlow v13 passed lint, typecheck, tests and production build, then pushed to GitHub.
echo.
echo NEXT STEP: Run supabase\migrations\005_cross_device_admin.sql once in Supabase SQL Editor.
echo Then promote your own username to admin using the command in ADMIN_SETUP_V13.md.
echo.
pause
exit /b 0

:wrongfolder
echo ERROR: Extract this ZIP directly into the StudyFlow repository root.
echo Expected path: C:\Users\PC-Kosar\Downloads\studyflow\studyflow
pause
exit /b 1

:missing
echo ERROR: One or more v13 patch files are missing.
echo Extract the ZIP again and choose Replace files in destination.
pause
exit /b 1

:nodist
echo ERROR: Build finished but the dist folder was not created.
goto :fail

:fail
echo.
echo FAILED: A validation or Git step failed. Nothing after the failed step was pushed.
echo Send a screenshot of this window to ChatGPT.
pause
exit /b 1
