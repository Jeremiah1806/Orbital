// ORBITAL ARCHITECT — Game State, Telemetry Audio, 2D FX & UI Controller

class TelemetryAudio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  beep(freq = 880, dur = 0.06, type = "sine", gainVal = 0.06) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }
  click() { this.beep(740, 0.045, "triangle", 0.05); }
  quindar() {
    this.beep(2525, 0.08, "sine", 0.05);
    setTimeout(() => this.beep(2475, 0.08, "sine", 0.05), 110);
  }
  alert() {
    this.beep(520, 0.14, "sawtooth", 0.07);
    setTimeout(() => this.beep(440, 0.18, "sawtooth", 0.07), 160);
  }
  launchRumble() {
    this.beep(95, 0.9, "sawtooth", 0.09);
  }
}

const sfx = new TelemetryAudio();

const STEP_META = [
  {
    title: "01. Launch Vehicle & Target Orbit",
    desc: "Choose a booster capable of lifting your spacecraft mass to the target planet.",
    insight: "Engineering Trade-Off: Heavy rockets unlock higher payload mass limits for science gear, but consume budget needed for solar wings and high-gain dishes."
  },
  {
    title: "02. Scientific Payload Instruments",
    desc: "Select one or more instruments to achieve your mission's Science Point target.",
    insight: "Engineering Trade-Off: High-resolution optical and radar sensors yield huge Science Points, but draw heavy wattage and generate high Mbps data streams."
  },
  {
    title: "03. Power Generation & Eclipse Survival",
    desc: "Balance solar arrays (or nuclear RTGs) with battery storage for dark planetary shadows.",
    insight: "Engineering Trade-Off: Solar output drops with distance squared (just 3.7% at Jupiter/Europa). Without a battery bank or RTG, your spacecraft freezes in eclipse."
  },
  {
    title: "04. Communications & Deep Space Network",
    desc: "Size your antenna dish to beam science data back to NASA DSN ground stations.",
    insight: "Engineering Trade-Off: If your science instruments generate more Mbps than your antenna can transmit, valuable mission data overflows and is lost."
  }
];

const TOUR_STEPS = [
  {
    badge: "FLIGHT DIRECTOR BRIEFING • 1 OF 3",
    title: "Every Part Triggers a Real Engineering Trade-Off",
    body: "Adding high-resolution cameras boosts Science Points, but increases spacecraft Mass and Power draw. Keep all 4 bottom resource gauges in the green."
  },
  {
    badge: "FLIGHT DIRECTOR BRIEFING • 2 OF 3",
    title: "Survive Sunlight & Dark Planetary Eclipses",
    body: "In Step 03, pair solar wings (or a nuclear RTG for outer planets) with a battery pack so your spacecraft stays alive while passing behind the planet."
  },
  {
    badge: "FLIGHT DIRECTOR BRIEFING • 3 OF 3",
    title: "Use 'Load Baseline' or Launch Directly",
    body: "New to orbital design? Click 'Load Baseline' in the top bar for a working starter spacecraft, inspect it in 3D, then hit 'Execute Launch'!"
  }
];

const state = {
  mode: "solo",
  scenario: JSON.parse(JSON.stringify(SCENARIOS[0])),
  catalog: JSON.parse(JSON.stringify(CATALOG)),
  step: 0,
  tourIdx: 0,
  selected: {
    launch: "falcon_9_rideshare",
    science: ["multispectral_cam"],
    power: ["deployable_solar_m", "li_ion_std"],
    comms: "xband_dish"
  },
  expandedParts: {},
  floatPopups: []
};

let viewport3D;

function initApp() {
  viewport3D = new SpaceViewport3D("three-canvas", "viewport-container");
  renderScenarios();
  bindEvents();
  updateAllUI();
  start2DOverlays();
}

function renderScenarios() {
  const container = document.getElementById("scenario-list");
  container.innerHTML = "";
  SCENARIOS.forEach((scen, idx) => {
    const card = document.createElement("div");
    card.className = "scenario-card" + (state.scenario.id === scen.id ? " active" : "");
    card.innerHTML = `
      <div class="scen-top">
        <span class="scen-diff ${scen.diffClass}">${scen.difficulty}</span>
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${scen.body}</span>
      </div>
      <div class="scen-title">${scen.title}</div>
      <div class="scen-desc">${scen.desc}</div>
      <div class="scen-specs">
        <span>BUDGET: $${scen.budget}M</span>
        <span>GOAL: ${scen.scienceGoal} PTS</span>
        <span>FLUX: ${scen.solarFluxPct}%</span>
      </div>
    `;
    card.onclick = () => {
      sfx.click();
      state.scenario = JSON.parse(JSON.stringify(SCENARIOS[idx]));
      renderScenarios();
    };
    container.appendChild(card);
  });
}

