@echo off
echo Starting Terminal Server...
start "Terminal Server" cmd /k "npm run terminal-server"

echo Starting Note Taking App...
start "Note Taking App" cmd /k "npm run dev"

echo Both services have been started in new windows.
