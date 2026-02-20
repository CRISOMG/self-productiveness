<script setup lang="ts">
definePageMeta({ layout: "landing" });

const { t, locale } = useI18n();
const supabase = useSupabaseClient();
const toast = useSuccessErrorToast();

const features = computed(() => t("landing.pricing.features").split(","));
const showSuccessModal = ref(false);

const route = useRoute();

onMounted(() => {
  if (route.query.source) {
    localStorage.setItem("source", route.query.source as string);
    localStorage.setItem("s", route.query.s as string);
  }
});

const email = ref("");
const loading = ref(false);
const sent = ref(false);

const toggleLocale = () => {
  locale.value = locale.value === "es" ? "en" : "es";
};

// Magic link sign-in
async function handleMagicLink() {
  if (!email.value) return;
  loading.value = true;
  try {
    const redirectTo = `${window.location.origin}/callback?source=landing`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: {
        data: {
          source: "landing",
        },
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
    sent.value = true;
    showSuccessModal.value = true;
  } catch (e: any) {
    toast.addErrorToast({
      title: "Error",
      description: e.message || "Error sending magic link",
    });
  } finally {
    loading.value = false;
  }
}

// Scroll reveal animation
const observerCallback: IntersectionObserverCallback = (entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("revealed");
    }
  });
};

onMounted(() => {
  const observer = new IntersectionObserver(observerCallback, {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  });
  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
});
</script>