function bindEvents() {
  // Mode selection
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.onclick = () => {
      sfx.click();
      document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.mode = btn.dataset.mode;
      document.getElementById("custom-mission-panel").classList.toggle("hidden", state.mode !== "custom");
    };
  });

  // Start Mission from Briefing
  document.getElementById("btn-start-mission").onclick = () => {
    sfx.quindar();
    if (state.mode === "custom") {
      state.scenario.title = document.getElementById("cust-title").value || "Custom Mission";
      state.scenario.budget = Number(document.getElementById("cust-budget").value) || 450;
      state.scenario.scienceGoal = Number(document.getElementById("cust-science").value) || 180;
      state.scenario.solarFluxPct = Number(document.getElementById("cust-flux").value) || 100;
    }
    document.getElementById("briefing-modal").classList.add("hidden");
    viewport3D.buildOrbitEnvironment(state.scenario.planetColor, state.scenario.accentColor);
    viewport3D.handleResize();
    updateAllUI();

    if (document.getElementById("chk-tour").checked) {
      state.tourIdx = 0;
      showTourStep();
    }
  };

  document.getElementById("btn-open-briefing").onclick = () => {
    sfx.click();
    document.getElementById("briefing-modal").classList.remove("hidden");
  };

  // Step Tabs
  document.querySelectorAll(".step-tab").forEach(tab => {
    tab.onclick = () => {
      sfx.click();
      state.step = Number(tab.dataset.step);
      updateAllUI();
    };
  });

  // Load Baseline & Clear
  document.getElementById("btn-preset-baseline").onclick = () => {
    sfx.quindar();
    state.selected = JSON.parse(JSON.stringify(state.scenario.baseline));
    spawnFloatPopup("BASELINE LOADED", "#00d4ff");
    updateAllUI();
  };

  document.getElementById("btn-preset-clear").onclick = () => {
    sfx.click();
    state.selected = {
      launch: state.catalog.launch[0].id,
      science: [],
      power: [],
      comms: state.catalog.comms[0].id
    };
    spawnFloatPopup("HANGAR CLEARED", "#f59e0b");
    updateAllUI();
  };

  // View Switcher
  document.getElementById("btn-view-craft").onclick = () => {
    sfx.click();
    document.getElementById("btn-view-craft").classList.add("active");
    document.getElementById("btn-view-orbit").classList.remove("active");
    document.getElementById("camera-presets").classList.add("hidden");
    viewport3D.setViewMode("craft");
  };

  document.getElementById("btn-view-orbit").onclick = () => {
    sfx.click();
    document.getElementById("btn-view-orbit").classList.add("active");
    document.getElementById("btn-view-craft").classList.remove("active");
    document.getElementById("camera-presets").classList.remove("hidden");
    viewport3D.setViewMode("orbit");
  };

  document.querySelectorAll(".cam-btn").forEach(btn => {
    btn.onclick = () => {
      sfx.click();
      document.querySelectorAll(".cam-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      viewport3D.setCameraPreset(btn.dataset.cam);
    };
  });

  // Smart Blocker Hint button navigates directly to bottleneck tab
  document.getElementById("btn-smart-hint").onclick = () => {
    const evalRes = evaluateMissionDesign(state);
    if (evalRes.blockers.length > 0) {
      sfx.click();
      state.step = evalRes.blockers[0].step;
      updateAllUI();
    }
  };

  // Tour Navigation
  document.getElementById("btn-tour-skip").onclick = () => {
    document.getElementById("tour-modal").classList.add("hidden");
  };
  document.getElementById("btn-tour-next").onclick = () => {
    sfx.click();
    state.tourIdx++;
    if (state.tourIdx >= TOUR_STEPS.length) {
      document.getElementById("tour-modal").classList.add("hidden");
    } else {
      showTourStep();
    }
  };

  // Custom Part Modal
  document.getElementById("btn-add-custom-part").onclick = () => {
    sfx.click();
    document.getElementById("custom-part-modal").classList.remove("hidden");
  };
  document.getElementById("btn-close-custom-part").onclick = () => {
    document.getElementById("custom-part-modal").classList.add("hidden");
  };
  document.getElementById("btn-save-custom-part").onclick = saveCustomComponent;

  // Team Sync Modal
  document.getElementById("btn-team-sync").onclick = () => {
    sfx.click();
    document.getElementById("sync-code-box").value = btoa(JSON.stringify(state.selected));
    document.getElementById("sync-modal").classList.remove("hidden");
  };
  document.getElementById("btn-close-sync").onclick = () => {
    document.getElementById("sync-modal").classList.add("hidden");
  };
  document.getElementById("btn-copy-sync").onclick = () => {
    navigator.clipboard.writeText(document.getElementById("sync-code-box").value);
    sfx.quindar();
  };
  document.getElementById("btn-load-sync").onclick = () => {
    try {
      const decoded = JSON.parse(atob(document.getElementById("sync-code-box").value.trim()));
      state.selected = decoded;
      document.getElementById("sync-modal").classList.add("hidden");
      updateAllUI();
      sfx.quindar();
    } catch (e) {
      alert("Invalid Team Sync token.");
    }
  };

  // Audio toggles
  const toggleAudio = () => {
    sfx.enabled = !sfx.enabled;
    const icon = sfx.enabled ? "volume_up" : "volume_off";
    document.querySelector("#btn-audio-toggle span").textContent = icon;
    document.querySelector("#btn-audio-toggle-modal span").textContent = icon;
  };
  document.getElementById("btn-audio-toggle").onclick = toggleAudio;
  document.getElementById("btn-audio-toggle-modal").onclick = toggleAudio;

  // Launch Execution
  document.getElementById("btn-launch").onclick = executeLaunchSequence;

  // Report Buttons
  document.getElementById("btn-edit-design").onclick = () => {
    document.getElementById("report-modal").classList.add("hidden");
    document.getElementById("flight-hud").classList.add("hidden");
    viewport3D.isSimulating = false;
  };
  document.getElementById("btn-new-mission").onclick = () => {
    document.getElementById("report-modal").classList.add("hidden");
    document.getElementById("flight-hud").classList.add("hidden");
    document.getElementById("briefing-modal").classList.remove("hidden");
    viewport3D.isSimulating = false;
  };
}

