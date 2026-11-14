// ORBITAL ARCHITECT — 3D WebGL Spacecraft Assembly & Orbital Mechanics Engine

class SpaceViewport3D {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById(containerId);
    this.viewMode = "craft"; // "craft" | "orbit"
    this.cameraPreset = "overview";
    this.isSimulating = false;
    this.simProgress = 0;
    this.inEclipse = false;
    this.overMass = false;
    this.powerHealthy = true;

    this.rotY = 0.55;
    this.rotX = 0.28;
    this.zoom = 1.0;
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };

    this.initScene();
    this.bindInteractions();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  getSize() {
    const rect = this.container.getBoundingClientRect();
    return {
      w: Math.max(320, Math.floor(rect.width)),
      h: Math.max(240, Math.floor(rect.height))
    };
  }

  initScene() {
    const { w, h } = this.getSize();
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    this.camera.position.set(0, 2.2, 6.2);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Three-point aerospace studio + solar lighting
    const ambient = new THREE.AmbientLight(0x6b82a6, 0.95);
    this.scene.add(ambient);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.sunLight.position.set(10, 6, 8);
    this.scene.add(this.sunLight);

    const rimLight = new THREE.DirectionalLight(0x00d4ff, 0.75);
    rimLight.position.set(-8, -4, -6);
    this.scene.add(rimLight);

    // Starfield background
    const starGeo = new THREE.BufferGeometry();
    const starVerts = [];
    for (let i = 0; i < 900; i++) {
      starVerts.push((Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180, (Math.random() - 0.5) * 180);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcbd5e1, size: 0.35 });
    this.scene.add(new THREE.Points(starGeo, starMat));

    // CAD Assembly Group
    this.craftGroup = new THREE.Group();
    this.scene.add(this.craftGroup);

    this.cadGrid = new THREE.GridHelper(8, 16, 0x1e293b, 0x111827);
    this.cadGrid.position.y = -1.7;
    this.scene.add(this.cadGrid);

    // Orbit & Planet Group
    this.orbitGroup = new THREE.Group();
    this.orbitGroup.visible = false;
    this.scene.add(this.orbitGroup);

    this.buildOrbitEnvironment(0x1d63b8, 0x34d399);

    // ResizeObserver prevents 0x0 canvas bugs
    this.resizeObs = new ResizeObserver(() => this.handleResize());
    this.resizeObs.observe(this.container);
  }

  handleResize() {
    const { w, h } = this.getSize();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  buildOrbitEnvironment(planetColor, accentColor) {
    while (this.orbitGroup.children.length) {
      this.orbitGroup.remove(this.orbitGroup.children[0]);
    }

    // Planet Sphere
    const planetGeo = new THREE.SphereGeometry(1.75, 42, 42);
    const planetMat = new THREE.MeshStandardMaterial({
      color: planetColor,
      roughness: 0.65,
      metalness: 0.1
    });
    this.planetMesh = new THREE.Mesh(planetGeo, planetMat);
    this.orbitGroup.add(this.planetMesh);

    // Subtle atmosphere / rim ring
    const atmoGeo = new THREE.SphereGeometry(1.83, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.14,
      wireframe: true
    });
    this.orbitGroup.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Target Science Zone Marker on Planet Surface
    const targetGeo = new THREE.RingGeometry(0.16, 0.28, 24);
    const targetMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, side: THREE.DoubleSide });
    this.targetZone = new THREE.Mesh(targetGeo, targetMat);
    this.targetZone.position.set(0, 1.76, 0.15);
    this.targetZone.rotation.x = Math.PI / 2;
    this.planetMesh.add(this.targetZone);

    // DSN Ground Station Marker
    const dsnGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const dsnMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff });
    this.dsnStation = new THREE.Mesh(dsnGeo, dsnMat);
    this.dsnStation.position.set(1.45, 0.65, 0.75);
    this.planetMesh.add(this.dsnStation);

    // Eclipse Shadow Cone (Night side -X)
    const shadowGeo = new THREE.CylinderGeometry(1.75, 1.85, 6.5, 32, 1, true);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x02040a,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const shadowCone = new THREE.Mesh(shadowGeo, shadowMat);
    shadowCone.rotation.z = Math.PI / 2;
    shadowCone.position.set(-4.8, 0, 0);
    this.orbitGroup.add(shadowCone);

    // Orbital Trajectory Ring
    const pts = [];
    const rx = 3.3, rz = 2.9;
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * 0.65, Math.sin(a) * rz));
    }
    const orbitCurveGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const orbitCurveMat = new THREE.LineBasicMaterial({ color: 0x00d4ff });
    this.orbitLine = new THREE.Line(orbitCurveGeo, orbitCurveMat);
    this.orbitGroup.add(this.orbitLine);

    // Mini Orbiting Satellite
    this.orbitSat = new THREE.Group();
    const satCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.24, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.7, roughness: 0.25 })
    );
    const satWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.03, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.5, roughness: 0.3 })
    );
    this.orbitSat.add(satCore, satWing);
    this.orbitGroup.add(this.orbitSat);

    // Live Cyan Telemetry Downlink Beam
    const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 1)]);
    const beamMat = new THREE.LineBasicMaterial({ color: 0x10b981 });
    this.dsnBeam = new THREE.Line(beamGeo, beamMat);
    this.orbitGroup.add(this.dsnBeam);
  }

  rebuildSpacecraft(state, evalResult) {
    this.overMass = !evalResult.canLaunch && evalResult.totalMass > evalResult.massCap && state.mode !== "sandbox";
    this.powerHealthy = evalResult.netPower >= 0;

    while (this.craftGroup.children.length) {
      this.craftGroup.remove(this.craftGroup.children[0]);
    }

    // Core Octagonal Bus (Gold MLI Thermal Foil)
    const busGeo = new THREE.CylinderGeometry(0.72, 0.72, 1.35, 8);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd99b26,
      metalness: 0.78,
      roughness: 0.28
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    this.craftGroup.add(busMesh);

    // Top Avionics Deck
    const deckGeo = new THREE.CylinderGeometry(0.76, 0.76, 0.16, 16);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.4 });
    const topDeck = new THREE.Mesh(deckGeo, deckMat);
    topDeck.position.y = 0.72;
    this.craftGroup.add(topDeck);

    // Engine Nozzle + Ion Thruster Glow
    const nozzleGeo = new THREE.CylinderGeometry(0.22, 0.38, 0.42, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.y = -0.85;
    this.craftGroup.add(nozzle);

    if (this.powerHealthy) {
      const plumeGeo = new THREE.ConeGeometry(0.26, 0.7, 16);
      const plumeMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.65 });
      const plume = new THREE.Mesh(plumeGeo, plumeMat);
      plume.rotation.x = Math.PI;
      plume.position.y = -1.35;
      this.craftGroup.add(plume);
    }

    // Power Subsystems (Solar Wings or Nuclear MMRTG)
    const pwrIds = state.selected.power;
    const hasNuclear = pwrIds.includes("mmrtg_nuclear");
    const hasLargeSolar = pwrIds.includes("deployable_solar_l");
    const hasMedSolar = pwrIds.includes("deployable_solar_m") || pwrIds.some(id => id.startsWith("custom_"));

    if (hasNuclear) {
      // Finned RTG Nuclear Generator Boom
      const rtgGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.15, 12);
      const rtgMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.35 });
      const rtg = new THREE.Mesh(rtgGeo, rtgMat);
      rtg.rotation.z = Math.PI / 3;
      rtg.position.set(1.05, -0.25, 0);
      this.craftGroup.add(rtg);
    }

    if (hasLargeSolar || hasMedSolar) {
      const span = hasLargeSolar ? 2.5 : 1.75;
      const panelGeo = new THREE.BoxGeometry(span, 0.05, 0.68);
      const panelMat = new THREE.MeshStandardMaterial({
        color: this.powerHealthy ? 0x1d4ed8 : 0x475569,
        emissive: this.powerHealthy ? 0x091e42 : 0x000000,
        metalness: 0.55,
        roughness: 0.22
      });
      const leftWing = new THREE.Mesh(panelGeo, panelMat);
      leftWing.position.set(-(0.75 + span / 2), 0.1, 0);
      const rightWing = new THREE.Mesh(panelGeo, panelMat);
      rightWing.position.set(0.75 + span / 2, 0.1, 0);
      this.craftGroup.add(leftWing, rightWing);
    }

    // Battery Modules on Bus Side
    if (pwrIds.includes("li_ion_std") || pwrIds.includes("li_ion_high")) {
      const batGeo = new THREE.BoxGeometry(0.32, 0.55, 0.25);
      const batMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4, roughness: 0.4 });
      const bat = new THREE.Mesh(batGeo, batMat);
      bat.position.set(0, -0.05, 0.76);
      this.craftGroup.add(bat);
    }

    // Comms Dish on Top Deck
    const commsId = state.selected.comms;
    const dishRadius = commsId === "dsn_deep_dish" ? 0.85 : commsId === "ka_high_gain" ? 0.65 : commsId === "xband_dish" ? 0.45 : 0.25;
    const dishGeo = new THREE.SphereGeometry(dishRadius, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.42);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      side: THREE.DoubleSide,
      metalness: 0.3,
      roughness: 0.35
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.rotation.x = Math.PI;
    dish.position.set(0, 0.82 + dishRadius * 0.45, 0);
    this.craftGroup.add(dish);

    // Mounted Science Instruments around Bus
    state.selected.science.forEach((sciId, idx) => {
      const angle = (idx / Math.max(1, state.selected.science.length)) * Math.PI * 2 + 0.5;
      const instGeo = new THREE.BoxGeometry(0.34, 0.42, 0.34);
      const instMat = new THREE.MeshStandardMaterial({ color: 0x00d4ff, metalness: 0.5, roughness: 0.3 });
      const inst = new THREE.Mesh(instGeo, instMat);
      inst.position.set(Math.cos(angle) * 0.78, 0.35, Math.sin(angle) * 0.78);
      this.craftGroup.add(inst);
    });

    // Red Over-Mass Structural Warning Wireframe Cage
    if (this.overMass) {
      const cageGeo = new THREE.BoxGeometry(3.4, 2.5, 2.2);
      const cageMat = new THREE.MeshBasicMaterial({ color: 0xef4444, wireframe: true });
      this.overMassCage = new THREE.Mesh(cageGeo, cageMat);
      this.craftGroup.add(this.overMassCage);
    }

    // Subtle pop-in scale animation
    this.craftGroup.scale.set(0.86, 0.86, 0.86);
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.craftGroup.visible = mode === "craft";
    this.cadGrid.visible = mode === "craft";
    this.orbitGroup.visible = mode === "orbit";
  }

  setCameraPreset(preset) {
    this.cameraPreset = preset;
  }

  bindInteractions() {
    this.container.addEventListener("mousedown", e => {
      this.isDragging = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener("mouseup", () => { this.isDragging = false; });
    window.addEventListener("mousemove", e => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMouse.x;
      const dy = e.clientY - this.prevMouse.y;
      this.rotY += dx * 0.008;
      this.rotX = Math.max(-1.1, Math.min(1.1, this.rotX + dy * 0.008));
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });
    this.container.addEventListener("wheel", e => {
      e.preventDefault();
      this.zoom = Math.max(0.55, Math.min(2.1, this.zoom + e.deltaY * 0.001));
    }, { passive: false });
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    // Smooth pop-in recovery
    this.craftGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.14);

    if (this.viewMode === "craft") {
      if (!this.isDragging) this.rotY += 0.004;
      this.craftGroup.rotation.y = this.rotY;
      this.craftGroup.rotation.x = this.rotX;
      this.camera.position.set(0, 1.4 * this.zoom, 5.4 * this.zoom);
      this.camera.lookAt(0, 0, 0);
    } else {
      // Orbit & Flight Mode
      const orbitAngle = this.isSimulating ? this.simProgress * Math.PI * 6 : time * 0.0007;
      const rx = 3.3, rz = 2.9;
      const sx = Math.cos(orbitAngle) * rx;
      const sy = Math.sin(orbitAngle) * 0.65;
      const sz = Math.sin(orbitAngle) * rz;

      this.orbitSat.position.set(sx, sy, sz);
      this.orbitSat.lookAt(0, 0, 0);
      this.planetMesh.rotation.y += 0.002;

      // Eclipse detection when behind planet on -X side
      this.inEclipse = sx < -1.1 && Math.abs(sz) < 1.75;

      // Update live DSN telemetry beam
      const dsnWorld = new THREE.Vector3();
      this.dsnStation.getWorldPosition(dsnWorld);
      this.dsnBeam.geometry.setFromPoints([this.orbitSat.position.clone(), dsnWorld]);
      this.dsnBeam.visible = dsnWorld.distanceTo(this.orbitSat.position) < 4.5;

      if (this.cameraPreset === "chase") {
        this.camera.position.lerp(new THREE.Vector3(sx * 1.45, sy + 1.1, sz * 1.45), 0.08);
        this.camera.lookAt(sx, sy, sz);
      } else if (this.cameraPreset === "dsn") {
        this.camera.position.lerp(new THREE.Vector3(3.6, 2.2, 3.6), 0.08);
        this.camera.lookAt(dsnWorld);
      } else {
        const dist = 7.4 * this.zoom;
        this.camera.position.set(Math.sin(this.rotY) * dist, 3.2 * this.zoom + this.rotX * 3, Math.cos(this.rotY) * dist);
        this.camera.lookAt(0, 0, 0);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
