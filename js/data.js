/* ==========================================================================
   GAME CONTENT DATA: ENGLISH CURRICULUM, LEVELS, SHOP & ACHIEVEMENTS
   ========================================================================== */

const GAME_DATA = {
  // Course Information
  course: {
    id: 'en_basics',
    title: 'Английский для начинающих',
    targetLang: 'English',
    sourceLang: 'Русский',
    flag: '🇬🇧'
  },

  // Levels & Interactive Exercises
  levels: [
    {
      id: 1,
      title: 'Основы и приветствия',
      subtitle: 'Hello, Please, Thank you',
      icon: '👋',
      rewardXp: 20,
      rewardGems: 15,
      questions: [
        {
          type: 'choice',
          title: 'Как переводится «Привет»?',
          prompt: 'Привет',
          speakText: 'Hello',
          options: ['Hello', 'Goodbye', 'Apple', 'Water'],
          correctIndex: 0,
          explanation: '«Hello» или «Hi» — самые популярные способы поздороваться по-английски.'
        },
        {
          type: 'word_bank',
          title: 'Соберите фразу: «Меня зовут Люми»',
          prompt: 'Меня зовут Люми',
          speakText: 'My name is Lumi',
          targetTokens: ['My', 'name', 'is', 'lumi'],
          bankTokens: ['My', 'name', 'is', 'lumi', 'are', 'your', 'hello'],
          explanation: '«My name is...» — классическая грамматическая конструкция для знакомства.'
        },
        {
          type: 'matching',
          title: 'Соедините пары слов',
          pairs: [
            { en: 'Yes', ru: 'Да' },
            { en: 'No', ru: 'Нет' },
            { en: 'Please', ru: 'Пожалуйста' },
            { en: 'Thank you', ru: 'Спасибо' }
          ],
          explanation: 'Базовые слова вежливости в английском языке.'
        },
        {
          type: 'choice',
          title: 'Выберите верный перевод: «До свидания»',
          prompt: 'До свидания',
          speakText: 'Goodbye',
          options: ['Good night', 'Goodbye', 'Good morning', 'See me'],
          correctIndex: 1,
          explanation: '«Goodbye» переводится как «До свидания» или «Пока».'
        }
      ]
    },
    {
      id: 2,
      title: 'Еда и напитки',
      subtitle: 'Coffee, Tea, Bread & Water',
      icon: '☕',
      rewardXp: 25,
      rewardGems: 20,
      questions: [
        {
          type: 'choice',
          title: 'Выберите перевод слова «Вода»',
          prompt: 'Вода',
          speakText: 'Water',
          options: ['Milk', 'Coffee', 'Water', 'Tea'],
          correctIndex: 2,
          explanation: '«Water» [ˈwɔː.tər] переводится как «вода».'
        },
        {
          type: 'word_bank',
          title: 'Соберите фразу: «Я хочу кофе, пожалуйста»',
          prompt: 'Я хочу кофе, пожалуйста',
          speakText: 'I want coffee please',
          targetTokens: ['I', 'want', 'coffee', 'please'],
          bankTokens: ['I', 'want', 'coffee', 'please', 'tea', 'you', 'drink'],
          explanation: 'В английском: Подлежащее (I) + Сказуемое (want) + Дополнение (coffee) + вежливость (please).'
        },
        {
          type: 'matching',
          title: 'Найдите подходящие пары',
          pairs: [
            { en: 'Tea', ru: 'Чай' },
            { en: 'Bread', ru: 'Хлеб' },
            { en: 'Apple', ru: 'Яблоко' },
            { en: 'Coffee', ru: 'Кофе' }
          ],
          explanation: 'Популярные продукты в меню кафе.'
        },
        {
          type: 'choice',
          title: 'Что означает «an apple»?',
          prompt: 'an apple',
          speakText: 'an apple',
          options: ['Апельсин', 'Яблоко', 'Банан', 'Груша'],
          correctIndex: 1,
          explanation: 'Перед гласным звуком («a») используется артикль «an»: an apple.'
        }
      ]
    },
    {
      id: 3,
      title: 'Животные и природа',
      subtitle: 'The smart Fox, Dogs & Cats',
      icon: '🦊',
      rewardXp: 30,
      rewardGems: 25,
      questions: [
        {
          type: 'choice',
          title: 'Как переводится маскот «Лис» / «Лиса»?',
          prompt: 'Лис',
          speakText: 'Fox',
          options: ['Wolf', 'Fox', 'Bear', 'Cat'],
          correctIndex: 1,
          explanation: '«Fox» переводится как «Лис» или «Лисица».'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Лис очень умный»',
          prompt: 'Лис очень умный',
          speakText: 'The fox is very smart',
          targetTokens: ['The', 'fox', 'is', 'very', 'smart'],
          bankTokens: ['The', 'fox', 'is', 'very', 'smart', 'a', 'cute', 'dog'],
          explanation: 'С существительным в единственном числе используется глагол-связка «is».'
        },
        {
          type: 'matching',
          title: 'Соедините животных',
          pairs: [
            { en: 'Dog', ru: 'Собака' },
            { en: 'Cat', ru: 'Кошка' },
            { en: 'Bird', ru: 'Птица' },
            { en: 'Fish', ru: 'Рыба' }
          ],
          explanation: 'Названия домашних и диких животных.'
        },
        {
          type: 'choice',
          title: 'Переведите: «A cute cat»',
          prompt: 'A cute cat',
          speakText: 'A cute cat',
          options: ['Злая собака', 'Милая кошка', 'Большая птица', 'Умный лис'],
          correctIndex: 1,
          explanation: '«Cute» означает милый или симпатичный.'
        }
      ]
    },
    {
      id: 4,
      title: 'Город и путешествия',
      subtitle: 'Airport, Hotel & Taxi',
      icon: '✈️',
      rewardXp: 35,
      rewardGems: 30,
      questions: [
        {
          type: 'choice',
          title: 'Как спросить «Где отель?»',
          prompt: 'Где отель?',
          speakText: 'Where is the hotel?',
          options: ['Where is the hotel?', 'What is hotel?', 'Who is hotel?', 'How is hotel?'],
          correctIndex: 0,
          explanation: 'Вопросительное слово «Where» означает «Где» или «Куда».'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Мне нужно такси в аэропорт»',
          prompt: 'Мне нужно такси в аэропорт',
          speakText: 'I need a taxi to the airport',
          targetTokens: ['I', 'need', 'a', 'taxi', 'to', 'the', 'airport'],
          bankTokens: ['I', 'need', 'a', 'taxi', 'to', 'the', 'airport', 'hotel', 'train'],
          explanation: '«I need...» выражает потребность в чём-либо («Мне нужно...»).'
        },
        {
          type: 'matching',
          title: 'Соедините слова для путешествий',
          pairs: [
            { en: 'Airport', ru: 'Аэропорт' },
            { en: 'Train', ru: 'Поезд' },
            { en: 'Ticket', ru: 'Билет' },
            { en: 'Passport', ru: 'Паспорт' }
          ],
          explanation: 'Ключевые термины для вокзала и аэропорта.'
        }
      ]
    },
    {
      id: 5,
      title: 'Семья и друзья',
      subtitle: 'Family, Sister, Brother',
      icon: '👨‍👩‍👦',
      rewardXp: 40,
      rewardGems: 35,
      questions: [
        {
          type: 'choice',
          title: 'Переведите: «My best friend»',
          prompt: 'My best friend',
          speakText: 'My best friend',
          options: ['Мой лучший друг', 'Мой брат', 'Моя семья', 'Мой коллега'],
          correctIndex: 0,
          explanation: '«Best friend» переводится как «лучший друг».'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Я люблю мою семью»',
          prompt: 'Я люблю мою семью',
          speakText: 'I love my family',
          targetTokens: ['I', 'love', 'my', 'family'],
          bankTokens: ['I', 'love', 'my', 'family', 'brother', 'is', 'friend'],
          explanation: 'Простое настоящее время (Present Simple) для выражения чувств.'
        },
        {
          type: 'matching',
          title: 'Сопоставьте членов семьи',
          pairs: [
            { en: 'Mother', ru: 'Мама' },
            { en: 'Father', ru: 'Папа' },
            { en: 'Sister', ru: 'Сестра' },
            { en: 'Brother', ru: 'Брат' }
          ],
          explanation: 'Близкие родственники на английском.'
        }
      ]
    },
    {
      id: 6,
      title: 'Мини-босс: Проверка знаний',
      subtitle: 'Тест на знание первых пяти тем курса',
      icon: '⚔️',
      rewardXp: 45,
      rewardGems: 35,
      questions: [
        {
          type: 'choice',
          title: 'БОСС РАУНД 1: Выберите правильное приветствие вежливости',
          prompt: 'Nice to meet you',
          speakText: 'Nice to meet you',
          options: ['Приятно познакомиться', 'Сколько это стоит?', 'Где выход?', 'До завтра'],
          correctIndex: 0,
          explanation: '«Nice to meet you» говорится при знакомстве с новым человеком.'
        },
        {
          type: 'word_bank',
          title: 'БОСС РАУНД 2: Соберите фразу заказа',
          prompt: 'Я хочу чай и яблоко, пожалуйста',
          speakText: 'I want tea and an apple please',
          targetTokens: ['I', 'want', 'tea', 'and', 'an', 'apple', 'please'],
          bankTokens: ['I', 'want', 'tea', 'and', 'an', 'apple', 'please', 'coffee', 'the'],
          explanation: 'Сложное составное предложение с союзом «and» и артиклем «an».'
        },
        {
          type: 'matching',
          title: 'БОСС РАУНД 3: Быстрый блиц слов',
          pairs: [
            { en: 'Smart fox', ru: 'Умный лис' },
            { en: 'Big city', ru: 'Большой город' },
            { en: 'Good luck', ru: 'Удачи' },
            { en: 'Champion', ru: 'Чемпион' }
          ],
          explanation: 'Отличная работа с устойчивыми словосочетаниями!'
        }
      ]
    },
    {
      id: 7,
      title: 'Цвета и гардероб',
      subtitle: 'Colors, Jacket, Shoes & T-shirt',
      icon: '🎨',
      rewardXp: 50,
      rewardGems: 30,
      questions: [
        {
          type: 'choice',
          title: 'Как переводится цвет «Синий»?',
          prompt: 'Синий',
          speakText: 'Blue',
          options: ['Red', 'Blue', 'Green', 'Yellow'],
          correctIndex: 1,
          explanation: '«Blue» [bluː] — синий или голубой цвет.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Я ношу красную куртку»',
          prompt: 'Я ношу красную куртку',
          speakText: 'I wear a red jacket',
          targetTokens: ['I', 'wear', 'a', 'red', 'jacket'],
          bankTokens: ['I', 'wear', 'a', 'red', 'jacket', 'blue', 'shoes', 'she'],
          explanation: 'Глагол «wear» означает носить одежду.'
        },
        {
          type: 'matching',
          title: 'Соедините цвета',
          pairs: [
            { en: 'Red', ru: 'Красный' },
            { en: 'Green', ru: 'Зелёный' },
            { en: 'Black', ru: 'Чёрный' },
            { en: 'White', ru: 'Белый' }
          ],
          explanation: 'Базовая палитра цветов в английском языке.'
        },
        {
          type: 'choice',
          title: 'Что означает фраза «My new shoes»?',
          prompt: 'My new shoes',
          speakText: 'My new shoes',
          options: ['Моя старая куртка', 'Моя новая обувь', 'Моя белая рубашка', 'Мои синие джинсы'],
          correctIndex: 1,
          explanation: '«New» — новый, «shoes» — туфли или обувь.'
        }
      ]
    },
    {
      id: 8,
      title: 'Дом и уют',
      subtitle: 'House, Kitchen, Table & Door',
      icon: '🏠',
      rewardXp: 55,
      rewardGems: 35,
      questions: [
        {
          type: 'choice',
          title: 'В какой комнате обычно готовят еду?',
          prompt: 'Кухня',
          speakText: 'Kitchen',
          options: ['Bedroom', 'Kitchen', 'Bathroom', 'Garden'],
          correctIndex: 1,
          explanation: '«Kitchen» — кухня, а «Bedroom» — спальня.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Книга лежит на столе»',
          prompt: 'Книга лежит на столе',
          speakText: 'The book is on the table',
          targetTokens: ['The', 'book', 'is', 'on', 'the', 'table'],
          bankTokens: ['The', 'book', 'is', 'on', 'the', 'table', 'chair', 'under'],
          explanation: 'Предлог «on» указывает на нахождение на поверхности.'
        },
        {
          type: 'matching',
          title: 'Соедините предметы дома',
          pairs: [
            { en: 'Door', ru: 'Дверь' },
            { en: 'Window', ru: 'Окно' },
            { en: 'Table', ru: 'Стол' },
            { en: 'Bed', ru: 'Кровать' }
          ],
          explanation: 'Основные предметы мебели и интерьера.'
        },
        {
          type: 'choice',
          title: 'Переведите: «Open the window, please»',
          prompt: 'Open the window, please',
          speakText: 'Open the window please',
          options: ['Закрой дверь', 'Открой окно, пожалуйста', 'Помой пол', 'Включи свет'],
          correctIndex: 1,
          explanation: 'Глагол «open» переводится как «открыть».'
        }
      ]
    },
    {
      id: 9,
      title: 'Профессии и карьера',
      subtitle: 'Doctor, Teacher, Office & Work',
      icon: '💼',
      rewardXp: 60,
      rewardGems: 35,
      questions: [
        {
          type: 'choice',
          title: 'Кто учит детей в школе?',
          prompt: 'Учитель',
          speakText: 'Teacher',
          options: ['Doctor', 'Driver', 'Teacher', 'Pilot'],
          correctIndex: 2,
          explanation: '«Teacher» — учитель, образовано от глагола «teach» (учить).'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Мой отец — врач»',
          prompt: 'Мой отец — врач',
          speakText: 'My father is a doctor',
          targetTokens: ['My', 'father', 'is', 'a', 'doctor'],
          bankTokens: ['My', 'father', 'is', 'a', 'doctor', 'teacher', 'work', 'the'],
          explanation: 'Перед названиями профессий ставится неопределённый артикль: a doctor.'
        },
        {
          type: 'matching',
          title: 'Соедините профессии',
          pairs: [
            { en: 'Doctor', ru: 'Врач' },
            { en: 'Teacher', ru: 'Учитель' },
            { en: 'Driver', ru: 'Водитель' },
            { en: 'Engineer', ru: 'Инженер' }
          ],
          explanation: 'Популярные профессии в английском языке.'
        },
        {
          type: 'choice',
          title: 'Переведите: «She works in an office»',
          prompt: 'She works in an office',
          speakText: 'She works in an office',
          options: ['Она учится в школе', 'Она работает в офисе', 'Он живёт в городе', 'Она отдыхает дома'],
          correctIndex: 1,
          explanation: 'Глагол «works» с окончанием -s для местоимения she (она).'
        }
      ]
    },
    {
      id: 10,
      title: 'Время, дни и числа',
      subtitle: 'Monday, Friday, Clock & Numbers',
      icon: '⏰',
      rewardXp: 65,
      rewardGems: 40,
      questions: [
        {
          type: 'choice',
          title: 'Как по-английски «Понедельник»?',
          prompt: 'Понедельник',
          speakText: 'Monday',
          options: ['Sunday', 'Monday', 'Friday', 'Wednesday'],
          correctIndex: 1,
          explanation: 'В английском дни недели всегда пишутся с заглавной буквы: Monday.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Увидимся в пятницу»',
          prompt: 'Увидимся в пятницу',
          speakText: 'See you on Friday',
          targetTokens: ['See', 'you', 'on', 'Friday'],
          bankTokens: ['See', 'you', 'on', 'Friday', 'today', 'tomorrow', 'at'],
          explanation: 'С днями недели используется предлог «on»: on Friday.'
        },
        {
          type: 'matching',
          title: 'Соедините временные рамки',
          pairs: [
            { en: 'Today', ru: 'Сегодня' },
            { en: 'Tomorrow', ru: 'Завтра' },
            { en: 'Weekend', ru: 'Выходные' },
            { en: 'Morning', ru: 'Утро' }
          ],
          explanation: 'Слова для планирования времени и встреч.'
        },
        {
          type: 'choice',
          title: 'Как спросить: «Который сейчас час?»',
          prompt: 'Который час?',
          speakText: 'What time is it?',
          options: ['What time is it?', 'Where is time?', 'How much hour?', 'When is clock?'],
          correctIndex: 0,
          explanation: '«What time is it?» — стандартный вопрос о точном времени.'
        }
      ]
    },
    {
      id: 11,
      title: 'Чувства и эмоции',
      subtitle: 'Happy, Tired, Hungry & Good',
      icon: '😊',
      rewardXp: 70,
      rewardGems: 40,
      questions: [
        {
          type: 'choice',
          title: 'Что сказать, если вы хотите есть?',
          prompt: 'Я голоден',
          speakText: 'I am hungry',
          options: ['I am thirsty', 'I am hungry', 'I am sleepy', 'I am angry'],
          correctIndex: 1,
          explanation: '«Hungry» — голодный, а «thirsty» — хотящий пить.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Сегодня я очень счастлив»',
          prompt: 'Сегодня я очень счастлив',
          speakText: 'I am very happy today',
          targetTokens: ['I', 'am', 'very', 'happy', 'today'],
          bankTokens: ['I', 'am', 'very', 'happy', 'today', 'tired', 'sad', 'is'],
          explanation: 'С местоимением «I» всегда употребляется форма глагола «am».'
        },
        {
          type: 'matching',
          title: 'Соедините эмоции',
          pairs: [
            { en: 'Happy', ru: 'Счастливый' },
            { en: 'Sad', ru: 'Грустный' },
            { en: 'Tired', ru: 'Уставший' },
            { en: 'Strong', ru: 'Сильный' }
          ],
          explanation: 'Прилагательные, описывающие самочувствие и настроение.'
        },
        {
          type: 'choice',
          title: 'Как вежливо спросить: «Ты в порядке?»',
          prompt: 'Ты в порядке?',
          speakText: 'Are you okay?',
          options: ['How are you car?', 'Are you okay?', 'Who are you?', 'Why is fine?'],
          correctIndex: 1,
          explanation: '«Are you okay?» или «Are you alright?» — искренний вопрос заботы.'
        }
      ]
    },
    {
      id: 12,
      title: 'Хобби и увлечения',
      subtitle: 'Music, Football, Books & Games',
      icon: '⚽',
      rewardXp: 75,
      rewardGems: 45,
      questions: [
        {
          type: 'choice',
          title: 'Какой предмет относится к музыке?',
          prompt: 'Гитара',
          speakText: 'Guitar',
          options: ['Football', 'Guitar', 'Chess', 'Swimming'],
          correctIndex: 1,
          explanation: '«Guitar» — музыкальный инструмент гитара.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Я люблю играть в футбол»',
          prompt: 'Я люблю играть в футбол',
          speakText: 'I like to play football',
          targetTokens: ['I', 'like', 'to', 'play', 'football'],
          bankTokens: ['I', 'like', 'to', 'play', 'football', 'guitar', 'music', 'she'],
          explanation: 'Конструкция «like to + глагол» означает «любить делать что-то».'
        },
        {
          type: 'matching',
          title: 'Соедините хобби и развлечения',
          pairs: [
            { en: 'Book', ru: 'Книга' },
            { en: 'Music', ru: 'Музыка' },
            { en: 'Game', ru: 'Игра' },
            { en: 'Cinema', ru: 'Кинотеатр' }
          ],
          explanation: 'Любимые способы провести свободное время.'
        },
        {
          type: 'choice',
          title: 'Переведите фразу: «Listen to this song»',
          prompt: 'Listen to this song',
          speakText: 'Listen to this song',
          options: ['Спой эту песню', 'Послушай эту песню', 'Прочитай эту книгу', 'Сыграй в игру'],
          correctIndex: 1,
          explanation: 'Глагол «listen to» переводится как «слушать кого-то или что-то».'
        }
      ]
    },
    {
      id: 13,
      title: 'Покупки и кафе',
      subtitle: 'Shopping, Bill, Price & Menu',
      icon: '🛍️',
      rewardXp: 80,
      rewardGems: 50,
      questions: [
        {
          type: 'choice',
          title: 'Как спросить в магазине: «Сколько это стоит?»',
          prompt: 'Сколько это стоит?',
          speakText: 'How much is this?',
          options: ['How much is this?', 'Where is cost?', 'What price here?', 'How many it?'],
          correctIndex: 0,
          explanation: '«How much is this?» — главная фраза для покупок за границей.'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Можно мне счёт, пожалуйста?»',
          prompt: 'Можно мне счёт, пожалуйста?',
          speakText: 'Can I have the bill please',
          targetTokens: ['Can', 'I', 'have', 'the', 'bill', 'please'],
          bankTokens: ['Can', 'I', 'have', 'the', 'bill', 'please', 'menu', 'water'],
          explanation: '«The bill» в ресторанах Великобритании — это чек или счёт.'
        },
        {
          type: 'matching',
          title: 'Соедините слова для покупок',
          pairs: [
            { en: 'Price', ru: 'Цена' },
            { en: 'Money', ru: 'Деньги' },
            { en: 'Cash', ru: 'Наличные' },
            { en: 'Card', ru: 'Карта' }
          ],
          explanation: 'Термины для оплаты товаров и услуг.'
        },
        {
          type: 'choice',
          title: 'Что спрашивает продавец: «Cash or card?»',
          prompt: 'Cash or card?',
          speakText: 'Cash or card?',
          options: ['Чай или кофе?', 'Наличными или картой?', 'С собой или здесь?', 'Пакет нужен?'],
          correctIndex: 1,
          explanation: 'Выбор способа оплаты: наличные (cash) или карта (card).'
        }
      ]
    },
    {
      id: 14,
      title: 'Погода и времена года',
      subtitle: 'Sunny, Rain, Summer & Snow',
      icon: '☀️',
      rewardXp: 85,
      rewardGems: 50,
      questions: [
        {
          type: 'choice',
          title: 'Какое сейчас время года, если идёт снег?',
          prompt: 'Зима',
          speakText: 'Winter',
          options: ['Summer', 'Spring', 'Winter', 'Autumn'],
          correctIndex: 2,
          explanation: '«Winter» — зима, когда выпадает снег («snow»).'
        },
        {
          type: 'word_bank',
          title: 'Соберите: «Сегодня тёплый солнечный день»',
          prompt: 'Сегодня тёплый солнечный день',
          speakText: 'It is a warm sunny day',
          targetTokens: ['It', 'is', 'a', 'warm', 'sunny', 'day'],
          bankTokens: ['It', 'is', 'a', 'warm', 'sunny', 'day', 'cold', 'rain'],
          explanation: 'Безличные предложения о погоде строятся с «It is...».'
        },
        {
          type: 'matching',
          title: 'Соедините времена года и погоду',
          pairs: [
            { en: 'Summer', ru: 'Лето' },
            { en: 'Winter', ru: 'Зима' },
            { en: 'Rain', ru: 'Дождь' },
            { en: 'Sun', ru: 'Солнце' }
          ],
          explanation: 'Ключевые слова для разговоров о погоде.'
        },
        {
          type: 'choice',
          title: 'Переведите комплимент дню: «The weather is beautiful»',
          prompt: 'The weather is beautiful',
          speakText: 'The weather is beautiful',
          options: ['Погода холодная', 'Погода прекрасная', 'Скоро пойдёт дождь', 'На улице туман'],
          correctIndex: 1,
          explanation: '«Weather» — погода, «beautiful» — прекрасная, чудесная.'
        }
      ]
    },
    {
      id: 15,
      title: 'ГРАНД БОСС: Испытание Люми',
      subtitle: 'Финальный супер-экзамен всего курса A1!',
      icon: '👑',
      isBoss: true,
      rewardXp: 120,
      rewardGems: 120,
      questions: [
        {
          type: 'choice',
          title: 'БОСС РАУНД 1: Выберите фразу уверенного знания языка',
          prompt: 'I speak English very well',
          speakText: 'I speak English very well',
          options: ['Я говорю по-английски очень хорошо', 'Я совсем не понимаю язык', 'Где мой переводчик?', 'Я говорю только по-русски'],
          correctIndex: 0,
          explanation: '«Very well» означает отлично, очень хорошо!'
        },
        {
          type: 'word_bank',
          title: 'БОСС РАУНД 2: Соберите фразу путешественника',
          prompt: 'Я хочу путешествовать по всему миру',
          speakText: 'I want to travel around the world',
          targetTokens: ['I', 'want', 'to', 'travel', 'around', 'the', 'world'],
          bankTokens: ['I', 'want', 'to', 'travel', 'around', 'the', 'world', 'city', 'hotel'],
          explanation: 'Конструкция «want to travel around the world» — мечта каждого полиглота!'
        },
        {
          type: 'matching',
          title: 'БОСС РАУНД 3: Блиц супер-слов',
          pairs: [
            { en: 'Superstar', ru: 'Суперзвезда' },
            { en: 'Knowledge', ru: 'Знания' },
            { en: 'Victory', ru: 'Победа' },
            { en: 'Luminary', ru: 'Светило' }
          ],
          explanation: 'Слова истинного победителя курса!'
        },
        {
          type: 'choice',
          title: 'БОСС РАУНД 4: Что означает поговорка «Practice makes perfect»?',
          prompt: 'Practice makes perfect',
          speakText: 'Practice makes perfect',
          options: ['Повторение — мать учения (практика ведёт к мастерству)', 'Никогда не начинай учиться поздно', 'Сложные задачи решай один', 'Учись только по фильмам'],
          correctIndex: 0,
          explanation: 'Главный девиз Люми: регулярная практика делает знания безупречными!'
        }
      ]
    }
  ],

  // Shop Catalog (Only game perks & utilities - no skins)
  shopItems: [
    {
      id: 'hearts_refill',
      name: 'Полное исцеление (5 Сердец)',
      desc: 'Мгновенно восстанавливает все жизни для продолжения уроков',
      icon: '❤️',
      price: 25,
      type: 'consumable',
      action: 'refill_hearts'
    },
    {
      id: 'streak_freeze',
      name: 'Заморозка Ударного режима',
      desc: 'Защищает вашу серию дней от сброса при случайном пропуске',
      icon: '🧊',
      price: 40,
      type: 'perk',
      action: 'streak_freeze'
    },
    {
      id: 'bonus_xp',
      name: 'Эликсир Опыта (+50 XP)',
      desc: 'Мгновенно даёт 50 очков опыта для продвижения в лиге',
      icon: '⚡',
      price: 35,
      type: 'consumable',
      action: 'bonus_xp'
    },
    {
      id: 'double_rewards',
      name: 'Зелье х2 наград',
      desc: 'Удваивает весь опыт (XP) и кристаллы (💎) за следующий пройденный урок',
      icon: '🧪',
      price: 30,
      type: 'booster',
      action: 'double_rewards'
    }
  ],

  // Achievements & Trophies
  achievements: [
    {
      id: 'first_step',
      name: 'Первый шаг к успеху',
      desc: 'Завершите свой первый урок',
      icon: '🌱',
      requirement: { type: 'levels_completed', count: 1 }
    },
    {
      id: 'streak_3',
      name: 'Огненный энтузиаст',
      desc: 'Достигните 3 дней ударного режима',
      icon: '🔥',
      requirement: { type: 'streak', count: 3 }
    },
    {
      id: 'gem_collector',
      name: 'Кристальный магнат',
      desc: 'Накопите суммарно 100 кристаллов',
      icon: '💎',
      requirement: { type: 'gems_earned', count: 100 }
    },
    {
      id: 'curious_mind',
      name: 'Любознательный ум',
      desc: 'Пообщайтесь с лисёнком Люми в режиме диалога',
      icon: '💡',
      requirement: { type: 'chat_with_lumi', count: 1 }
    },
    {
      id: 'boss_slayer',
      name: 'Повелитель английского',
      desc: 'Пройдите финального босса',
      icon: '🏆',
      requirement: { type: 'boss_completed', count: 1 }
    }
  ],

  // Daily Quests (Задания дня)
  dailyQuests: [
    {
      id: 'quest_xp',
      title: 'Получите 20 очков опыта',
      icon: '⚡',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      target: 20,
      rewardGems: 10,
      type: 'xp'
    },
    {
      id: 'quest_perfect',
      title: 'Пройдите 1 урок без потери сердец',
      icon: '❤️',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      target: 1,
      rewardGems: 15,
      type: 'perfect_lesson'
    },
    {
      id: 'quest_chat',
      title: 'Задайте вопрос лисёнку Люми',
      icon: '🦊',
      iconBg: '#FFF4ED',
      iconColor: '#EA580C',
      target: 1,
      rewardGems: 10,
      type: 'chat_lumi'
    },
    {
      id: 'quest_words',
      title: 'Соберите 3 фразы из блоков слов',
      icon: '📖',
      iconBg: '#F0FDF4',
      iconColor: '#16A34A',
      target: 3,
      rewardGems: 10,
      type: 'word_bank'
    }
  ],

  // Monthly Challenge (Марафон месяца)
  monthlyChallenge: {
    id: 'marathon_gold',
    title: 'Золотой кубок месяца',
    desc: 'Выполните 3 ежедневных задания и заберите суперприз!',
    target: 3,
    rewardGems: 50,
    rewardXp: 100
  }
};
