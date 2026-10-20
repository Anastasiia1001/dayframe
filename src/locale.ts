export const locale = "uk-UA";
const labels: Record<string, string> = {
  Today: "Сьогодні",
  Calendar: "Календар",
  Work: "Робота",
  Personal: "Особисте",
  Settings: "Налаштування",
  Day: "День",
  Week: "Тиждень",
  Month: "Місяць",
  Quarter: "Квартал",
  Year: "Рік",
  All: "Усе",
  Appearance: "Оформлення",
  Default: "Стандартна",
  Graphite: "Графітова",
  Blue: "Блакитна",
  Green: "Зелена",
  Purple: "Бузкова",
  Warm: "Тепла",
  Dark: "Темна",
  Blossom: "Цвітіння",
  once: "Один раз",
  daily: "Щодня",
  Daily: "Щодня",
  weekly: "Щотижня",
  monthly: "Щомісяця",
  "every 3 months": "Щокварталу",
  yearly: "Щороку",
  custom: "Власний інтервал",
  Low: "Низький",
  Normal: "Звичайний",
  High: "Високий",
  Medium: "Середній",
  "Direct mentions": "Прямі згадки",
  "My team": "Моя команда",
  "My projects": "Мої проєкти",
  "Everyone / important": "Загальне й важливе",
  "Potentially useful": "Може бути корисним",
  "Could help here": "Тут можна допомогти",
  Mention: "Згадка",
  "Google Calendar": "Календар Google",
  "Outlook Calendar": "Календар Outlook",
  "Outlook · Work": "Outlook · Робочий",
  "Outlook · Personal": "Outlook · Особистий",
  "Account connected. Refreshing your sources.":
    "Обліковий запис підключено. Оновлюємо дані.",
  "Connection cancelled. You can try again in Settings.":
    "Підключення скасовано. Спробуй ще раз у налаштуваннях.",
  "A tiny win. Look at you go! ♡": "Маленька перемога. Ти молодець! ♡",
  "Task postponed to ": "Завдання перенесено на ",
  "All clear here. Add something you’d like to take care of.":
    "Тут усе зроблено. Додай те, про що хочеш подбати.",
  " · Disabled": " · Призупинено",
  "Time for yourself": "Час для себе",
  "Reminder: 10 minutes before": "Нагадування за 10 хвилин",
  "No reminder": "Без нагадування",
  "UP NEXT": "НЕЗАБАРОМ",
  "Digest category": "Категорія огляду",
  "No Slack activity loaded. Connect Slack in Settings, or refresh your sources.":
    "Дані Slack не завантажено. Підключи Slack у налаштуваннях або онови джерела.",
  "No matching activity.": "Відповідних повідомлень немає.",
  "Open in Slack": "Відкрити у Slack",
  "Already in your tasks": "Уже є серед твоїх завдань",
  "Added to your personal tasks": "Додано до особистих завдань",
  "Add to tasks": "Додати до завдань",
  "Personal task · ": "Особисте завдання · ",
  "Previous period": "Попередній період",
  "Next period": "Наступний період",
  "’s space": " — мій простір",
  "Your space": "Твій простір",
  "Personal workspace": "Особистий простір",
  "YOUR SPACE": "ТВІЙ ПРОСТІР",
  "YOUR SOURCES": "ТВОЇ ДЖЕРЕЛА",
  "A little less noise.": "Трохи менше шуму.",
  "A little more joy. ♡": "Трохи більше радості. ♡",
  "A calmer place to start": "Спокійний початок дня",
  "Dayframe brings your day together. Connect Outlook, Google Calendar and Slack in Settings, or explore demo mode. External sources are read-only; Jira and Confluence are disabled. Your personal tasks stay in this browser.":
    "Dayframe збирає твій день в одному місці. Підключи Outlook, Календар Google і Slack у налаштуваннях або спробуй деморежим. Зовнішні джерела доступні лише для читання; Jira та Confluence вимкнені. Особисті завдання зберігаються в цьому браузері.",
  "Help & getting started": "Допомога й перші кроки",
  "Personal profile": "Особистий профіль",
  "Make room for what matters": "Залиши місце для важливого",
  "Search anything...": "Знайти щось…",
  "Profile settings": "Налаштування профілю",
  "A little clarity for your day.": "Трохи ясності у твоєму дні.",
  "Make room for your life.": "Залиши місце для життя.",
  "Your work, in perspective.": "Твоя робота — як на долоні.",
  "A little space to plan.": "Трохи простору для планів.",
  "Make yourself at home.": "Почувайся як удома.",
  "Your schedule, your priorities, and a little room to breathe.":
    "Твій розклад, твої пріоритети й трохи простору для себе.",
  "Small responsibilities. A lighter mind.": "Маленькі справи. Більше спокою.",
  "The context you need, without all the noise.":
    "Усе потрібне — без зайвого шуму.",
  "One view for work, life, and everything in between.":
    "Робота, життя й усе між ними — в одному календарі.",
  "A few thoughtful choices to make Dayframe yours.":
    "Налаштуй Dayframe так, як зручно саме тобі.",
  "calendar events": "подій у календарі",
  "Add task": "Додати завдання",
  "Demo data": "Демонстраційні дані",
  "Live workspace": "Власні дані",
  "Updated ": "Оновлено о ",
  "Waiting for connections": "Очікуємо підключення",
  "Refreshing…": "Оновлюємо…",
  Refresh: "Оновити",
  Connections: "Підключення",
  "YOUR DAY AT A GLANCE": "ТВІЙ ДЕНЬ КОРОТКО",
  events: "подій",
  mentions: "згадок",
  "personal tasks": "особистих завдань",
  "One thing at a time.": "Одна справа за раз.",
  "Your schedule": "Твій розклад",
  "A LITTLE STRUCTURE": "ТРОХИ ПОРЯДКУ",
  "Open calendar": "Відкрити календар",
  "Today,": "Сьогодні,",
  "Your day has room.": "У твоєму дні є простір.",
  "No calendar events loaded for today. Connect Outlook or Google Calendar in Settings.":
    "Події на сьогодні не завантажено. Підключи Outlook або Календар Google у налаштуваннях.",
  "No events scheduled for today.": "На сьогодні подій не заплановано.",
  "Manage calendars": "Налаштувати календарі",
  "All times are shown in your device’s time zone.":
    "Час указано в часовому поясі твого пристрою.",
  "Your relevant Slack activity": "Важливе для тебе у Slack",
  "YOUR SLACK DIGEST": "ТВІЙ ОГЛЯД SLACK",
  "Demo summary": "Демонстраційний огляд",
  "Last 24 hours · Search results": "Останні 24 години · Результати пошуку",
  "Sample summaries, for exploration.":
    "Приклади оглядів для знайомства із застосунком.",
  "Read-only messages. You decide what matters.":
    "Повідомлення лише для читання. Ти обираєш важливе.",
  "All activity": "Усі повідомлення",
  "Worth your attention": "Варте твоєї уваги",
  "A few things you may want to look at.":
    "Кілька речей, які можна переглянути.",
  "No direct mentions loaded. Nothing is automatically marked as missed.":
    "Прямих згадок не завантажено. Нічого не позначається пропущеним автоматично.",
  "Due today": "На сьогодні",
  "For you, outside of work": "Для тебе, поза роботою",
  "MY TASKS": "МОЇ ЗАВДАННЯ",
  of: "із",
  done: "виконано",
  "Add a personal task": "Додати особисте завдання",
  "Little things count, too.": "Маленькі справи теж важливі.",
  "Open personal tasks": "Відкрити особисті завдання",
  "BEFORE YOU CALL IT A DAY": "ПЕРЕД ЗАВЕРШЕННЯМ ДНЯ",
  "Leave with a clear mind.": "Заверши день зі спокоєм.",
  "direct mentions to review.": "прямих згадок для перегляду.",
  "personal tasks still open.": "особистих завдань ще не виконано.",
  "Your daily review": "Підсумки твого дня",
  "Daily review": "Підсумки дня",
  "Review your day": "Переглянути підсумки дня",
  "Demo workspace · Sample activity": "Деморежим · Приклади активності",
  "Read-only connections · Your accounts stay yours":
    "Лише читання · Твої облікові записи залишаються твоїми",
  "Made for a more intentional day.": "Для дня з турботою про себе.",
  "A home for the little things that keep life running.":
    "Місце для маленьких справ, які підтримують лад у житті.",
  "Your lists, your pace.": "Твої списки, твій ритм.",
  "The everyday things": "Щоденні справи",
  "A monthly reset": "Щомісячне оновлення",
  "A little seasonal care": "Трохи сезонної турботи",
  "The bigger picture": "Важливе на рік",
  "Editable starter library": "Початкові списки можна редагувати",
  "Slack · Your relevant activity": "Slack · Важливе для тебе",
  "Demo summaries": "Демонстраційні огляди",
  "Read-only · Not an AI digest": "Лише читання · Без ШІ-огляду",
  "Jira and Confluence are disabled. No access is requested and no data is loaded.":
    "Jira та Confluence вимкнені. Доступ не запитується, дані не завантажуються.",
  "Your profile": "Твій профіль",
  "Display name": "Ім’я у застосунку",
  "Only stored in this browser.": "Зберігається лише в цьому браузері.",
  "Your name": "Твоє ім’я",
  "YOUR SPACE, YOUR STYLE": "ТВІЙ ПРОСТІР, ТВІЙ СТИЛЬ",
  "Choose the palette that feels right for your day.":
    "Обери кольори під свій настрій.",
  "Theme controls accents, surfaces, text, selected states and calendar colors.":
    "Тема визначає кольори акцентів, фону, тексту, вибраних елементів і календаря.",
  "Dayframe on your Mac": "Dayframe на твоєму Mac",
  "Your own window. A little flower in the Dock.":
    "Окреме вікно. Маленька квіточка в Dock.",
  "In Safari on macOS Sonoma or later, open Dayframe and choose":
    "У Safari на macOS Sonoma або новішій відкрий Dayframe та вибери",
  "File → Add to Dock": "Файл → Додати до Dock",
  ". Use the hosted live workspace for account connections.":
    ". Для підключення облікових записів використовуй серверну версію.",
  "Tasks may use a separate browser store; they are not automatically transferred. A native .dmg installer is not included.":
    "Вебзастосунок може мати окреме сховище: завдання не переносяться автоматично. Окремого інсталятора .dmg поки немає.",
  "Mac installation guide": "Як установити на Mac",
  "Personal task preferences": "Особисті завдання",
  "Show the little companion": "Показувати маленького помічника",
  "Keep a little encouragement, or hide it for more focus.":
    "Залиш трохи підтримки або приховай її, щоб зосередитися.",
  "Show personal tasks on Today": "Показувати особисті завдання на сьогодні",
  "Keep a little room for life alongside work.":
    "Залиши трохи місця для життя поряд із роботою.",
  "Default recurrence": "Типове повторення",
  "Used when creating a new personal task.":
    "Використовується для нових особистих завдань.",
  Notifications: "Сповіщення",
  "Close notifications": "Закрити сповіщення",
  "Mark all as read": "Позначити все прочитаним",
  "Global search": "Пошук усюди",
  "Search your day, work, and life...":
    "Пошук серед подій, повідомлень і завдань…",
  "Close search": "Закрити пошук",
  "No results for “": "Нічого не знайдено за запитом «",
  "”. Try a title, person, or channel.": "». Спробуй назву, ім’я або канал.",
  "Search across all five sources": "Пошук серед усіх доступних джерел",
  "esc to close": "Esc — закрити",
  "Personal task": "Особисте завдання",
  "Task saved": "Завдання збережено",
  "A LITTLE THING FOR YOU": "МАЛЕНЬКА СПРАВА ДЛЯ СЕБЕ",
  "Edit task": "Редагувати завдання",
  "Close task": "Закрити завдання",
  Title: "Назва",
  "What would you like to take care of?": "Про що хочеш подбати?",
  Category: "Категорія",
  Date: "Дата",
  Recurrence: "Повторення",
  Priority: "Пріоритет",
  "Repeat every (days)": "Повторювати кожні (днів)",
  Notes: "Нотатки",
  "Anything useful to remember": "Що корисно пам’ятати",
  "Pause this task": "Призупинити це завдання",
  Delete: "Видалити",
  Cancel: "Скасувати",
  "Save task": "Зберегти завдання",
  "Close details": "Закрити подробиці",
  "Demo preview · Sample data.": "Демонстраційний перегляд · Приклади даних.",
  "Your workspace · Read-only source data.":
    "Твій простір · Дані джерел лише для читання.",
  "Got it": "Зрозуміло",
  "Could not disconnect.": "Не вдалося відключити обліковий запис.",
  "Your connections": "Твої підключення",
  "READ-ONLY · YOUR ACCOUNTS, YOUR CHOICE":
    "ЛИШЕ ЧИТАННЯ · ТВОЇ ОБЛІКОВІ ЗАПИСИ, ТВІЙ ВИБІР",
  "Connect work and personal Outlook accounts, then Google Calendar and Slack. Jira and Confluence are disabled.":
    "Підключи робочий і особистий Outlook, а потім Календар Google та Slack. Jira й Confluence вимкнені.",
  "Demo workspace": "Демопростір",
  "Only connected accounts appear in your dashboard.":
    "На головній сторінці відображаються лише дані підключених облікових записів.",
  "Sample calendar and Slack activity. No accounts are connected by demo mode.":
    "Приклади календарних подій і повідомлень Slack. Деморежим не підключає облікові записи.",
  "Try demo": "Спробувати деморежим",
  "Use live data": "Використовувати власні дані",
  Connected: "Підключено",
  "Ready to connect": "Можна підключити",
  "Not connected": "Не підключено",
  "Read direct mentions and the channels you choose. No messages are sent.":
    "Читання прямих згадок і вибраних каналів. Повідомлення не надсилаються.",
  "Read calendar events, meeting details and attendees. No events are changed.":
    "Читання подій, подробиць зустрічей і списків учасників. Події не змінюються.",
  "Disconnecting…": "Відключаємо…",
  Disconnect: "Відключити",
  Connect: "Підключити",
  "Account app registration required — see setup guide below.":
    "Потрібна реєстрація OAuth-застосунку — інструкція нижче.",
  "Requires the hosted workspace. GitHub Pages cannot run account connections.":
    "Потрібна серверна версія. GitHub Pages не підтримує підключення облікових записів.",
  "Switch to live data to see your connected account.":
    "Перемкнися на власні дані, щоб побачити підключений обліковий запис.",
  "Disabled · no access": "Вимкнено · немає доступу",
  "Your Slack channels": "Твої канали Slack",
  "Up to 5 channel names, separated by commas. Direct mentions are included automatically.":
    "До 5 назв каналів через кому. Прямі згадки додаються автоматично.",
  "Enter up to five channel names using letters, numbers, hyphens or underscores.":
    "Укажи до п’яти назв каналів: латинські літери, цифри, дефіси або підкреслення.",
  Save: "Зберегти",
  "Deploy live workspace": "Розмістити серверну версію",
  "Refresh connections": "Оновити підключення",
  "Connection setup guide": "Інструкція з підключення",
  "Your account tokens stay on the server, never in browser storage. Sessions last up to 8 hours; a server restart requires reconnecting. Disconnect removes this session’s token; revoke app access in the provider’s settings to revoke the permission itself.":
    "Токени облікових записів зберігаються на сервері, а не в браузері. Сеанс триває до 8 годин; після перезапуску сервера потрібно підключитися знову. Відключення видаляє токен поточного сеансу. Щоб відкликати сам дозвіл, видали доступ застосунку в налаштуваннях сервісу.",
  "Little steps are still steps. You’re doing lovely.":
    "Маленькі кроки теж ведуть уперед. Ти молодець.",
  "A sip of water, a deep breath. You’ve got this.":
    "Ковток води, глибокий вдих. У тебе все вийде.",
  "You don’t have to do everything to have a good day.":
    "Щоб день був хорошим, не обов’язково встигнути все.",
  "A tiny win deserves a tiny happy dance.":
    "Маленька перемога заслуговує на маленький танець радості.",
  "A little encouragement": "Трохи підтримки",
  "A SOFTER KIND OF PRODUCTIVITY": "СПРАВИ З ТУРБОТОЮ ПРО СЕБЕ",
  "One little thing at a time": "Одна маленька справа за раз",
  "Daily standup": "Щоденна зустріч команди",
  "UI design review": "Обговорення дизайну інтерфейсу",
  "A little time for lunch": "Час на обід",
  "Personal time": "Особистий час",
  "1:1 with Maya": "Особиста зустріч із Маєю",
  "Evening walk": "Вечірня прогулянка",
  "Outside, a screen-free break": "Надворі, перерва від екранів",
  You: "Ти",
  "Maya would love your eyes on the updated reward flow before the design review.":
    "Мая просить переглянути оновлений сценарій нагород перед обговоренням дизайну.",
  "You were mentioned directly. The review starts at 11:00.":
    "Тебе згадали особисто. Обговорення почнеться об 11:00.",
  "The team agreed on a lighter motion style for the next release.":
    "Команда погодила легший стиль анімацій для наступного випуску.",
  "This affects the reward reveal animation you are working on.":
    "Це стосується анімації нагород, над якою ти працюєш.",
  "A new build log may help narrow down the Addressables issue.":
    "Новий журнал збірки може допомогти знайти причину проблеми з Addressables.",
  "Related to GAME-89322, assigned to you.":
    "Стосується завдання GAME-89322, призначеного тобі.",
  "Friday is a focus day. Internal meetings are optional.":
    "П’ятниця — день зосередженої роботи. Внутрішні зустрічі необов’язкові.",
  "A useful heads-up for planning the rest of your week.":
    "Корисно врахувати під час планування решти тижня.",
  "Updated accessibility guidance includes new contrast examples.":
    "В оновлених рекомендаціях із доступності є нові приклади контрастності.",
  "Potentially useful for your next UI review.":
    "Може знадобитися під час наступного обговорення інтерфейсу.",
  "Alex is looking into a UI masking issue similar to one you recently solved.":
    "Алекс досліджує проблему маскування інтерфейсу, схожу на ту, яку ти нещодавно розв’язала.",
  "Your previous investigation could save the team some time.":
    "Твій досвід може заощадити команді час.",
  "32 min ago": "32 хв тому",
  "48 min ago": "48 хв тому",
  "1 hour ago": "1 год тому",
  "2 hours ago": "2 год тому",
  "3 hours ago": "3 год тому",
  "4 hours ago": "4 год тому",
  "People team": "Команда турботи про працівників",
  "Water the plants": "Полити рослини",
  "Start a load of laundry": "Запустити прання",
  "Buy dog food": "Купити корм для собаки",
  "Wash the dishes": "Помити посуд",
  "Clean washing machine": "Почистити пральну машину",
  "Clean refrigerator": "Помити холодильник",
  "Check medicine cabinet": "Перевірити аптечку",
  "Organize wardrobe": "Упорядкувати гардероб",
  "Review subscriptions": "Переглянути підписки",
  "Deep clean bathroom": "Ретельно прибрати ванну",
  "Wash windows": "Помити вікна",
  "Clean extractor hood": "Почистити витяжку",
  "Clean AC filters": "Почистити фільтри кондиціонера",
  "Review seasonal clothes": "Перебрати сезонний одяг",
  "Deep clean storage areas": "Прибрати місця зберігання",
  "Review household supplies": "Перевірити домашні запаси",
  "Review important documents": "Переглянути важливі документи",
  "Backup files and photos": "Зробити резервну копію файлів і фото",
  "Clean devices and cables": "Почистити пристрої та кабелі",
  "Review insurance": "Переглянути страхування",
  "Major wardrobe review": "Ретельно перебрати гардероб",
  "Deep home organization": "Навести лад удома",
  "Digital photo cleanup": "Упорядкувати цифрові фото",
  "Backup important data": "Зробити резервну копію важливих даних",
  "Review yearly expenses": "Переглянути витрати за рік",
  "Review personal goals": "Переглянути особисті цілі",
  "Live connections need a hosted Dayframe server. This static site supports personal tasks and demo mode.":
    "Для реальних підключень потрібен сервер Dayframe. На цьому статичному сайті доступні особисті завдання та деморежим.",
  "Could not load this source.": "Не вдалося завантажити дані цього джерела.",
  "Could not sync.": "Не вдалося оновити дані.",
  "Could not reach the workspace server.": "Не вдалося з’єднатися із сервером.",
  "Slack: showing up to 30 latest results per query. Narrow your channel selection for more focus.":
    "Slack: показано до 30 останніх результатів на запит. Зменш кількість каналів, щоб зосередитися на важливому.",
  "All day": "Увесь день",
  "Untitled event": "Подія без назви",
  "No location": "Місце не вказано",
  Guest: "Учасник",
  "Slack member": "Учасник Slack",
  "(Message has no text)": "(Повідомлення без тексту)",
  "You were directly mentioned.": "Тебе згадали особисто.",
  "Matched the channels or terms you chose. This is a search result, not an AI summary.":
    "Знайдено у вибраних каналах. Це результат пошуку, а не ШІ-огляд.",
  "DAYFRAME_PUBLIC_URL must use HTTPS (HTTP is allowed only on localhost)":
    "DAYFRAME_PUBLIC_URL має використовувати HTTPS (HTTP дозволено лише для localhost)",
  "The provider could not be reached. Please try again.":
    "Не вдалося з’єднатися із сервісом. Спробуй ще раз.",
  "Connection expired. Please reconnect.":
    "Термін підключення минув. Підключи обліковий запис знову.",
  "Provider rate limit reached. Please wait before refreshing.":
    "Досягнуто ліміту запитів сервісу. Зачекай перед оновленням.",
  "Provider request failed. Check account permissions and try again.":
    "Сервіс не виконав запит. Перевір дозволи облікового запису та спробуй ще раз.",
  "The provider declined the request. Check permissions or reconnect.":
    "Сервіс відхилив запит. Перевір дозволи або підключи обліковий запис знову.",
  "Connect this account in Settings first.":
    "Спочатку підключи цей обліковий запис у налаштуваннях.",
  "Please reconnect this account.": "Підключи цей обліковий запис знову.",
  "Request too large": "Запит завеликий",
  "Invalid JSON": "Некоректні дані JSON",
  "Request origin did not match this workspace.":
    "Джерело запиту не відповідає цьому простору.",
  "Method not allowed": "Метод запиту не підтримується",
  "Authorization expired or state did not match. Start again in Settings.":
    "Авторизація застаріла або її перевірка не пройшла. Почни знову в налаштуваннях.",
  "Authorization code is missing.": "Відсутній код авторизації.",
  "The provider did not return a user access token.":
    "Сервіс не повернув токен доступу користувача.",
  "Choose a valid calendar range of at most 62 days.":
    "Обери коректний період календаря тривалістю до 62 днів.",
  "Invalid time zone.": "Некоректний часовий пояс.",
  "Too many events in this range. Choose a shorter calendar range.":
    "Забагато подій у цьому періоді. Обери коротший проміжок.",
  "Invalid provider pagination.":
    "Некоректне посилання на наступну сторінку даних сервісу.",
  "Choose up to five Slack channel names.":
    "Укажи до п’яти назв каналів Slack.",
  "Slack did not identify the connected user.":
    "Slack не визначив підключеного користувача.",
  "Endpoint not found": "Шлях API не знайдено",
  "Invalid path": "Некоректний шлях",
  "An unexpected server error occurred.":
    "Сталася непередбачена помилка сервера.",
  "Dayframe server is ready.": "Сервер Dayframe готовий до роботи.",
  "Invalid MICROSOFT_TENANT_ID": "Некоректний MICROSOFT_TENANT_ID",
  "Event is missing its time": "Не вказано час події",
  "Invalid calendar timestamp": "Некоректна дата або час події",
  Complete: "Виконати",
  Uncomplete: "Позначити невиконаним",
  Postpone: "Перенести",
  Edit: "Редагувати",
  DEMO: "ДЕМО",
  "In Progress": "У роботі",
  "In progress": "У роботі",
  "To Do": "До виконання",
  "To do": "До виконання",
  "In review": "На перевірці",
  Tomorrow: "Завтра",
  Friday: "П’ятниця",
  Yesterday: "Учора",
  "Addressables build investigation": "Дослідження збірки Addressables",
  "Refine reward reveal animation": "Удосконалити анімацію появи нагороди",
  "Review UI masking approach": "Переглянути підхід до маскування інтерфейсу",
  "UI guidelines · motion & feedback":
    "Рекомендації з інтерфейсу · рух і зворотний зв’язок",
  "Addressables build troubleshooting":
    "Усунення проблем зі збіркою Addressables",
  "Release 2.8 · what’s changing": "Випуск 2.8 · що змінюється",
  "Design system": "Дизайн-система",
  "Gamepoint engineering": "Інженерна команда Gamepoint",
  "Updated motion principles and examples for reward states. Relevant to the upcoming UI review.":
    "Оновлені принципи руху та приклади станів нагород. Стане в пригоді для обговорення інтерфейсу.",
  "A shared checklist for investigating asset loading and build pipeline failures.":
    "Спільний список перевірок для дослідження завантаження ресурсів і помилок збірки.",
  "Release scope, key milestones and the UI changes to review this week.":
    "Обсяг випуску, основні етапи та зміни інтерфейсу для перегляду цього тижня.",
};
/** Display labels only; saved keys, account data and identifiers remain unchanged. */
export function uk(value: string): string {
  return labels[value] ?? value;
}
export function shortDate(value: string): string {
  return new Date(value + "T12:00:00").toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export function plural(
  count: number,
  one: string,
  few: string,
  many: string,
): string {
  const form = new Intl.PluralRules(locale).select(count);
  return form === "one" ? one : form === "few" ? few : many;
}
