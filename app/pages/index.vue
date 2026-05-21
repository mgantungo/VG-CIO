<!-- app/pages/index.vue -->
<template>
  <div class="portal-root">

    <Head>
      <Title>VGAMS — Select Portal</Title>
      <Link rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" />
    </Head>

    <!-- ── Background grid texture ─────────────────────────────── -->
    <div class="bg-grid" aria-hidden="true" />

    <!-- ── Main tree layout ────────────────────────────────────── -->
    <div class="tree-wrap">

      <!-- Root node -->
      <div class="root-node">
        <div class="root-emblem">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="26" height="26" rx="5" stroke="#0066CC" stroke-width="1.5"/>
            <path d="M7 14h14M14 7v14" stroke="#0066CC" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="14" cy="14" r="3" fill="#003366"/>
          </svg>
        </div>
        <div class="root-text">
          <span class="root-label">VGAMS</span>
          <span class="root-sub">Vision Group Advertising Management System</span>
        </div>
        <div class="root-badge">newvision.co.ug</div>
      </div>

      <!-- Trunk line -->
      <div class="trunk" aria-hidden="true" />

      <!-- Branch connector -->
      <div class="branch-row" aria-hidden="true">
        <div class="branch-arm branch-arm--left" />
        <div class="branch-arm branch-arm--right" />
      </div>

      <!-- Portal cards -->
      <div class="portals">

        <!-- ── VGAMS Staff Login ──────────────────────────────── -->
        <NuxtLink to="/login" class="portal-card portal-card--primary" tabindex="0">
          <div class="portal-stem portal-stem--left" aria-hidden="true" />
          <div class="portal-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="16" cy="10" r="5" stroke="#003366" stroke-width="1.5"/>
              <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#003366" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="portal-body">
            <h2 class="portal-title">Ads Booking Portal</h2>
            <p class="portal-desc">Booking clerks, editors, finance team, design house & advertising managers</p>
            <ul class="portal-roles">
              <li>Booking Clerk</li>
              <li>Sub Editor</li>
              <li>Advertising Manager</li>
              <li>Design House</li>
              <li>Finance Team</li>
            </ul>
          </div>
          <div class="portal-action">
            <span class="portal-action-label">Enter Portal</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </NuxtLink>

        <!-- ── SFA Login ──────────────────────────────────────── -->
        <NuxtLink to="/sfa-login" class="portal-card portal-card--secondary" tabindex="0">
          <div class="portal-stem portal-stem--right" aria-hidden="true" />
          <div class="portal-icon-wrap portal-icon-wrap--alt">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="5" y="8" width="22" height="16" rx="2" stroke="#1A5276" stroke-width="1.5"/>
              <path d="M5 13h22M11 8v5M21 8v5" stroke="#1A5276" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="16" cy="19" r="2" fill="#1A5276"/>
            </svg>
          </div>
          <div class="portal-body">
            <h2 class="portal-title">Sales Force Automation Portal</h2>
            <p class="portal-desc">Sales force automation — field agents, account managers & sales operations</p>
            <ul class="portal-roles">
              <li>Sales Agents</li>
              <li>Sales Person</li>
              <li>Group Supervisors</li>
              <li>Sales Operations</li>
            </ul>
          </div>
          <div class="portal-action portal-action--alt">
            <span class="portal-action-label">Enter Portal</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </NuxtLink>

      </div><!-- /portals -->

    </div><!-- /tree-wrap -->

    <!-- Footer -->
    <footer class="portal-footer">
      <span>© {{ new Date().getFullYear() }} Vision Group Ltd</span>
      <span class="footer-dot" aria-hidden="true">·</span>
      <span>VGAMS v2</span>
      <span class="footer-dot" aria-hidden="true">·</span>
      <span>All access is logged and monitored</span>
    </footer>

  </div>
</template>

<script setup>
definePageMeta({ layout: false })
</script>

<style scoped>
/* ── Root shell ────────────────────────────────────────────────── */
.portal-root {
  font-family: 'IBM Plex Sans', sans-serif;
  height: 98vh;
  background: #F0F4F8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* ── Subtle dot-grid background ───────────────────────────────── */
.bg-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, #CBD5E3 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.55;
  pointer-events: none;
}

/* ── Tree wrapper ─────────────────────────────────────────────── */
.tree-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 820px;
  padding: 0 24px;
}

