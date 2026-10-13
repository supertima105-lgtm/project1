/* ==========================================================================
   AI TUTOR ENGINE (БЛОК 3: Интеграция ИИ API)
   Connects to Google Gemini API (AI Studio), Free Generative Public LLM,
   and features a massive Dynamic In-Game Linguistic Tutor Engine.
   Lumi NEVER stalls and NEVER repeats the exact same static phrase!
   ========================================================================== */

const AIEngine = {
  API_KEY_STORAGE: 'foxi_gemini_api_key',
  DEFAULT_API_KEY: '',
  lastStatus: 'local_smart', // 'live_gemini' | 'free_ai' | 'local_smart'
  activeModel: 'gemini-1.5-flash',
  lastAnswersHistory: [],

  getApiKey() {
    const stored = localStorage.getItem(this.API_KEY_STORAGE);
    if (stored && stored.trim() && stored.trim().length > 15 && stored.trim() !== 'null' && stored.trim() !== 'undefined') {
      return stored.trim();
    }
    return this.DEFAULT_API_KEY;
  },

  setApiKey(key) {
    if (key && key.trim()) {
      localStorage.setItem(this.API_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(this.API_KEY_STORAGE);
    }
  },

  /**
   * Tests a Gemini API key with a fast ping request
   */
  async testKey(key) {
    if (!key || !key.trim()) return { ok: false, error: 'Ключ не указан' };
    const trimmed = key.trim();
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmed)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': trimmed
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hi' }] }]
          })
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          return { ok: true, model };
        } else {
          const errText = await response.text();
          let parsed;
          try { parsed = JSON.parse(errText); } catch(e) {}
          const msg = parsed?.error?.message || `HTTP ${response.status}`;
          if (response.status === 401 || response.status === 400 || response.status === 403) {
            return { ok: false, error: msg };
          }
        }
      } catch (e) {
        // Continue to next model or return error
      }
    }
    return { ok: false, error: 'Не удалось подключиться к серверам Google Gemini' };
  },

  /**
   * Explains a specific mistake in a quiz question
   */
  async explainMistake(question, userAnswer) {
    const correctStr = question.options ? question.options[question.correctIndex] : (question.targetTokens ? question.targetTokens.join(' ') : 'другой вариант');
    const prompt = `Ты дружелюбный маскот Лисёнок Люми из обучающего приложения Foxical.
Ученик ответил: "${userAnswer}", но правильный ответ: "${correctStr}".
Вопрос: "${question.title}" (${question.prompt || ''}).
По-доброму и понятно (2-3 предложения) на русском объясни, почему такой ответ правильный и какое простое правило поможет запомнить. Используй эмодзи 🦊✨`;

    // Try online LLM first
    const online = await this.tryAllGenerators(prompt, 'explanation');
    if (online) return online;

    // Fallback to contextual smart tutor
    return this.generateSmartMistakeExplanation(question, userAnswer, correctStr);
  },

  /**
   * Generates a conversational response in AI Tutor Chat
   */
  async chat(userMessage) {
    const systemPrompt = `Ты — Лисёнок Люми (Lumi), веселый, добрый и умный маскот приложения Foxical для изучения английского языка.
Твоя задача — помогать пользователю учить английский:
- Если он пишет по-русски, отвечай по-русски и приводи примеры полезных фраз на английском с переводом и транскрипцией.
- Если он пишет по-английски, похвали его, мягко укажи на ошибки если они есть, и ответь по-английски с русским переводом.
- Ответы держи живыми, вдохновляющими, понятными и дружелюбными (2-4 предложения).
- Всегда полностью завершай фразы знаком препинания (. ! ?) или эмодзи. Никогда не обрывай предложение.
- Используй эмодзи 🦊✨🐾`;

    // 1. Try Live AI generators (Gemini API -> Free Public LLM)
    const onlineAnswer = await this.tryAllGenerators(userMessage, 'chat', systemPrompt);
    if (onlineAnswer) {
      return onlineAnswer;
    }

    // 2. Comprehensive Dynamic Linguistic Brain
    this.lastStatus = 'local_smart';
    return this.getSmartDynamicResponse(userMessage);
  },

  /**
   * Tries available online LLM providers in sequence
   */
  async tryAllGenerators(promptText, mode = 'chat', systemInstruction = '') {
    const apiKey = this.getApiKey();

    // Step A: Google Gemini API (if key present)
    if (apiKey && apiKey.length > 15) {
      const fullPrompt = systemInstruction ? `${systemInstruction}\n\nПользователь: ${promptText}` : promptText;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      };

      const geminiResult = await this.tryCallGemini(apiKey, payload);
      if (geminiResult) {
        this.lastStatus = 'live_gemini';
        return geminiResult;
      }
    }

    // Step B: Free Fast Generative Public LLM (Zero-Config fallback)
    const freeResult = await this.tryCallFreeAI(promptText, systemInstruction);
    if (freeResult) {
      this.lastStatus = 'free_ai';
      return freeResult;
    }

    return null;
  },

  /**
   * Tries to call Google Gemini Generative Language API
   */
  async tryCallGemini(key, payload) {
    if (!key) return null;
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-flash-latest'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6500);

        const response = await fetch(url, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key
          },
          body: JSON.stringify(payload)
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            this.activeModel = model;
            return candidateText.trim();
          }
        } else {
          console.warn(`Gemini API ${model} HTTP ${response.status}`);
        }
      } catch (fetchErr) {
        // Network timeout / offline
      }
    }
    return null;
  },

  /**
   * Tries free fast public generative AI (Pollinations text endpoint)
   */
  async tryCallFreeAI(userMessage, systemPrompt = '') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const sys = systemPrompt || 'Ты лисенок Люми, персональный репетитор по английскому языку. Отвечай кратко, дружелюбно (2-3 предложения), с примером на английском и эмодзи 🦊✨.';
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: userMessage }
          ],
          model: 'openai',
          seed: Math.floor(Math.random() * 10000)
        })
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim() && !text.includes('<!DOCTYPE') && !text.includes('Error')) {
          return text.trim();
        }
      }
    } catch (e) {
      // Free endpoint unreachable or timed out
    }
    return null;
  },

  // ==========================================================================
  // DYNAMIC IN-GAME LINGUISTIC TUTOR ENGINE (LOCAL BRAIN)
  // Ensures Lumi always speaks dynamically, intelligently and with rich variety
  // ==========================================================================

  vocabulary: {
    // Животные
    'собака': { en: 'dog', trans: 'дог', ex: 'I have a friendly dog.', ru: 'У меня дружелюбная собака.' },
    'кот': { en: 'cat', trans: 'кэт', ex: 'The cat is sleeping on the sofa.', ru: 'Кот спит на диване.' },
    'кошка': { en: 'cat', trans: 'кэт', ex: 'My cat loves playing.', ru: 'Моя кошка любит играть.' },
    'лиса': { en: 'fox', trans: 'фокс', ex: 'The clever fox knows English!', ru: 'Умная лиса знает английский!' },
    'лисенок': { en: 'fox / little fox', trans: 'литл фокс', ex: 'Lumi is a smart fox.', ru: 'Люми — умный лисёнок.' },
    'волк': { en: 'wolf', trans: 'вулф', ex: 'The gray wolf lives in the forest.', ru: 'Серый волк живёт в лесу.' },
    'медведь': { en: 'bear', trans: 'бэр', ex: 'A big brown bear.', ru: 'Большой бурый медведь.' },
    'птица': { en: 'bird', trans: 'бёрд', ex: 'Early bird catches the worm.', ru: 'Ранняя птичка ловит червячка.' },
    'рыба': { en: 'fish', trans: 'фиш', ex: 'Fish swim in the river.', ru: 'Рыбы плавают в реке.' },

    // Еда и напитки
    'яблоко': { en: 'apple', trans: 'эппл', ex: 'An apple a day keeps the doctor away.', ru: 'Яблоко в день бережет здоровье.' },
    'вода': { en: 'water', trans: 'уотер', ex: 'Please give me a glass of water.', ru: 'Пожалуйста, дайте мне стакан воды.' },
    'кофе': { en: 'coffee', trans: 'кофи', ex: 'I drink hot coffee in the morning.', ru: 'Я пью горячий кофе по утрам.' },
    'чай': { en: 'tea', trans: 'ти', ex: 'Would you like some green tea?', ru: 'Хочешь немного зелёного чая?' },
    'хлеб': { en: 'bread', trans: 'брэд', ex: 'Fresh bread smells delicious.', ru: 'Свежий хлеб пахнет вкусно.' },
    'молоко': { en: 'milk', trans: 'милк', ex: 'I like cereal with cold milk.', ru: 'Я люблю хлопья с холодным молоком.' },
    'пицца': { en: 'pizza', trans: 'пицца', ex: 'Let us order delicious pizza!', ru: 'Давай закажем вкусную пиццу!' },
    'сыр': { en: 'cheese', trans: 'чиз', ex: 'Say cheese and smile!', ru: 'Скажи «сыр» и улыбнись!' },
    'завтрак': { en: 'breakfast', trans: 'брэкфэст', ex: 'What do you eat for breakfast?', ru: 'Что ты ешь на завтрак?' },
    'обед': { en: 'lunch', trans: 'ланч', ex: 'Time for a tasty lunch.', ru: 'Время вкусного обеда.' },
    'ужин': { en: 'dinner', trans: 'диннер', ex: 'Family dinner is great.', ru: 'Семейный ужин — это здорово.' },

    // Люди и семья
    'друг': { en: 'friend', trans: 'фрэнд', ex: 'A friend in need is a friend indeed.', ru: 'Друг познаётся в беде.' },
    'друзья': { en: 'friends', trans: 'фрэндз', ex: 'We are the best friends!', ru: 'Мы лучшие друзья!' },
    'семья': { en: 'family', trans: 'фэмили', ex: 'I love my family very much.', ru: 'Я очень люблю свою семью.' },
    'мама': { en: 'mother / mom', trans: 'мам', ex: 'My mom is kind and smart.', ru: 'Моя мама добрая и умная.' },
    'папа': { en: 'father / dad', trans: 'дэд', ex: 'Dad helps me with homework.', ru: 'Папа помогает мне с уроками.' },
    'брат': { en: 'brother', trans: 'бразэр', ex: 'My brother plays football.', ru: 'Мой брат играет в футбол.' },
    'сестра': { en: 'sister', trans: 'систэр', ex: 'My sister learns English too.', ru: 'Моя сестра тоже учит английский.' },
    'учитель': { en: 'teacher', trans: 'тичэр', ex: 'A great teacher inspires you.', ru: 'Отличный учитель вдохновляет.' },
    'ученик': { en: 'student', trans: 'стьюдент', ex: 'You are a brilliant student!', ru: 'Ты блестящий ученик!' },

    // Действия и глаголы
    'учить': { en: 'learn / study', trans: 'лёрн', ex: 'I learn new words every day.', ru: 'Я учу новые слова каждый день.' },
    'учиться': { en: 'study / learn', trans: 'стади', ex: 'It is fun to learn English with Lumi.', ru: 'Учить английский с Люми весело.' },
    'любить': { en: 'love / like', trans: 'лав / лайк', ex: 'I love studying languages.', ru: 'Я люблю изучать языки.' },
    'говорить': { en: 'speak / talk', trans: 'спик', ex: 'I want to speak English fluently.', ru: 'Я хочу свободно говорить по-английски.' },
    'читать': { en: 'read', trans: 'рид', ex: 'I read interesting books in English.', ru: 'Я читаю интересные книги на английском.' },
    'писать': { en: 'write', trans: 'райт', ex: 'Write down new words.', ru: 'Записывай новые слова.' },
    'идти': { en: 'go', trans: 'гоу', ex: 'Let us go forward!', ru: 'Пойдём вперёд!' },
    'помогать': { en: 'help', trans: 'хэлп', ex: 'Can I help you?', ru: 'Я могу тебе помочь?' },
    'спать': { en: 'sleep', trans: 'слип', ex: 'I need to sleep well tonight.', ru: 'Мне нужно хорошо выспаться сегодня.' },
    'работать': { en: 'work', trans: 'уёрк', ex: 'Hard work pays off.', ru: 'Усердная работа окупается.' },

    // Время и предметы
    'время': { en: 'time', trans: 'тайм', ex: 'What time is it now?', ru: 'Который сейчас час?' },
    'сегодня': { en: 'today', trans: 'тудэй', ex: 'Today is a wonderful day!', ru: 'Сегодня замечательный день!' },
    'завтра': { en: 'tomorrow', trans: 'туморроу', ex: 'See you tomorrow in class!', ru: 'Увидимся завтра на уроке!' },
    'книга': { en: 'book', trans: 'бук', ex: 'Open your English book.', ru: 'Открой свою книгу по английскому.' },
    'дом': { en: 'house / home', trans: 'хоум', ex: 'There is no place like home.', ru: 'В гостях хорошо, а дома лучше.' },
    'город': { en: 'city', trans: 'сити', ex: 'I live in a beautiful city.', ru: 'Я живу в красивом городе.' },
    'деньги': { en: 'money', trans: 'мани', ex: 'Time is money.', ru: 'Время — деньги.' }
  },

  /**
   * Generates a contextually rich, varied offline response
   */
  getSmartDynamicResponse(rawText) {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // 1. Check for translation inquiries ("как сказать X", "как по английски X", "переведи X")
    const translationMatch = this.detectTranslationRequest(lower);
    if (translationMatch) {
      return this.formatVocabularyResponse(translationMatch);
    }

    // 2. Grammar inquiries
    if (lower.includes('present simple') || lower.includes('простое настоящее')) {
      return this.getRandomVariant([
        `🦊 Present Simple — фундамент английского языка! 🏛️\nФормула: **I / You / We / They + глагол** (*I study English*).\nА для **He / She / It** глагол получает хвостик **-s**: *He studies English*! Запомни лисье правило: один персонаж любит букву «S»! 🐾✨`,
        `🦊 Правило Present Simple очень простое! 🌟\nИспользуй его для фактов и привычек: *I drink tea every morning* («Я пью чай каждое утро»). В отрицании приходят помощники: **don't** или **doesn't**. Например: *She doesn't drink coffee*. Хочешь потренироваться? ☕✨`
      ]);
    }

    if (lower.includes('past simple') || lower.includes('прошедш')) {
      return this.getRandomVariant([
        `🦊 Past Simple рассказывает о том, что уже произошло в прошлом! ⏳\nДля правильных глаголов просто добавь **-ed**: *I played games yesterday*. А неправильные глаголы имеют свою особую форму (например: *go → went*, *see → saw*). В вопросах выручает помощник **Did**: *Did you study?* 🎓✨`,
        `🦊 Прошедшее время Past Simple — это просто! 🐾\nМаркеры времени: **yesterday** (вчера), **last week** (на прошлой неделе), **two days ago** (два дня назад). Пример: *We visited our friends last Sunday* («Мы навестили друзей в прошлое воскресенье»). Попробуй вспомнить, что ты делал вчера? 🌟`
      ]);
    }

    if (lower.includes('future simple') || lower.includes('будущ')) {
      return this.getRandomVariant([
        `🦊 Будущее время Future Simple строится с волшебным словом **will**! 🚀\nФормула: **I will + глагол** (*I will learn 100 new words!*).\nВ разговорной речи часто сокращают: *I'll help you* («Я помогу тебе»). А в отрицании используют **won't**: *I won't give up* («Я не сдамся»)! Ты справишься! ✨`,
        `🦊 Планируешь будущее? Используй **will**! 🔮\nПример: *Tomorrow I will practice English with Lumi* («Завтра я буду практиковать английский с Люми»). А для твердых намерений можно сказать: *I am going to travel* («Я собираюсь путешествовать»). Какая твоя цель на этой неделе? 🐾`
      ]);
    }

    if (lower.includes('артикл') || lower.includes('a ') || lower.includes('the ') || lower.includes('a/the') || lower.includes('an ')) {
      return this.getRandomVariant([
        `🦊 Лёгкий секрет артиклей от Люми! 🎓\n• **A / An** — ставим перед одним предметом, когда говорим о нём в первый раз (*I see a fox* — «Я вижу какую-то лису»). Если слово начинается на гласный звук — берём **an** (*an orange* 🍊).\n• **The** — когда предмет конкретный и собеседник точно знает, о чём речь (*The fox is smart* — «Эта конкретная лиса умная»)! 🦊✨`,
        `🦊 Артикли **a** и **the** помогают нам быть точными! 🎯\nСравни: *I bought a book* (какую-то книгу) и *The book was amazing* (та самая книга, которую я купил). С именами и городами артикли обычно не ставятся! Запомнил разницу? 🌟🐾`
      ]);
    }

    if (lower.includes('местоимен') || lower.includes('pronoun')) {
      return `🦊 Английские местоимения в кармане: 🎒\n• **I** (я), **You** (ты/вы), **He** (он), **She** (она), **It** (оно/предмет)\n• **We** (мы), **They** (они)\nА чтобы сказать «мой/твой»: **my** (мой), **your** (твой), **his** (его), **her** (её), **our** (наш)! Составь с ними фразу! ✨🐾`;
    }

    // 3. Greetings & Casual chit-chat
    if (lower.includes('привет') || lower.includes('здравствуй') || lower.includes('hello') || lower.includes('hi ') || lower === 'hi' || lower.includes('хай')) {
      return this.getRandomVariant([
        `🦊 Hello there, my bright star! Как твоё настроение сегодня? Готов пройти один урок и заработать кристаллы? Напиши мне любое слово, и мы его разберём! 🚀✨`,
        `🦊 Hi friend! Лисёнок Люми рад тебя видеть! Помни: всего 5-10 минут практики в день творят настоящие чудеса с твоим английским! С чего начнём сегодня? 🐾🌟`,
        `🦊 Good day, champion! Сегодня отличный день, чтобы выучить парочку крутых английских фраз. О чем бы ты хотел поговорить? 🎓✨`
      ]);
    }

    if (lower.includes('как дела') || lower.includes('как ты') || lower.includes('how are you')) {
      return this.getRandomVariant([
        `🦊 I am doing fantastic, thank you! («У меня всё просто замечательно, спасибо!») 💖 На английском можно ответить: *«I am doing great!»* [ай эм дуинг грэйт]. А как твои успехи? Готов к новым победам? 🐾✨`,
        `🦊 У меня отличное лисье настроение! 🦊 Готовлю для тебя новые интересные вопросы и награды в лавке! На английском вопрос «как дела?» звучит: *How are you doing?* или по-дружески: *What's up?* [уотс ап]! 🌟`,
        `🦊 I'm feeling wonderful! («Я чувствую себя чудесно!») Спасибо, что заботишься! Твоя серия дней вдохновляет меня. Давай сделаем сегодня ещё один шаг вперёд! 🔥✨`
      ]);
    }

    if (lower.includes('что делаешь') || lower.includes('чем занят') || lower.includes('what are you doing')) {
      return this.getRandomVariant([
        `🦊 Прямо сейчас я составляю для тебя новые классные уровни и повторяю полезные фразочки! 📚 На английском можно сказать: *I am practicing English right now!* («Я прямо сейчас практикую английский!»). Чем займёмся? 🐾✨`,
        `🦊 Сижу на травке под деревом и читаю интересную книжку про приключения! 🌲 На английском: *I am reading a good book.* А ты любишь читать? 🦊📖`
      ]);
    }

    if (lower.includes('кто ты') || lower.includes('как тебя зовут') || lower.includes('расскажи о себе') || lower.includes('who are you')) {
      return `🦊 Меня зовут Лисёнок Люми (Lumi the Fox)! 🦊 Я твой персональный наставник и верный друг в мире английского языка в Foxical. Я обожаю лесную чернику, помогать ученикам держать огонь серии 🔥 и радоваться твоим успехам! Задай мне любой вопрос по английскому! ✨🐾`;
    }

    if (lower.includes('познакомиться') || lower.includes('знакомств') || lower.includes('nice to meet you')) {
      return this.getRandomVariant([
        `🦊 Фраза для знакомства №1: **«Nice to meet you!»** [найс ту мит ю] — «Приятно познакомиться!» В ответ смело говори: **«Nice to meet you too!»** («Мне тоже приятно!») 👋✨`,
        `🦊 При знакомстве полезно спросить: **«What is your name?»** [уот из ёр нэйм] — «Как тебя зовут?» И ответить: **«My name is...»** («Меня зовут...»). Запомнилось? Потренируйся со мной! 🐾🌟`
      ]);
    }

    if (lower.includes('аппетит') || lower.includes('кушать') || lower.includes('еда') || lower.includes('bon appetit')) {
      return `🦊 В английском языке нет прямого дословного перевода фразы «приятного аппетита», поэтому чаще всего говорят: **«Enjoy your meal!»** [инˈджой ёр мил] («Наслаждайся едой!») 🍕 Или универсальное: **«Have a good lunch/dinner!»** Bon appétit! 😋✨`;
    }

    if (lower.includes('спокойной ночи') || lower.includes('good night') || lower.includes('спать')) {
      return `🦊 Спокойной ночи! На английском это звучит так: **«Good night!»** [гуд найт] 🌙 А если хочешь пожелать сладких снов: **«Sweet dreams!»** [суит дримз]. Набирайся сил для завтрашних открытий! 😴✨🐾`;
    }

    if (lower.includes('доброе утро') || lower.includes('good morning')) {
      return `🦊 Доброе утро! **«Good morning, sunshine!»** [гуд монинг, саншайн] ☀️ Пусть этот день будет наполнен бодростью, радостью и новыми знаниями! Заряжай свой streak на максимум! 🚀✨`;
    }

    if (lower.includes('спасибо') || lower.includes('благодар') || lower.includes('thank')) {
      return this.getRandomVariant([
        `🦊 You are very welcome! («Всегда пожалуйста!») 💖 На английском можно также сказать: **«Not at all!»** («Не за что!») или **«Anytime!»** («В любое время!»). Я всегда рядом! 🐾✨`,
        `🦊 My pleasure! («С превеликим удовольствием!») Ты очень вежливый ученик! Продолжай в том же духе, я горжусь твоим старанием! 🌟🦊`
      ]);
    }

    if (lower.includes('похвал') || lower.includes('молодец') || lower.includes('хорош') || lower.includes('good job') || lower.includes('proud')) {
      return this.getRandomVariant([
        `🦊 **You are doing an outstanding job!** («Ты делаешь потрясающую работу!») 🌟 Твоя настойчивость обязательно приведет к свободной речи на английском. Держи лисью звёздочку почёта! ⭐🐾`,
        `🦊 **Proud of you!** («Горжусь тобой!») 🔥 Каждый шаг, каждое выученное слово приближает тебя к цели. Ты настоящий чемпион Foxical! 🏆✨`
      ]);
    }

    if (lower.includes('устал') || lower.includes('сложно') || lower.includes('тяжело') || lower.includes('не могу')) {
      return this.getRandomVariant([
        `🦊 Не опускай лапки! 🐾 Все великие полиглоты начинали с нуля. В английском есть отличная пословица: **«Step by step is the way to go»** («Шаг за шагом — вот верный путь»). Сделай глубокий вдох, отдохни пару минут и возвращайся! Я верю в тебя! ❤️✨`,
        `🦊 It is okay to take a little rest! («Совершенно нормально немного передохнуть!») 🌿 Английский язык — это не спринт, а увлекательное путешествие. Главное — регулярность. Ты уже сделал больше, чем думаешь! 🌟🦊`
      ]);
    }

    if (lower.includes('шутк') || lower.includes('анекдот') || lower.includes('joke') || lower.includes('рассмеши')) {
      return this.getRandomVariant([
        `🦊 Лови английскую шутку-каламбур! 🦊\n**Q:** Why did the teacher wear sunglasses to school? 😎\n**A:** Because her students were too bright!\n*(Слово «bright» означает и «яркий», и «умный/способный»! Понял игру слов?)* 😂✨`,
        `🦊 Минутка юмора от Люми! 🐾\n**Q:** What do you call a bear with no teeth? 🐻\n**A:** A gummy bear! («Мармеладный мишка» — ведь toothless gum = десна!). Улыбнись, улыбка украшает! 😄🌟`
      ]);
    }

    if (lower.includes('пока') || lower.includes('до свидания') || lower.includes('bye') || lower.includes('goodbye') || lower.includes('увидимся')) {
      return this.getRandomVariant([
        `🦊 **See you later!** [си ю лэйтэр] («Увидимся позже!») 👋 Отличная работа сегодня, береги свою серию дней и заглядывай снова! 🐾✨`,
        `🦊 **Take care and have a wonderful day!** («Береги себя и отличного дня!») 🌟 До скорой встречи в Foxical! 🚀`
      ]);
    }

    // 4. Fallback with smart lexical suggestions
    return this.getRandomVariant([
      `🦊 Отличный интерес к английскому! 🌟 Попробуй сказать эту мысль на английском, например: **«Practice makes perfect»** («Практика ведёт к совершенству»)! Напиши мне любое конкретное слово (например: *собака, друг, время*) или спроси о грамматике! 🐾✨`,
      `🦊 Любопытный вопрос! 🐾 Чтобы свободно выражать мысли, полезно начать с простого шаблона: **«I think that...»** («Я думаю, что...») или **«In my opinion...»** («По моему мнению...»). О каком слове или правиле хочешь узнать подробнее? 🎓✨`,
      `🦊 Каждое новое слово — это суперсила! 💫 Спроси меня: *«Как сказать я люблю яблоки?»* или *«Объясни Past Simple»*, и я мгновенно помогу тебе всё разобрать по полочкам! 🦊🚀`
    ]);
  },

  /**
   * Helper to detect requests like "как сказать собака", "как по английски яблоко", "переведи кот"
   */
  detectTranslationRequest(lower) {
    const prefixes = [
      'как сказать', 'как по английски', 'как по-английски', 'как перевести',
      'что значит', 'перевод слова', 'переведи', 'переведи слово', 'как будет'
    ];

    for (const prefix of prefixes) {
      if (lower.includes(prefix)) {
        let extracted = lower.replace(prefix, '').replace(/[«»"'\?\.\!]/g, '').trim();
        // Check if extracted word is in dictionary
        for (const [key, item] of Object.entries(this.vocabulary)) {
          if (extracted.includes(key) || key.includes(extracted)) {
            return { wordRu: key, ...item };
          }
        }
        // If not in dictionary directly, return partial extraction
        if (extracted.length > 1) {
          return { wordRu: extracted, custom: true };
        }
      }
    }

    // Direct word matches from dictionary
    for (const [key, item] of Object.entries(this.vocabulary)) {
      if (lower === key || lower === `слово ${key}` || lower === `про ${key}`) {
        return { wordRu: key, ...item };
      }
    }

    return null;
  },

  /**
   * Formats a rich educational dictionary response
   */
  formatVocabularyResponse(entry) {
    if (entry.custom) {
      return `🦊 Чтобы выразить мысль «${entry.wordRu}» на английском, помни о прямом порядке слов: **Кто + Что делает + Где/Когда**! Например: *«I want to express this clearly»*. Напиши мне целое предложение, и мы разберём его по частям! 🐾✨`;
    }

    const openers = [
      `🦊 Слово «${entry.wordRu}» на английском будет: **${entry.en}** [${entry.trans}]!`,
      `🦊 «${entry.wordRu}» по-английски — это **${entry.en}** [${entry.trans}]! ✨`,
      `🦊 Отличное слово! «${entry.wordRu}» переводится как **${entry.en}** [${entry.trans}]. 🐾`
    ];
    const pickedOpener = openers[Math.floor(Math.random() * openers.length)];

    return `${pickedOpener}\nПример предложения: *«${entry.ex}»* (${entry.ru}).\nПопробуй произнести это вслух 3 раза для лучшего запоминания! 🗣️🌟`;
  },

  /**
   * Explains mistake when offline
   */
  generateSmartMistakeExplanation(question, userAnswer, correctStr) {
    const qTitle = question.title || '';
    const qPrompt = question.prompt || '';
    const combined = `${qTitle} ${qPrompt}`.toLowerCase();

    let ruleTip = `В английском языке порядок слов и форма глагола имеют ключевое значение.`;
    if (combined.includes('артикл') || correctStr === 'a' || correctStr === 'the' || correctStr === 'an') {
      ruleTip = `Артикль «a/an» используется перед исчисляемыми предметами в единственном числе, когда говорим о них впервые.`;
    } else if (combined.includes('present') || combined.includes('делает') || correctStr.endsWith('s')) {
      ruleTip = `Для местоимений He/She/It в настоящем времени к глаголу добавляется окончание «-s».`;
    } else if (combined.includes('множеств') || correctStr.endsWith('s') || correctStr.endsWith('es')) {
      ruleTip = `Множественное число большинства существительных образуется добавлением окончания «-s» или «-es».`;
    }

    return `🦊 Ошибки — это естественная ступенька к мастерству! 🐾\nПравильный ответ: **«${correctStr}»** (а твой вариант был «${userAnswer || 'другой'}»).\n💡 **Подсказка:** ${ruleTip}\nПовтори фразу вслух и попробуй ещё раз — у тебя обязательно всё получится! ✨`;
  },

  /**
   * Helper to pick a non-repeating variant
   */
  getRandomVariant(variants) {
    if (!variants || variants.length === 0) return '';
    if (variants.length === 1) return variants[0];

    // Filter out recently shown
    const candidates = variants.filter(v => !this.lastAnswersHistory.includes(v));
    const pool = candidates.length > 0 ? candidates : variants;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    this.lastAnswersHistory.push(picked);
    if (this.lastAnswersHistory.length > 6) {
      this.lastAnswersHistory.shift();
    }
    return picked;
  }
};
