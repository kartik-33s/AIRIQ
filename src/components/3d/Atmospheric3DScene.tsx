import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LocationData, AqiStandard } from '../../types/aqi';
import { getAqiCategory } from '../../lib/aqi';
import { SensorPartId, STATION_SENSORS } from './sensorData';
import { playTelemetryChirp } from '../../lib/audioTelemetry';

export type CameraViewPreset = 'hero' | 'dispersion' | 'inversion' | 'panorama' | 'macro';

interface Atmospheric3DSceneProps {
  locationData: LocationData | null;
  standard: AqiStandard;
  cameraPreset: CameraViewPreset;
  explodedFactor: number; // 0.0 to 1.0
  showParticles: boolean;
  showInversionCap?: boolean;
  timeOfDay: number; // 0 (morning) to 1 (night)
  selectedSensorId?: SensorPartId | null;
  simulatedAqi?: number | null;
  simulatedWindSpeed?: number | null;
  onSelectSensor?: (sensorId: SensorPartId) => void;
}

// Module-level pre-allocated scratch vectors to prevent GC churn inside requestAnimationFrame
const _scratchVec3 = new THREE.Vector3();
const _scratchMat4 = new THREE.Matrix4();
const _scratchColor = new THREE.Color();
const _targetCamPos = new THREE.Vector3();
const _targetCamLookAt = new THREE.Vector3();

// Procedural texture generator for the solar photovoltaic panel
function createSolarCellTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0a192f';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    [128, 256, 384].forEach((pos) => {
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 512);
      ctx.stroke();
    });
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural digital edge-compute screen texture
function createDigitalScreenTexture(aqiVal: number, cityName: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // OLED deep black background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 512, 256);

    // Cyan glowing border
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 244);

    // Header info
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('AIRIQ TELEMETRY CORE v4.8', 24, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(`LOC: ${cityName.toUpperCase().slice(0, 20)}`, 24, 74);
    ctx.fillText('NET: CAMS LEO SATELLITE [SYNC]', 24, 98);

    // Large Live AQI Display
    ctx.fillStyle = aqiVal > 200 ? '#ef4444' : aqiVal > 100 ? '#f59e0b' : '#10b981';
    ctx.font = 'bold 74px monospace';
    ctx.fillText(`AQI ${aqiVal}`, 24, 180);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px monospace';
    ctx.fillText('OPTICAL BENCH: 650nm LASER ACTIVE', 24, 222);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural soft contact shadow texture
function createRadialShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 120);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0.55)');
    gradient.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