function showTourStep() {
  const t = TOUR_STEPS[state.tourIdx];
  document.getElementById("tour-step-badge").textContent = t.badge;
  document.getElementById("tour-title").textContent = t.title;
  document.getElementById("tour-body").textContent = t.body;
  document.getElementById("tour-next-label").textContent = state.tourIdx === TOUR_STEPS.length - 1 ? "Start Building" : "Next Tip";
  document.getElementById("tour-modal").classList.remove("hidden");
}

function saveCustomComponent() {
  const name = document.getElementById("cp-name").value.trim() || "Custom Subsystem Unit";
  const cost = Number(document.getElementById("cp-cost").value) || 40;
  const mass = Number(document.getElementById("cp-mass").value) || 120;
  const power = Number(document.getElementById("cp-power").value) || 80;
  const val = Number(document.getElementById("cp-value").value) || 80;
  const desc = document.getElementById("cp-desc").value.trim() || "User-engineered custom NASA subsystem.";
  const id = "custom_" + Date.now();

  if (state.step === 0) {
    state.catalog.launch.push({ id, name, cost, maxMass: val * 20, deltaV: 11.5, desc });
    state.selected.launch = id;
  } else if (state.step === 1) {
    state.catalog.science.push({ id, name, cost, mass, powerDraw: power, sciencePts: val, dataRateMbps: 20, desc });
    state.selected.science.push(id);
  } else if (state.step === 2) {
    state.catalog.power.push({ id, name, type: "gen", cost, mass, baseWatts: Math.abs(power), batteryWh: val * 10, desc });
    state.selected.power.push(id);
  } else if (state.step === 3) {
    state.catalog.comms.push({ id, name, cost, mass, powerDraw: power, downlinkCapacityMbps: val, desc });
    state.selected.comms = id;
  }

  document.getElementById("custom-part-modal").classList.add("hidden");
  sfx.quindar();
  spawnFloatPopup("+CUSTOM PART", "#00d4ff");
  updateAllUI();
}

