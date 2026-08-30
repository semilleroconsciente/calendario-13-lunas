@echo off
cd /d "%~dp0"
start "" http://localhost:8137
node server.js
