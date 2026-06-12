const TelegramBot = require('node-telegram-bot-api');
const { SocksProxyAgent } = require('socks-proxy-agent');

// ============================================
// КОНФИГУРАЦИЯ
// ============================================

const BOT_TOKEN = '8967965044:AAGrDpowX6YL6lEt2bqQvsi0LhZ5SOwuS3A';
const WEB_APP_URL = 'https://shamshaevi.github.io/dog-treats-app';

// SOCKS5 прокси для обхода блокировки Telegram API
// Бесплатные публичные прокси (если не работает — замени на свой)
const SOCKS_PROXIES = [
    'socks5://51.83.190.248:19050',
    'socks5://88.198.24.108:1080',
    'socks5://162.19.155.60:1080',
    'socks5://51.178.220.22:1080',
];

// ============================================
// ПОДКЛЮЧЕНИЕ
// ============================================

async function startBot() {
    // Пробуем подключиться напрямую
    console.log('[Bot] Проверяю прямое подключение к Telegram...');
    
    const https = require('https');
    const directWorks = await new Promise((resolve) => {
        const req = https.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(true));
        });
        req.on('error', () => resolve(false));
        req.setTimeout(8000, () => { req.destroy(); resolve(false); });
    });

    let botOptions = { polling: true };

    if (directWorks) {
        console.log('[Bot] Прямое подключение работает!\n');
    } else {
        console.log('[Bot] Прямое подключение не работает, пробую прокси...\n');
        
        let connected = false;
        for (const proxy of SOCKS_PROXIES) {
            console.log(`[Bot] Пробую ${proxy}...`);
            const agent = new SocksProxyAgent(proxy);
            
            const works = await new Promise((resolve) => {
                const req = https.get(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`, { agent }, (res) => {
                    let d = '';
                    res.on('data', c => d += c);
                    res.on('end', () => resolve(true));
                });
                req.on('error', () => resolve(false));
                req.setTimeout(10000, () => { req.destroy(); resolve(false); });
            });

            if (works) {
                console.log(`[Bot] Прокси ${proxy} работает!\n`);
                botOptions.request = { agent };
                connected = true;
                break;
            } else {
                console.log(`[Bot] Прокси ${proxy} не отвечает`);
            }
        }

        if (!connected) {
            console.log('\n[Bot] Ни один прокси не работает.');
            console.log('[Bot] Варианты:');
            console.log('  1. Включи VPN, который пропускает весь трафик (не только браузер)');
            console.log('  2. Найди рабочий SOCKS5 прокси и добавь в массив SOCKS_PROXIES');
            console.log('  3. Запусти бота на VPS (сервере за границей)\n');
            process.exit(1);
        }
    }

    // Запускаем бота
    const bot = new TelegramBot(BOT_TOKEN, botOptions);

    console.log('[Bot] Бот запущен и ожидает сообщений...');
    console.log('[Bot] Mini App URL: ' + WEB_APP_URL);
    console.log('[Bot] Отправь /start боту в Telegram!\n');

    // Команда /start
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'друг';

        bot.sendMessage(chatId,
            `Привет, ${firstName}! \u{1F436}\n\n` +
            `Добро пожаловать в *Dog Treats Shop* \u{2014} магазин натуральных лакомств для собак! \u{1F9B4}\n\n` +
            `Нажми кнопку ниже, чтобы открыть наш магазин:`,
            {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '\u{1F43E} Открыть магазин',
                            web_app: { url: WEB_APP_URL }
                        }
                    ]]
                }
            }
        );
    });

    // Команда /help
    bot.onText(/\/help/, (msg) => {
        bot.sendMessage(msg.chat.id,
            `\u{1F43E} *Dog Treats Shop \u{2014} Помощь*\n\n` +
            `Доступные команды:\n` +
            `/start \u{2014} Открыть магазин\n` +
            `/help \u{2014} Эта справка\n` +
            `/about \u{2014} О нас\n\n` +
            `По любым вопросам пишите прямо в чат!`,
            { parse_mode: 'Markdown' }
        );
    });

    // Команда /about
    bot.onText(/\/about/, (msg) => {
        bot.sendMessage(msg.chat.id,
            `\u{1F436} *О Dog Treats Shop*\n\n` +
            `Мы \u{2014} небольшая мастерская натуральных лакомств для собак.\n\n` +
            `\u{1F331} Только натуральные ингредиенты\n` +
            `\u{1F469}\u200D\u{1F373} Ручная работа с любовью\n` +
            `\u{1F4E6} Быстрая доставка по всей России\n` +
            `\u{1F49C} Ветеринарный контроль каждой партии\n\n` +
            `Мы любим собак и заботимся о их здоровье!`,
            { parse_mode: 'Markdown' }
        );
    });

    // Обработка данных из Mini App
    bot.on('web_app_data', (msg) => {
        try {
            const data = JSON.parse(msg.web_app_data.data);
            console.log('[Bot] Данные из Mini App:', data);
            if (data.action === 'contact') {
                bot.sendMessage(msg.chat.id,
                    `Спасибо за интерес! \u{1F43E}\n\nНапишите ваш вопрос, и мы ответим в ближайшее время.`
                );
            }
        } catch (e) {
            console.error('[Bot] Ошибка обработки данных:', e);
        }
    });

    // Обычные сообщения
    bot.on('message', (msg) => {
        if (msg.text && msg.text.startsWith('/')) return;
        if (msg.web_app_data) return;

        bot.sendMessage(msg.chat.id,
            `Спасибо за сообщение! \u{1F436}\n\nОткройте наше приложение:`,
            {
                reply_markup: {
                    inline_keyboard: [[
                        {
                            text: '\u{1F43E} Открыть магазин',
                            web_app: { url: WEB_APP_URL }
                        }
                    ]]
                }
            }
        );
    });

    bot.on('polling_error', (error) => {
        console.error('[Bot] Ошибка:', error.code, error.message);
    });
}

startBot().catch(console.error);
