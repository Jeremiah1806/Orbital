# ORBITAL ARCHITECT — NASA JPL Mission Design Lab Simulator
**2026 NASA Space Apps Challenge Submission**

## Overview
**ORBITAL ARCHITECT** is an interactive 3D space mission engineering game modeled after NASA JPL's Mission Design Lab (MDL) and General Mission Analysis Tool (GMAT). Instead of teaching rockets, orbits, and instruments in isolation, players design, balance, launch, and operate a complete space mission from concept to orbital operations while navigating coupled aerospace trade-offs.

## Key Features
1. **Coupled Systems Engineering Engine (`physics.js`):**
   - **Mass vs. Launch Capacity:** Evaluates structural bus, science payload, solar/nuclear power, and antenna mass against real booster limits.
   - **Inverse-Square Solar Flux ($1/r^2$):** Scales solar array output from 100% in Earth/Lunar orbit down to 43% at Mars (1.52 AU) and 3.7% at Europa (5.2 AU), requiring nuclear MMRTG power for outer-planet missions.
   - **Orbital Eclipse Survival:** Simulates battery discharge during planetary shadow passes.
   - **RF Downlink Bottlenecks:** Compares instrument data generation (Mbps) against S-Band, X-Band, and Ka-Band Deep Space Network (DSN) dish capacity.
2. **Real-Time 3D WebGL Assembly & Orbital Visualizer (`scene3d.js`):**
   - Procedural 3D spacecraft assembly that dynamically attaches solar wings, nuclear RTGs, battery packs, high-gain dishes, and science sensors.
   - Interactive 3D orbital trajectory view featuring the planet's eclipse shadow cone, surface science target zones, and live DSN telemetry beams.
3. **4 Operations Modes:**
   - **Solo Architect:** Full command of all 4 engineering subsystems.
   - **4-Player Team Mode:** Shareable Base64 telemetry tokens for collaborative team mission design.
   - **Sandbox Lab:** Unlimited budget and mass for free experimentation.
   - **Custom Architect Mode:** Allows educators and engineers to override component costs and create custom subsystem hardware in real time.

## How to Run Locally in VS Code
1. Unzip this folder and open it in **Visual Studio Code**.
2. Right-click `index.html` and select **Open with Live Server** (or simply double-click `index.html` to open it in any modern browser—zero `npm install` or build step required).
3. To deploy live for judges, drag and drop this folder onto **Netlify Drop** (`https://app.netlify.com/drop`).