function updateAllUI() {
  const evalRes = evaluateMissionDesign(state);

  // Header updates
  document.getElementById("hdr-mission-name").textContent = state.scenario.title.toUpperCase();
  document.getElementById("hdr-mode-tag").textContent = state.mode.toUpperCase();
  document.getElementById("btn-team-sync").classList.toggle("hidden", state.mode !== "team");
  document.getElementById("btn-add-custom-part").classList.toggle("hidden", state.mode !== "custom");

  // Step Tabs
  document.querySelectorAll(".step-tab").forEach((t, idx) => {
    t.classList.toggle("active", idx === state.step);
  });

  const meta = STEP_META[state.step];
  document.getElementById("step-title").textContent = meta.title;
  document.getElementById("step-desc").textContent = meta.desc;
  document.getElementById("insight-text").innerHTML = `<strong>${meta.insight.split(":")[0]}:</strong>${meta.insight.split(":")[1]}`;

  renderComponentCards();

  // Telemetry HUD
  document.getElementById("tele-body").textContent = state.scenario.body;
  document.getElementById("tele-flux").textContent = `${state.scenario.solarFluxPct}% (${Math.round(1361 * state.scenario.solarFluxPct / 100)} W/m²)`;
  document.getElementById("tele-eclipse").textContent = `${state.scenario.eclipseMin} min / orbit`;

  // Stacked Cost Bar
  const cap = Math.max(evalRes.budgetCap, evalRes.totalCost, 1);
  const { launchCost, sciCost, pwrCost, commsCost } = evalRes.costBreakdown;
  document.querySelector(".seg-launch").style.width = `${(launchCost / cap) * 100}%`;
  document.querySelector(".seg-science").style.width = `${(sciCost / cap) * 100}%`;
  document.querySelector(".seg-power").style.width = `${(pwrCost / cap) * 100}%`;
  document.querySelector(".seg-comms").style.width = `${(commsCost / cap) * 100}%`;
  document.getElementById("breakdown-total-label").textContent = state.mode === "sandbox" ? `$${evalRes.totalCost}M (SANDBOX)` : `$${evalRes.totalCost}M / $${evalRes.budgetCap}M`;

  // Bottom 4 Gauges
  updateGauge("budget", `$${evalRes.totalCost} / $${evalRes.budgetCap}M`, evalRes.totalCost / evalRes.budgetCap, state.mode !== "sandbox" && evalRes.totalCost > evalRes.budgetCap);
  updateGauge("mass", `${evalRes.totalMass} / ${evalRes.massCap} kg`, evalRes.totalMass / evalRes.massCap, state.mode !== "sandbox" && evalRes.totalMass > evalRes.massCap);
  updateGauge("power", `${evalRes.netPower >= 0 ? "+" : ""}${evalRes.netPower} W`, Math.min(1, evalRes.generatedWatts / Math.max(1, evalRes.totalDraw)), evalRes.netPower < 0);
  updateGauge("science", `${evalRes.effectiveScience} / ${evalRes.scienceGoal} PTS`, evalRes.effectiveScience / evalRes.scienceGoal, false);

  // Overmass 3D Banner
  document.getElementById("overmass-banner").classList.toggle("hidden", !(state.mode !== "sandbox" && evalRes.totalMass > evalRes.massCap));

  // Readiness Blocker & Launch Button
  const blockerBtn = document.getElementById("btn-smart-hint");
  const launchBtn = document.getElementById("btn-launch");
  if (evalRes.canLaunch) {
    blockerBtn.classList.add("ready");
    document.getElementById("blocker-icon").textContent = "check_circle";
    document.getElementById("blocker-text").textContent = "ALL SYSTEMS NOMINAL — READY FOR LAUNCH";
    launchBtn.disabled = false;
  } else {
    blockerBtn.classList.remove("ready");
    document.getElementById("blocker-icon").textContent = "error";
    document.getElementById("blocker-text").textContent = evalRes.blockers[0].msg;
    launchBtn.disabled = true;
  }

  // Update 3D Spacecraft Mesh
  viewport3D.rebuildSpacecraft(state, evalRes);
}