/* ── Root node ────────────────────────────────────────────────── */
.root-node {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #ffffff;
  border: 1.5px solid #D1D9E0;
  border-radius: 10px;
  padding: 16px 28px;
  box-shadow: 0 2px 12px rgba(0, 51, 102, 0.07);
}

.root-emblem {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  background: #EBF1FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.root-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.root-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #003366;
  letter-spacing: 1.5px;
}

.root-sub {
  font-size: 11.5px;
  color: #5A7A9A;
  font-weight: 400;
  max-width: 340px;
}

.root-badge {
  margin-left: auto;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  color: #0066CC;
  background: #EBF1FA;
  border: 1px solid #B8CFEA;
  border-radius: 4px;
  padding: 3px 9px;
  letter-spacing: 0.5px;
}

/* ── Trunk ────────────────────────────────────────────────────── */
.trunk {
  width: 2px;
  height: 36px;
  background: #B8CFEA;
  flex-shrink: 0;
}

/* ── Branch arms ──────────────────────────────────────────────── */
.branch-row {
  display: flex;
  width: 540px;
  position: relative;
}

.branch-arm {
  height: 2px;
  width: 50%;
  background: #B8CFEA;
}

.branch-arm--left {
  border-radius: 2px 0 0 0;
  align-self: flex-start;
  margin-top: 0;
  position: relative;
}

.branch-arm--left::before {
  content: '';
  position: absolute;
  left: 0; top: -16px;
  width: 2px; height: 16px;
  background: #B8CFEA;
}

.branch-arm--right {
  border-radius: 0 2px 0 0;
}

.branch-arm--right::before {
  content: '';
  position: absolute;
  right: 0; top: -16px;
  width: 2px; height: 16px;
  background: #B8CFEA;
}

/* ── Portal cards row ─────────────────────────────────────────── */
.portals {
  display: flex;
  gap: 32px;
  width: 100%;
  max-width: 820px;
}

/* ── Portal card ──────────────────────────────────────────────── */
.portal-card {
  position: relative;
  flex: 1;
  background: #ffffff;
  border: 1.5px solid #D1D9E0;
  border-radius: 10px;
  padding: 28px 26px 22px;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.15s;
  box-shadow: 0 2px 8px rgba(0, 51, 102, 0.05);
}

.portal-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 51, 102, 0.11);
}

.portal-card--primary:hover { border-color: #0066CC; }
.portal-card--secondary:hover { border-color: #1A5276; }

/* stem drop from branch arm down to card top */
.portal-stem {
  position: absolute;
  top: -18px;
  width: 2px;
  height: 18px;
  background: #B8CFEA;
}

.portal-stem--left  { left: 50%; transform: translateX(-50%); }
.portal-stem--right { left: 50%; transform: translateX(-50%); }

/* ── Icon ─────────────────────────────────────────────────────── */
.portal-icon-wrap {
  width: 56px;
  height: 56px;
  background: #EBF1FA;
  border-radius: 10px;
  border: 1.5px solid #C5D8EF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.portal-icon-wrap--alt {
  background: #EAF0F8;
  border-color: #B8CEEA;
}

/* ── Card body ────────────────────────────────────────────────── */
.portal-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.portal-title {
  font-size: 17px;
  font-weight: 700;
  color: #003366;
  margin: 0;
  letter-spacing: 0.2px;
}

.portal-desc {
  font-size: 12.5px;
  color: #5A7A9A;
  line-height: 1.55;
  margin: 0;
}

.portal-roles {
  list-style: none;
  padding: 0;
  margin: 6px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.portal-roles li {
  font-size: 10.5px;
  font-weight: 600;
  color: #3A6B99;
  background: #EBF1FA;
  border: 1px solid #C5D8EF;
  border-radius: 4px;
  padding: 2px 8px;
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.2px;
}

/* ── Action row ───────────────────────────────────────────────── */
.portal-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #E8EDF3;
  color: #0066CC;
  font-size: 12.5px;
  font-weight: 600;
  transition: gap 0.15s;
}

.portal-action--alt { color: #1A5276; }

.portal-card:hover .portal-action { gap: 10px; }

.portal-action-label { flex: 1; }

/* ── Footer ───────────────────────────────────────────────────── */
.portal-footer {
  position: absolute;
  bottom: 16px;
  left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 11px;
  color: #8A9BB5;
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.3px;
}

.footer-dot { opacity: 0.4; }
</style>