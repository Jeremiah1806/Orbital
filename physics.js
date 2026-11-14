// ORBITAL ARCHITECT — Aerospace Systems Engineering & Trade-Off Physics Engine

const SCENARIOS = [
  {
    id: "earth_ocean",
    title: "Earth Ocean & Climate Sentinel",
    difficulty: "CADET • EASY",
    diffClass: "diff-easy",
    body: "EARTH (LEO 700 km)",
    planetColor: 0x1d63b8,
    accentColor: 0x34d399,
    budget: 260,
    scienceGoal: 110,
    solarFluxPct: 100,
    eclipseMin: 35,
    orbitPeriodMin: 98,
    distanceAU: 1.0,
    desc: "Monitor global sea-surface temperatures and phytoplankton blooms from Sun-synchronous Low Earth Orbit.",
    nasaTwin: "Landsat 9 & Sentinel-6 Michael Freilich — Earth-observing satellites balancing high-rate optical/radar imaging with frequent polar ground passes.",
    baseline: { launch: "falcon_9_rideshare", science: ["multispectral_cam", "radar_altimeter"], power: ["deployable_solar_m", "li_ion_std"], comms: "xband_dish" }
  },
  {
    id: "lunar_ice",
    title: "Lunar South Pole Ice Mapper",
    difficulty: "ENGINEER • MEDIUM",
    diffClass: "diff-med",
    body: "MOON (Polar 100 km)",
    planetColor: 0x8a929a,
    accentColor: 0x38bdf8,
    budget: 380,
    scienceGoal: 165,
    solarFluxPct: 100,
    eclipseMin: 48,
    orbitPeriodMin: 118,
    distanceAU: 1.002,
    desc: "Map permanently shadowed craters at Shackleton Crater for water-ice deposits ahead of Artemis crewed landings.",
    nasaTwin: "Lunar Reconnaissance Orbiter (LRO) — Uses neutron spectrometers and laser altimetry in a cold polar lunar orbit with 48-minute solar eclipses.",
    baseline: { launch: "vulcan_centaur", science: ["neutron_spec", "lidar_mapper"], power: ["deployable_solar_l", "li_ion_high"], comms: "ka_high_gain" }
  },
  {
    id: "mars_recon",
    title: "Mars Subsurface Water & Weather Orbiter",
    difficulty: "DIRECTOR • HARD",
    diffClass: "diff-hard",
    body: "MARS (300 km Circular)",
    planetColor: 0xc25934,
    accentColor: 0xfbbf24,
    budget: 520,
    scienceGoal: 210,
    solarFluxPct: 43,
    eclipseMin: 42,
    orbitPeriodMin: 114,
    distanceAU: 1.52,
    desc: "Operate at 1.52 AU where solar intensity drops by 57%, demanding larger solar wings and high-gain deep-space dishes.",
    nasaTwin: "Mars Reconnaissance Orbiter (MRO) — Carries massive solar arrays and a 3-meter High-Gain Antenna to beam HiRISE imagery across 225 million km.",
    baseline: { launch: "falcon_heavy", science: ["hirise_optics", "subsurface_radar"], power: ["deployable_solar_l", "li_ion_high"], comms: "ka_high_gain" }
  },
  {
    id: "europa_plume",
    title: "Europa Cryo-Plume Recon",
    difficulty: "JPL FELLOW • EXTREME",
    diffClass: "diff-hard",
    body: "EUROPA (Jupiter 5.2 AU)",
    planetColor: 0xc8b89d,
    accentColor: 0x00d4ff,
    budget: 760,
    scienceGoal: 260,
    solarFluxPct: 3.7,
    eclipseMin: 75,
    orbitPeriodMin: 210,
    distanceAU: 5.2,
    desc: "At Jupiter (5.2 AU), sunlight is just 3.7% of Earth's. Standard solar panels starve—nuclear RTG power is critical.",
    nasaTwin: "Europa Clipper — Radiation-hardened outer-planet spacecraft designed to sample water plumes erupting through Europa's icy crust.",
    baseline: { launch: "sls_block1", science: ["mass_spec", "ice_radar", "magnetometer"], power: ["mmrtg_nuclear", "li_ion_high"], comms: "dsn_deep_dish" }
  }
];

