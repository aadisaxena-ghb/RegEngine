@echo off
title RegEngine Campus Portal Server
echo ========================================================
echo   RegEngine - Pure Java Academic & Registration Engine
echo ========================================================
echo.
echo Starting local server on http://localhost:8080/ ...
echo.
cd /d "%~dp0scholaris\backend"
java -cp out com.campus.Main 8080
pause