// Procedural particulate aerosol texture
function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.7)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export const Atmospheric3DScene: React.FC<Atmospheric3DSceneProps> = ({
  locationData,
  standard,
  cameraPreset,
  explodedFactor,
  showParticles,
  showInversionCap = true,
  timeOfDay,
  selectedSensorId,
  simulatedAqi,
  simulatedWindSpeed,
  onSelectSensor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable state in refs so React state updates do not recreate WebGL
  const stateRef = useRef({
    explodedFactor,
    showParticles,
    showInversionCap,
    cameraPreset,
    timeOfDay,
    locationData,
    standard,
    selectedSensorId,
    simulatedAqi,
    simulatedWindSpeed,
  });

  useEffect(() => {
    stateRef.current = {
      explodedFactor,
      showParticles,
      showInversionCap,
      cameraPreset,
      timeOfDay,
      locationData,
      standard,
      selectedSensorId,
      simulatedAqi,
      simulatedWindSpeed,
    };
  }, [
    explodedFactor,
    showParticles,
    showInversionCap,
    cameraPreset,
    timeOfDay,
    locationData,
    standard,
    selectedSensorId,
    simulatedAqi,
    simulatedWindSpeed,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Detection Guard (SwiftShader/llvmpipe)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Scene, Camera, and Renderer Initialization
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );
    camera.position.set(10, 8, 14);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.appendChild(renderer.domElement);

    // 3. OrbitControls with Silky Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 2.5;
    controls.maxDistance = 110;
    controls.target.set(0, 4.0, 0);

    let isUserInteracting = false;
    controls.addEventListener('start', () => {
      isUserInteracting = true;
    });
    controls.addEventListener('end', () => {
      isUserInteracting = false;
    });

    // 4. Studio Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig (Warm Key + Cool Fill + Celestial Light)
    const hemiLight = new THREE.HemisphereLight(0xd4d4d4, 0x171717, 1.3);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.5);
    keyLight.position.set(18, 28, 14);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 16;
    keyLight.shadow.camera.bottom = -16;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-16, 14, -16);
    scene.add(rimLight);

    // Dynamic Fog initialized to ambient horizon
    scene.fog = new THREE.FogExp2(0x000000, 0.012);
    scene.background = new THREE.Color(0x000000);

    // 6. Ground Radar & Concentric Terrain Grid
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.85,
      metalness: 0.15,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Concentric laser radar rings etched into the ground
    const radarGroup = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.1, 0.15, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    [6, 14, 25, 40].forEach((radius) => {
      const ring = new THREE.Mesh(new THREE.RingGeometry(radius - 0.08, radius + 0.08, 64), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      radarGroup.add(ring);
    });
    scene.add(radarGroup);

    // Soft radial contact shadow directly underneath the station
    const shadowTex = createRadialShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(10, 10);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.025;
    scene.add(contactShadow);

    // 7. COMPOSITE 10-PART PROCEDURAL MONITORING STATION SUBJECT
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x262626,
      roughness: 0.85,
      metalness: 0.05,
    });
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0xa3a3a3,
      roughness: 0.25,
      metalness: 0.85,
    });
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.3,
      metalness: 0.75,
    });
    const nephelometerMat = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.2,
      metalness: 0.85,
    });
    const copperMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.25,
      metalness: 0.9,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.15,
      metalness: 0.95,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isSoftwareGl ? 0.35 : 0.92,
      roughness: 0.05,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.9,
      ior: 1.55,
      thickness: 0.8,
      depthWrite: false,
    });
    const solarTex = createSolarCellTexture();
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.15,
      metalness: 0.6,
    });
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.4,
    });

    const screenTex = createDigitalScreenTexture(100, 'Station Core');
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTex,
    });

    // Part 1: Heavy Beveled Octagonal Concrete Base Pedestal
    const basePart = new THREE.Group();
    basePart.userData = { sensorId: 'pedestal' };
    const baseMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 0.6, 8), concreteMat);
    baseMesh.position.y = 0.3;
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    basePart.add(baseMesh);

    // 8 anchor bolts
    const boltGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, mastMat);
      bolt.position.set(Math.cos(angle) * 1.8, 0.65, Math.sin(angle) * 1.8);
      basePart.add(bolt);
    }
    stationGroup.add(basePart);

    // Part 2: Structural Lattice Titanium Mast
    const mastPart = new THREE.Group();
    const centralCol = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.2, 16), mastMat);
    centralCol.position.y = 2.2;
    centralCol.castShadow = !isSoftwareGl;
    mastPart.add(centralCol);

    const ribGeo = new THREE.BoxGeometry(0.08, 3.0, 0.25);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const rib = new THREE.Mesh(ribGeo, mastMat);
      rib.position.set(Math.cos(angle) * 0.55, 2.2, Math.sin(angle) * 0.55);
      rib.rotation.y = angle;
      mastPart.add(rib);
    }
    stationGroup.add(mastPart);

    // Part 3: Main Avionics Enclosure with Digital Telemetry OLED Screen
    const enclosurePart = new THREE.Group();
    enclosurePart.userData = { sensorId: 'avionics' };
    const podMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 1.4, 6), housingMat);
    podMesh.position.y = 4.4;
    podMesh.castShadow = !isSoftwareGl;
    enclosurePart.add(podMesh);

    // Heatsink fins
    const finGeo = new THREE.BoxGeometry(0.04, 1.0, 0.4);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeo, mastMat);
      fin.position.set(Math.cos(angle) * 1.15, 4.4, Math.sin(angle) * 1.15);
      fin.rotation.y = angle;
      enclosurePart.add(fin);
    }

    // High-tech curved digital telemetry screen mounted on front face
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), screenMat);
    screenMesh.position.set(0, 4.4, 1.18);
    enclosurePart.add(screenMesh);
    stationGroup.add(enclosurePart);

    // Part 4: Laser Optical Particulate Nephelometer Chamber (PM2.5 / PM10)
    const nephelometerPart = new THREE.Group();
    nephelometerPart.userData = { sensorId: 'nephelometer' };
    const opticalChamber = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 16), nephelometerMat);
    opticalChamber.rotation.z = Math.PI / 2;
    opticalChamber.position.set(-0.8, 4.4, 0.6);
    opticalChamber.castShadow = !isSoftwareGl;
    nephelometerPart.add(opticalChamber);

    const trumpetMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.2, 0.35, 16), brassMat);
    trumpetMesh.rotation.z = -Math.PI / 2;
    trumpetMesh.position.set(-1.4, 4.4, 0.6);
    nephelometerPart.add(trumpetMesh);

    // Atmospheric LIDAR optical laser beam (vertical cylinder shooting into the sky)
    const lidarBeamGeo = new THREE.CylinderGeometry(0.04, 0.12, 16, 12);
    const lidarBeamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lidarBeam = new THREE.Mesh(lidarBeamGeo, lidarBeamMat);
    lidarBeam.position.set(-0.8, 12.4, 0.6);
    nephelometerPart.add(lidarBeam);
    stationGroup.add(nephelometerPart);

    // Part 5: Solar Pyranometer & UV Spectroradiometer
    const radiometerPart = new THREE.Group();
    radiometerPart.userData = { sensorId: 'radiometer' };
    const armMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), mastMat);
    armMesh.rotation.z = Math.PI / 3;
    armMesh.position.set(0.8, 5.0, 0.5);
    radiometerPart.add(armMesh);

    const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16), brassMat);
    brassRing.position.set(1.3, 5.3, 0.5);
    radiometerPart.add(brassRing);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      glassMat
    );
    glassDome.position.set(1.3, 5.38, 0.5);
    radiometerPart.add(glassDome);
    stationGroup.add(radiometerPart);

    // Part 6: Multi-Gas Electrochemical Canister (NO2, SO2, CO, O3)
    const gasPart = new THREE.Group();
    gasPart.userData = { sensorId: 'gas_analyzer' };
    const gasCanister = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.85, 16), copperMat);
    gasCanister.position.set(-0.65, 4.4, -0.65);
    gasCanister.castShadow = !isSoftwareGl;
    gasPart.add(gasCanister);

    // 4 sampling orifice ports
    for (let i = 0; i < 4; i++) {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), brassMat);
      const angle = (i / 4) * Math.PI * 2;
      port.position.set(-0.65 + Math.cos(angle) * 0.35, 4.4, -0.65 + Math.sin(angle) * 0.35);
      gasPart.add(port);
    }
    stationGroup.add(gasPart);

    // Part 7: Photovoltaic Solar Panel Wing
    const solarPart = new THREE.Group();
    solarPart.userData = { sensorId: 'solar' };
    const panelFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 1.2), housingMat);
    panelFrame.position.set(0, 4.6, -1.2);
    panelFrame.rotation.x = Math.PI / 5;
    panelFrame.castShadow = !isSoftwareGl;

    const panelSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), solarMat);
    panelSurface.rotation.x = -Math.PI / 2;
    panelSurface.position.y = 0.05;
    panelFrame.add(panelSurface);
    solarPart.add(panelFrame);
    stationGroup.add(solarPart);

    // Part 8: Real-Time AQI Beacon Halo (Glow Ring)
    const beaconPart = new THREE.Group();
    beaconPart.userData = { sensorId: 'beacon' };
    const beaconMesh = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.07, 16, 32), beaconMat);
    beaconMesh.rotation.x = Math.PI / 2;
    beaconMesh.position.y = 5.25;
    beaconPart.add(beaconMesh);
    stationGroup.add(beaconPart);

    // Part 9: Tri-Axial Ultrasonic Wind Anemometer Head with Spinning Cups
    const spirePart = new THREE.Group();
    spirePart.userData = { sensorId: 'anemometer' };
    const spireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.15, 2.4, 12), mastMat);
    spireMesh.position.y = 6.4;
    spireMesh.castShadow = !isSoftwareGl;
    spirePart.add(spireMesh);

    // Rotating Anemometer Rotor Sub-Group
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, 7.3, 0);

    const cupArmGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const smallArm = new THREE.Mesh(cupArmGeo, brassMat);
      smallArm.position.set(Math.cos(angle) * 0.4, 0, Math.sin(angle) * 0.4);
      smallArm.rotation.y = angle;
      smallArm.rotation.z = Math.PI / 2;

      // Anemometer half-cup
      const cup = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12, 0, Math.PI),
        housingMat
      );
      cup.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
      cup.rotation.y = angle + Math.PI / 2;
      rotorGroup.add(smallArm);
      rotorGroup.add(cup);
    }
    spirePart.add(rotorGroup);
    stationGroup.add(spirePart);

    // 8. PROCEDURAL INSTANCED URBAN TREES
    const treeCount = 36;
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1.2, 8);
    const foliageGeo = new THREE.ConeGeometry(0.9, 2.2, 7);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x15803d,
      roughness: 0.7,
      metalness: 0.05,
    });
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.9,
    });

    const instancedFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
    const instancedTrunk = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
    instancedFoliage.castShadow = !isSoftwareGl;

    let treeIdx = 0;
    for (let r = 14; r <= 34; r += 7) {
      const countInRing = Math.floor(r * 0.85);
      for (let i = 0; i < countInRing && treeIdx < treeCount; i++) {
        const theta = (i / countInRing) * Math.PI * 2 + r * 0.3;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const scale = 0.85 + Math.sin(i * 1.5) * 0.25;

        _scratchMat4.makeTranslation(x, 0.6 * scale, z);
        _scratchMat4.scale(_scratchVec3.set(scale, scale, scale));
        instancedTrunk.setMatrixAt(treeIdx, _scratchMat4);

        _scratchMat4.makeTranslation(x, (1.2 + 0.9) * scale, z);
        _scratchMat4.scale(_scratchVec3.set(scale, scale, scale));
        instancedFoliage.setMatrixAt(treeIdx, _scratchMat4);

        _scratchColor.setHex(0x16a34a).offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.1);
        instancedFoliage.setColorAt(treeIdx, _scratchColor);

        treeIdx++;
      }
    }
    instancedTrunk.instanceMatrix.needsUpdate = true;
    instancedFoliage.instanceMatrix.needsUpdate = true;
    if (instancedFoliage.instanceColor) instancedFoliage.instanceColor.needsUpdate = true;
    scene.add(instancedTrunk);
    scene.add(instancedFoliage);

    // 9. PROCEDURAL CITY SKYLINE BUILDINGS WITH WINDOWS
    const buildingGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.6,
      metalness: 0.2,
    });
    const windowEmissiveMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
    });

    const buildingCount = 20;
    for (let i = 0; i < buildingCount; i++) {
      const angle = (i / buildingCount) * Math.PI * 2;
      const dist = 50 + (i % 3) * 10;
      const bWidth = 7 + (i % 4) * 3;
      const bHeight = 14 + (i % 5) * 8;
      const bDepth = 7 + (i % 3) * 3;

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(bWidth, bHeight, bDepth), buildingMat);
      bMesh.position.set(Math.cos(angle) * dist, bHeight / 2, Math.sin(angle) * dist);
      bMesh.castShadow = !isSoftwareGl;
      bMesh.receiveShadow = !isSoftwareGl;
      buildingGroup.add(bMesh);

      // Window grid plate
      const winMesh = new THREE.Mesh(new THREE.PlaneGeometry(bWidth * 0.8, bHeight * 0.7), windowEmissiveMat);
      winMesh.position.set(Math.cos(angle) * (dist - bDepth * 0.51), bHeight / 2, Math.sin(angle) * (dist - bDepth * 0.51));
      winMesh.lookAt(0, bHeight / 2, 0);
      buildingGroup.add(winMesh);
    }
    scene.add(buildingGroup);

    // 10. REAL-TIME ATMOSPHERIC INVERSION CEILING LAYER
    const inversionGeo = new THREE.CylinderGeometry(45, 45, 0.4, 32);
    const inversionMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const inversionLayer = new THREE.Mesh(inversionGeo, inversionMat);
    inversionLayer.position.y = 12.0;
    scene.add(inversionLayer);

    // 11. PARTICULATE SMOG AEROSOL SIMULATION (Points)
    const particleCount = isSoftwareGl ? 400 : 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePos[i3] = (Math.random() - 0.5) * 80;
      particlePos[i3 + 1] = Math.random() * 16 + 0.2;
      particlePos[i3 + 2] = (Math.random() - 0.5) * 80;

      particleVel[i3] = 0.5 + Math.random() * 0.5;
      particleVel[i3 + 1] = (Math.random() - 0.5) * 0.12;
      particleVel[i3 + 2] = 0.3 + Math.random() * 0.4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleTex = createParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      map: particleTex,
      size: 0.9,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
      color: 0x94a3b8,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 12. DIRECTIONAL WIND STREAMLINES (Instanced Lines / Trail Streaks)
    const streamCount = isSoftwareGl ? 30 : 75;
    const streamGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.5, 6);
    const streamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const instancedStreams = new THREE.InstancedMesh(streamGeo, streamMat, streamCount);
    const streamData: Array<{ x: number; y: number; z: number; speed: number }> = [];

    for (let i = 0; i < streamCount; i++) {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 12 + 1.0;
      const z = (Math.random() - 0.5) * 60;
      streamData.push({ x, y, z, speed: 0.8 + Math.random() * 0.8 });

      _scratchMat4.makeTranslation(x, y, z);
      _scratchMat4.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
      instancedStreams.setMatrixAt(i, _scratchMat4);
    }
    instancedStreams.instanceMatrix.needsUpdate = true;
    scene.add(instancedStreams);

    // 13. CELESTIAL SUN & MOON SPHERES
    const sunGeo = new THREE.SphereGeometry(1.8, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sunMesh);

    const moonGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // 14. Interactive Raycasting on Station Sub-Components
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stationGroup.children, true);

      if (intersects.length > 0) {
        let currentObj: THREE.Object3D | null = intersects[0].object;
        while (currentObj && currentObj !== stationGroup) {
          if (currentObj.userData && currentObj.userData.sensorId) {
            const sid = currentObj.userData.sensorId as SensorPartId;
            if (onSelectSensor) {
              playTelemetryChirp(1600);
              onSelectSensor(sid);
            }
            break;
          }
          currentObj = currentObj.parent;
        }
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 15. Responsive Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 16. Lossless Render Loop with Damped Camera & Software WebGL pacing
    let frameId = 0;
    const timer = new THREE.Timer();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 75);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      timer.update();
      const delta = timer.getDelta();
      const elapsed = timer.getElapsed();
      const current = stateRef.current;

      // Effective AQI and wind speed (live or simulated override)
      const effectiveAqi = current.simulatedAqi ?? current.locationData?.aqi ?? 100;
      const effectiveWindSpeed = current.simulatedWindSpeed ?? current.locationData?.weather.windSpeed ?? 8;
      const cat = getAqiCategory(effectiveAqi, current.standard);
      const aqiColorHex = cat.color ? parseInt(cat.color.replace('#', '0x'), 16) : 0x38bdf8;

      // 1. Update Beacon Glow
      beaconMat.color.setHex(aqiColorHex);
      beaconMat.emissive.setHex(aqiColorHex);
      beaconMat.emissiveIntensity = 1.3 + Math.sin(elapsed * 2.8) * 0.5;

      // Spin ultrasonic anemometer rotor proportional to wind speed
      const rotorSpeed = 0.5 + effectiveWindSpeed * 0.25;
      rotorGroup.rotation.y += delta * rotorSpeed;

      // 2. Dynamic Fog & Particulate Colors
      let fogColorHex = 0x000000;
      if (effectiveAqi <= 50) {
        particleMat.color.setHex(0x60a5fa);
        particleMat.opacity = 0.25;
        fogColorHex = 0x000000;
        inversionMat.color.setHex(0x38bdf8);
      } else if (effectiveAqi <= 100) {
        particleMat.color.setHex(0xfacc15);
        particleMat.opacity = 0.45;
        fogColorHex = 0x18181b;
        inversionMat.color.setHex(0xfacc15);
      } else if (effectiveAqi <= 200) {
        particleMat.color.setHex(0xf97316);
        particleMat.opacity = 0.65;
        fogColorHex = 0x27170a;
        inversionMat.color.setHex(0xf97316);
      } else {
        particleMat.color.setHex(0xef4444);
        particleMat.opacity = 0.85;
        fogColorHex = 0x2b0d0d;
        inversionMat.color.setHex(0xef4444);
      }

      if (scene.fog) {
        scene.fog.color.setHex(fogColorHex);
      }
      scene.background = new THREE.Color(fogColorHex);

      // Inversion layer visibility & height modulation
      inversionLayer.visible = current.showInversionCap ?? true;
      inversionMat.opacity = THREE.MathUtils.clamp((effectiveAqi / 300) * 0.35, 0.08, 0.4);

      // 3. Move Particulate Smog Particles
      particleSystem.visible = current.showParticles;
      if (current.showParticles) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        const windMult = Math.min(3.0, Math.max(0.4, effectiveWindSpeed / 4));

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          positions[i3] += particleVel[i3] * delta * 5 * windMult;
          positions[i3 + 1] += Math.sin(elapsed + i) * 0.01;
          positions[i3 + 2] += particleVel[i3 + 2] * delta * 4 * windMult;

          if (positions[i3] > 40) positions[i3] = -40;
          if (positions[i3 + 2] > 40) positions[i3 + 2] = -40;
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // 4. Move Directional Wind Streamlines
      for (let i = 0; i < streamCount; i++) {
        const s = streamData[i];
        s.x += delta * s.speed * (effectiveWindSpeed * 0.8 + 2);
        if (s.x > 35) s.x = -35;

        _scratchMat4.makeTranslation(s.x, s.y, s.z);
        _scratchMat4.multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
        instancedStreams.setMatrixAt(i, _scratchMat4);
      }
      instancedStreams.instanceMatrix.needsUpdate = true;

      // 5. Smooth Exploded View Layer Separation
      const targetExp = current.explodedFactor;
      mastPart.position.y = THREE.MathUtils.damp(mastPart.position.y, targetExp * 0.8, 5, delta);
      enclosurePart.position.y = THREE.MathUtils.damp(enclosurePart.position.y, targetExp * 2.2, 5, delta);
      nephelometerPart.position.x = THREE.MathUtils.damp(nephelometerPart.position.x, -targetExp * 1.6, 5, delta);
      radiometerPart.position.x = THREE.MathUtils.damp(radiometerPart.position.x, targetExp * 1.6, 5, delta);
      radiometerPart.position.y = THREE.MathUtils.damp(radiometerPart.position.y, targetExp * 3.0, 5, delta);
      gasPart.position.x = THREE.MathUtils.damp(gasPart.position.x, -targetExp * 1.5, 5, delta);
      gasPart.position.z = THREE.MathUtils.damp(gasPart.position.z, -targetExp * 1.5, 5, delta);
      solarPart.position.z = THREE.MathUtils.damp(solarPart.position.z, -targetExp * 2.0, 5, delta);
      beaconPart.position.y = THREE.MathUtils.damp(beaconPart.position.y, targetExp * 4.2, 5, delta);
      spirePart.position.y = THREE.MathUtils.damp(spirePart.position.y, targetExp * 5.8, 5, delta);

      // 6. Camera Position & LookAt Transitions
      if (current.selectedSensorId && STATION_SENSORS[current.selectedSensorId]) {
        const sensor = STATION_SENSORS[current.selectedSensorId];
        _targetCamPos.set(sensor.cameraPos[0], sensor.cameraPos[1], sensor.cameraPos[2]);
        _targetCamLookAt.set(sensor.cameraTarget[0], sensor.cameraTarget[1], sensor.cameraTarget[2]);
      } else if (current.cameraPreset === 'hero') {
        _targetCamPos.set(9, 7.5, 12);
        _targetCamLookAt.set(0, 4.2, 0);
      } else if (current.cameraPreset === 'dispersion') {
        _targetCamPos.set(24, 18, 28);
        _targetCamLookAt.set(0, 3, 0);
      } else if (current.cameraPreset === 'inversion') {
        _targetCamPos.set(8, 2.8, 14);
        _targetCamLookAt.set(0, 11, 0);
      } else {
        // panorama
        _targetCamPos.set(42, 32, 45);
        _targetCamLookAt.set(0, 2, 0);
      }

      if (!isUserInteracting) {
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-3.5 * delta));
        controls.target.lerp(_targetCamLookAt, 1 - Math.exp(-3.5 * delta));
      }

      // 7. Celestial Sun / Moon Orbit & City Window Illumination
      const t = current.timeOfDay; // 0 to 1
      const sunAngle = (t - 0.5) * Math.PI * 1.1;
      const sunDist = 55;

      const sunX = Math.sin(sunAngle) * sunDist;
      const sunY = Math.cos(sunAngle) * sunDist;
      const sunZ = -25;
      sunMesh.position.set(sunX, sunY, sunZ);

      // Moon opposite sun
      moonMesh.position.set(-sunX, -sunY, sunZ);

      keyLight.position.set(Math.sin(sunAngle) * 32, Math.max(4, Math.cos(sunAngle) * 32), 16);

      // Light up city windows at night (t > 0.65 or t < 0.25)
      const isNight = t > 0.65 || t < 0.25;
      windowEmissiveMat.opacity = isNight ? 0.75 : 0;

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 17. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      controls.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      foliageGeo.dispose();
      foliageMat.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
      inversionGeo.dispose();
      inversionMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
      streamGeo.dispose();
      streamMat.dispose();
      solarTex.dispose();
      screenTex.dispose();
      sunGeo.dispose();
      sunMat.dispose();
      moonGeo.dispose();
      moonMat.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
    />
  );
};