const CATALOG = {
  launch: [
    {
      id: "electron_light",
      name: "SmallSat Dedicated Booster",
      cost: 35,
      maxMass: 450,
      deltaV: 7.8,
      desc: "Affordable light launcher for LEO CubeSats and small tech demos. Cannot lift heavy deep-space payloads."
    },
    {
      id: "falcon_9_rideshare",
      name: "Medium Reusable Falcon-Class",
      cost: 70,
      maxMass: 1400,
      deltaV: 9.4,
      desc: "Workhorse orbital launcher offering strong payload-to-cost efficiency for Earth and Lunar missions."
    },
    {
      id: "vulcan_centaur",
      name: "Heavy Cryo-Upper Stage Booster",
      cost: 125,
      maxMass: 2600,
      deltaV: 11.2,
      desc: "High-energy cryogenic upper stage ideal for Lunar polar insertion and medium interplanetary probes."
    },
    {
      id: "falcon_heavy",
      name: "Triple-Core Heavy Lift Vehicle",
      cost: 165,
      maxMass: 4200,
      deltaV: 12.6,
      desc: "Delivers large multi-instrument orbiters directly to Mars transfer trajectories."
    },
    {
      id: "sls_block1",
      name: "Super-Heavy Deep Space Launcher",
      cost: 290,
      maxMass: 6800,
      deltaV: 14.8,
      desc: "Maximum C3 injection energy for outer solar system missions to Jupiter and Europa."
    }
  ],
  science: [
    {
      id: "multispectral_cam",
      name: "Multispectral Ocean Imager",
      cost: 38,
      mass: 140,
      powerDraw: 110,
      sciencePts: 65,
      dataRateMbps: 18,
      desc: "Captures 12 visible and infrared bands to track ocean health, algae blooms, and coastal erosion."
    },
    {
      id: "radar_altimeter",
      name: "Ku-Band Radar Altimeter",
      cost: 44,
      mass: 180,
      powerDraw: 150,
      sciencePts: 60,
      dataRateMbps: 14,
      desc: "Measures sea-level rise and ice-sheet topography down to 2-centimeter precision."
    },
    {
      id: "neutron_spec",
      name: "Epithermal Neutron Spectrometer",
      cost: 52,
      mass: 160,
      powerDraw: 95,
      sciencePts: 85,
      dataRateMbps: 8,
      desc: "Detects subsurface hydrogen and water ice locked inside permanently shadowed lunar craters."
    },
    {
      id: "lidar_mapper",
      name: "3D Laser Terrain LiDAR",
      cost: 68,
      mass: 240,
      powerDraw: 220,
      sciencePts: 95,
      dataRateMbps: 32,
      desc: "Fires rapid laser pulses to map landing hazards in pitch-black polar craters."
    },
    {
      id: "hirise_optics",
      name: "0.5m High-Res Planetary Telescope",
      cost: 95,
      mass: 360,
      powerDraw: 260,
      sciencePts: 125,
      dataRateMbps: 55,
      desc: "Resolves boulders as small as 30 cm on Mars, generating massive image data files."
    },
    {
      id: "subsurface_radar",
      name: "Deep Ground-Penetrating Radar",
      cost: 78,
      mass: 310,
      powerDraw: 240,
      sciencePts: 100,
      dataRateMbps: 28,
      desc: "Uses 10-meter dipole antennas to peer kilometers beneath planetary ice and dust."
    },
    {
      id: "mass_spec",
      name: "Cryo-Plume Mass Spectrometer",
      cost: 110,
      mass: 290,
      powerDraw: 210,
      sciencePts: 120,
      dataRateMbps: 22,
      desc: "Sniffs organic molecules and salts ejected by active water geysers on icy moons."
    },
    {
      id: "ice_radar",
      name: "Europa Ice-Shell Sounder",
      cost: 92,
      mass: 340,
      powerDraw: 280,
      sciencePts: 105,
      dataRateMbps: 35,
      desc: "Maps subsurface ocean pockets beneath Europa's 20-kilometer ice crust."
    },
    {
      id: "magnetometer",
      name: "Boom-Mounted Magnetometer",
      cost: 34,
      mass: 85,
      powerDraw: 45,
      sciencePts: 55,
      dataRateMbps: 5,
      desc: "Measures induced magnetic fields to confirm global saltwater oceans beneath icy crusts."
    }
  ],
  power: [
    {
      id: "body_solar",
      name: "Body-Mounted GaAs Solar Cells",
      type: "gen",
      cost: 22,
      mass: 95,
      baseWatts: 320,
      batteryWh: 0,
      desc: "Simple fixed panels. Low mass, but limited output and sensitive to sun angle."
    },
    {
      id: "deployable_solar_m",
      name: "Dual-Wing Articulated Solar Arrays",
      type: "gen",
      cost: 48,
      mass: 210,
      baseWatts: 820,
      batteryWh: 0,
      desc: "Sun-tracking gimbaled solar wings delivering reliable power across Earth and Lunar orbits."
    },
    {
      id: "deployable_solar_l",
      name: "Mega-Span UltraFlex Solar Wings",
      type: "gen",
      cost: 86,
      mass: 390,
      baseWatts: 1850,
      batteryWh: 0,
      desc: "Oversized high-efficiency arrays engineered to harvest weak sunlight out at Mars."
    },
    {
      id: "mmrtg_nuclear",
      name: "MMRTG Plutonium-238 Nuclear Source",
      type: "gen",
      cost: 165,
      mass: 480,
      baseWatts: 950,
      batteryWh: 0,
      isNuclear: true,
      desc: "Generates continuous heat and electricity 24/7 regardless of sunlight or eclipses. Essential for Jupiter/Europa."
    },
    {
      id: "li_ion_std",
      name: "Standard Li-Ion Battery Pack (600 Wh)",
      type: "bat",
      cost: 24,
      mass: 110,
      baseWatts: 0,
      batteryWh: 600,
      desc: "Keeps avionics and heaters alive during short 35-minute LEO eclipses."
    },
    {
      id: "li_ion_high",
      name: "Deep-Cycle Radiation Battery (1600 Wh)",
      type: "bat",
      cost: 55,
      mass: 260,
      baseWatts: 0,
      batteryWh: 1600,
      desc: "High-capacity thermal-regulated battery bank for long planetary shadows."
    }
  ],
  comms: [
    {
      id: "sband_omni",
      name: "S-Band Low-Gain Patch Antenna",
      cost: 20,
      mass: 65,
      powerDraw: 40,
      downlinkCapacityMbps: 15,
      desc: "Reliable telemetry link for small LEO satellites, but too slow for heavy imaging payloads."
    },
    {
      id: "xband_dish",
      name: "X-Band Gimbaled Medium Dish (1.2m)",
      cost: 46,
      mass: 145,
      powerDraw: 95,
      downlinkCapacityMbps: 55,
      desc: "Standard NASA planetary science transponder capable of streaming radar and multispectral data."
    },
    {
      id: "ka_high_gain",
      name: "Ka-Band High-Gain Dish (2.5m)",
      cost: 84,
      mass: 240,
      powerDraw: 160,
      downlinkCapacityMbps: 130,
      desc: "High-frequency focused beam delivering 4x faster science data return from Moon and Mars."
    },
    {
      id: "dsn_deep_dish",
      name: "3.2m Deep-Space Ka/Optical Array",
      cost: 135,
      mass: 350,
      powerDraw: 230,
      downlinkCapacityMbps: 220,
      desc: "Flagship deep-space communications suite engineered to pierce 5.2 AU distance from Jupiter."
    }
  ]
};

