@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ======================================================
echo   StudyFlow - Global League + Mobile Polish v13.4
echo ======================================================
echo.

if not exist package.json goto :wrongfolder
if not exist .git goto :wrongfolder
if not exist src\components\GlobalLeaderboardCard.tsx goto :missing
if not exist src\hooks\usePublicLeaderboard.ts goto :missing
if not exist src\mobile-v13-4.css goto :missing
if not exist supabase\migrations\007_public_leaderboard.sql goto :missing
if not exist verify-v13-4.cjs goto :missing

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

echo [6/9] Running v13.4 regression checks...
node verify-v13-4.cjs
if errorlevel 1 goto :fail

echo [7/9] Verifying production output...
if not exist dist goto :nodist
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files=Get-ChildItem -Path 'dist' -Recurse -File -ErrorAction SilentlyContinue; if(-not $files){exit 1}; Write-Host ('Production files: '+$files.Count)"
if errorlevel 1 goto :fail

echo [8/9] Committing v13.4...
git add src\components\GlobalLeaderboardCard.tsx src\components\AppShell.tsx src\components\AuthGate.tsx src\components\SyncBadge.tsx src\hooks\usePublicLeaderboard.ts src\lib\sync.ts src\main.tsx src\mobile-final-v12.css src\mobile-v13-4.css supabase\migrations\006_core_cloud_tables.sql supabase\migrations\007_public_leaderboard.sql MOBILE_QA_V13_4.md verify-v13-4.cjs APPLY_LATEST.cmd
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo No new v13.4 changes to commit.
) else (
  git commit -m "Add global leaderboard and refine mobile experience"
  if errorlevel 1 goto :fail
)

echo [9/9] Pushing to GitHub...
git push
if errorlevel 1 goto :fail

echo.
echo SUCCESS: StudyFlow v13.4 passed lint, typecheck, tests, build and regression checks, then pushed to GitHub.
echo.
echo IMPORTANT: Run supabase\migrations\007_public_leaderboard.sql once in Supabase SQL Editor.
echo Migration 006 is included in Git now for completeness; if you already ran it successfully, do NOT need to run it again.
echo.
pause
exit /b 0

:wrongfolder
echo ERROR: Extract this ZIP directly into the StudyFlow repository root.
echo Expected path: C:\Users\PC-Kosar\Downloads\studyflow\studyflow
pause
exit /b 1

:missing
echo ERROR: One or more v13.4 patch files are missing.
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
