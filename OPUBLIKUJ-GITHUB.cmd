@echo off
chcp 65001 >nul
title Samolociarze - publikacja na GitHub Pages
set "SAMOLOCIARZE_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SAMOLOCIARZE_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%SAMOLOCIARZE_NODE%" "%~dp0tools\login-github.cjs"
if errorlevel 1 (
  echo.
  echo Publikacja nie zostala zakonczona. Sprawdz komunikat powyzej.
)
echo.
pause
