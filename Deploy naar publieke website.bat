@echo off
title Q8 Parking - Deploy naar publieke website
cd /d "%~dp0"
echo.
echo  De app wordt geupload naar de publieke website...
echo  Daar werkt de kaart vaak wel (API-sleutel staat daar toe).
echo.
firebase deploy --only hosting
echo.
pause
