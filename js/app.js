/* ==========================================================================
   APP ENGINE & GAMEPLAY CONTROLLER (Foxical / Lumi English)
   ========================================================================== */

const App = {
  activeScreen: 'learn',
  currentLesson: null,
  currentQuestionIndex: 0,
  selectedAnswer: null,
  wordBankPlaced: [],
  matchingSelected: null,
  matchingPairsLeft: 0,
  hasAnsweredCurrent: false,

  async init() {
    AuthDB.init();
    this.bindEvents();
    this.initConfetti();

    // 1. Check for 1-Click QR Code / Magic Link Login from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quickAuth = urlParams.get('quick_auth');
    if (quickAuth) {
      try {
        const creds = JSON.parse(decodeURIComponent(atob(quickAuth)));
        if (creds && creds.email) {
          window.history.replaceState({}, document.title, window.location.pathname);
          const loginRes = await AuthDB.login(creds.email, creds.pass || '');
          if (!loginRes.success) {
            await AuthDB.register(creds.name || 'Ученик', creds.email, creds.pass || '');
          }
          this.showInAppToast('Вход по QR-коду! 📱', `С возвращением, ${AuthDB.currentUser?.name}!`, '✨');
        }
      } catch (err) {
        console.warn('Quick auth parse error:', err);
      }
    }

    // 2. Check if user is authenticated (email or guest)
    if (!AuthDB.currentUser) {
      this.showAuthModal(true);
      return;
    }

    this.updateTopBarStats();
    this.renderRoadmap();
    this.renderQuests();
    this.renderShop();
    this.renderLumiRoom();
    this.renderProfile();
    console.log('Foxical Initialized for user:', AuthDB.currentUser?.name);

    // Asynchronously sync cloud profile from Supabase to keep Phone and PC in sync
    const syncRes = await AuthDB.syncLatestCloudProfile();
    if (syncRes && syncRes.hasNewProgress) {
      this.updateTopBarStats();
      this.renderRoadmap();
      this.renderQuests();
      this.renderProfile();
      this.showInAppToast('Синхронизация ☁️', `Загружен прогресс с другого устройства! Пройдено уровней: ${syncRes.completedCount}, Опыт: ${syncRes.xp} XP`, '✨');
    }
  },

  // -------------------------------------------------------------
  // EVENT BINDINGS
  // -------------------------------------------------------------
  bindEvents() {
    // Bottom Tab Bar (Regular tabs and elevated center button)
    document.querySelectorAll('.nav-tab, .nav-tab-center').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const screen = tab.getAttribute('data-screen');
        if (screen) {
          SoundFX.playTap();
          this.switchScreen(screen);
        }
      });
    });

    // Enter key in Lumi Room question input
    const lumiInput = document.getElementById('lumi-room-input');
    if (lumiInput) {
      lumiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleLumiRoomAsk();
        }
      });
    }
  },

  // -------------------------------------------------------------
  // SCREEN NAVIGATION
  // -------------------------------------------------------------
  switchScreen(screenId) {
    this.activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab, .nav-tab-center').forEach(t => t.classList.remove('active'));

    const targetScreen = document.getElementById(`screen-${screenId}`);
    if (targetScreen) targetScreen.classList.add('active');

    const activeTab = document.querySelector(`[data-screen="${screenId}"]`);
    if (activeTab) activeTab.classList.add('active');

    if (screenId === 'learn') this.renderRoadmap();
    if (screenId === 'quests') this.renderQuests();
    if (screenId === 'shop') this.renderShop();
    if (screenId === 'lumi') this.renderLumiRoom();
    if (screenId === 'profile') this.renderProfile();
  },

  // -------------------------------------------------------------
  // TOP BAR STATS
  // -------------------------------------------------------------
  updateTopBarStats(animateType = null) {
    const user = AuthDB.currentUser;
    if (!user) return;

    const streakEl = document.getElementById('stat-streak');
    const gemsEl = document.getElementById('stat-gems');
    const heartsEl = document.getElementById('stat-hearts');
    const boosterWrap = document.getElementById('stat-booster-wrap');
    const boosterCount = document.getElementById('stat-booster-count');

    if (streakEl) streakEl.innerText = user.streak || 1;

    if (gemsEl) {
      gemsEl.innerText = user.gems || 0;
      if (animateType === 'gems') {
        gemsEl.classList.remove('anim-count-pop');
        void gemsEl.offsetWidth;
        gemsEl.classList.add('anim-count-pop');
      }
    }

    if (heartsEl) {
      heartsEl.innerText = user.hearts || 0;
      if (animateType === 'hearts') {
        heartsEl.classList.remove('anim-count-pop');
        void heartsEl.offsetWidth;
        heartsEl.classList.add('anim-count-pop');
      }
    }

    if (boosterWrap && boosterCount) {
      if (user.doubleRewardsPotions && user.doubleRewardsPotions > 0) {
        boosterWrap.style.display = 'inline-flex';
        boosterCount.innerText = `х2 (${user.doubleRewardsPotions})`;
        if (animateType === 'double_rewards' || animateType === 'booster') {
          boosterWrap.classList.remove('anim-bump');
          void boosterWrap.offsetWidth;
          boosterWrap.classList.add('anim-bump');
        }
      } else {
        boosterWrap.style.display = 'none';
      }
    }
  },

  // -------------------------------------------------------------
  // ROADMAP (LEARN TAB)
  // -------------------------------------------------------------
  renderRoadmap() {
    const user = AuthDB.currentUser;
    const pathEl = document.getElementById('roadmap-path');
    const mascotBubbleEl = document.getElementById('roadmap-mascot-avatar');
    if (!pathEl || !user) return;

    if (mascotBubbleEl) {
      MascotEngine.mount('roadmap-mascot-avatar', 'happy', 52);
    }

    pathEl.innerHTML = '';

    const completed = new Set(user.completedLevels || []);

    // Determine currently active level (first unlocked but not yet completed level)
    let activeLevelId = null;
    for (let i = 0; i < GAME_DATA.levels.length; i++) {
      const lvl = GAME_DATA.levels[i];
      const isCompleted = completed.has(lvl.id);
      const isUnlocked = lvl.id === 1 || completed.has(GAME_DATA.levels[i - 1].id);
      if (isUnlocked && !isCompleted) {
        activeLevelId = lvl.id;
        break;
      }
    }
    // If all levels are completed, point active indicator to the last level
    if (!activeLevelId && GAME_DATA.levels.length > 0) {
      activeLevelId = GAME_DATA.levels[GAME_DATA.levels.length - 1].id;
    }

    GAME_DATA.levels.forEach((lvl, idx) => {
      const isCompleted = completed.has(lvl.id);
      const isUnlocked = lvl.id === 1 || completed.has(GAME_DATA.levels[idx - 1].id);
      const isActive = lvl.id === activeLevelId;

      // Alternating zig-zag curve layout like Duolingo
      const row = document.createElement('div');
      row.className = 'node-row';
      const isShiftLeft = (idx % 3 === 1);
      const isShiftRight = (idx % 3 === 2);
      if (isShiftLeft) row.classList.add('shift-left');
      if (isShiftRight) row.classList.add('shift-right');

      const nodeBtn = document.createElement('div');
      nodeBtn.className = `level-node ${isCompleted ? 'completed' : ''} ${!isUnlocked ? 'locked' : ''} ${lvl.isBoss ? 'boss-node' : ''} ${isActive && isUnlocked ? 'current-active' : ''}`;

      if (isCompleted) {
        nodeBtn.innerHTML = `
          <div class="node-stars">⭐⭐⭐</div>
          <span>${lvl.icon}</span>
        `;
      } else if (!isUnlocked) {
        nodeBtn.innerHTML = `<span>🔒</span>`;
      } else {
        nodeBtn.innerHTML = `<span>${lvl.icon}</span>`;
      }

      // Add "НАЧАТЬ ▶" badge above active node
      if (isActive && isUnlocked) {
        const tooltip = document.createElement('div');
        tooltip.className = 'start-node-tooltip';
        tooltip.innerText = 'НАЧАТЬ ▶';
        nodeBtn.appendChild(tooltip);
      }

      nodeBtn.title = lvl.title;

      nodeBtn.addEventListener('click', () => {
        if (!isUnlocked) {
          SoundFX.playIncorrect();
          this.showInAppToast('Уровень заблокирован', 'Сначала пройдите предыдущий уровень!', '🔒');
          return;
        }
        if (user.hearts <= 0) {
          SoundFX.playIncorrect();
          this.showOutOfHeartsModal();
          return;
        }
        SoundFX.playTap();
        this.startLesson(lvl);
      });

      row.appendChild(nodeBtn);

      // Cheering Mascot Standing Beside Active Node (Duolingo style)
      if (isActive && isUnlocked) {
        const sideMascot = document.createElement('div');
        sideMascot.className = `roadmap-side-mascot ${isShiftRight ? 'on-left' : ''}`;
        sideMascot.innerHTML = `
          <div class="mascot-island-speech">Вперёд! 🦊</div>
          <img src="assets/lumi/happy.png" alt="Lumi" class="mascot-island-img" />
          <div class="mascot-island-base"></div>
        `;
        sideMascot.title = 'Поговорить с Люми';
        sideMascot.addEventListener('click', () => {
          SoundFX.playTap();
          this.switchScreen('lumi');
        });
        row.appendChild(sideMascot);
      }

      pathEl.appendChild(row);

      // Milestone Treasure Chest between Level 3 and Level 4
      if (lvl.id === 3) {
        const chestRow = document.createElement('div');
        chestRow.className = 'node-row';

        const isLvl3Done = completed.has(3);
        const isChestClaimed = (user.claimedChests || []).includes('chest_level_3');

        let chestClass = 'roadmap-chest-node';
        let chestHtml = '';

        if (isChestClaimed) {
          chestClass += ' claimed';
          chestHtml = `
            <div class="chest-icon">📦</div>
            <div class="chest-label">Сундук открыт ✓</div>
          `;
        } else if (isLvl3Done) {
          chestClass += ' ready';
          chestHtml = `
            <div class="chest-tooltip">ОТКРЫТЬ! +30 💎</div>
            <div class="chest-icon">🎁</div>
            <div class="chest-label">Забрать награду!</div>
          `;
        } else {
          chestClass += ' locked';
          chestHtml = `
            <div class="chest-icon">🔒</div>
            <div class="chest-label">Сундук (Уровень 3)</div>
          `;
        }

        const chestEl = document.createElement('div');
        chestEl.className = chestClass;
        chestEl.innerHTML = chestHtml;
        chestEl.addEventListener('click', () => {
          this.handleRoadmapChestClick('chest_level_3', isLvl3Done, isChestClaimed);
        });

        chestRow.appendChild(chestEl);
        pathEl.appendChild(chestRow);
      }
    });

    // Milestone Finish Gate Trophy at the end of Chapter 1
    const finishGate = document.createElement('div');
    finishGate.className = 'roadmap-finish-gate';
    finishGate.innerHTML = `
      <div class="gate-trophy">🏆</div>
      <div class="gate-title">Раздел 1: Знакомство и основы</div>
      <div class="gate-sub">Пройдите финального босса и завершите модуль!</div>
    `;
    pathEl.appendChild(finishGate);
  },

  handleRoadmapChestClick(chestId, isUnlocked, isClaimed) {
    if (isClaimed) {
      this.showInAppToast('Сундук уже открыт', 'Вы уже забрали 30 💎 и зелье х2', '📦');
      return;
    }
    if (!isUnlocked) {
      SoundFX.playIncorrect();
      this.showInAppToast('Сундук заблокирован', 'Пройдите первые 3 уровня!', '🔒');
      return;
    }

    const user = AuthDB.currentUser;
    user.claimedChests = user.claimedChests || [];
    user.claimedChests.push(chestId);
    user.gems = (user.gems || 0) + 30;
    user.doubleRewardsPotions = (user.doubleRewardsPotions || 0) + 1;

    SoundFX.playVictory();
    this.launchConfetti();
    this.showInAppToast('Сундук открыт! 🎁', '+30 💎 и +1 🧪 Зелье х2 наград!', '🎁');

    AuthDB.saveProgress({
      gems: user.gems,
      doubleRewardsPotions: user.doubleRewardsPotions,
      claimedChests: user.claimedChests
    });

    this.updateTopBarStats();
    this.renderRoadmap();
  },

  // -------------------------------------------------------------
  // LESSON SYSTEM & QUIZ RUNNER
  // -------------------------------------------------------------
  startLesson(level) {
    this.currentLesson = level;
    this.currentQuestionIndex = 0;
    this.hasAnsweredCurrent = false;

    const user = AuthDB.currentUser;
    this.lessonStartHearts = user?.hearts || 5;

    const boosterBadge = document.getElementById('lesson-booster-badge');
    if (boosterBadge) {
      if (user && user.doubleRewardsPotions && user.doubleRewardsPotions > 0) {
        boosterBadge.style.display = 'inline-flex';
        boosterBadge.innerText = `🧪 х2 НАГРАДЫ (${user.doubleRewardsPotions})`;
      } else {
        boosterBadge.style.display = 'none';
      }
    }

    const lessonScreen = document.getElementById('screen-lesson');
    lessonScreen.classList.add('active');

    this.renderCurrentQuestion();
  },

  closeLesson() {
    if (confirm('Прервать урок? Несохраненный прогресс будет потерян.')) {
      document.getElementById('screen-lesson').classList.remove('active');
      this.currentLesson = null;
      this.renderRoadmap();
    }
  },

  renderCurrentQuestion() {
    this.hasAnsweredCurrent = false;
    this.selectedAnswer = null;
    this.wordBankPlaced = [];
    this.matchingSelected = null;

    const q = this.currentLesson.questions[this.currentQuestionIndex];
    const totalQ = this.currentLesson.questions.length;
    const progressPct = ((this.currentQuestionIndex) / totalQ) * 100;

    // Update Progress Bar
    const progFill = document.getElementById('lesson-progress-fill');
    if (progFill) progFill.style.width = `${progressPct}%`;

    // Reset Footer
    const footer = document.getElementById('lesson-footer');
    footer.className = 'lesson-footer';
    const banner = document.getElementById('feedback-banner');
    banner.style.display = 'none';

    const checkBtn = document.getElementById('btn-check-answer');
    checkBtn.innerText = 'Проверить';
    checkBtn.className = 'btn-3d btn-primary';
    checkBtn.disabled = true;

    // Render Question Title
    document.getElementById('lesson-q-title').innerText = q.title;

    // Render Mascot
    MascotEngine.mount('lesson-mascot-avatar', 'happy', 60);

    // Prompt Bubble (with speak pronunciation button)
    const promptWrap = document.getElementById('lesson-prompt-bubble');
    promptWrap.innerHTML = `
      <span>${q.prompt || ''}</span>
      ${q.speakText ? `<button class="btn-speak" onclick="SoundFX.speakEnglish('${q.speakText.replace(/'/g, "\\'")}')" title="Послушать произношение">🔊</button>` : ''}
    `;

    // Render Body according to question type
    const container = document.getElementById('lesson-interactive-area');
    container.innerHTML = '';

    if (q.type === 'choice') {
      this.renderChoiceQuestion(q, container);
    } else if (q.type === 'word_bank') {
      this.renderWordBankQuestion(q, container);
    } else if (q.type === 'matching') {
      this.renderMatchingQuestion(q, container);
    }
  },

  renderChoiceQuestion(q, container) {
    const list = document.createElement('div');
    list.className = 'options-list';

    q.options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.innerText = opt;

      card.addEventListener('click', () => {
        if (this.hasAnsweredCurrent) return;
        SoundFX.playTap();
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedAnswer = idx;
        document.getElementById('btn-check-answer').disabled = false;
      });

      list.appendChild(card);
    });

    container.appendChild(list);
  },

  renderWordBankQuestion(q, container) {
    const slots = document.createElement('div');
    slots.className = 'word-bank-slots';
    slots.id = 'word-slots';

    const pool = document.createElement('div');
    pool.className = 'word-bank-pool';
    pool.id = 'word-pool';

    const checkBtn = document.getElementById('btn-check-answer');

    // Rule: Only the starting word of the sentence begins with a capital letter.
    // All other words in the bank are lowercase (except the pronoun 'I').
    const firstTargetWord = (q.targetTokens && q.targetTokens[0]) ? q.targetTokens[0].toLowerCase() : '';
    let hasCapitalizedFirst = false;

    const formattedTokens = (q.bankTokens || []).map(token => {
      const lower = token.toLowerCase();
      if (lower === 'i') {
        return 'I';
      }
      if (lower === firstTargetWord && !hasCapitalizedFirst) {
        hasCapitalizedFirst = true;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    });

    // Fisher-Yates shuffle to scatter tokens randomly
    const shuffledTokens = [...formattedTokens];
    for (let attempt = 0; attempt < 25; attempt++) {
      for (let i = shuffledTokens.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledTokens[i], shuffledTokens[j]] = [shuffledTokens[j], shuffledTokens[i]];
      }
      const startsWithTarget = q.targetTokens && q.targetTokens.length > 1 &&
        shuffledTokens.slice(0, q.targetTokens.length).every((t, i) => t.toLowerCase() === q.targetTokens[i].toLowerCase());
      const firstIsStart = shuffledTokens.length > 2 && shuffledTokens[0].toLowerCase() === firstTargetWord;

      if (!startsWithTarget && !firstIsStart) {
        break;
      }
    }

    shuffledTokens.forEach((token, idx) => {
      const tile = document.createElement('div');
      tile.className = 'word-tile';
      tile.innerText = token;
      tile.id = `token-${idx}`;

      tile.addEventListener('click', () => {
        if (this.hasAnsweredCurrent) return;
        SoundFX.playTap();

        if (tile.classList.contains('used')) return;

        // Add to slots
        tile.classList.add('used');
        this.wordBankPlaced.push({ token, index: idx });

        const slotTile = document.createElement('div');
        slotTile.className = 'word-tile';
        slotTile.innerText = token;
        slotTile.addEventListener('click', () => {
          if (this.hasAnsweredCurrent) return;
          SoundFX.playTap();
          slotTile.remove();
          tile.classList.remove('used');
          this.wordBankPlaced = this.wordBankPlaced.filter(item => item.index !== idx);
          checkBtn.disabled = this.wordBankPlaced.length === 0;
        });

        slots.appendChild(slotTile);
        checkBtn.disabled = false;
      });

      pool.appendChild(tile);
    });

    container.appendChild(slots);
    container.appendChild(pool);
  },

  renderMatchingQuestion(q, container) {
    const grid = document.createElement('div');
    grid.className = 'matching-grid';

    // English on the left, Russian on the right
    const leftSide = q.pairs.map(p => ({ text: p.en, pairId: p.en, lang: 'en' }));
    const rightSide = q.pairs.map(p => ({ text: p.ru, pairId: p.en, lang: 'ru' }));

    // Shuffle English column independently
    for (let i = leftSide.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [leftSide[i], leftSide[j]] = [leftSide[j], leftSide[i]];
    }

    // Shuffle Russian column independently, ensuring no direct opposite pairs
    for (let attempt = 0; attempt < 25; attempt++) {
      for (let i = rightSide.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rightSide[i], rightSide[j]] = [rightSide[j], rightSide[i]];
      }
      const hasDirectOpposite = rightSide.some((rItem, idx) => rItem.pairId === leftSide[idx].pairId);
      if (!hasDirectOpposite || rightSide.length <= 1) {
        break;
      }
    }

    this.matchingPairsLeft = q.pairs.length;

    // Helper to create tile
    const createTile = (item) => {
      const tile = document.createElement('div');
      tile.className = 'match-tile';
      tile.innerText = item.text;
      tile.dataset.pairId = item.pairId;
      tile.dataset.lang = item.lang;

      tile.addEventListener('click', () => {
        if (tile.classList.contains('matched') || this.hasAnsweredCurrent) return;
        SoundFX.playTap();

        if (item.lang === 'en') {
          SoundFX.speakEnglish(item.text);
        }

        if (!this.matchingSelected) {
          tile.classList.add('selected');
          this.matchingSelected = tile;
        } else if (this.matchingSelected === tile) {
          tile.classList.remove('selected');
          this.matchingSelected = null;
        } else {
          // Check pair match
          if (this.matchingSelected.dataset.pairId === tile.dataset.pairId && this.matchingSelected.dataset.lang !== tile.dataset.lang) {
            // Match success!
            SoundFX.playCorrect();
            this.matchingSelected.classList.remove('selected');
            this.matchingSelected.classList.add('matched');
            tile.classList.add('matched');
            this.matchingSelected = null;
            this.matchingPairsLeft--;

            if (this.matchingPairsLeft === 0) {
              document.getElementById('btn-check-answer').disabled = false;
              // Auto trigger check
              this.handleCheckAnswer();
            }
          } else {
            // Mismatch
            SoundFX.playIncorrect();
            tile.classList.add('incorrect');
            this.matchingSelected.classList.add('incorrect');
            const prev = this.matchingSelected;
            setTimeout(() => {
              tile.classList.remove('incorrect', 'selected');
              prev.classList.remove('incorrect', 'selected');
            }, 500);
            this.matchingSelected = null;
          }
        }
      });
      return tile;
    };

    // Interleave row-by-row into 2-column grid so Col 1 is English and Col 2 is Russian
    for (let i = 0; i < leftSide.length; i++) {
      grid.appendChild(createTile(leftSide[i]));
      grid.appendChild(createTile(rightSide[i]));
    }

    container.appendChild(grid);
  },

  // -------------------------------------------------------------
  // CHECK ANSWER & FEEDBACK LOGIC
  // -------------------------------------------------------------
  handleCheckAnswer() {
    const q = this.currentLesson.questions[this.currentQuestionIndex];
    const footer = document.getElementById('lesson-footer');
    const banner = document.getElementById('feedback-banner');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const detail = document.getElementById('feedback-detail');
    const checkBtn = document.getElementById('btn-check-answer');
    const aiExplainBtn = document.getElementById('btn-ai-explain');

    if (this.hasAnsweredCurrent) {
      // Button acts as "Продолжить" to next question
      this.currentQuestionIndex++;
      if (this.currentQuestionIndex >= this.currentLesson.questions.length) {
        this.finishLessonSuccess();
      } else {
        this.renderCurrentQuestion();
      }
      return;
    }

    this.hasAnsweredCurrent = true;
    let isCorrect = false;

    if (q.type === 'choice') {
      isCorrect = this.selectedAnswer === q.correctIndex;
      const cards = document.querySelectorAll('.option-card');
      if (cards[q.correctIndex]) cards[q.correctIndex].classList.add('correct');
      if (!isCorrect && cards[this.selectedAnswer]) {
        cards[this.selectedAnswer].classList.add('incorrect');
      }
    } else if (q.type === 'word_bank') {
      const userSentence = this.wordBankPlaced.map(p => p.token).join(' ');
      const targetSentence = q.targetTokens.join(' ');
      isCorrect = userSentence.trim().toLowerCase() === targetSentence.trim().toLowerCase();
      if (isCorrect) {
        this.updateQuestProgress('quest_words', 1);
      }
    } else if (q.type === 'matching') {
      isCorrect = this.matchingPairsLeft === 0;
    }

    banner.style.display = 'flex';
    checkBtn.innerText = 'Продолжить';

    if (isCorrect) {
      SoundFX.playCorrect();
      MascotEngine.mount('lesson-mascot-avatar', 'celebrate', 60);
      footer.className = 'lesson-footer feedback-correct';
      icon.innerText = '🎉';
      title.innerText = 'Отлично!';
      title.style.color = 'var(--success-shade)';
      detail.innerText = q.explanation || 'Правильный ответ!';
      checkBtn.className = 'btn-3d btn-success';
      aiExplainBtn.style.display = 'none';
    } else {
      SoundFX.playIncorrect();
      MascotEngine.mount('lesson-mascot-avatar', 'sad', 60);
      footer.className = 'lesson-footer feedback-incorrect';
      icon.innerText = '💔';
      title.innerText = 'Не совсем так';
      if (q.type === 'word_bank') {
        detail.innerText = `Правильно: «${q.targetTokens.join(' ')}». ${q.explanation || ''}`;
      } else {
        detail.innerText = q.explanation || 'Обратите внимание на правильный вариант.';
      }
      checkBtn.className = 'btn-3d btn-danger';
      aiExplainBtn.style.display = 'inline-flex';

      // Deduct heart
      const user = AuthDB.currentUser;
      user.hearts = Math.max(0, user.hearts - 1);
      AuthDB.saveProgress({ hearts: user.hearts });
      this.updateTopBarStats();

      if (user.hearts <= 0) {
        setTimeout(() => {
          this.showOutOfHeartsModal();
        }, 800);
      }
    }
  },

  async askAiExplainCurrentQuestion() {
    const q = this.currentLesson?.questions[this.currentQuestionIndex];
    if (!q) return;

    const detail = document.getElementById('feedback-detail');
    detail.innerText = 'Люми думает над ответом... 🦊';

    const explanation = await AIEngine.explainMistake(q, 'Неверный выбор');
    detail.innerText = explanation;
  },

  // -------------------------------------------------------------
  // LESSON COMPLETION & REWARDS
  // -------------------------------------------------------------
  finishLessonSuccess() {
    SoundFX.playVictory();
    this.launchConfetti();

    const user = AuthDB.currentUser;
    const completedSet = new Set(user.completedLevels || []);
    const isFirstTime = !completedSet.has(this.currentLesson.id);

    completedSet.add(this.currentLesson.id);

    let earnedXp = this.currentLesson.rewardXp || 20;
    let earnedGems = isFirstTime ? (this.currentLesson.rewardGems || 15) : 5;

    let isBoosted = false;
    if (user.doubleRewardsPotions && user.doubleRewardsPotions > 0) {
      user.doubleRewardsPotions -= 1;
      earnedXp *= 2;
      earnedGems *= 2;
      isBoosted = true;
    }

    user.xp = (user.xp || 0) + earnedXp;
    user.gems = (user.gems || 0) + earnedGems;
    user.completedLevels = Array.from(completedSet);

    // Check achievements
    this.checkAchievementsAfterLesson(user);

    // Update Quests progress
    this.updateQuestProgress('quest_xp', earnedXp);
    if (user.hearts >= (this.lessonStartHearts || 5)) {
      this.updateQuestProgress('quest_perfect', 1);
    }

    AuthDB.saveProgress({
      xp: user.xp,
      gems: user.gems,
      completedLevels: user.completedLevels,
      doubleRewardsPotions: user.doubleRewardsPotions
    });

    this.updateTopBarStats();

    // Show Reward Modal
    const rewardModal = document.getElementById('reward-popup');
    document.getElementById('reward-earned-xp').innerText = isBoosted ? `+${earnedXp} XP (х2 🔥)` : `+${earnedXp} XP`;
    document.getElementById('reward-earned-gems').innerText = isBoosted ? `+${earnedGems} 💎 (х2 🔥)` : `+${earnedGems} 💎`;
    MascotEngine.mount('reward-mascot-box', 'celebrate', 140);
    rewardModal.classList.add('active');
  },

  closeRewardModal() {
    document.getElementById('reward-popup').classList.remove('active');
    document.getElementById('screen-lesson').classList.remove('active');
    this.currentLesson = null;
    this.renderRoadmap();
  },

  checkAchievementsAfterLesson(user) {
    const unlocked = new Set(user.achievements || []);

    if (user.completedLevels.length >= 1 && !unlocked.has('first_step')) {
      unlocked.add('first_step');
      this.showToastAchievement('Первый шаг к успеху! 🌱');
    }
    if (user.streak >= 3 && !unlocked.has('streak_3')) {
      unlocked.add('streak_3');
      this.showToastAchievement('Огненный энтузиаст! 🔥');
    }
    if (user.gems >= 100 && !unlocked.has('gem_collector')) {
      unlocked.add('gem_collector');
      this.showToastAchievement('Кристальный магнат! 💎');
    }
    const lastLevelId = GAME_DATA.levels[GAME_DATA.levels.length - 1]?.id || 15;
    if (user.completedLevels.includes(lastLevelId) && !unlocked.has('boss_slayer')) {
      unlocked.add('boss_slayer');
      this.showToastAchievement('Повелитель английского! 🏆');
    }

    user.achievements = Array.from(unlocked);
  },

  showToastAchievement(title) {
    SoundFX.playVictory();
    this.launchConfetti();
    this.showInAppToast('🏆 Достижение разблокировано!', title, '🏆');
  },

  showOutOfHeartsModal() {
    if (confirm('У вас закончились сердечки! 💔\nХотите перейти в Магазин и пополнить жизни за кристаллы?')) {
      document.getElementById('screen-lesson').classList.remove('active');
      this.switchScreen('shop');
    }
  },

  // -------------------------------------------------------------
  // SHOP SYSTEM
  // -------------------------------------------------------------
  renderShop(highlightItemId = null) {
    const user = AuthDB.currentUser;
    const shopList = document.getElementById('shop-items-list');
    if (!shopList || !user) return;

    shopList.innerHTML = '';

    GAME_DATA.shopItems.forEach(item => {
      const isJustBought = (item.id === highlightItemId);
      const card = document.createElement('div');
      card.className = `shop-item-card ${isJustBought ? 'shop-card-bought' : ''}`;
      card.id = `shop-item-${item.id}`;

      let statusBadge = '';
      let isHeartFull = false;

      if (item.action === 'double_rewards' && user.doubleRewardsPotions > 0) {
        statusBadge = `
          <div class="shop-stock-badge ${isJustBought ? 'anim-bump' : ''}">
            В запасе: <strong class="badge-count-num ${isJustBought ? 'anim-count-pop' : ''}">${user.doubleRewardsPotions} шт.</strong>
          </div>`;
      } else if (item.action === 'streak_freeze' && user.streakFreezeActive) {
        statusBadge = `
          <div class="shop-active-badge ${isJustBought ? 'anim-bump' : ''}">
            Защита активна 🧊
          </div>`;
      } else if (item.action === 'refill_hearts' && user.hearts >= (user.maxHearts || 5)) {
        isHeartFull = true;
        statusBadge = `
          <div class="shop-full-badge ${isJustBought ? 'anim-bump' : ''}">
            Жизни полные ❤️
          </div>`;
      }

      let btnHtml = '';
      if (isHeartFull) {
        btnHtml = `<button class="btn-3d btn-primary btn-buy btn-disabled" id="btn-buy-${item.id}" disabled title="У вас максимальное количество жизней">ПОЛНОСТЬЮ</button>`;
      } else {
        btnHtml = `<button class="btn-3d btn-primary btn-buy" id="btn-buy-${item.id}" onclick="App.buyShopItem('${item.id}')">${item.price} 💎</button>`;
      }

      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
          ${statusBadge}
        </div>
        ${btnHtml}
      `;

      shopList.appendChild(card);
    });
  },

  buyShopItem(itemId) {
    const user = AuthDB.currentUser;
    const item = GAME_DATA.shopItems.find(i => i.id === itemId);
    const cardEl = document.getElementById(`shop-item-${itemId}`);
    const buyBtn = document.getElementById(`btn-buy-${itemId}`);

    if (!user || !item) return;

    // Disallow buying hearts if already full (5/5)
    if (item.action === 'refill_hearts' && user.hearts >= (user.maxHearts || 5)) {
      SoundFX.playIncorrect();
      if (buyBtn) {
        buyBtn.classList.remove('anim-shake');
        void buyBtn.offsetWidth;
        buyBtn.classList.add('anim-shake');
      }
      return;
    }

    // Check crystals without blocking alert
    if (user.gems < item.price) {
      SoundFX.playIncorrect();
      if (buyBtn) {
        buyBtn.classList.remove('anim-shake');
        void buyBtn.offsetWidth;
        buyBtn.classList.add('anim-shake');
      }
      const gemsPill = document.querySelector('.stat-gems');
      if (gemsPill) {
        gemsPill.classList.remove('anim-shake');
        void gemsPill.offsetWidth;
        gemsPill.classList.add('anim-shake');
      }
      return;
    }

    // Deduct crystals & play coin sound
    SoundFX.playGem();
    user.gems -= item.price;

    let floatText = '';
    let animType = 'gems';

    if (item.action === 'refill_hearts') {
      const added = (user.maxHearts || 5) - user.hearts;
      user.hearts = user.maxHearts || 5;
      floatText = added > 0 ? `+${added} ❤️` : '❤️ 5/5';
      animType = 'hearts';
    } else if (item.action === 'streak_freeze') {
      user.streakFreezeActive = true;
      floatText = '🧊 Защита!';
      animType = 'streak';
    } else if (item.action === 'bonus_xp') {
      user.xp = (user.xp || 0) + 50;
      floatText = '+50 XP ⚡';
      animType = 'xp';
    } else if (item.action === 'double_rewards') {
      user.doubleRewardsPotions = (user.doubleRewardsPotions || 0) + 1;
      floatText = `+1 🧪 (всего ${user.doubleRewardsPotions})`;
      animType = 'double_rewards';
    }

    AuthDB.saveProgress({
      gems: user.gems,
      hearts: user.hearts,
      xp: user.xp,
      streakFreezeActive: user.streakFreezeActive,
      doubleRewardsPotions: user.doubleRewardsPotions
    });

    // Spawn floating animation chip above card
    if (cardEl && floatText) {
      const floatEl = document.createElement('div');
      floatEl.className = 'purchase-float-text';
      floatEl.innerText = floatText;
      cardEl.appendChild(floatEl);
      setTimeout(() => floatEl.remove(), 900);
    }

    // Briefly pulse button with success state
    if (buyBtn) {
      buyBtn.classList.add('anim-bump');
    }

    // Re-render shop and top bar with animation
    this.renderShop(itemId);
    this.updateTopBarStats(animType);
    this.renderRoadmap();
  },

  // -------------------------------------------------------------
  // QUESTS SYSTEM & DAILY MARATHON (ЗАДАНИЯ ДНЯ И МАРАФОН)
  // -------------------------------------------------------------
  updateQuestProgress(questId, amount, isIncremental = true) {
    const user = AuthDB.currentUser;
    if (!user) return;
    user.questsProgress = user.questsProgress || {};
    if (isIncremental) {
      user.questsProgress[questId] = (user.questsProgress[questId] || 0) + amount;
    } else {
      user.questsProgress[questId] = Math.max(user.questsProgress[questId] || 0, amount);
    }
    AuthDB.saveProgress({ questsProgress: user.questsProgress });
    if (this.activeScreen === 'quests') {
      this.renderQuests();
    }
  },

  renderQuests() {
    const user = AuthDB.currentUser;
    const container = document.getElementById('quests-list-container');
    if (!container || !user) return;

    container.innerHTML = '';
    const progress = user.questsProgress || {};
    const claimed = new Set(user.claimedQuests || []);

    GAME_DATA.dailyQuests.forEach(quest => {
      const card = document.createElement('div');
      card.className = 'quest-card';

      const currentVal = Math.min(quest.target, progress[quest.id] || 0);
      const pct = Math.min(100, Math.round((currentVal / quest.target) * 100));
      const isReady = currentVal >= quest.target;
      const isClaimed = claimed.has(quest.id);

      let actionHtml = '';
      if (isClaimed) {
        actionHtml = `<div class="quest-claimed-badge"><span>✓</span> <span>Забрано</span></div>`;
      } else if (isReady) {
        actionHtml = `<button class="btn-quest-claim" onclick="App.claimQuest('${quest.id}')">+${quest.rewardGems} 💎 ЗАБРАТЬ</button>`;
      } else {
        actionHtml = `
          <div class="quest-chest-chip">
            <span class="quest-chest-icon">🎁</span>
            <span>+${quest.rewardGems} 💎</span>
          </div>
        `;
      }

      card.innerHTML = `
        <div class="quest-icon-wrap" style="background: ${quest.iconBg || '#FFFBEB'}; color: ${quest.iconColor || '#D97706'};">
          ${quest.icon}
        </div>
        <div class="quest-body">
          <div class="quest-title">${quest.title}</div>
          <div class="quest-progress-track">
            <div class="quest-progress-fill" style="width: ${pct}%;"></div>
            <div class="quest-progress-label">${currentVal} / ${quest.target}</div>
          </div>
        </div>
        <div class="quest-action-slot">
          ${actionHtml}
        </div>
      `;

      container.appendChild(card);
    });

    // Locked placeholder matching Duolingo
    const lockedCard = document.createElement('div');
    lockedCard.className = 'quest-locked-placeholder';
    lockedCard.innerHTML = `
      <span style="font-size: 20px;">🔒</span>
      <span>Скоро будет доступно ещё больше заданий</span>
    `;
    container.appendChild(lockedCard);

    // Update Marathon Box
    const claimedCount = (user.claimedQuests || []).length;
    const marathonTarget = GAME_DATA.monthlyChallenge.target;
    const marathonPct = Math.min(100, Math.round((claimedCount / marathonTarget) * 100));

    const marathonFill = document.getElementById('marathon-bar-fill');
    if (marathonFill) marathonFill.style.width = `${marathonPct}%`;

    const marathonCounter = document.getElementById('marathon-counter-text');
    if (marathonCounter) marathonCounter.innerText = `${claimedCount} / ${marathonTarget} заданий`;

    const marathonBox = document.getElementById('marathon-card-box');
    const marathonBtn = marathonBox?.querySelector('.marathon-btn');
    if (marathonBtn) {
      if (user.marathonClaimed) {
        marathonBtn.innerText = 'Кубок получен! 🏆';
        marathonBtn.className = 'btn-3d btn-success marathon-btn';
        marathonBtn.onclick = () => App.switchScreen('learn');
      } else if (claimedCount >= marathonTarget) {
        marathonBtn.innerText = 'Забрать кубок! 🏆';
        marathonBtn.className = 'btn-3d btn-primary marathon-btn';
        marathonBtn.onclick = () => App.claimMarathon();
      } else {
        marathonBtn.innerText = 'К урокам ▶';
        marathonBtn.className = 'btn-3d btn-primary marathon-btn';
        marathonBtn.onclick = () => App.switchScreen('learn');
      }
    }
  },

  claimQuest(questId) {
    const user = AuthDB.currentUser;
    if (!user) return;
    const quest = GAME_DATA.dailyQuests.find(q => q.id === questId);
    if (!quest) return;

    user.claimedQuests = user.claimedQuests || [];
    if (user.claimedQuests.includes(questId)) return;

    const current = (user.questsProgress && user.questsProgress[questId]) || 0;
    if (current < quest.target) return;

    user.claimedQuests.push(questId);
    user.gems = (user.gems || 0) + quest.rewardGems;

    SoundFX.playGem();
    this.launchConfetti();

    AuthDB.saveProgress({
      gems: user.gems,
      claimedQuests: user.claimedQuests
    });

    this.updateTopBarStats();
    this.renderQuests();

    // Check if ready for marathon
    if (user.claimedQuests.length >= GAME_DATA.monthlyChallenge.target && !user.marathonClaimed) {
      setTimeout(() => {
        this.showInAppToast('Марафон завершён! 🏆', 'Заберите Золотой кубок в марафоне месяца!', '🏆');
      }, 400);
    }
  },

  claimMarathon() {
    const user = AuthDB.currentUser;
    if (!user || user.marathonClaimed) return;

    const count = (user.claimedQuests || []).length;
    if (count < GAME_DATA.monthlyChallenge.target) {
      this.showInAppToast('Марафон не завершен', 'Сначала выполните все 3 задания дня!', '⏳');
      return;
    }

    user.marathonClaimed = true;
    user.gems = (user.gems || 0) + GAME_DATA.monthlyChallenge.rewardGems;
    user.xp = (user.xp || 0) + GAME_DATA.monthlyChallenge.rewardXp;

    this.showTrophyModal();

    AuthDB.saveProgress({
      gems: user.gems,
      xp: user.xp,
      marathonClaimed: true
    });

    this.updateTopBarStats();
    this.renderQuests();
  },

  showTrophyModal() {
    const modal = document.getElementById('trophy-celebration-modal');
    if (modal) {
      modal.classList.add('active');
      SoundFX.playVictory();
      this.launchConfetti();
    }
  },

  closeTrophyModal() {
    const modal = document.getElementById('trophy-celebration-modal');
    if (modal) {
      modal.classList.remove('active');
      SoundFX.playTap();
    }
  },

  // -------------------------------------------------------------
  // PROFILE & SETTINGS
  // -------------------------------------------------------------
  renderProfile() {
    const user = AuthDB.currentUser;
    if (!user) return;

    document.getElementById('profile-name').innerText = user.name;
    const profileEmailEl = document.getElementById('profile-email');
    if (profileEmailEl) {
      profileEmailEl.innerText = user.email ? `✉️ ${user.email}` : '';
    }
    document.getElementById('profile-xp-stat').innerText = `${user.xp || 0} XP`;
    document.getElementById('profile-streak-stat').innerText = `${user.streak || 1} 🔥`;
    document.getElementById('profile-levels-stat').innerText = `${(user.completedLevels || []).length} / ${GAME_DATA.levels.length}`;

    MascotEngine.mount('profile-avatar', 'happy', 90);

    // Render achievements
    const achList = document.getElementById('achievements-list');
    if (achList) {
      achList.innerHTML = '';
      const unlockedSet = new Set(user.achievements || []);

      GAME_DATA.achievements.forEach(ach => {
        const isDone = unlockedSet.has(ach.id);
        const item = document.createElement('div');
        item.className = `badge-item ${isDone ? 'unlocked' : ''}`;
        item.innerHTML = `
          <div class="badge-icon">${ach.icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 15px;">${ach.name}</div>
            <div style="font-size: 12px; color: var(--text-muted);">${ach.desc}</div>
          </div>
          <div>${isDone ? '✅' : '🔒'}</div>
        `;
        achList.appendChild(item);
      });
    }
  },

  currentAuthMode: 'login',
  isAuthMandatory: false,

  showAuthModal(isMandatory = false) {
    this.isAuthMandatory = isMandatory;
    const cancelBtn = document.getElementById('btn-auth-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = isMandatory ? 'none' : 'block';
    }
    this.setAuthTab(isMandatory ? 'register' : 'login');
    document.getElementById('auth-modal').classList.add('active');
  },

  closeAuthModal() {
    if (this.isAuthMandatory && !AuthDB.isLoggedInWithEmail()) {
      this.showInAppToast('Регистрация обязательна', 'Пожалуйста, введите почту для сохранения прогресса', '✉️');
      return;
    }
    document.getElementById('auth-modal').classList.remove('active');
  },

  setAuthTab(mode) {
    this.currentAuthMode = mode;
    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const nameWrap = document.getElementById('auth-field-name-wrap');
    const emailLabel = document.getElementById('auth-email-label');
    const subtitle = document.getElementById('auth-modal-subtitle');
    const submitBtn = document.getElementById('btn-auth-submit');
    const noteText = document.getElementById('auth-note-text');

    if (mode === 'register') {
      if (tabLogin) tabLogin.classList.remove('active');
      if (tabRegister) tabRegister.classList.add('active');
      if (nameWrap) nameWrap.style.display = 'block';
      if (emailLabel) emailLabel.innerText = 'Электронная почта (Email)';
      if (subtitle) subtitle.innerText = 'Создайте аккаунт для сохранения прогресса на любом устройстве.';
      if (submitBtn) submitBtn.innerText = 'Зарегистрироваться';
      if (noteText) noteText.innerText = '⚡ Подтверждение почты не требуется — играйте сразу!';
    } else {
      if (tabRegister) tabRegister.classList.remove('active');
      if (tabLogin) tabLogin.classList.add('active');
      if (nameWrap) nameWrap.style.display = 'none';
      if (emailLabel) emailLabel.innerText = 'Почта (Email) или Логин';
      if (subtitle) subtitle.innerText = 'Войдите, чтобы восстановить свой профиль.';
      if (submitBtn) submitBtn.innerText = 'Войти';
      if (noteText) noteText.innerText = '⚡ Вход доступен с любого устройства по вашей почте';
    }
  },

  async handleAuthSubmit() {
    const nameInput = document.getElementById('auth-name-input')?.value.trim();
    const emailInput = document.getElementById('auth-email-input')?.value.trim();
    const passInput = document.getElementById('auth-pass-input')?.value.trim();

    if (!emailInput || !passInput) {
      this.showInAppToast('Внимание', 'Пожалуйста, укажите почту и пароль!', '⚠️');
      return;
    }

    if (this.currentAuthMode === 'register') {
      if (!emailInput.includes('@') || !emailInput.includes('.')) {
        this.showInAppToast('Неверный Email', 'Пожалуйста, укажите корректную почту (например, user@gmail.com)', '✉️');
        return;
      }
      if (passInput.length < 3) {
        this.showInAppToast('Короткий пароль', 'Пароль должен содержать от 3 символов', '🔒');
        return;
      }

      const regResult = await AuthDB.register(nameInput || emailInput.split('@')[0], emailInput, passInput);
      this.isAuthMandatory = false;
      this.closeAuthModal();

      this.updateTopBarStats();
      this.renderRoadmap();
      this.renderQuests();
      this.renderShop();
      this.renderLumiRoom();
      this.renderProfile();

      if (regResult.alreadyExisted || regResult.syncedFromCloud) {
        const levelsCount = (regResult.user.completedLevels || []).length;
        this.showInAppToast('С возвращением! ☁️', `Прогресс ${regResult.user.name} синхронизирован! Пройдено: ${levelsCount} уроков, XP: ${regResult.user.xp || 0}`, '👋');
      } else {
        this.showInAppToast('Аккаунт создан! 🎉', `Добро пожаловать, ${regResult.user.name}! Прогресс сохраняется в облаке.`, '✨');
      }
    } else {
      // Login mode
      const loginRes = await AuthDB.login(emailInput, passInput);
      if (loginRes.success) {
        this.isAuthMandatory = false;
        this.closeAuthModal();

        this.updateTopBarStats();
        this.renderRoadmap();
        this.renderQuests();
        this.renderShop();
        this.renderLumiRoom();
        this.renderProfile();

        const levelsCount = (loginRes.user.completedLevels || []).length;
        this.showInAppToast('С возвращением! ☁️', `Прогресс ${loginRes.user.name} синхронизирован! Пройдено: ${levelsCount} уроков, XP: ${loginRes.user.xp || 0}`, '👋');
      } else {
        this.showInAppToast('Ошибка входа', loginRes.message || 'Неверная почта или пароль', '❌');
      }
    }
  },

  // Backward compatibility alias
  async handleLoginOrCreate() {
    return this.handleAuthSubmit();
  },

  appendEmailDomain(domain) {
    const input = document.getElementById('auth-email-input');
    if (!input) return;
    let val = input.value.trim();
    if (val.includes('@')) {
      val = val.split('@')[0];
    }
    input.value = val ? `${val}${domain}` : domain.replace('@', '');
    input.focus();
  },

  togglePasswordVisibility() {
    const passInput = document.getElementById('auth-pass-input');
    const eyeBtn = document.getElementById('btn-toggle-pass');
    if (!passInput) return;
    if (passInput.type === 'password') {
      passInput.type = 'text';
      if (eyeBtn) eyeBtn.innerText = '🙈';
    } else {
      passInput.type = 'password';
      if (eyeBtn) eyeBtn.innerText = '👁️';
    }
  },

  loginAsGuest() {
    AuthDB.registerGuest();
    this.isAuthMandatory = false;
    this.closeAuthModal();
    this.updateTopBarStats();
    this.renderRoadmap();
    this.renderQuests();
    this.renderShop();
    this.renderLumiRoom();
    this.renderProfile();
    this.showInAppToast('Гостевой режим 🎮', 'Вы вошли как Гость. Привязать почту можно в любой момент в Профиле!', '🦊');
  },

  _phoneSyncUrl: '',

  showPhoneSyncModal() {
    const user = AuthDB.currentUser;
    if (!user || !user.email) {
      this.showInAppToast('Сначала войдите', 'Зарегистрируйтесь с почтой, чтобы войти с телефона в 1 клик!', '⚠️');
      this.showAuthModal(false);
      return;
    }

    const payload = {
      email: user.email,
      pass: user.password || '',
      name: user.name || 'Ученик'
    };
    const token = btoa(encodeURIComponent(JSON.stringify(payload)));
    const directUrl = `${window.location.origin}${window.location.pathname}?quick_auth=${token}`;
    this._phoneSyncUrl = directUrl;

    const qrImg = document.getElementById('phone-sync-qr-img');
    if (qrImg) {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(directUrl)}`;
    }

    document.getElementById('phone-sync-modal')?.classList.add('active');
  },

  closePhoneSyncModal() {
    document.getElementById('phone-sync-modal')?.classList.remove('active');
  },

  async copyPhoneSyncLink() {
    if (!this._phoneSyncUrl) return;
    try {
      await navigator.clipboard.writeText(this._phoneSyncUrl);
      this.showInAppToast('Ссылка скопирована! 📋', 'Отправьте ссылку себе в Telegram или WhatsApp и откройте на телефоне', '🚀');
    } catch (e) {
      prompt('Скопируйте ссылку для входа с телефона:', this._phoneSyncUrl);
    }
  },

  showSettingsModal() {
    const config = AuthDB.getCloudConfig() || { url: '', anonKey: '' };
    document.getElementById('settings-supabase-url').value = config.url || '';
    document.getElementById('settings-supabase-key').value = config.anonKey || '';
    document.getElementById('settings-gemini-key').value = AIEngine.getApiKey() || '';
    
    const statusEl = document.getElementById('gemini-key-status');
    if (statusEl) {
      const key = AIEngine.getApiKey();
      if (key && key.length > 15) {
        statusEl.innerHTML = '🔑 Сохранен ключ Gemini. Нажмите «Тест» для проверки связи.';
        statusEl.style.color = 'var(--text-muted)';
      } else {
        statusEl.innerHTML = '✨ Люми отвечает динамически! Если ключ не указан, работает умный встроенный ИИ.';
        statusEl.style.color = 'var(--text-muted)';
      }
    }

    document.getElementById('settings-modal').classList.add('active');
  },

  async testGeminiKey() {
    const input = document.getElementById('settings-gemini-key');
    const statusEl = document.getElementById('gemini-key-status');
    const key = input ? input.value.trim() : '';

    if (!key) {
      if (statusEl) {
        statusEl.innerHTML = '⚠️ Пожалуйста, введите ключ Google Gemini перед тестированием.';
        statusEl.style.color = '#EA580C';
      }
      return;
    }

    if (statusEl) {
      statusEl.innerHTML = '⏳ Проверяем ключ на серверах Google Gemini...';
      statusEl.style.color = 'var(--primary)';
    }

    const res = await AIEngine.testKey(key);
    if (res.ok) {
      if (statusEl) {
        statusEl.innerHTML = `✅ Ключ активен! Модель <strong>${res.model}</strong> готова к работе.`;
        statusEl.style.color = '#16A34A';
      }
      this.showInAppToast('Ключ подтвержден! ✅', `Сервер Gemini ответил успешно (${res.model})`, '🤖');
    } else {
      if (statusEl) {
        statusEl.innerHTML = `⚠️ Ошибка проверки: ${res.error}.<br>(Люми продолжит отвечать через умный встроенный ИИ).`;
        statusEl.style.color = '#EA580C';
      }
      this.showInAppToast('Ошибка ключа', res.error, '⚠️');
    }
  },

  closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
  },

  async saveSettings() {
    const url = document.getElementById('settings-supabase-url').value.trim();
    const anonKey = document.getElementById('settings-supabase-key').value.trim();
    const geminiKey = document.getElementById('settings-gemini-key').value.trim();

    AuthDB.saveCloudConfig(url, anonKey);
    AIEngine.setApiKey(geminiKey);

    this.showInAppToast('Настройки сохранены', 'Конфигурация облака и ИИ обновлена', '⚙️');
    this.closeSettingsModal();
  },

  // -------------------------------------------------------------
  // LUMI CHARACTER ROOM & LIVE SPEECH BUBBLE (ПЕРСОНАЖ ЛЮМИ)
  // -------------------------------------------------------------
  lumiCurrentEmotion: 'happy',
  currentBubbleSpeechText: 'Hello! I am Lumi the Fox. Let us learn English together!',

  renderLumiRoom() {
    MascotEngine.mountFull('lumi-full-container', {
      emotion: this.lumiCurrentEmotion || 'happy',
      size: 240
    });
  },

  tapLumiCharacter(event) {
    SoundFX.playTap();
    // Spawn floating heart particle
    const stage = document.querySelector('.lumi-lounge-card') || document.querySelector('.lumi-stage-hero');
    if (stage) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      const emojis = ['❤️', '💖', '✨', '🐾', '⭐'];
      heart.innerText = emojis[Math.floor(Math.random() * emojis.length)];

      const rect = stage.getBoundingClientRect();
      const x = event.clientX ? (event.clientX - rect.left - 12) : (rect.width / 2);
      const y = event.clientY ? (event.clientY - rect.top - 12) : (rect.height / 2);

      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      stage.appendChild(heart);

      setTimeout(() => heart.remove(), 1200);
    }

    // Playful reaction
    this.lumiCurrentEmotion = 'wink';
    this.renderLumiRoom();

    const phrases = [
      '«Хи-хи, щекотно! Давай учить английский язык! 🦊✨»',
      '«I love learning with you! («Мне нравится учиться с тобой!») ❤️»',
      '«You are my favorite student! («Ты мой любимый ученик!») ⭐»',
      '«Smart fox is ready to help! («Умный лис готов помочь!») 🚀»'
    ];
    const picked = phrases[Math.floor(Math.random() * phrases.length)];
    this.setSpeechBubble(picked);

    setTimeout(() => {
      this.lumiCurrentEmotion = 'happy';
      this.renderLumiRoom();
    }, 1400);
  },

  setSpeechBubble(text) {
    const bubbleTextEl = document.getElementById('lumi-bubble-text');
    const bubbleContainer = document.getElementById('lumi-stage-bubble');
    if (bubbleTextEl) {
      this.currentBubbleSpeechText = text;
      // Convert markdown bold and linebreaks safely to HTML
      const formatted = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

      bubbleTextEl.innerHTML = formatted;
    }
    if (bubbleContainer) {
      // Re-trigger popup animation
      bubbleContainer.style.animation = 'none';
      bubbleContainer.offsetHeight; // trigger reflow
      bubbleContainer.style.animation = 'popBubble 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
  },

  speakCurrentBubble() {
    if (this.currentBubbleSpeechText) {
      SoundFX.speakEnglish(this.currentBubbleSpeechText);
    }
  },

  quickAskLumi(text) {
    const input = document.getElementById('lumi-room-input');
    if (input) input.value = text;
    this.handleLumiRoomAsk();
  },

  async handleLumiRoomAsk() {
    const input = document.getElementById('lumi-room-input');
    if (!input || !input.value.trim()) return;

    const userText = input.value.trim();
    input.value = '';

    SoundFX.playTap();

    // Show thinking bubble & emotion
    this.lumiCurrentEmotion = 'thinking';
    this.renderLumiRoom();
    this.setSpeechBubble('«Люми думает над ответом... ✨»');

    // Query Gemini AI
    const reply = await AIEngine.chat(userText);

    // Show answer bubble & talking emotion
    this.lumiCurrentEmotion = 'talking';
    this.renderLumiRoom();
    this.setSpeechBubble(reply);
    SoundFX.playCorrect();

    // Add to user chat log
    const user = AuthDB.currentUser;
    if (user) {
      user.chatHistory = user.chatHistory || [];
      user.chatHistory.push({ sender: 'user', text: userText });
      user.chatHistory.push({ sender: 'bot', text: reply });

      if (!user.achievements?.includes('curious_mind')) {
        user.achievements = user.achievements || [];
        user.achievements.push('curious_mind');
        this.showToastAchievement('Любознательный ум! 💡');
      }

      AuthDB.saveProgress({
        chatHistory: user.chatHistory,
        achievements: user.achievements
      });
    }

    // Update quest progress for talking with Lumi
    this.updateQuestProgress('quest_chat', 1, false);

    // Reset to happy after talking animation
    setTimeout(() => {
      this.lumiCurrentEmotion = 'happy';
      this.renderLumiRoom();
    }, 2200);
  },

  // -------------------------------------------------------------
  // IN-APP SLIDING TOAST NOTIFICATIONS (Non-blocking)
  // -------------------------------------------------------------
  showInAppToast(title, message, icon = '🎉') {
    const toast = document.getElementById('in-app-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (!toast) return;

    if (toastTitle) toastTitle.innerText = title;
    if (toastMessage) toastMessage.innerText = message;
    if (toastIcon) toastIcon.innerText = icon;

    toast.classList.remove('active');
    void toast.offsetWidth;
    toast.classList.add('active');

    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  },

  // -------------------------------------------------------------
  // CONFETTI CELEBRATION EFFECT
  // -------------------------------------------------------------
  initConfetti() {
    this.confettiCanvas = document.getElementById('confetti-canvas');
    if (!this.confettiCanvas) return;
    this.confettiCtx = this.confettiCanvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  },

  resizeCanvas() {
    if (!this.confettiCanvas) return;
    this.confettiCanvas.width = this.confettiCanvas.offsetWidth;
    this.confettiCanvas.height = this.confettiCanvas.offsetHeight;
  },

  launchConfetti() {
    if (!this.confettiCtx) return;
    const pieces = [];
    const colors = ['#FF6F00', '#7C4DFF', '#00C853', '#FFD600', '#FF1744', '#00E5FF'];

    for (let i = 0; i < 70; i++) {
      pieces.push({
        x: this.confettiCanvas.width / 2,
        y: this.confettiCanvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8
      });
    }

    let frames = 0;
    const animate = () => {
      this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      pieces.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.spin;
        this.confettiCtx.save();
        this.confettiCtx.translate(p.x, p.y);
        this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
        this.confettiCtx.fillStyle = p.color;
        this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.confettiCtx.restore();
      });

      frames++;
      if (frames < 90) {
        requestAnimationFrame(animate);
      } else {
        this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
      }
    };
    animate();
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
