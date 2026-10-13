/* ==========================================================================
   MASCOT ENGINE: LUMI THE FOX (ОФИЦИАЛЬНЫЙ МАСКОТ FOXICAL)
   Studio 2D Character Engine with True Transparency and Alive Animations
   Clean mascot identity: No customization clutter, 100% authentic character
   ========================================================================== */

const MascotEngine = {
  POSES: {
    happy: 'assets/lumi/happy.png',
    thinking: 'assets/lumi/thinking.png',
    celebrate: 'assets/lumi/celebrate.png',
    cool: 'assets/lumi/cool.png'
  },

  /**
   * Renders avatar/mascot for roadmap, profile, top bar, lesson feedback
   */
  render(emotion = 'happy', size = 120) {
    let pose = 'happy';
    if (emotion === 'thinking' || emotion === 'sad') {
      pose = 'thinking';
    } else if (emotion === 'celebrate' || emotion === 'wink' || emotion === 'talking') {
      pose = 'celebrate';
    } else if (emotion === 'cool') {
      pose = 'cool';
    }

    const src = this.POSES[pose] || this.POSES.happy;

    return `
      <div class="lumi-avatar-container" style="width: ${size}px; height: ${size}px; display: inline-flex; align-items: center; justify-content: center;">
        <img src="${src}" alt="Lumi" class="lumi-avatar-img" style="width: 100%; height: 100%; object-fit: contain; pointer-events: none;" />
      </div>
    `;
  },

  /**
   * Renders full-body hero mascot on stage with alive idle animation & ground shadow
   */
  renderFullBody({
    emotion = 'happy',
    size = 240
  } = {}) {
    let pose = 'happy';
    let animClass = 'lumi-alive-idle';

    if (emotion === 'thinking') {
      pose = 'thinking';
      animClass = 'lumi-alive-thinking';
    } else if (emotion === 'celebrate') {
      pose = 'celebrate';
      animClass = 'lumi-alive-celebrate';
    } else if (emotion === 'talking') {
      pose = 'celebrate';
      animClass = 'lumi-alive-talking';
    } else if (emotion === 'wink') {
      pose = 'celebrate';
      animClass = 'lumi-alive-tap';
    } else if (emotion === 'cool') {
      pose = 'cool';
      animClass = 'lumi-alive-idle';
    } else if (emotion === 'sad') {
      pose = 'thinking';
      animClass = 'lumi-alive-idle';
    }

    const src = this.POSES[pose] || this.POSES.happy;

    return `
      <div class="lumi-stage-character-box ${animClass}" style="width: ${size}px; height: ${size}px;">
        <img src="${src}" alt="Lumi the Fox" class="lumi-hero-img" />
        <div class="lumi-floor-shadow"></div>
      </div>
    `;
  },

  mount(elementId, emotion = 'happy', size = 100) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = this.render(emotion, size);
  },

  mountFull(elementId, options = {}) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = this.renderFullBody(options);
  }
};