<template>
  <div class="landing-page">
    <!-- ==================== NAV ==================== -->
    <div class="h-15">
      <nav class="landing-nav">
        <div class="nav-inner">
          <span class="nav-logo">
            <NuxtLink to="/" class="flex items-baseline">
              <i class="mr-1 w-6 flex self-center">
                <img src="/favicon.ico" alt="focus" />
              </i>
              <p class="font-bold">Yourfocus</p>
            </NuxtLink>
          </span>
          <div class="nav-links">
            <a href="#why">{{ t("landing.nav.why") }}</a>
            <a href="#how">{{ t("landing.nav.how") }}</a>
            <a href="#ecosystem">{{ t("landing.nav.ecosystem") }}</a>
            <a href="#pricing">{{ t("landing.nav.pricing") }}</a>
            <button class="locale-toggle" @click="toggleLocale">
              {{ locale === "es" ? "EN" : "ES" }}
            </button>
          </div>
        </div>
      </nav>
    </div>
    <div class="p-2 bg-green-800">
      <p
        class="text-center flex flex-col sm:flex-row items-center justify-center gap-2"
      >
        <UBadge
          color="success"
          variant="subtle"
          :ui="{ base: 'inline-flex items-center gap-1.5' }"
        >
          <span class="relative flex h-2 w-2">
            <span
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
            />
            <span
              class="relative inline-flex rounded-full h-2 w-2 bg-green-400"
            />
          </span>
          <span class="text-xs whitespace-nowrap"> IN DEVELOPMENT</span>
        </UBadge>

        <a
          href="https://platzi.com/blog/reto-developer-foundations/"
          target="_blank"
          class="text-md whitespace-nowrap underline"
        >
          Open Beta for Platzi Developers Foundation Challenge!
          <UIcon name="i-lucide-external-link" class="size-4" />
        </a>
      </p>
    </div>
    <section class="hero-section">
      <!-- ==================== HERO ==================== -->
      <div class="hero-content">
        <div
          class="reveal relative border-2 rounded-2xl overflow-hidden mb-4 cursor-pointer"
        >
          <a target="_blank" href="/Yourfocus.pdf" class="">
            <img src="/presentando_yourfocus.png" alt="presentando yourfocus" />
            <div class="absolute top-2 right-2">
              <UBadge
                color="info"
                variant="subtle"
                :ui="{
                  base: 'inline-flex items-center gap-1.5 text-white',
                }"
              >
                <UIcon
                  name="i-lucide-external-link"
                  class="size-6 text-secondary"
                />
              </UBadge>
            </div>
          </a>
        </div>
        <span class="hero-badge reveal">{{ t("landing.hero.badge") }}</span>
        <h1 class="hero-headline reveal">{{ t("landing.hero.headline") }}</h1>
        <p class="hero-sub reveal">{{ t("landing.hero.subheadline") }}</p>
        <form class="hero-form reveal" @submit.prevent="handleMagicLink">
          <input
            v-model="email"
            type="email"
            :placeholder="t('landing.hero.emailPlaceholder')"
            class="hero-input"
            required
            :disabled="loading || sent"
          />
          <button
            type="submit"
            class="hero-cta-btn"
            :disabled="loading || sent"
          >
            {{
              sent
                ? t("landing.magicLink.sent")
                : loading
                  ? t("landing.magicLink.sending")
                  : t("landing.hero.cta")
            }}
          </button>
        </form>
      </div>
      <div class="hero-glow" />
    </section>

    <!-- ==================== WHY ==================== -->
    <section id="why" class="section-why">
      <span class="section-label reveal">{{
        t("landing.why.sectionLabel")
      }}</span>
      <h2 class="section-title reveal">{{ t("landing.why.title") }}</h2>
      <p class="section-subtitle reveal">{{ t("landing.why.subtitle") }}</p>

      <div class="why-grid">
        <!-- Internal Reality -->
        <div class="reality-card glass-card reveal">
          <h3 class="reality-title internal-accent">
            {{ t("landing.why.internal.title") }}
          </h3>
          <p class="reality-desc">
            {{ t("landing.why.internal.description") }}
          </p>
          <div class="flow-chain">
            <span class="flow-step">{{ t("landing.why.internal.step1") }}</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">{{ t("landing.why.internal.step2") }}</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">{{ t("landing.why.internal.step3") }}</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step accent-step-orange">{{
              t("landing.why.internal.step4")
            }}</span>
          </div>
        </div>

        <!-- External Reality -->
        <div class="reality-card glass-card reveal">
          <h3 class="reality-title external-accent">
            {{ t("landing.why.external.title") }}
          </h3>
          <p class="reality-desc">
            {{ t("landing.why.external.description") }}
          </p>
          <div class="flow-chain">
            <span class="flow-step">{{ t("landing.why.external.step1") }}</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">{{ t("landing.why.external.step2") }}</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step accent-step-green">{{
              t("landing.why.external.step3")
            }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== HOW ==================== -->
    <section id="how" class="section-how">
      <span class="section-label reveal">{{
        t("landing.how.sectionLabel")
      }}</span>
      <h2 class="section-title reveal">{{ t("landing.how.title") }}</h2>
      <p class="section-subtitle reveal">{{ t("landing.how.subtitle") }}</p>

      <!-- Golden Circle -->
      <div class="golden-circle-wrapper reveal">
        <div class="golden-circle">
          <div class="circle-ring ring-what">
            <span class="ring-label relative top-26">{{
              t("landing.how.what.label")
            }}</span>
          </div>
          <div class="circle-ring ring-how">
            <span class="ring-label relative top-15">{{
              t("landing.how.howCircle.label")
            }}</span>
          </div>
          <div class="circle-ring ring-why">
            <span class="ring-label">{{ t("landing.how.why.label") }}</span>
          </div>
        </div>
        <div class="golden-details">
          <div class="golden-item">
            <span class="golden-label why-color">{{
              t("landing.how.why.label")
            }}</span>
            <br />

            <strong>{{ t("landing.how.why.title") }}</strong>
            <p>{{ t("landing.how.why.description") }}</p>
          </div>
          <div class="golden-item">
            <span class="golden-label how-color">{{
              t("landing.how.howCircle.label")
            }}</span>
            <br />

            <strong>{{ t("landing.how.howCircle.title") }}</strong>
            <p>{{ t("landing.how.howCircle.description") }}</p>
          </div>
          <div class="golden-item">
            <span class="golden-label what-color">{{
              t("landing.how.what.label")
            }}</span>

            <br />
            <strong>{{ t("landing.how.what.title") }}</strong>
            <p>{{ t("landing.how.what.description") }}</p>
          </div>
        </div>
      </div>

      <!-- Mission / Vision / Values -->
      <div class="mvv-strip reveal">
        <div class="mvv-item">
          <span class="mvv-label">Misión</span>
          <p>{{ t("landing.how.mission") }}</p>
        </div>
        <div class="mvv-item">
          <span class="mvv-label">Visión</span>
          <p>{{ t("landing.how.vision") }}</p>
        </div>
        <div class="mvv-item">
          <span class="mvv-label">Valores</span>
          <p>{{ t("landing.how.values") }}</p>
        </div>
      </div>
    </section>

    <!-- ==================== ECOSYSTEM ==================== -->
    <section id="ecosystem" class="section-ecosystem">
      <span class="section-label reveal">{{
        t("landing.ecosystem.sectionLabel")
      }}</span>
      <h2 class="section-title reveal">{{ t("landing.ecosystem.title") }}</h2>
      <p class="section-subtitle reveal">
        {{ t("landing.ecosystem.subtitle") }}
      </p>

      <div class="eco-grid">
        <div
          v-for="key in [
            'pomodoro',
            'bitacora',
            'agent',
            'knowledge',
            'analytics',
            'api',
            'byok',
            'tasks',
          ]"
          :key="key"
          class="eco-card glass-card reveal"
        >
          <div class="eco-icon" :class="`eco-icon-${key}`" />
          <h4>{{ t(`landing.ecosystem.${key}.title`) }}</h4>
          <p>{{ t(`landing.ecosystem.${key}.description`) }}</p>
        </div>
      </div>
    </section>

    <!-- ==================== PRICING ==================== -->
    <section id="pricing" class="section-pricing">
      <span class="section-label reveal">{{
        t("landing.pricing.sectionLabel")
      }}</span>
      <h2 class="section-title reveal">{{ t("landing.pricing.title") }}</h2>
      <p class="section-subtitle reveal">{{ t("landing.pricing.subtitle") }}</p>

      <div class="pricing-card glass-card reveal">
        <span class="pricing-badge">{{ t("landing.pricing.badge") }}</span>
        <div class="pricing-amount">
          <span class="pricing-currency">$</span>
          <span class="pricing-number">{{ t("landing.pricing.price") }}</span>
          <span class="pricing-period"
            >{{ t("landing.pricing.currency") }}
            {{ t("landing.pricing.period") }}</span
          >
        </div>
        <ul class="pricing-features">
          <li v-for="(feat, idx) in features" :key="idx">
            <span class="check-icon">✓</span>
            {{ feat }}
          </li>
        </ul>
        <form class="pricing-form" @submit.prevent="handleMagicLink">
          <input
            v-model="email"
            type="email"
            :placeholder="t('landing.pricing.emailPlaceholder')"
            class="hero-input"
            required
            :disabled="loading || sent"
          />
          <button
            type="submit"
            class="hero-cta-btn"
            :disabled="loading || sent"
          >
            {{
              sent
                ? t("landing.magicLink.sent")
                : loading
                  ? t("landing.magicLink.sending")
                  : t("landing.pricing.cta")
            }}
          </button>
        </form>
        <p class="pricing-guarantee">{{ t("landing.pricing.guarantee") }}</p>
      </div>
    </section>

    <!-- ==================== CTA ==================== -->
    <section class="section-cta">
      <div class="cta-content reveal">
        <h2>{{ t("landing.cta.title") }}</h2>
        <p>{{ t("landing.cta.subtitle") }}</p>
        <form class="cta-form" @submit.prevent="handleMagicLink">
          <input
            v-model="email"
            type="email"
            :placeholder="`${t('landing.cta.emailPlaceholder')}`"
            class="hero-input"
            required
            :disabled="loading || sent"
          />
          <button
            type="submit"
            class="hero-cta-btn"
            :disabled="loading || sent"
          >
            {{
              sent
                ? t("landing.magicLink.sent")
                : loading
                  ? t("landing.magicLink.sending")
                  : t("landing.cta.button")
            }}
          </button>
        </form>
        <small class="cta-note">{{ t("landing.cta.note") }}</small>
      </div>
    </section>

    <!-- ==================== SUCCESS MODAL ==================== -->
    <UModal v-model:open="showSuccessModal" :dismissible="false" :close="false">
      <template #default>
        <span />
      </template>
      <template #content>
        <div class="success-modal-content">
          <div class="success-modal-icon">✉️</div>
          <h3 class="success-modal-title">
            {{ t("landing.magicLink.successTitle") }}
          </h3>
          <p class="success-modal-desc">
            {{ t("landing.magicLink.successDescription") }}
          </p>
          <UButton
            class="hero-cta-btn success-modal-btn"
            @click="showSuccessModal = false"
          >
            OK
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- ==================== FOOTER ==================== -->
    <footer class="landing-footer">
      <div class="footer-inner">
        <span class="nav-logo">Yourfocus</span>
        <p class="footer-tagline">{{ t("landing.footer.tagline") }}</p>
        <div class="flex gap-4 justify-center m-4">
          <a target="_blank" href="https://www.linkedin.com/in/crisomg/">
            <UIcon name="i-lucide-linkedin" size="42" />
          </a>
          <a target="_blank" href="https://github.com/CRISOMG/yourfocus">
            <UIcon name="i-lucide-github" size="42" />
          </a>
        </div>
        <p class="footer-legal">
          {{ t("landing.footer.legal", { year: new Date().getFullYear() }) }}
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ===== VARIABLES ===== */
:root {
  html {
    font-size: 24px !important;
  }

  --landing-bg: #0d222d;
  --landing-surface: rgba(255, 255, 255, 0.05);
  --landing-border: rgba(255, 255, 255, 0.12);
  --landing-text: #f7efc5;
  --landing-text-muted: rgba(247, 239, 197, 0.65);
  --landing-orange: #ffaa5b;
  --landing-green: #5ba546;
  --landing-brown: #602d1f;
  --landing-cream: #f7efc5;
}

