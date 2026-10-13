/* ==========================================================================
   AUTH & PERSISTENCE MODULE (БЛОК 3: Авторизация и База Данных)
   Multi-user profile management with data isolation, LocalStorage and Supabase Cloud Sync
   ========================================================================== */

const AuthDB = {
  CURRENT_USER_KEY: 'foxi_current_user_id',
  USERS_DB_KEY: 'foxi_users_directory',
  CLOUD_CONFIG_KEY: 'foxi_supabase_config',
  DEVICE_ID_KEY: 'foxi_device_id',

  DEFAULT_CONFIG: {
    url: 'https://nssqtujsojqfnjkywdnd.supabase.co',
    anonKey: 'sb_publishable__V30930L9R4JzaCDErR-SQ_FuF5ffOu'
  },

  currentUser: null,
  client: null,

  /**
   * Generates or retrieves unique device_id stored in localStorage
   */
  getDeviceId() {
    let id = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(this.DEVICE_ID_KEY, id);
      console.log('📱 Сгенерирован новый уникальный device_id:', id);
    }
    return id;
  },

  /**
   * Checks whether the current user is properly authenticated with a valid email
   */
  isLoggedInWithEmail() {
    return !!(this.currentUser && this.currentUser.email && this.currentUser.email.includes('@'));
  },

  init() {
    // 1. Ensure unique device_id is generated and stored in localStorage
    this.getDeviceId();

    this.ensureDirectory();
    this.initClient();
    const currentId = localStorage.getItem(this.CURRENT_USER_KEY);
    if (currentId) {
      const user = this.getUserById(currentId);
      // Only keep user logged in if they have a registered email
      if (user && user.email && user.email.includes('@')) {
        this.currentUser = user;
      } else {
        // Discard legacy/guest users without email
        this.currentUser = null;
        localStorage.removeItem(this.CURRENT_USER_KEY);
      }
    } else {
      this.currentUser = null;
    }
    return this.currentUser;
  },

  initClient() {
    const config = this.getCloudConfig();
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && config && config.url && config.anonKey) {
      try {
        this.client = window.supabase.createClient(config.url, config.anonKey);
        console.log('✅ Supabase Client Initialized with:', config.url);
      } catch (err) {
        console.warn('Supabase client init warning:', err);
      }
    }
  },

  ensureDirectory() {
    if (!localStorage.getItem(this.USERS_DB_KEY)) {
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify({}));
    }
  },

  getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_DB_KEY)) || {};
    } catch (e) {
      return {};
    }
  },

  getUserById(userId) {
    const users = this.getAllUsers();
    const user = users[userId] || null;
    if (user) {
      if (!user.questsProgress) user.questsProgress = {};
      if (!user.claimedQuests) user.claimedQuests = [];
      if (!user.claimedChests) user.claimedChests = [];
      if (user.marathonClaimed === undefined) user.marathonClaimed = false;
      if (user.doubleRewardsPotions === undefined) user.doubleRewardsPotions = 0;
      if (!user.lastDeviceId) user.lastDeviceId = this.getDeviceId();
    }
    return user;
  },

  /**
   * Registers a new user account with isolated storage and email.
   * If the email is already registered in cloud, seamlessly restores account with device check.
   */
  async register(name, emailOrLogin, password) {
    const users = this.getAllUsers();
    const cleanInput = (emailOrLogin || '').trim().toLowerCase();
    const isEmail = cleanInput.includes('@');
    const userEmail = isEmail ? cleanInput : '';
    const userLogin = isEmail ? cleanInput.split('@')[0] : cleanInput;
    const userName = (name || '').trim() || (isEmail ? cleanInput.split('@')[0] : 'Ученик');

    // 1. Check local users
    for (const id in users) {
      const u = users[id];
      if (u.email && u.email.toLowerCase() === userEmail) {
        this.setCurrentUser(u.id);
        const checkResult = await this.checkDeviceAndLoadProfile(u);
        return { success: true, user: this.currentUser, alreadyExisted: true, deviceReset: checkResult?.reset === true };
      }
    }

    // 2. Check cloud profiles in Supabase
    let cloudProfile = null;
    const config = this.getCloudConfig();
    if (this.client) {
      try {
        const { data } = await this.client
          .from('user_profiles')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
        if (data) cloudProfile = data;
      } catch (e) {}
    } else if (config && config.url && config.anonKey) {
      try {
        const res = await fetch(`${config.url}/rest/v1/user_profiles?email=eq.${encodeURIComponent(userEmail)}&select=*`, {
          headers: { 'apikey': config.anonKey, 'Authorization': `Bearer ${config.anonKey}` }
        });
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) cloudProfile = list[0];
        }
      } catch (e) {}
    }

    if (cloudProfile) {
      // User exists in cloud -> Link account
      const localUser = {
        id: cloudProfile.user_id || ('usr_' + Date.now()),
        name: cloudProfile.name || userName,
        email: cloudProfile.email || userEmail,
        login: cloudProfile.login || userLogin,
        password: password,
        createdAt: cloudProfile.created_at || new Date().toISOString(),
        hearts: cloudProfile.hearts !== undefined ? cloudProfile.hearts : 5,
        maxHearts: 5,
        gems: cloudProfile.gems !== undefined ? cloudProfile.gems : 50,
        xp: cloudProfile.xp || 0,
        streak: cloudProfile.streak || 1,
        lastActiveDate: new Date().toDateString(),
        completedLevels: cloudProfile.completed_levels || [],
        streakFreezeActive: false,
        doubleRewardsPotions: 0,
        questsProgress: {},
        claimedQuests: [],
        claimedChests: [],
        marathonClaimed: false,
        achievements: [],
        lastDeviceId: this.getDeviceId(),
        chatHistory: []
      };
      users[localUser.id] = localUser;
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
      this.setCurrentUser(localUser.id);
      const syncResult = await this.syncLatestCloudProfile(localUser);
      return { 
        success: true, 
        user: this.currentUser, 
        alreadyExisted: true, 
        syncedFromCloud: true, 
        completedCount: (this.currentUser.completedLevels || []).length 
      };
    }

    // 3. New user registration
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const currentDeviceId = this.getDeviceId();
    const newUser = {
      id: userId,
      name: userName,
      email: userEmail,
      login: userLogin,
      password: password,
      createdAt: new Date().toISOString(),
      hearts: 5,
      maxHearts: 5,
      gems: 50, // Starting gift
      xp: 0,
      streak: 1,
      lastActiveDate: new Date().toDateString(),
      completedLevels: [],
      streakFreezeActive: false,
      doubleRewardsPotions: 0,
      questsProgress: {},
      claimedQuests: [],
      claimedChests: [],
      marathonClaimed: false,
      achievements: [],
      lastDeviceId: currentDeviceId,
      chatHistory: [
        { sender: 'bot', text: 'Привет! Я Лисёнок Люми 🦊 Твой личный помощник по английскому. Спроси меня о грамматике или напиши фразу для практики!' }
      ]
    };

    users[userId] = newUser;
    localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
    this.setCurrentUser(userId);
    await this.syncWithCloud(newUser);
    return { success: true, user: newUser, alreadyExisted: false, deviceReset: false };
  },

  /**
   * Syncs latest user progress with Supabase cloud:
   * Keeps completed levels, XP, gems in 100% sync between Phone, PC and any device
   */
  async syncLatestCloudProfile(user = null) {
    const targetUser = user || this.currentUser;
    if (!targetUser) return { synced: false };

    const currentDeviceId = this.getDeviceId();
    const config = this.getCloudConfig();
    if (!config || !config.url || !config.anonKey) return { synced: false };

    if (!this.client && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      this.initClient();
    }

    let cloudProfile = null;

    // 1. Fetch user record from Supabase
    if (this.client) {
      try {
        let orQuery = `user_id.eq.${targetUser.id}`;
        if (targetUser.email) orQuery += `,email.eq.${targetUser.email}`;
        if (targetUser.login) orQuery += `,login.eq.${targetUser.login}`;
        const { data, error } = await this.client
          .from('user_profiles')
          .select('*')
          .or(orQuery)
          .maybeSingle();

        if (!error && data) {
          cloudProfile = data;
        }
      } catch (err) {
        console.warn('Supabase fetch error:', err);
      }
    }

    // REST fallback
    if (!cloudProfile) {
      try {
        let orQuery = `or=(user_id.eq.${encodeURIComponent(targetUser.id)}`;
        if (targetUser.email) orQuery += `,email.eq.${encodeURIComponent(targetUser.email)}`;
        if (targetUser.login) orQuery += `,login.eq.${encodeURIComponent(targetUser.login)}`;
        orQuery += ')';
        const res = await fetch(`${config.url}/rest/v1/user_profiles?${orQuery}&select=*`, {
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`
          }
        });
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            cloudProfile = list[0];
          }
        }
      } catch (e) {}
    }

    // 2. Synchronize progress between cloud and local
    if (cloudProfile) {
      console.log('☁️ Синхронизация профиля с Supabase:', cloudProfile.name || targetUser.name);

      // Merge completed levels (keep all levels completed on phone or PC)
      const localCompleted = targetUser.completedLevels || [];
      const cloudCompleted = cloudProfile.completed_levels || [];
      const mergedCompleted = Array.from(new Set([...localCompleted, ...cloudCompleted]));

      let hasNewProgress = false;
      if (mergedCompleted.length > localCompleted.length || (cloudProfile.xp || 0) > (targetUser.xp || 0)) {
        hasNewProgress = true;
      }

      targetUser.completedLevels = mergedCompleted;
      targetUser.xp = Math.max(targetUser.xp || 0, cloudProfile.xp || 0);
      targetUser.gems = Math.max(targetUser.gems || 0, cloudProfile.gems || 0);
      targetUser.hearts = cloudProfile.hearts !== undefined ? cloudProfile.hearts : (targetUser.hearts || 5);
      targetUser.streak = Math.max(targetUser.streak || 1, cloudProfile.streak || 1);
      targetUser.lastDeviceId = currentDeviceId;

      const users = this.getAllUsers();
      users[targetUser.id] = targetUser;
      localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
      this.currentUser = targetUser;

      // If local had more progress than cloud, push the unified progress to Supabase
      if (mergedCompleted.length > cloudCompleted.length || targetUser.xp > (cloudProfile.xp || 0)) {
        await this.syncWithCloud(targetUser);
      }

      return { 
        synced: true, 
        hasNewProgress, 
        user: targetUser, 
        completedCount: mergedCompleted.length,
        xp: targetUser.xp 
      };
    } else {
      // First time in cloud: save current user with currentDeviceId
      targetUser.lastDeviceId = currentDeviceId;
      await this.syncWithCloud(targetUser);
      return { synced: true, hasNewProgress: false, user: targetUser };
    }
  },

  // Backwards compatibility alias
  async checkDeviceAndLoadProfile(user = null) {
    return this.syncLatestCloudProfile(user);
  },

  /**
   * Logs into an existing account by Email or Login (checks local storage and Supabase cloud)
   */
  async login(loginOrEmail, password) {
    const users = this.getAllUsers();
    const clean = (loginOrEmail || '').trim().toLowerCase();
    let localUser = null;

    for (const id in users) {
      const u = users[id];
      const matchLogin = u.login && u.login.toLowerCase() === clean;
      const matchEmail = u.email && u.email.toLowerCase() === clean;
      if ((matchLogin || matchEmail) && (!password || u.password === password)) {
        localUser = u;
        break;
      }
    }

    // Try cloud lookup from Supabase (matching either email or login)
    let cloudProfile = null;
    if (this.client) {
      try {
        const { data } = await this.client
          .from('user_profiles')
          .select('*')
          .or(`login.eq.${clean},email.eq.${clean}`)
          .maybeSingle();
        if (data) cloudProfile = data;
      } catch (e) {}
    }

    // REST fallback
    if (!cloudProfile) {
      const config = this.getCloudConfig();
      if (config && config.url && config.anonKey) {
        try {
          const res = await fetch(`${config.url}/rest/v1/user_profiles?or=(login.eq.${encodeURIComponent(clean)},email.eq.${encodeURIComponent(clean)})&select=*`, {
            headers: {
              'apikey': config.anonKey,
              'Authorization': `Bearer ${config.anonKey}`
            }
          });
          if (res.ok) {
            const list = await res.json();
            if (list && list.length > 0) cloudProfile = list[0];
          }
        } catch (e) {}
      }
    }

    if (cloudProfile) {
      if (cloudProfile.password && password && cloudProfile.password !== password) {
        return { success: false, message: 'Неверный пароль' };
      }

      if (!localUser) {
        localUser = {
          id: cloudProfile.user_id || ('usr_' + Date.now()),
          name: cloudProfile.name || (clean.includes('@') ? clean.split('@')[0] : 'Ученик'),
          email: cloudProfile.email || (clean.includes('@') ? clean : ''),
          login: cloudProfile.login || clean,
          password: password || cloudProfile.password,
          createdAt: cloudProfile.created_at || new Date().toISOString(),
          hearts: cloudProfile.hearts !== undefined ? cloudProfile.hearts : 5,
          maxHearts: 5,
          gems: cloudProfile.gems !== undefined ? cloudProfile.gems : 50,
          xp: cloudProfile.xp || 0,
          streak: cloudProfile.streak || 1,
          lastActiveDate: new Date().toDateString(),
          completedLevels: cloudProfile.completed_levels || [],
          streakFreezeActive: false,
          doubleRewardsPotions: 0,
          questsProgress: {},
          claimedQuests: [],
          claimedChests: [],
          marathonClaimed: false,
          achievements: [],
          lastDeviceId: this.getDeviceId(),
          chatHistory: []
        };
        users[localUser.id] = localUser;
        localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));
      }

      this.setCurrentUser(localUser.id);
      const syncResult = await this.syncLatestCloudProfile(localUser);
      return { 
        success: true, 
        user: this.currentUser, 
        syncedFromCloud: true,
        completedCount: (this.currentUser.completedLevels || []).length
      };
    }

    if (localUser) {
      this.setCurrentUser(localUser.id);
      const syncResult = await this.syncLatestCloudProfile(localUser);
      return { 
        success: true, 
        user: this.currentUser, 
        syncedFromCloud: true,
        completedCount: (this.currentUser.completedLevels || []).length
      };
    }

    return { success: false, message: 'Неверный логин, email или пароль' };
  },

  setCurrentUser(userId) {
    localStorage.setItem(this.CURRENT_USER_KEY, userId);
    this.currentUser = this.getUserById(userId);
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.CURRENT_USER_KEY);
  },

  /**
   * Saves updated user progress to isolated DB (Create / Update)
   */
  saveProgress(updates = {}) {
    if (!this.currentUser) return;
    const users = this.getAllUsers();
    const updated = { ...this.currentUser, ...updates };

    // Check streak updates
    const today = new Date().toDateString();
    if (updated.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (updated.lastActiveDate === yesterday) {
        updated.streak += 1;
      } else {
        // If streak freeze perk is owned, use it, else reset to 1
        if (updated.streakFreezeActive) {
          updated.streakFreezeActive = false;
        } else {
          updated.streak = 1;
        }
      }
      updated.lastActiveDate = today;
    }

    this.currentUser = updated;
    users[this.currentUser.id] = updated;
    localStorage.setItem(this.USERS_DB_KEY, JSON.stringify(users));

    // Async cloud backup attempt
    this.syncWithCloud(updated);
    return updated;
  },

  /**
   * Cloud sync helper using official Supabase client with REST fallback
   * Fulfills Block 3 criteria: Supabase DB Create / Read / Update
   */
  async syncWithCloud(userData) {
    const config = this.getCloudConfig();
    if (!config || !config.url || !config.anonKey) {
      // Local fallback active (100% stable offline)
      return { synced: false, reason: 'offline_mode' };
    }

    if (!this.client && typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      this.initClient();
    }

    const payload = {
      user_id: userData.id,
      name: userData.name,
      email: userData.email || '',
      login: userData.login,
      xp: userData.xp || 0,
      gems: userData.gems || 0,
      hearts: userData.hearts || 5,
      streak: userData.streak || 1,
      completed_levels: userData.completedLevels || [],
      last_device_id: userData.lastDeviceId || this.getDeviceId(),
      updated_at: new Date().toISOString()
    };
    if (userData.password) {
      payload.password = userData.password;
    }

    // 1. First try with official Supabase SDK
    if (this.client) {
      try {
        let { data, error } = await this.client
          .from('user_profiles')
          .upsert(payload, { onConflict: 'user_id' });

        // If password column does not exist in Supabase, retry without password
        if (error && error.message && error.message.includes('password')) {
          const { password, ...safePayload } = payload;
          const retry = await this.client
            .from('user_profiles')
            .upsert(safePayload, { onConflict: 'user_id' });
          error = retry.error;
        }

        if (!error) {
          console.log('☁️ Synced with Supabase (SDK):', userData.name);
          return { synced: true, source: 'supabase_sdk' };
        } else {
          console.log('ℹ️ Supabase note:', error.message || error);
        }
      } catch (err) {
        console.warn('Supabase SDK error:', err);
      }
    }

    // 2. Direct REST endpoint fallback
    try {
      let res = await fetch(`${config.url}/rest/v1/user_profiles?user_id=eq.${userData.id}`, {
        method: 'POST',
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok && payload.password) {
        const { password, ...safePayload } = payload;
        res = await fetch(`${config.url}/rest/v1/user_profiles?user_id=eq.${userData.id}`, {
          method: 'POST',
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(safePayload)
        });
      }

      return { synced: res.ok, source: 'rest_fallback' };
    } catch (e) {
      console.warn('Cloud sync offline fallback active', e);
      return { synced: false, error: e };
    }
  },

  getCloudConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.CLOUD_CONFIG_KEY));
      if (saved && saved.url && saved.anonKey) {
        return saved;
      }
    } catch (e) {}
    return this.DEFAULT_CONFIG;
  },

  saveCloudConfig(url, anonKey) {
    localStorage.setItem(this.CLOUD_CONFIG_KEY, JSON.stringify({ url, anonKey }));
    this.initClient();
  }
};