function updateGauge(key, text, ratio, isDanger) {
  const el = document.getElementById(`g-${key}`);
  document.getElementById(`val-${key}`).textContent = text;
  const fill = document.getElementById(`bar-${key}`);
  fill.style.width = `${Math.max(6, Math.min(100, ratio * 100))}%`;
  el.classList.toggle("danger", isDanger);
}

function renderComponentCards() {
  const list = document.getElementById("component-list");
  list.innerHTML = "";
  const categories = ["launch", "science", "power", "comms"];
  const catKey = categories[state.step];
  const items = state.catalog[catKey];

  items.forEach(part => {
    const isMulti = catKey === "science" || catKey === "power";
    const isSelected = isMulti ? state.selected[catKey].includes(part.id) : state.selected[catKey] === part.id;

    let pillsHtml = "";
    if (catKey === "launch") {
      pillsHtml = `<span class="stat-pill">MAX PAYLOAD: ${part.maxMass} kg</span><span class="stat-pill">Δv: ${part.deltaV} km/s</span>`;
    } else if (catKey === "science") {
      pillsHtml = `<span class="stat-pill">+${part.sciencePts} SCI</span><span class="stat-pill">${part.mass} kg</span><span class="stat-pill">-${part.powerDraw} W</span><span class="stat-pill">${part.dataRateMbps} Mbps</span>`;
    } else if (catKey === "power") {
      const pwrLabel = part.baseWatts > 0 ? `+${part.isNuclear ? part.baseWatts : Math.round(part.baseWatts * state.scenario.solarFluxPct / 100)} W` : `+${part.batteryWh} Wh BAT`;
      pillsHtml = `<span class="stat-pill">${pwrLabel}</span><span class="stat-pill">${part.mass} kg</span>`;
    } else if (catKey === "comms") {
      pillsHtml = `<span class="stat-pill">CAP: ${part.downlinkCapacityMbps} Mbps</span><span class="stat-pill">${part.mass} kg</span><span class="stat-pill">-${part.powerDraw} W</span>`;
    }

    const card = document.createElement("div");
    card.className = "part-card" + (isSelected ? " selected" : "");

    const costHtml = state.mode === "custom"
      ? `<input type="number" class="cost-edit-input" value="${part.cost}" onclick="event.stopPropagation()" onchange="overridePartCost('${catKey}','${part.id}', this.value)" />`
      : `<span class="part-cost">$${part.cost}M</span>`;

    const isExpanded = !!state.expandedParts[part.id];

    card.innerHTML = `
      <div class="part-top">
        <div class="part-name">
          <span class="material-symbols-outlined" style="color:${isSelected ? 'var(--cyan)' : 'var(--text-muted)'}">${isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
          <span>${part.name}</span>
        </div>
        ${costHtml}
      </div>
      <div class="part-pills">${pillsHtml}</div>
      <button class="part-details-toggle" onclick="event.stopPropagation(); togglePartDetails('${part.id}')">
        <span>${isExpanded ? 'Hide Specs' : 'Specs & Trade-offs'}</span>
        <span class="material-symbols-outlined" style="font-size:14px">${isExpanded ? 'expand_less' : 'expand_more'}</span>
      </button>
      ${isExpanded ? `<div class="part-extra-desc">${part.desc}</div>` : ""}
    `;

    card.onclick = () => {
      sfx.click();
      if (isMulti) {
        const arr = state.selected[catKey];
        const idx = arr.indexOf(part.id);
        if (idx >= 0) {
          arr.splice(idx, 1);
          spawnFloatPopup(`-$${part.cost}M`, "#f59e0b");
        } else {
          arr.push(part.id);
          spawnFloatPopup(`+$${part.cost}M`, "#00d4ff");
        }
      } else {
        state.selected[catKey] = part.id;
        spawnFloatPopup(`${part.name.split(" ")[0]} MOUNTED`, "#00d4ff");
      }
      updateAllUI();
    };

    list.appendChild(card);
  });
}

window.togglePartDetails = (id) => {
  state.expandedParts[id] = !state.expandedParts[id];
  renderComponentCards();
};

window.overridePartCost = (catKey, id, val) => {
  const part = state.catalog[catKey].find(p => p.id === id);
  if (part) {
    part.cost = Math.max(0, Number(val) || 0);
    updateAllUI();
  }
};