/* ===== BASE ===== */
.landing-page {
  --landing-bg: #0d222d;
  --landing-surface: rgba(255, 255, 255, 0.05);
  --landing-border: rgba(255, 255, 255, 0.12);
  --landing-text: #f7efc5;
  --landing-text-muted: rgba(247, 239, 197, 0.65);
  --landing-orange: #cb8747;
  --landing-green: #6db758;
  --landing-brown: #ab6552;
  --landing-cream: #f7efc5;

  background: var(--landing-bg);
  color: var(--landing-text);
  font-family: "Lexend", sans-serif;
  overflow-x: hidden;
}

/* ===== SCROLL REVEAL ===== */
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition:
    opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ===== GLASS CARD ===== */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--landing-border);
  border-radius: 20px;
  padding: 2rem;
  transition:
    border-color 0.3s,
    transform 0.3s,
    box-shadow 0.3s;
}
.glass-card:hover {
  border-color: var(--landing-orange);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

/* ===== NAV ===== */
.landing-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(13, 34, 45, 0.85); /* Dark Slate with opacity */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--landing-border);
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.nav-logo {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: 1.4rem;
  background: linear-gradient(
    135deg,
    var(--landing-orange),
    var(--landing-cream)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.nav-links a {
  color: var(--landing-text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 400;
  transition: color 0.2s;
}
.nav-links a:hover {
  color: var(--landing-orange);
}
.locale-toggle {
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
  color: var(--landing-text-muted);
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.locale-toggle:hover {
  border-color: var(--landing-orange);
  color: var(--landing-orange);
}

/* ===== HERO ===== */
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0rem 1.5rem 2rem;
  text-align: center;
  overflow: hidden;
}
.hero-content {
  max-width: 720px;
  position: relative;
  z-index: 1;
}
.hero-badge {
  display: inline-block;
  background: rgba(217, 101, 3, 0.15);
  border: 1px solid rgba(217, 101, 3, 0.3);
  color: var(--landing-orange);
  padding: 0.35rem 1rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 2rem;
}
.hero-headline {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: clamp(2.2rem, 5vw, 3.6rem);
  line-height: 1.15;
  margin-bottom: 1.25rem;
  background: linear-gradient(
    135deg,
    var(--landing-text) 0%,
    var(--landing-cream) 60%,
    var(--landing-orange) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  color: var(--landing-text-muted);
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.6;
  margin-bottom: 2.5rem;
  max-width: 560px;
  margin-inline: auto;
}
.hero-form {
  display: flex;
  gap: 0.5rem;
  max-width: 460px;
  margin-inline: auto;
}
.hero-input {
  flex: 1;
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  color: var(--landing-text);
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}
.hero-input::placeholder {
  color: var(--landing-text-muted);
}
.hero-input:focus {
  border-color: var(--landing-orange);
}
.hero-cta-btn {
  background: linear-gradient(135deg, var(--landing-orange), #ff8c00);
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.hero-cta-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(217, 101, 3, 0.4);
}
.hero-cta-btn:active {
  transform: translateY(0);
}
.hero-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(
    circle,
    rgba(219, 108, 3, 0.15) 0%,
    transparent 70%
  );
  pointer-events: none;
}

/* ===== SECTION SHARED ===== */
.section-label {
  display: block;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  color: var(--landing-orange);
  margin-bottom: 0.75rem;
}
.section-title {
  text-align: center;
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: clamp(1.6rem, 3.5vw, 2.6rem);
  margin-bottom: 0.75rem;
}
.section-subtitle {
  text-align: center;
  color: var(--landing-text-muted);
  font-size: 1rem;
  max-width: 560px;
  margin: 0 auto 3rem;
  line-height: 1.6;
}

/* ===== WHY ===== */
.section-why {
  padding: 6rem 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}
.why-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 768px) {
  .why-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.reality-card {
  text-align: left;
}
.reality-title {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}
.internal-accent {
  color: var(--landing-orange);
}
.external-accent {
  color: var(--landing-green);
}
.reality-desc {
  color: var(--landing-text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}
.flow-chain {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.flow-step {
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
  padding: 0.3rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 400;
}
.accent-step-orange {
  background: rgba(217, 101, 3, 0.15);
  border-color: rgba(217, 101, 3, 0.3);
  color: var(--landing-orange);
}
.accent-step-green {
  background: #6db7582b;
  border-color: #6db758;
  color: var(--landing-green);
}
.flow-arrow {
  color: var(--landing-text-muted);
  font-size: 0.85rem;
}

/* ===== HOW ===== */
.section-how {
  padding: 6rem 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
}
.golden-circle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  margin-bottom: 4rem;
}
@media (min-width: 768px) {
  .golden-circle-wrapper {
    flex-direction: row;
    justify-content: center;
  }
}
.golden-circle {
  position: relative;
  width: 260px;
  height: 260px;
  flex-shrink: 0;
}
.circle-ring {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ring-what {
  width: 260px;
  height: 260px;
  top: 0;
  left: 0;
  background: rgba(23, 73, 9, 0.15);
  border: 1.5px solid rgba(23, 73, 9, 0.4);
}
.ring-how {
  width: 170px;
  height: 170px;
  top: 45px;
  left: 45px;
  background: rgba(96, 45, 31, 0.2);
  border: 1.5px solid rgba(96, 45, 31, 0.5);
}
.ring-why {
  width: 80px;
  height: 80px;
  top: 90px;
  left: 90px;
  background: rgba(219, 108, 3, 0.25);
  border: 1.5px solid rgba(219, 108, 3, 0.6);
}
.ring-label {
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--landing-text-muted);
}
.ring-why .ring-label {
  color: var(--landing-orange);
}
.golden-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 380px;
}
.golden-item p {
  color: var(--landing-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
  margin-top: 0.25rem;
}
.golden-label {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.why-color {
  color: var(--landing-orange);
}
.how-color {
  color: var(--landing-brown);
}
.what-color {
  color: var(--landing-green);
}

/* MVV */
.mvv-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .mvv-strip {
    grid-template-columns: repeat(3, 1fr);
  }
}
.mvv-item {
  background: var(--landing-surface);
  border: 1px solid var(--landing-border);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
}
.mvv-label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--landing-orange);
  display: block;
  margin-bottom: 0.5rem;
}
.mvv-item p {
  color: var(--landing-text-muted);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ===== ECOSYSTEM ===== */
.section-ecosystem {
  padding: 6rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}
.eco-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .eco-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .eco-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
.eco-card {
  text-align: center;
  padding: 1.5rem 1.25rem;
}
.eco-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin: 0 auto 1rem;
  background: rgba(217, 101, 3, 0.12);
  border: 1px solid rgba(217, 101, 3, 0.2);
}
.eco-icon-pomodoro {
  background: rgba(219, 108, 3, 0.2);
}
.eco-icon-bitacora {
  background: rgba(23, 73, 9, 0.3);
}
.eco-icon-agent {
  background: rgba(96, 45, 31, 0.3);
}
.eco-icon-knowledge {
  background: rgba(247, 239, 197, 0.15);
}
.eco-icon-analytics {
  background: rgba(219, 108, 3, 0.1);
}
.eco-icon-api {
  background: rgba(23, 73, 9, 0.2);
}
.eco-icon-byok {
  background: rgba(219, 108, 3, 0.15);
}
.eco-icon-tasks {
  background: rgba(96, 45, 31, 0.2);
}
.eco-card h4 {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: 1rem;
  margin-bottom: 0.4rem;
}
.eco-card p {
  color: var(--landing-text-muted);
  font-size: 0.825rem;
  line-height: 1.5;
}

/* ===== PRICING ===== */
.section-pricing {
  padding: 6rem 1.5rem;
  max-width: 560px;
  margin: 0 auto;
}
.pricing-card {
  text-align: center;
  position: relative;
  overflow: hidden;
}
.pricing-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--landing-orange),
    var(--landing-cream),
    var(--landing-green)
  );
  opacity: 0.8;
}
.pricing-badge {
  display: inline-block;
  background: rgba(217, 101, 3, 0.15);
  border: 1px solid rgba(217, 101, 3, 0.3);
  color: var(--landing-orange);
  padding: 0.25rem 0.75rem;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1.5rem;
}
.pricing-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
  margin-bottom: 2rem;
}
.pricing-currency {
  font-size: 1.5rem;
  font-weight: 300;
  color: var(--landing-text-muted);
}
.pricing-number {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: 4rem;
  line-height: 1;
  background: linear-gradient(
    135deg,
    var(--landing-orange),
    var(--landing-cream)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.pricing-period {
  font-size: 0.9rem;
  color: var(--landing-text-muted);
}
.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 2rem;
  text-align: left;
  display: grid;
  gap: 0.6rem;
}
.pricing-features li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: var(--landing-text-muted);
}
.check-icon {
  color: var(--landing-green);
  font-weight: 700;
  flex-shrink: 0;
}
.pricing-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.pricing-guarantee {
  color: var(--landing-text-muted);
  font-size: 0.75rem;
  font-style: italic;
}

