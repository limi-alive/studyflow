@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ======================================================
echo   StudyFlow - Mobile Dashboard Final Polish v12.2
echo ======================================================
echo.

if not exist package.json goto :wrongfolder
if not exist .git goto :wrongfolder
if not exist src\mobile-final-v12.css goto :missing
if not exist src\components\DashboardRewardCard.tsx goto :missing
if not exist apply-latest.cjs goto :missing
if not exist .github\workflows goto :missing

for %%F in (APPLY_*.cmd) do (
  if /I not "%%~nxF"=="APPLY_LATEST.cmd" del /q "%%F" >nul 2>nul
)

echo [1/10] Wiring final phone layout and cloud build settings...
node apply-latest.cjs
if errorlevel 1 goto :fail

echo [2/10] Installing dependencies...
call npm.cmd install
if errorlevel 1 goto :fail

echo [3/10] Linting...
call npm.cmd run lint
if errorlevel 1 goto :fail

echo [4/10] Type checking...
call npm.cmd run typecheck
if errorlevel 1 goto :fail

echo [5/10] Running tests...
call npm.cmd run test
if errorlevel 1 goto :fail

echo [6/10] Building production PWA...
call npm.cmd run build
if errorlevel 1 goto :fail

echo [7/10] Verifying production output...
if not exist dist goto :nodist
powershell -NoProfile -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path 'dist' -Recurse -File -ErrorAction SilentlyContinue; if(-not $files){exit 1}; Write-Host ('Production files: ' + $files.Count)"
if errorlevel 1 goto :fail

echo [8/10] Checking reward copy is English...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$targets = @('src/components/SidebarRewardCard.tsx','src/components/ProgressHub.tsx','src/components/DashboardRewardCard.tsx'); $bad = Select-String -Path $targets -Pattern 'تومان' -SimpleMatch -ErrorAction SilentlyContinue; if($bad){$bad; exit 1}; Write-Host 'Reward copy check passed.'"
if errorlevel 1 goto :fail

echo [9/10] Committing mobile dashboard polish...
git add src\main.tsx src\mobile-final-v12.css src\components\AppShell.tsx src\components\DashboardRewardCard.tsx src\components\SidebarRewardCard.tsx src\components\ProgressHub.tsx src\hooks\useMonthlyReward.ts .github\workflows MOBILE_QA_V12_2.md apply-latest.cjs APPLY_LATEST.cmd
if errorlevel 1 goto :fail

git diff --cached --quiet
if not errorlevel 1 (
  echo No new changes to commit.
) else (
  git commit -m "Polish phone layout and move reward to dashboard"
  if errorlevel 1 goto :fail
)

echo [10/10] Pushing to GitHub...
git push
if errorlevel 1 goto :fail

echo.
echo SUCCESS: v12.2 passed lint, typecheck, tests and production build.
echo Wait for GitHub Actions to turn green, then refresh StudyFlow on your phone.
echo The monthly reward is now English and appears at the top of the mobile Dashboard.
echo.
pause
exit /b 0

:wrongfolder
echo ERROR: Extract this ZIP directly into the StudyFlow repository root.
echo Expected: C:\Users\PC-Kosar\Downloads\studyflow\studyflow
pause
exit /b 1

:missing
echo ERROR: One or more v12.2 patch files are missing.
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
