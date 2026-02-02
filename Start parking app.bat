@echo off
title Q8 Parking - Lokale server
cd /d "%~dp0"
echo.
echo  Q8 Parking wordt gestart...
echo  Wacht tot je "Local:" ziet, open dan in je browser:  http://localhost:3000
echo.
npx serve public
pause