/* ===== CTA ===== */
.section-cta {
  padding: 6rem 1.5rem;
  text-align: center;
}
.cta-content {
  max-width: 560px;
  margin: 0 auto;
}
.cta-content h2 {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
  margin-bottom: 0.75rem;
}
.cta-content p {
  color: var(--landing-text-muted);
  margin-bottom: 2rem;
  font-size: 1rem;
}
.cta-form {
  display: flex;
  gap: 0.5rem;
  max-width: 460px;
  margin: 0 auto 0.75rem;
}
.cta-note {
  color: var(--landing-text-muted);
  font-size: 0.75rem;
}

/* ===== FOOTER ===== */
.landing-footer {
  border-top: 1px solid var(--landing-border);
  padding: 2.5rem 1.5rem;
}
.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}
.footer-tagline {
  color: var(--landing-text-muted);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
.footer-legal {
  color: var(--landing-text-muted);
  font-size: 0.75rem;
  margin-top: 1rem;
  opacity: 0.6;
}

/* ===== SUCCESS MODAL ===== */
.success-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2.5rem 2rem;
  background: var(--landing-bg);
  border-radius: 20px;
  border: 1px solid var(--landing-border);
}
.success-modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
.success-modal-title {
  font-family: "Fredoka", cursive;
  font-weight: 500;
  font-size: 1.4rem;
  color: var(--landing-text);
  margin-bottom: 0.75rem;
}
.success-modal-desc {
  color: var(--landing-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  max-width: 360px;
}
.success-modal-btn {
  min-width: 120px;
}

/* ===== MOBILE NAV ===== */
@media (max-width: 640px) {
  .nav-links a {
    display: none;
  }
  .hero-form,
  .pricing-form,
  .cta-form {
    flex-direction: column;
  }
  .hero-cta-btn {
    width: 100%;
  }
}
</style>