function spawnFloatPopup(text, color) {
  state.floatPopups.push({
    text,
    color,
    x: 180 + Math.random() * 140,
    y: 220,
    alpha: 1.0
  });
}

// STAGE 3: LAUNCH COUNTDOWN & ACCELERATED 3D FLIGHT SIMULATION
function executeLaunchSequence() {
  const evalRes = evaluateMissionDesign(state);
  if (!evalRes.canLaunch) return;

  sfx.launchRumble();
  const cdOverlay = document.getElementById("countdown-overlay");
  const cdNum = document.getElementById("cd-number");
  cdOverlay.classList.remove("hidden");

  let count = 3;
  cdNum.textContent = "T-3";

  const cdTimer = setInterval(() => {
    count--;
    if (count > 0) {
      cdNum.textContent = `T-${count}`;
      document.getElementById("cd-alt").textContent = `${(3 - count) * 42.5} km`;
      document.getElementById("cd-vel").textContent = `${((3 - count) * 2.45).toFixed(2)} km/s`;
    } else if (count === 0) {
      cdNum.textContent = "IGNITION";
      document.getElementById("cd-alt").textContent = "185.0 km";
      document.getElementById("cd-vel").textContent = "7.82 km/s";
      sfx.quindar();
    } else {
      clearInterval(cdTimer);
      cdOverlay.classList.add("hidden");
      startOrbitalFlight(evalRes);
    }
  }, 650);
}

function startOrbitalFlight(evalRes) {
  // Switch to Orbit & Eclipse View
  document.getElementById("btn-view-orbit").click();
  document.getElementById("flight-hud").classList.remove("hidden");

  viewport3D.isSimulating = true;
  viewport3D.simProgress = 0;

  let progress = 0;
  let batteryPct = 100;
  let scienceCollected = 0;
  let dataDownlinked = 0;
  let crisisTriggered = false;
  let crisisPenaltyBat = 0;
  let crisisPenaltySci = 0;
  const flightLogs = [];

  const simInterval = setInterval(() => {
    if (!document.getElementById("crisis-modal").classList.contains("hidden")) return;

    progress += 1.6;
    viewport3D.simProgress = progress / 100;

    // Trigger Interactive Mid-Flight Crisis at 48%
    if (progress >= 48 && !crisisTriggered) {
      crisisTriggered = true;
      sfx.alert();
      triggerMidFlightCrisis((batDelta, sciDelta, logText) => {
        crisisPenaltyBat += batDelta;
        crisisPenaltySci += sciDelta;
        flightLogs.push(logText);
      });
      return;
    }

    // Eclipse battery drain vs Sunlight recharge
    const sunPill = document.getElementById("fl-sun-state");
    if (viewport3D.inEclipse && !evalRes.hasNuclear) {
      sunPill.textContent = "ECLIPSE SHADOW";
      sunPill.classList.add("eclipse");
      const drainRate = evalRes.batteryWh >= 1500 ? 0.55 : evalRes.batteryWh >= 600 ? 1.15 : 2.4;
      batteryPct = Math.max(0, batteryPct - drainRate);
    } else {
      sunPill.textContent = evalRes.hasNuclear ? "RTG NUCLEAR" : "SUNLIGHT";
      sunPill.classList.remove("eclipse");
      batteryPct = Math.min(100, batteryPct + 1.1);
    }

    const effectiveBat = Math.max(0, batteryPct - crisisPenaltyBat);
    scienceCollected = Math.max(0, Math.round((evalRes.effectiveScience * (progress / 100)) - crisisPenaltySci));
    dataDownlinked = ((scienceCollected * 0.42) * evalRes.downlinkRatio).toFixed(1);

    document.getElementById("flight-pct").textContent = `${Math.min(100, Math.round(progress))}%`;
    document.getElementById("flight-bar-fill").style.width = `${Math.min(100, progress)}%`;
    document.getElementById("fl-sci").textContent = `${scienceCollected} PTS`;
    document.getElementById("fl-bat").textContent = `${Math.round(effectiveBat)}%`;
    document.getElementById("fl-data").textContent = `${dataDownlinked} Gb`;

    // Early Battery Failure Check
    if (effectiveBat <= 2) {
      clearInterval(simInterval);
      viewport3D.isSimulating = false;
      flightLogs.push("CRITICAL FAILURE: Spacecraft batteries depleted during planetary eclipse shadow.");
      showPostFlightReport(evalRes, scienceCollected, 0, flightLogs, true);
      return;
    }

    if (progress >= 100) {
      clearInterval(simInterval);
      viewport3D.isSimulating = false;
      sfx.quindar();
      showPostFlightReport(evalRes, scienceCollected, Math.round(effectiveBat), flightLogs, false);
    }
  }, 110);
}

