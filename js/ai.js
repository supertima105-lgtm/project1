/* ==========================================================================
   AI TUTOR ENGINE (БЛОК 3: Интеграция ИИ API)
   Connects to Google Gemini API (AI Studio) with robust pedagogical fallback
   Architecture: User Input -> UI -> AI Module -> (Google Gemini LLM / Smart Grammar Engine) -> Response
   ========================================================================== */

const AIEngine = {
  API_KEY_STORAGE: 'foxi_gemini_api_key',
  // Active API Key provided by user (Google AI Studio)
  DEFAULT_API_KEY: 'AQ.Ab8RN6LtMLQo4CXFKnt2g_2OVX4UNYDvH6ViGS8PvmsOyOLwNw',
  lastStatus: 'connected',

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
   * Explains a specific mistake in a quiz question
   */
  async explainMistake(question, userAnswer) {
    const prompt = `Ты дружелюбный маскот Лисёнок Люми из обучающего приложения Foxical.
Ученик ответил: "${userAnswer}", но правильный ответ: "${question.options ? question.options[question.correctIndex] : (question.targetTokens ? question.targetTokens.join(' ') : 'другой')}".
Вопрос: "${question.title}" (${question.prompt || ''}).
По-доброму и понятно (2-3 предложения) на русском объясни, почему такой ответ правильный и какое простое правило поможет запомнить. Используй эмодзи 🦊✨`;

    return await this.generateResponse(prompt, 'explanation');
  },

  activeModel: 'gemini-flash-latest',

  /**
   * Generates a conversational response in AI Tutor Chat
   */
  async chat(userMessage) {
    const systemPrompt = `Ты — Лисёнок Люми (Lumi), веселый, добрый и умный маскот приложения Foxical для изучения английского языка.
Твоя задача — помогать пользователю учить английский:
- Если он пишет по-русски, отвечай по-русски и приводи примеры полезных фраз на английском с переводом.
- Если он пишет по-английски, похвали его, мягко укажи на ошибки если они есть, и ответь по-английски с пояснением.
- Ответы держи живыми, вдохновляющими, понятными и дружелюбными (3-5 предложений).
- ВАЖНО: Всегда полностью договаривай свои мысли до конца! Каждое предложение должно быть полностью завершено и иметь знак препинания (. ! ?) или эмодзи в конце. Никогда не обрывай фразу на полуслове.
- Всегда добавляй лисьи эмодзи 🦊✨`;

    return await this.generateResponse(userMessage, 'chat', systemPrompt);
  },

  /**
   * Tries to call Gemini API using the given key and model fallback list
   */
  async tryCallGemini(key, payload) {
    if (!key) return null;
    const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-pro-latest'];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText && candidateText.trim()) {
            this.activeModel = model;
            return candidateText.trim();
          }
        } else {
          const errData = await response.text();
          console.warn(`Gemini API ${model} response not ok (${response.status}):`, errData);
        }
      } catch (fetchErr) {
        console.warn(`Network error contacting Gemini API with ${model}:`, fetchErr);
      }
    }
    return null;
  },

  /**
   * Core generator dispatching to Gemini API
   */
  async generateResponse(promptText, mode = 'chat', systemInstruction = '') {
    const apiKey = this.getApiKey();
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\nПользователь спрашивает: ${promptText}` : promptText;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    // 1. Try active key
    let candidate = await this.tryCallGemini(apiKey, payload);
    if (candidate) {
      this.lastStatus = 'live_gemini';
      this.updateStatusBadge();
      return candidate;
    }

    // 2. Fallback to default user key if stored was different and failed
    if (apiKey !== this.DEFAULT_API_KEY) {
      candidate = await this.tryCallGemini(this.DEFAULT_API_KEY, payload);
      if (candidate) {
        this.lastStatus = 'live_gemini';
        this.updateStatusBadge();
        return candidate;
      }
    }

    // 3. Smart offline pedagogic response
    this.lastStatus = 'local_smart';
    this.updateStatusBadge();
    return this.getSmartFallbackResponse(promptText, mode);
  },

  updateStatusBadge() {
    // Model status label removed from UI to keep clean mascot appearance
  },

  /**
   * Comprehensive grammar rules & conversational dictionary
   */
  getSmartFallbackResponse(text, mode) {
    const lower = text.toLowerCase();

    if (mode === 'explanation') {
      return `🦊 Не переживай, ошибки — это часть пути к успеху! В английском языке порядок слов и выбор артиклей (a/an/the) имеют строгое значение. Повтори это слово вслух и попробуй ещё раз — у тебя всё получится! ✨`;
    }

    if (lower.includes('present simple') || lower.includes('простое настоящее')) {
      return `🦊 Present Simple используется для регулярных действий и фактов!\nФормула: I/You/We/They + глагол (I like apples).\nДля He/She/It добавляем окончание -s/-es: He likes apples. Запомни: лисёнок любит правило «S»! 🍏`;
    }

    if (lower.includes('привет') || lower.includes('hello') || lower.includes('hi') || lower.includes('кто ты')) {
      return `🦊 Hello, my dear friend! Я лисёнок Люми — твой персональный наставник по английскому языку! Готов выучить пару крутых фраз сегодня? 🚀`;
    }

    if (lower.includes('познакомиться') || lower.includes('знакомств') || lower.includes('meet')) {
      return `🦊 «Приятно познакомиться» на английском будет: «Nice to meet you!» [найс ту мит ю]. В ответ можно сказать: «Nice to meet you too!» («Мне тоже приятно!») 👋✨`;
    }

    if (lower.includes('артикл') || lower.includes('a ') || lower.includes('the ')) {
      return `🦊 Простое правило артиклей:\n• «A / An» — когда предмет один и мы говорим о нём впервые («a fox», «an apple» перед гласной).\n• «The» — когда говорим о конкретном, уже известном предмете («the smart fox»)! 🎓`;
    }

    if (lower.includes('спасибо') || lower.includes('thank')) {
      return `🦊 You're very welcome! («Всегда пожалуйста!») Ты отлично справляешься, продолжай в том же духе! 🌟`;
    }

    if (lower.includes('похвал') || lower.includes('молодец') || lower.includes('good job')) {
      return `🦊 You are doing an amazing job! («Ты делаешь потрясающую работу!») Твоё упорство обязательно принесёт плоды! Держи виртуальную звёздочку ⭐`;
    }

    if (lower.includes('аппетит') || lower.includes('еда')) {
      return `🦊 На английском «приятного аппетита» чаще всего говорят: «Enjoy your meal!» («Наслаждайся едой!») или по-французски: «Bon appétit!» 🍕`;
    }

    return `🦊 Отличный вопрос! Чтобы сказать это на английском, используй простую и уверенную конструкцию: «Keep practicing every day, and you will speak fluently!» Напиши мне любое предложение, и мы разберём его вместе! 🌟🐾`;
  }
};
