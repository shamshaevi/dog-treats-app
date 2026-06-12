@echo off
echo ========================================
echo   Dog Treats Shop - Telegram Mini App
echo ========================================
echo.
echo [1/2] Запускаю HTTPS туннель (localtunnel)...
echo.

REM Запускаем localtunnel в фоне и получаем URL
start "Tunnel" cmd /c "npx localtunnel --port 3000"

echo Подожди 10 секунд, пока туннель запустится...
timeout /t 10 /nobreak >nul

echo.
echo [2/2] Запускаю бота и веб-сервер...
echo.
echo ВАЖНО: После запуска туннеля скопируй HTTPS URL из окна "Tunnel"
echo и вставь его в WEB_APP_URL в файле bot.js
echo.
echo Или задай через переменную окружения:
echo   set WEB_APP_URL=https://xxxx.loca.lt
echo   node bot.js
echo.

node bot.js
pause