function triggerMidFlightCrisis(onResolve) {
  const modal = document.getElementById("crisis-modal");
  document.getElementById("crisis-title").textContent = "Coronal Mass Ejection (Solar Proton Storm)";
  document.getElementById("crisis-desc").textContent =
    "NASA Space Weather predicts an intense solar storm hitting your orbit in 90 seconds. How should Flight Control respond?";

  const choices = document.getElementById("crisis-choices");
  choices.innerHTML = "";

  const opts = [
    {
      title: "Option A: Enter Safe Mode & Power Down Sensors",
      desc: "Protects battery health (0% battery loss), but sacrifices 18 Science Points during the storm pass.",
      bat: 0,
      sci: 18,
      log: "CRISIS RESPONSE: Commanded Safe Mode during CME storm — preserved bus batteries with minor science pause."
    },
    {
      title: "Option B: Keep Instruments Active Through Storm",
      desc: "Maintains full science collection (0 Science lost), but overloads power bus (-22% Battery reserve).",
      bat: 22,
      sci: 0,
      log: "CRISIS RESPONSE: Rode out CME storm at full power — captured peak radiation data at the cost of 22% battery capacity."
    }
  ];

  opts.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "crisis-choice-btn";
    btn.innerHTML = `<strong>${opt.title}</strong><span>${opt.desc}</span>`;
    btn.onclick = () => {
      sfx.click();
      modal.classList.add("hidden");
      onResolve(opt.bat, opt.sci, opt.log);
    };
    choices.appendChild(btn);
  });

  modal.classList.remove("hidden");
}

function showPostFlightReport(evalRes, finalScience, finalBattery, logs, failedByBattery) {
  const goalMet = !failedByBattery && finalScience >= state.scenario.scienceGoal;
  const budgetEff = Math.max(0, Math.round(((evalRes.budgetCap - evalRes.totalCost) / evalRes.budgetCap) * 100));

  let rank = "FAILED";
  let score = Math.max(0, finalScience * 4 + finalBattery * 2);
  if (goalMet) {
    score += budgetEff * 5;
    rank = score >= 950 ? "S" : score >= 780 ? "A" : score >= 620 ? "B" : "C";
  }

  document.getElementById("rep-title").textContent = goalMet ? "MISSION ACCOMPLISHED" : "MISSION OBJECTIVES INCOMPLETE";
  document.getElementById("rep-subtitle").textContent = goalMet
    ? `Achieved ${finalScience}/${state.scenario.scienceGoal} Science Points within NASA JPL flight tolerances.`
    : failedByBattery
      ? "Spacecraft froze during orbital eclipse due to insufficient battery capacity."
      : `Collected ${finalScience} PTS, falling short of the ${state.scenario.scienceGoal} PTS contract goal.`;

  const rankEl = document.getElementById("rep-rank");
  rankEl.textContent = rank;
  rankEl.style.borderColor = goalMet ? "var(--green)" : "var(--red)";
  rankEl.style.color = goalMet ? "var(--green)" : "var(--red)";

  document.getElementById("rep-score").textContent = score;
  document.getElementById("rep-sci").textContent = `${finalScience} / ${state.scenario.scienceGoal} PTS`;
  document.getElementById("rep-budget").textContent = `$${evalRes.totalCost}M / $${evalRes.budgetCap}M`;
  document.getElementById("rep-bat").textContent = `${finalBattery}%`;

  const list = document.getElementById("rep-findings");
  list.innerHTML = "";

  const items = [
    {
      cls: goalMet ? "good" : "fail",
      text: goalMet
        ? `SCIENCE GOAL MET: Returned ${finalScience} Science Points across ${state.selected.science.length} active instrument(s).`
        : `SCIENCE SHORTFALL: Add higher-yield instruments or upgrade your antenna dish to prevent data bottlenecks.`
    },
    {
      cls: evalRes.downlinkRatio >= 0.9 ? "good" : "fail",
      text: evalRes.downlinkRatio >= 0.9
        ? `RF DOWNLINK NOMINAL: Antenna capacity (${evalRes.downlinkCap} Mbps) cleanly transmitted ${Math.round(evalRes.downlinkRatio * 100)}% of sensor data.`
        : `DATA BOTTLENECK: Instruments generated ${evalRes.generatedMbps} Mbps, exceeding your antenna's ${evalRes.downlinkCap} Mbps limit.`
    },
    {
      cls: failedByBattery ? "fail" : "good",
      text: failedByBattery
        ? `ECLIPSE BLACKOUT: Upgrade to a 1600 Wh Deep-Cycle Battery or Nuclear MMRTG to survive ${state.scenario.eclipseMin}-minute shadows.`
        : `THERMAL & POWER SURVIVAL: Spacecraft maintained +${evalRes.netPower} W net power and ended with ${finalBattery}% battery reserve.`
    },
    ...logs.map(l => ({ cls: "good", text: l }))
  ];

  items.forEach(item => {
    const li = document.createElement("li");
    li.className = item.cls;
    li.textContent = item.text;
    list.appendChild(li);
  });

  document.getElementById("rep-twin").textContent = state.scenario.nasaTwin;
  document.getElementById("report-modal").classList.remove("hidden");
}

