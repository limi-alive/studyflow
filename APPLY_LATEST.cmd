@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ===============================================
echo   StudyFlow - Mobile + Cloud Final Polish v12.1
echo ===============================================
echo.

if not exist package.json goto :wrongfolder
if not exist .git goto :wrongfolder
if not exist src\mobile-final-v12.css goto :missing
if not exist apply-latest.cjs goto :missing
if not exist .github\workflows goto :missing

for %%F in (APPLY_*.cmd) do (
  if /I not "%%~nxF"=="APPLY_LATEST.cmd" del /q "%%F" >nul 2>nul
)

echo [1/9] Wiring mobile polish and production Supabase secrets...
node apply-latest.cjs
if errorlevel 1 goto :fail

echo [2/9] Installing dependencies...
call npm.cmd install
if errorlevel 1 goto :fail

echo [3/9] Linting...
call npm.cmd run lint
if errorlevel 1 goto :fail

echo [4/9] Type checking...
call npm.cmd run typecheck
if errorlevel 1 goto :fail

echo [5/9] Running tests...
call npm.cmd run test
if errorlevel 1 goto :fail

echo [6/9] Building production PWA locally...
call npm.cmd run build
if errorlevel 1 goto :fail

echo [7/9] Verifying generated production bundle...
if not exist dist goto :nodist
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path 'dist' -Recurse -File -ErrorAction SilentlyContinue; if(-not $files){exit 1}; Write-Host ('Production files: ' + $files.Count)"
if errorlevel 1 goto :fail

echo [8/9] Committing final mobile and cloud configuration...
git add src\main.tsx src\mobile-final-v12.css .github\workflows MOBILE_QA_V12_1.md apply-latest.cjs APPLY_LATEST.cmd
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes to commit.
) else (
  git commit -m "Polish mobile UI and wire Supabase production env"
  if errorlevel 1 goto :fail
)

echo [9/9] Pushing to GitHub...
git push
if errorlevel 1 goto :fail

echo.
echo SUCCESS: v12.1 passed local checks and was pushed.
echo GitHub Actions will now rebuild the deployed app with the Supabase repository secrets.
echo Wait for Actions to turn green, then hard-refresh StudyFlow with Ctrl+F5.
echo The Cloud account warning should disappear and Create account should become active.
echo.
pause
exit /b 0

:wrongfolder
echo ERROR: Extract this ZIP directly into the StudyFlow repository root.
echo Expected: C:\Users\PC-Kosar\Downloads\studyflow\studyflow
pause
exit /b 1

:missing
echo ERROR: One or more v12.1 patch files or .github\workflows are missing.
echo Extract the ZIP again and choose Replace files in destination.
pause
exit /b 1

:nodist
echo ERROR: The build command finished but the dist folder was not created.
goto :fail

:fail
echo.
echo FAILED: A local check failed. Nothing after that failed step was pushed.
echo Send a screenshot of this window to ChatGPT.
pause
exit /b 1