function evaluateMissionDesign(state) {
  const scen = state.scenario;
  const isSandbox = state.mode === "sandbox";

  const launchPart = state.catalog.launch.find(p => p.id === state.selected.launch) || state.catalog.launch[0];
  const scienceParts = state.selected.science.map(id => state.catalog.science.find(p => p.id === id)).filter(Boolean);
  const powerParts = state.selected.power.map(id => state.catalog.power.find(p => p.id === id)).filter(Boolean);
  const commsPart = state.catalog.comms.find(p => p.id === state.selected.comms) || state.catalog.comms[0];

  // Base spacecraft bus structural mass & avionics draw
  const busMass = 220;
  const busPower = 90;

  const sciMass = scienceParts.reduce((s, p) => s + p.mass, 0);
  const pwrMass = powerParts.reduce((s, p) => s + p.mass, 0);
  const commsMass = commsPart ? commsPart.mass : 0;
  const totalMass = busMass + sciMass + pwrMass + commsMass;

  const launchCost = launchPart ? launchPart.cost : 0;
  const sciCost = scienceParts.reduce((s, p) => s + p.cost, 0);
  const pwrCost = powerParts.reduce((s, p) => s + p.cost, 0);
  const commsCost = commsPart ? commsPart.cost : 0;
  const totalCost = launchCost + sciCost + pwrCost + commsCost;

  // Power calculation with 1/r^2 solar flux scaling (unless Nuclear RTG)
  const fluxFactor = scen.solarFluxPct / 100;
  let generatedWatts = 0;
  let batteryWh = 0;
  let hasNuclear = false;

  powerParts.forEach(p => {
    if (p.isNuclear) {
      generatedWatts += p.baseWatts;
      hasNuclear = true;
    } else {
      generatedWatts += Math.round(p.baseWatts * fluxFactor);
    }
    batteryWh += (p.batteryWh || 0);
  });

  const sciPower = scienceParts.reduce((s, p) => s + p.powerDraw, 0);
  const commsPower = commsPart ? commsPart.powerDraw : 0;
  const totalDraw = busPower + sciPower + commsPower;
  const netPower = generatedWatts - totalDraw;

  // Eclipse survival check (Wh needed during dark shadow)
  const eclipseHours = scen.eclipseMin / 60;
  const eclipseEnergyNeeded = Math.round((busPower + sciPower * 0.45) * eclipseHours);
  const effectiveEclipseEnergy = hasNuclear ? Math.max(0, eclipseEnergyNeeded - generatedWatts * eclipseHours) : eclipseEnergyNeeded;
  const batteryMarginPct = batteryWh > 0 ? Math.min(100, Math.round(((batteryWh - effectiveEclipseEnergy) / batteryWh) * 100)) : -100;

  // Science & Downlink bottleneck
  const rawScience = scienceParts.reduce((s, p) => s + p.sciencePts, 0);
  const generatedMbps = scienceParts.reduce((s, p) => s + p.dataRateMbps, 0);
  const downlinkCap = commsPart ? commsPart.downlinkCapacityMbps : 0;
  const downlinkRatio = generatedMbps > 0 ? Math.min(1, downlinkCap / generatedMbps) : 1;
  const effectiveScience = Math.round(rawScience * (0.45 + 0.55 * downlinkRatio));

  // Blockers check
  const blockers = [];
  if (!isSandbox && totalCost > scen.budget) {
    blockers.push({ step: 0, msg: `OVER BUDGET BY $${totalCost - scen.budget}M — DOWNGRADE PARTS` });
  }
  if (!isSandbox && totalMass > launchPart.maxMass) {
    blockers.push({ step: 0, msg: `OVER MASS BY ${totalMass - launchPart.maxMass} KG — UPGRADE ROCKET` });
  }
  if (scienceParts.length === 0) {
    blockers.push({ step: 1, msg: "NO SCIENCE INSTRUMENTS MOUNTED" });
  }
  if (netPower < 0) {
    blockers.push({ step: 2, msg: `POWER DEFICIT (${netPower} W) — ADD SOLAR OR RTG` });
  }
  if (batteryWh <= 0 && !hasNuclear) {
    blockers.push({ step: 2, msg: "NO BATTERY BANK FOR ECLIPSE SHADOW" });
  }

  return {
    totalCost,
    budgetCap: scen.budget,
    totalMass,
    massCap: launchPart.maxMass,
    generatedWatts,
    totalDraw,
    netPower,
    batteryWh,
    batteryMarginPct,
    hasNuclear,
    rawScience,
    effectiveScience,
    scienceGoal: scen.scienceGoal,
    generatedMbps,
    downlinkCap,
    downlinkRatio,
    costBreakdown: { launchCost, sciCost, pwrCost, commsCost },
    blockers,
    canLaunch: blockers.length === 0
  };
}