// 2D TACTICAL RADAR, OSCILLOSCOPE & FLOATING DELTA POPUPS
function start2DOverlays() {
  const fxCanvas = document.getElementById("fx-canvas");
  const fxCtx = fxCanvas.getContext("2d");
  const scopeCanvas = document.getElementById("scope-canvas");
  const scopeCtx = scopeCanvas.getContext("2d");
  const radarCanvas = document.getElementById("radar-canvas");
  const radarCtx = radarCanvas.getContext("2d");

  let phase = 0;

  function render2D() {
    phase += 0.05;

    // Floating Delta Popups on main viewport
    fxCanvas.width = fxCanvas.clientWidth || 600;
    fxCanvas.height = fxCanvas.clientHeight || 400;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);

    state.floatPopups = state.floatPopups.filter(p => p.alpha > 0.02);
    state.floatPopups.forEach(p => {
      p.y -= 0.9;
      p.alpha -= 0.018;
      fxCtx.save();
      fxCtx.globalAlpha = p.alpha;
      fxCtx.font = "700 13px 'JetBrains Mono', monospace";
      fxCtx.fillStyle = p.color;
      fxCtx.fillText(p.text, p.x, p.y);
      fxCtx.restore();
    });

    // Telemetry Oscilloscope
    scopeCtx.clearRect(0, 0, 110, 48);
    scopeCtx.strokeStyle = "#1f2737";
    scopeCtx.strokeRect(0.5, 0.5, 109, 47);
    scopeCtx.beginPath();
    scopeCtx.strokeStyle = "#10b981";
    scopeCtx.lineWidth = 1.5;
    for (let x = 2; x < 108; x += 2) {
      const y = 24 + Math.sin(x * 0.12 + phase) * 9 + Math.cos(x * 0.05 - phase * 1.4) * 5;
      if (x === 2) scopeCtx.moveTo(x, y);
      else scopeCtx.lineTo(x, y);
    }
    scopeCtx.stroke();

    // Tactical Radar Sweep
    radarCtx.clearRect(0, 0, 64, 64);
    radarCtx.strokeStyle = "rgba(0, 212, 255, 0.35)";
    radarCtx.lineWidth = 1;
    [10, 20, 30].forEach(r => {
      radarCtx.beginPath();
      radarCtx.arc(32, 32, r, 0, Math.PI * 2);
      radarCtx.stroke();
    });
    radarCtx.beginPath();
    radarCtx.moveTo(32, 32);
    radarCtx.lineTo(32 + Math.cos(phase) * 30, 32 + Math.sin(phase) * 30);
    radarCtx.strokeStyle = "#00d4ff";
    radarCtx.stroke();

    radarCtx.fillStyle = "#f59e0b";
    radarCtx.beginPath();
    radarCtx.arc(21, 38, 2.5, 0, Math.PI * 2);
    radarCtx.fill();

    requestAnimationFrame(render2D);
  }
  requestAnimationFrame(render2D);
}

window.addEventListener("DOMContentLoaded", initApp);
