@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ======================================================
echo   StudyFlow - Phone Fit Final Polish v12.3
echo ======================================================
echo.

if not exist package.json goto :wrongfolder
if not exist .git goto :wrongfolder
if not exist src\mobile-final-v12.css goto :missing
if not exist src\components\DashboardRewardCard.tsx goto :missing
if not exist src\components\AppShell.tsx goto :missing
if not exist apply-latest.cjs goto :missing
if not exist verify-mobile-v12-3.cjs goto :missing
if not exist .github\workflows goto :missing

for %%F in (APPLY_*.cmd) do (
  if /I not "%%~nxF"=="APPLY_LATEST.cmd" del /q "%%F" >nul 2>nul
)

echo [1/11] Wiring phone layout and cloud build settings...
node apply-latest.cjs
if errorlevel 1 goto :fail

echo [2/11] Installing dependencies...
call npm.cmd install
if errorlevel 1 goto :fail

echo [3/11] Linting...
call npm.cmd run lint
if errorlevel 1 goto :fail

echo [4/11] Type checking...
call npm.cmd run typecheck
if errorlevel 1 goto :fail

echo [5/11] Running tests...
call npm.cmd run test
if errorlevel 1 goto :fail

echo [6/11] Building production PWA...
call npm.cmd run build
if errorlevel 1 goto :fail

echo [7/11] Verifying production output...
if not exist dist goto :nodist
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path 'dist' -Recurse -File -ErrorAction SilentlyContinue; if(-not $files){exit 1}; Write-Host ('Production files: ' + $files.Count)"
if errorlevel 1 goto :fail

echo [8/11] Running mobile regression checks...
node verify-mobile-v12-3.cjs
if errorlevel 1 goto :fail

echo [9/11] Checking reward copy is English...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$targets = @('src/components/SidebarRewardCard.tsx','src/components/ProgressHub.tsx','src/components/DashboardRewardCard.tsx'); $bad = Select-String -Path $targets -Pattern 'تومان' -SimpleMatch -ErrorAction SilentlyContinue; if($bad){$bad; exit 1}; Write-Host 'Reward copy check passed.'"
if errorlevel 1 goto :fail

echo [10/11] Committing final phone-fit polish...
git add src\main.tsx src\mobile-final-v12.css src\components\AppShell.tsx src\components\DashboardRewardCard.tsx src\components\SidebarRewardCard.tsx .github\workflows MOBILE_QA_V12_3.md apply-latest.cjs verify-mobile-v12-3.cjs APPLY_LATEST.cmd
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes to commit.
) else (
  git commit -m "Refine phone layout and mobile navigation"
  if errorlevel 1 goto :fail
)

echo [11/11] Pushing to GitHub...
git push
if errorlevel 1 goto :fail

echo.
echo SUCCESS: v12.3 passed lint, typecheck, tests, production build and mobile regression checks.
echo Wait for GitHub Actions to turn green, then fully close and reopen the StudyFlow PWA on your phone.
echo.
pause
exit /b 0

:wrongfolder
echo ERROR: Extract this ZIP directly into the StudyFlow repository root.
echo Expected: C:\Users\PC-Kosar\Downloads\studyflow\studyflow
pause
exit /b 1

:missing
echo ERROR: One or more v12.3 patch files are missing.
echo Extract the ZIP again and choose Replace files in destination.
pause
exit /b 1

:nodist
echo ERROR: Build finished but the dist folder was not created.
goto :fail

:fail
echo.
echo FAILED: A local validation step failed. Nothing after the failed step was pushed.
echo Send a screenshot of this window to ChatGPT.
pause
exit /b 1
