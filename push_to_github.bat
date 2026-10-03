@echo off
title CorridorX GitHub Sync
echo ========================================================
echo    CorridorX - Auto Push to GitHub
echo ========================================================
echo.

set GIT_PATH="C:\Users\shrey\AppData\Local\GitHubDesktop\app-3.6.6\resources\app\git\cmd\git.exe"

cd /d "C:\Users\shrey\.gemini\antigravity\scratch\corridorx"

echo [1/3] Adding all frontend and backend files...
%GIT_PATH% add .

echo [2/3] Committing changes...
%GIT_PATH% commit -m "Update: CorridorX frontend, backend & green corridor engine"

echo [3/3] Pushing to GitHub (origin/main)...
%GIT_PATH% push -u origin main

echo.
echo ========================================================
echo  Sync Complete! Check: https://github.com/ankitkharche120-source/CorridorX
echo ========================================================
pause
