import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LocationData, AqiStandard } from '../../types/aqi';
import { getAqiCategory } from '../../lib/aqi';

export type CameraViewPreset = 'hero' | 'dispersion' | 'panorama';

interface Atmospheric3DSceneProps {
  locationData: LocationData | null;
  standard: AqiStandard;
  cameraPreset: CameraViewPreset;
  explodedFactor: number; // 0.0 to 1.0
  showParticles: boolean;
  timeOfDay: number; // 0 (morning) to 1 (sunset/night)
  onStationClick?: () => void;
}

// Module-level pre-allocated scratch objects to prevent garbage collection inside requestAnimationFrame
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
    // Deep monocrystalline silicon blue
    ctx.fillStyle = '#0b192c';
    ctx.fillRect(0, 0, 512, 512);

    // Silver conductive busbars & gridlines
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

    // Heavy central busbars
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 512);
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.moveTo(384, 0);
    ctx.lineTo(384, 512);
    ctx.stroke();
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
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
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
    grad.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
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
  timeOfDay,
  onStationClick,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store mutable state in refs so React updates don't tear down WebGL
  const stateRef = useRef({
    explodedFactor,
    showParticles,
    cameraPreset,
    timeOfDay,
    locationData,
    standard,
  });

  useEffect(() => {
    stateRef.current = {
      explodedFactor,
      showParticles,
      cameraPreset,
      timeOfDay,
      locationData,
      standard,
    };
  }, [explodedFactor, showParticles, cameraPreset, timeOfDay, locationData, standard]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Detection Guard
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
      500
    );
    camera.position.set(12, 10, 16);

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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. OrbitControls with Silky-Smooth Damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.03; // Don't go below ground
    controls.minDistance = 4;
    controls.maxDistance = 80;
    controls.target.set(0, 3.5, 0);

    let isUserInteracting = false;
    controls.addEventListener('start', () => {
      isUserInteracting = true;
    });
    controls.addEventListener('end', () => {
      isUserInteracting = false;
    });

    // 4. Studio Environment Reflection via RoomEnvironment + PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Studio Lighting Rig
    // Hemisphere fill light (sky vs ground warmth)
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.2);
    scene.add(hemiLight);

    // Warm Directional Key Light with tight shadow frustum
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.4);
    keyLight.position.set(15, 25, 12);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 70;
    keyLight.shadow.camera.left = -15;
    keyLight.shadow.camera.right = 15;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Subtle cool rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    rimLight.position.set(-15, 12, -15);
    scene.add(rimLight);

    // Dynamic Fog initialized to ambient horizon
    const horizonColor = new THREE.Color(0x0f172a);
    scene.background = horizonColor;
    scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    // 6. Ground Foundation Plane & Contact Shadow
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.85,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Soft radial contact shadow directly underneath the hero station
    const shadowTex = createRadialShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(9, 9);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.015; // slightly above ground to prevent z-fighting
    scene.add(contactShadow);

    // 7. COMPOSITE 3-12 PART PROCEDURAL HERO SUBJECT: The AirIQ Monitoring Station
    const stationGroup = new THREE.Group();
    scene.add(stationGroup);

    // Procedural Materials with varied roughness and metalness across parts
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.05,
    });
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.25,
      metalness: 0.85,
    });
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.7,
    });
    const nephelometerMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.2,
      metalness: 0.8,
    });
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.15,
      metalness: 0.95,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isSoftwareGl ? 0.4 : 0.9,
      roughness: 0.05,
      metalness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.9,
      ior: 1.52,
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

    // Part 1: Heavy Beveled Octagonal Concrete Base Pedestal
    const basePart = new THREE.Group();
    const baseMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.6, 0.6, 8),
      concreteMat
    );
    baseMesh.position.y = 0.3;
    baseMesh.castShadow = !isSoftwareGl;
    baseMesh.receiveShadow = !isSoftwareGl;
    basePart.add(baseMesh);

    // Add 8 anchor bolts
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
    const centralCol = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 3.2, 16),
      mastMat
    );
    centralCol.position.y = 2.2;
    centralCol.castShadow = !isSoftwareGl;
    mastPart.add(centralCol);

    // 4 vertical structural support ribs
    const ribGeo = new THREE.BoxGeometry(0.08, 3.0, 0.25);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const rib = new THREE.Mesh(ribGeo, mastMat);
      rib.position.set(Math.cos(angle) * 0.55, 2.2, Math.sin(angle) * 0.55);
      rib.rotation.y = angle;
      mastPart.add(rib);
    }
    stationGroup.add(mastPart);

    // Part 3: Main Avionics & Sensor Enclosure (Hexagonal with Heat Fins)
    const enclosurePart = new THREE.Group();
    const podMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 1.4, 6),
      housingMat
    );
    podMesh.position.y = 4.4;
    podMesh.castShadow = !isSoftwareGl;
    enclosurePart.add(podMesh);

    // External heatsink fins
    const finGeo = new THREE.BoxGeometry(0.04, 1.0, 0.4);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeo, mastMat);
      fin.position.set(Math.cos(angle) * 1.15, 4.4, Math.sin(angle) * 1.15);
      fin.rotation.y = angle;
      enclosurePart.add(fin);
    }
    stationGroup.add(enclosurePart);

    // Part 4: Laser Particulate Nephelometer Chamber (PM2.5 / PM10)
    const nephelometerPart = new THREE.Group();
    const opticalChamber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.9, 16),
      nephelometerMat
    );
    opticalChamber.rotation.z = Math.PI / 2;
    opticalChamber.position.set(-0.8, 4.4, 0.6);
    opticalChamber.castShadow = !isSoftwareGl;
    nephelometerPart.add(opticalChamber);

    // Brass intake trumpet
    const trumpetMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.2, 0.35, 16),
      brassMat
    );
    trumpetMesh.rotation.z = -Math.PI / 2;
    trumpetMesh.position.set(-1.4, 4.4, 0.6);
    nephelometerPart.add(trumpetMesh);
    stationGroup.add(nephelometerPart);

    // Part 5: Solar Pyranometer & UV Radiometer on Support Arm
    const radiometerPart = new THREE.Group();
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
    const armMesh = new THREE.Mesh(armGeo, mastMat);
    armMesh.rotation.z = Math.PI / 3;
    armMesh.position.set(0.8, 5.0, 0.5);
    radiometerPart.add(armMesh);

    const brassRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16),
      brassMat
    );
    brassRing.position.set(1.3, 5.3, 0.5);
    radiometerPart.add(brassRing);

    const glassDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      glassMat
    );
    glassDome.position.set(1.3, 5.38, 0.5);
    radiometerPart.add(glassDome);
    stationGroup.add(radiometerPart);

    // Part 6: Multi-layer Angled Photovoltaic Solar Panel Wing
    const solarPart = new THREE.Group();
    const panelFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 1.2),
      housingMat
    );
    panelFrame.position.set(0, 4.6, -1.2);
    panelFrame.rotation.x = Math.PI / 5;
    panelFrame.castShadow = !isSoftwareGl;

    const panelSurface = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.1),
      solarMat
    );
    panelSurface.rotation.x = -Math.PI / 2;
    panelSurface.position.y = 0.05;
    panelFrame.add(panelSurface);
    solarPart.add(panelFrame);
    stationGroup.add(solarPart);

    // Part 7: Real-Time AQI Beacon Halo (Glow Ring)
    const beaconPart = new THREE.Group();
    const beaconMesh = new THREE.Mesh(
      new THREE.TorusGeometry(1.35, 0.07, 16, 32),
      beaconMat
    );
    beaconMesh.rotation.x = Math.PI / 2;
    beaconMesh.position.y = 5.25;
    beaconPart.add(beaconMesh);
    stationGroup.add(beaconPart);

    // Part 8: 3D Ultrasonic Wind Anemometer Head & Antenna Spire
    const spirePart = new THREE.Group();
    const spireMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.15, 2.4, 12),
      mastMat
    );
    spireMesh.position.y = 6.4;
    spireMesh.castShadow = !isSoftwareGl;
    spirePart.add(spireMesh);

    // Anemometer triple horizontal cross-arms
    const armSmallGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const smallArm = new THREE.Mesh(armSmallGeo, brassMat);
      smallArm.position.set(Math.cos(angle) * 0.45, 6.8, Math.sin(angle) * 0.45);
      smallArm.rotation.y = angle;
      smallArm.rotation.z = Math.PI / 2;

      // Ultrasonic transducer cylinder
      const transducer = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8),
        housingMat
      );
      transducer.position.set(Math.cos(angle) * 0.9, 6.8, Math.sin(angle) * 0.9);
      spirePart.add(smallArm);
      spirePart.add(transducer);
    }
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
    for (let r = 12; r <= 32; r += 7) {
      const countInRing = Math.floor(r * 0.85);
      for (let i = 0; i < countInRing && treeIdx < treeCount; i++) {
        const theta = (i / countInRing) * Math.PI * 2 + (r * 0.3);
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const scale = 0.85 + Math.sin(i * 1.5) * 0.25;

        // Trunk matrix
        _scratchMat4.makeTranslation(x, 0.6 * scale, z);
        _scratchMat4.scale(_scratchVec3.set(scale, scale, scale));
        instancedTrunk.setMatrixAt(treeIdx, _scratchMat4);

        // Foliage matrix
        _scratchMat4.makeTranslation(x, (1.2 + 0.9) * scale, z);
        _scratchMat4.scale(_scratchVec3.set(scale, scale, scale));
        instancedFoliage.setMatrixAt(treeIdx, _scratchMat4);

        // Color variation across foliage instances
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

    // 9. PROCEDURAL LOW-POLY CITY BUILDINGS PERIMETER
    const buildingGroup = new THREE.Group();
    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.2,
    });
    const buildingCount = 18;
    for (let i = 0; i < buildingCount; i++) {
      const angle = (i / buildingCount) * Math.PI * 2;
      const dist = 45 + (i % 3) * 8;
      const bWidth = 6 + (i % 4) * 3;
      const bHeight = 12 + (i % 5) * 6;
      const bDepth = 6 + (i % 3) * 3;

      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bWidth, bHeight, bDepth),
        buildingMat
      );
      bMesh.position.set(Math.cos(angle) * dist, bHeight / 2, Math.sin(angle) * dist);
      bMesh.castShadow = !isSoftwareGl;
      bMesh.receiveShadow = !isSoftwareGl;
      buildingGroup.add(bMesh);
    }
    scene.add(buildingGroup);

    // 10. REAL-TIME PARTICULATE SMOG AEROSOL SIMULATION (Points)
    const particleCount = isSoftwareGl ? 350 : 1000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePos[i3] = (Math.random() - 0.5) * 70;
      particlePos[i3 + 1] = Math.random() * 18 + 0.2;
      particlePos[i3 + 2] = (Math.random() - 0.5) * 70;

      particleVel[i3] = 0.4 + Math.random() * 0.4; // drift X
      particleVel[i3 + 1] = (Math.random() - 0.5) * 0.1; // turbulence Y
      particleVel[i3 + 2] = 0.2 + Math.random() * 0.3; // drift Z
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleTex = createParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      map: particleTex,
      size: 0.8,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.NormalBlending,
      color: 0x94a3b8,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 11. Raycasting on Station for Interactive Inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stationGroup.children, true);
      if (intersects.length > 0 && onStationClick) {
        onStationClick();
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 12. Responsive Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 13. Lossless Render Loop with Exponential Damping & Software GL Pacing
    let frameId = 0;
    const clock = new THREE.Clock();

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
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const current = stateRef.current;

      // 1. Dynamic Atmosphere & AQI Color Reaction
      const curAqi = current.locationData?.aqi ?? 100;
      const cat = getAqiCategory(curAqi, current.standard);
      const aqiColorHex = cat.color ? parseInt(cat.color.replace('#', '0x'), 16) : 0x38bdf8;

      // Update beacon glow
      beaconMat.color.setHex(aqiColorHex);
      beaconMat.emissive.setHex(aqiColorHex);
      beaconMat.emissiveIntensity = 1.2 + Math.sin(elapsed * 2.5) * 0.4;

      // Update particle color & density according to AQI
      let fogColorHex = 0x0f172a;
      if (curAqi <= 50) {
        particleMat.color.setHex(0x60a5fa); // crisp clean cyan-blue
        particleMat.opacity = 0.25;
        fogColorHex = 0x0f172a;
      } else if (curAqi <= 100) {
        particleMat.color.setHex(0xfacc15); // moderate golden haze
        particleMat.opacity = 0.45;
        fogColorHex = 0x18181b;
      } else if (curAqi <= 200) {
        particleMat.color.setHex(0xf97316); // unhealthy amber smog
        particleMat.opacity = 0.65;
        fogColorHex = 0x27170a;
      } else {
        particleMat.color.setHex(0xef4444); // severe smog inversion
        particleMat.opacity = 0.85;
        fogColorHex = 0x2b0d0d;
      }

      if (scene.fog) {
        scene.fog.color.setHex(fogColorHex);
      }
      scene.background = new THREE.Color(fogColorHex);

      particleSystem.visible = current.showParticles;

      // 2. Animate particulate smog flow based on wind vector
      if (current.showParticles) {
        const positions = particleGeo.attributes.position.array as Float32Array;
        const windSpeed = current.locationData?.weather.windSpeed ?? 5;
        const windMult = Math.min(2.5, Math.max(0.5, windSpeed / 4));

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          positions[i3] += particleVel[i3] * delta * 5 * windMult;
          positions[i3 + 1] += Math.sin(elapsed + i) * 0.008;
          positions[i3 + 2] += particleVel[i3 + 2] * delta * 4 * windMult;

          // Wrap particles inside atmospheric volume
          if (positions[i3] > 35) positions[i3] = -35;
          if (positions[i3 + 2] > 35) positions[i3 + 2] = -35;
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      // 3. Smooth Exploded View Layer Separation
      const targetExp = current.explodedFactor;
      // Interpolate individual parts vertically
      mastPart.position.y = THREE.MathUtils.damp(mastPart.position.y, targetExp * 0.8, 5, delta);
      enclosurePart.position.y = THREE.MathUtils.damp(enclosurePart.position.y, targetExp * 2.2, 5, delta);
      nephelometerPart.position.x = THREE.MathUtils.damp(nephelometerPart.position.x, -targetExp * 1.5, 5, delta);
      radiometerPart.position.x = THREE.MathUtils.damp(radiometerPart.position.x, targetExp * 1.5, 5, delta);
      radiometerPart.position.y = THREE.MathUtils.damp(radiometerPart.position.y, targetExp * 2.8, 5, delta);
      solarPart.position.z = THREE.MathUtils.damp(solarPart.position.z, -targetExp * 1.8, 5, delta);
      beaconPart.position.y = THREE.MathUtils.damp(beaconPart.position.y, targetExp * 4.0, 5, delta);
      spirePart.position.y = THREE.MathUtils.damp(spirePart.position.y, targetExp * 5.5, 5, delta);

      // 4. Smooth Camera Preset Damping
      if (current.cameraPreset === 'hero') {
        _targetCamPos.set(8, 7, 11);
        _targetCamLookAt.set(0, 4.2, 0);
      } else if (current.cameraPreset === 'dispersion') {
        _targetCamPos.set(22, 16, 26);
        _targetCamLookAt.set(0, 3, 0);
      } else {
        // panorama
        _targetCamPos.set(38, 28, 42);
        _targetCamLookAt.set(0, 2, 0);
      }

      // Damped camera navigation when not dragging controls
      if (!isUserInteracting) {
        camera.position.lerp(_targetCamPos, 1 - Math.exp(-3.5 * delta));
        controls.target.lerp(_targetCamLookAt, 1 - Math.exp(-3.5 * delta));
      }

      // 5. Lighting Azimuth & Solar Movement
      const sunAngle = (current.timeOfDay - 0.5) * Math.PI * 0.9;
      keyLight.position.x = Math.sin(sunAngle) * 28;
      keyLight.position.z = Math.cos(sunAngle) * 28;
      keyLight.position.y = Math.max(6, Math.cos(sunAngle) * 25);

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    // 14. Comprehensive Cleanup on Unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);

      controls.dispose();
      groundGeo.dispose();
      groundMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      foliageGeo.dispose();
      foliageMat.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
      solarTex.dispose();
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
