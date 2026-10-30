@echo off
setlocal EnableExtensions
cd /d "%~dp0"
chcp 65001 >nul

echo =========================================================
echo   StudyFlow CLEAN v14.0.1 - VERIFY AND REVIEW PUBLISH
echo =========================================================
echo.
where node.exe >nul 2>nul
if errorlevel 1 goto :node_missing
node.exe tools\one-click-release.cjs
set "RESULT=%ERRORLEVEL%"
echo.
if "%RESULT%"=="0" (
  echo Completed. Read the result above.
) else (
  echo Stopped safely. Do not copy old patch scripts into this folder.
)
pause
exit /b %RESULT%
:node_missing
echo Node.js is not installed or not on PATH.
pause
exit /b 1
