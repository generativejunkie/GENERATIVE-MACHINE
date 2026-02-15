/**
 * Scene management class
 * Handles Three.js scene, camera, renderer, and object lifecycle
 * @module managers/SceneManager
 */

import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls.js';
import type { ObjectInstance, RGBColor } from '@types';
import { EventEmitter } from '@utils/EventEmitter';
import { errorHandler } from '@utils/ErrorHandler';
import { rgbToThreeColor } from '@utils/helpers';
import { MATERIALS } from '@materials/geometries';
import {
  SCENE_CONFIG,
  LIGHTING_CONFIG,
  MEDIA_CONFIG,
  RENDER_ORDER,
} from '@constants/config';

/**
 * SceneManager class
 * Manages the Three.js scene and all 3D objects
 */
export class SceneManager extends EventEmitter {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private dragControls: DragControls | null = null;
  private currentMeshes: THREE.Object3D[] = [];
  private meshCache: Map<number, THREE.Object3D[]> = new Map(); // Cache meshes by instance ID
  private container: HTMLElement;
  private animationFrameId: number | null = null;
  private baseRotation: number = 0; // Base rotation offset in degrees
  private antigravityMode: boolean = false; // Antigravity mode
  private antigravityVelocities: Map<number, number> = new Map(); // Velocity per instance
  private gravityFloatSpeed: number = 0.1; // Gravity float speed multiplier
  private floatVariations: Map<number, { speedMult: number; stayInPlace: boolean; scaleMult: number; zOffset: number }> = new Map(); // Random variation per instance

  // Zero Gravity cosmic effects
  private fadeOutInstances: Map<number, { startTime: number; duration: number; meshes: THREE.Object3D[] }> = new Map();
  private burstParticles: THREE.Points[] = []; // Active burst particle systems

  // Mandala mode tracking for drag operations
  private currentMandalaMode: boolean = false;
  private currentSymmetryCount: number = 4;

  // Smooth drag properties
  private dragTargets: Map<THREE.Object3D, THREE.Vector3> = new Map(); // Target positions for smooth dragging
  private dragPrevPositions: Map<THREE.Object3D, THREE.Vector3> = new Map(); // Previous positions before drag
  private dragDamping: number = 0.2; // Damping factor for smooth drag (0-1, higher = more responsive)

  // Camera background properties
  private cameraBackgroundPlane: THREE.Mesh | null = null;
  private cameraTexture: THREE.CanvasTexture | null = null;

  constructor(containerId: string) {
    super();

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = container;

    // Initialize Three.js components
    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();

    // Setup lighting
    this.setupLighting();

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  /**
   * Create and configure the scene
   */
  private createScene(): THREE.Scene {
    const scene = new THREE.Scene();
    // scene.background = new THREE.Color(SCENE_CONFIG.BACKGROUND_COLOR); 
    scene.background = null; // transparent to let CSS handle background color
    return scene;
  }

  /**
   * Create and configure the camera
   */
  private createCamera(): THREE.PerspectiveCamera {
    // Fixed aspect ratio for Full HD (16:9)
    const aspect = 1920 / 1080;

    const camera = new THREE.PerspectiveCamera(
      SCENE_CONFIG.CAMERA_FOV,
      aspect,
      SCENE_CONFIG.CAMERA_NEAR,
      SCENE_CONFIG.CAMERA_FAR
    );
    camera.position.set(0, 0, SCENE_CONFIG.CAMERA_POSITION_Z);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  /**
   * Create and configure the renderer
   */
  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true, // Allow transparency for CSS background
    });

    // Force 1:1 pixel ratio for exact Full HD control
    renderer.setPixelRatio(1);

    // Fixed Full HD Resolution
    renderer.setSize(1920, 1080, false); // false prevents inline styling resizing

    this.container.appendChild(renderer.domElement);

    return renderer;
  }

  /**
   * Setup scene lighting
   */
  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      LIGHTING_CONFIG.AMBIENT_INTENSITY
    );
    this.scene.add(ambientLight);

    // Main directional light
    const mainLight = new THREE.DirectionalLight(
      0xffffff,
      LIGHTING_CONFIG.DIRECTIONAL_MAIN_INTENSITY
    );
    mainLight.position.set(
      LIGHTING_CONFIG.DIRECTIONAL_MAIN_POSITION.x,
      LIGHTING_CONFIG.DIRECTIONAL_MAIN_POSITION.y,
      LIGHTING_CONFIG.DIRECTIONAL_MAIN_POSITION.z
    );
    this.scene.add(mainLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(
      0xffffff,
      LIGHTING_CONFIG.DIRECTIONAL_FILL_INTENSITY
    );
    fillLight.position.set(
      LIGHTING_CONFIG.DIRECTIONAL_FILL_POSITION.x,
      LIGHTING_CONFIG.DIRECTIONAL_FILL_POSITION.y,
      LIGHTING_CONFIG.DIRECTIONAL_FILL_POSITION.z
    );
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.DirectionalLight(
      0xffffff,
      LIGHTING_CONFIG.DIRECTIONAL_RIM_INTENSITY
    );
    rimLight.position.set(
      LIGHTING_CONFIG.DIRECTIONAL_RIM_POSITION.x,
      LIGHTING_CONFIG.DIRECTIONAL_RIM_POSITION.y,
      LIGHTING_CONFIG.DIRECTIONAL_RIM_POSITION.z
    );
    this.scene.add(rimLight);
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Keep internal resolution fixed at 1920x1080
    // We rely on CSS object-fit: contain to scale it.

    // Ensure camera stays 16:9
    this.camera.aspect = 1920 / 1080;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(0, 0, 0);

    // ensure renderer stays 1920x1080 (in case something reset it)
    this.renderer.setSize(1920, 1080, false);
  }

  /**
   * Update scene with new instances
   */
  public updateScene(
    instances: ObjectInstance[],
    mandalaMode: boolean,
    symmetryEnabled: boolean,
    symmetryCount: number,
    sizeMultiplier: number,
    speedMultiplier: number,
    spreadMultiplier: number,
    spacingMultiplier: number,
    frequencyData: Uint8Array,
    reflectMode: boolean // Add reflectMode
  ): void {
    try {
      // Store mandala mode state for drag operations
      this.currentMandalaMode = mandalaMode;
      this.currentSymmetryCount = symmetryCount;

      // Apply antigravity effect
      this.applyAntigravity(instances);

      // Calculate average frequency for global effects
      let avgFrequency = 0;
      if (frequencyData.length > 0) {
        const sum = Array.from(frequencyData).reduce((a, b) => a + b, 0);
        avgFrequency = sum / frequencyData.length;
      }

      // Get current instance IDs
      const currentInstanceIds = new Set(instances.map(i => i.id));
      const cachedInstanceIds = new Set(this.meshCache.keys());

      // Remove meshes for deleted instances
      for (const cachedId of cachedInstanceIds) {
        if (!currentInstanceIds.has(cachedId)) {
          this.removeMeshesForInstance(cachedId);
        }
      }

      // Track if any meshes were recreated
      let meshesChanged = false;

      // Update or create meshes for each instance
      instances.forEach((instance, globalIndex) => {
        const existingMeshes = this.meshCache.get(instance.id);

        if (!existingMeshes || this.needsRecreation(instance, symmetryEnabled, symmetryCount, reflectMode)) {
          // Recreate meshes if they don't exist or settings changed
          this.removeMeshesForInstance(instance.id);
          this.createMeshesForInstance(
            instance,
            symmetryEnabled,
            symmetryCount,
            sizeMultiplier,
            speedMultiplier,
            spreadMultiplier,
            spacingMultiplier,
            avgFrequency,
            reflectMode
          );
          meshesChanged = true;
        } else {
          // Update existing meshes
          this.updateMeshesForInstance(
            instance,
            mandalaMode,
            symmetryEnabled,
            symmetryCount,
            sizeMultiplier,
            speedMultiplier,
            spreadMultiplier,
            spacingMultiplier,
            avgFrequency,
            globalIndex,
            instances.length,
            reflectMode
          );
        }
      });

      // Update drag controls if meshes changed or mesh count changed
      if (meshesChanged || cachedInstanceIds.size !== currentInstanceIds.size) {
        this.updateDragControls();
      }

      // Apply smooth dragging interpolation
      this.applySmoothDrag();

      // Emit update event
      this.emit('scene:updated', undefined);
    } catch (error) {
      errorHandler.renderingError('Failed to update scene', error as Error);
    }
  }

  /**
   * Check if meshes need to be recreated
   */
  private needsRecreation(instance: ObjectInstance, symmetryEnabled: boolean, symmetryCount: number, reflectMode: boolean): boolean {
    const meshes = this.meshCache.get(instance.id);
    if (!meshes || meshes.length === 0) return true;

    // In mandala mode with reflection symmetry, we have 2x the symmetry count if reflectMode is ON
    const expectedCount = symmetryEnabled && !instance.mediaData ? (reflectMode ? symmetryCount * 2 : symmetryCount) : 1;


    return meshes.length !== expectedCount;
  }

  /**
   * Remove meshes for a specific instance
   */
  private removeMeshesForInstance(instanceId: number): void {
    const meshes = this.meshCache.get(instanceId);
    if (!meshes) return;

    meshes.forEach(mesh => {
      this.scene.remove(mesh);
      const index = this.currentMeshes.indexOf(mesh);
      if (index > -1) {
        this.currentMeshes.splice(index, 1);
      }

      // Dispose geometries and materials
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });

    this.meshCache.delete(instanceId);
    this.antigravityVelocities.delete(instanceId);
    this.floatVariations.delete(instanceId);
  }

  /**
   * Create meshes for an instance
   */
  private createMeshesForInstance(
    instance: ObjectInstance,
    symmetryEnabled: boolean,
    symmetryCount: number,
    sizeMultiplier: number,
    speedMultiplier: number,
    spreadMultiplier: number,
    spacingMultiplier: number,
    avgFrequency: number,
    reflectMode: boolean
  ): void {
    const meshes: THREE.Object3D[] = [];

    if (instance.mediaData || !symmetryEnabled) {
      // Normal mode or media
      let mesh: THREE.Object3D | null;

      if (instance.mediaData) {
        mesh = this.createMediaMesh(instance);
      } else {
        mesh = this.createNormalMesh(
          instance,
          sizeMultiplier,
          speedMultiplier,
          spreadMultiplier,
          avgFrequency
        );
      }

      if (mesh) {
        this.scene.add(mesh);
        this.currentMeshes.push(mesh);
        meshes.push(mesh);
      }
    } else {
      // Mandala mode - create symmetric copies WITH reflection symmetry
      for (let i = 0; i < symmetryCount; i++) {
        // Apply base rotation offset (convert degrees to radians)
        const baseRotationRad = (this.baseRotation * Math.PI) / 180;
        const angle = (i / symmetryCount) * Math.PI * 2 + baseRotationRad;

        // Create original mesh at this angle
        const mesh = this.createSymmetricMesh(
          instance,
          angle,
          sizeMultiplier,
          speedMultiplier,
          spreadMultiplier,
          spacingMultiplier,
          avgFrequency
        );

        if (mesh) {
          this.scene.add(mesh);
          this.currentMeshes.push(mesh);
          meshes.push(mesh);
        }

        // Create reflected mesh (mirror symmetry) - ONLY if reflectMode is enabled
        if (reflectMode) {
          // Reflect across the radial axis by negating the angle
          const reflectedAngle = -angle + baseRotationRad * 2;
          const reflectedMesh = this.createSymmetricMesh(
            instance,
            reflectedAngle,
            sizeMultiplier,
            speedMultiplier,
            spreadMultiplier,
            spacingMultiplier,
            avgFrequency
          );

          if (reflectedMesh) {
            // Apply reflection by flipping scale on one axis
            reflectedMesh.scale.x *= -1;
            this.scene.add(reflectedMesh);
            this.currentMeshes.push(reflectedMesh);
            meshes.push(reflectedMesh);
          }
        }
      }
    }

    if (meshes.length > 0) {
      this.meshCache.set(instance.id, meshes);
    }
  }

  /**
   * Update existing meshes for an instance
   */
  private updateMeshesForInstance(
    instance: ObjectInstance,
    _mandalaMode: boolean,
    symmetryEnabled: boolean,
    symmetryCount: number,
    sizeMultiplier: number,
    speedMultiplier: number,
    spreadMultiplier: number,
    spacingMultiplier: number,
    avgFrequency: number,
    _globalIndex: number,
    _totalCount: number,
    _reflectMode: boolean
  ): void {
    const meshes = this.meshCache.get(instance.id);
    if (!meshes) return;

    const time = Date.now() * 0.001 * speedMultiplier;
    // User Request: "Rotation speed too fast" -> Reduced boost significantly
    const audioBoost = (avgFrequency / 255) * 0.1;
    const scaleBoost = 1 + (avgFrequency / 255) * 0.3;

    meshes.forEach((mesh, index) => {
      if (instance.mediaData) {
        // Media doesn't rotate/scale with audio
        return;
      }

      // Calculate floating offset when both Mandala and Antigravity are active
      let floatOffsetX = 0;
      let floatOffsetY = 0;
      let floatOffsetZ = 0;
      let zeroGravityScale = 1.0;

      if (this.antigravityMode && !instance.mediaData) {
        // Get or create random variation for this instance
        if (!this.floatVariations.has(instance.id)) {
          this.floatVariations.set(instance.id, {
            speedMult: 0.5 + Math.random() * 0.5, // 0.5 - 1.0
            stayInPlace: false,
            scaleMult: 0.3 + Math.random() * 2.0, // Random size: Small to Large
            zOffset: (Math.random() - 0.5) * 20 // Initial random Z depth
          });
        }

        const variation = this.floatVariations.get(instance.id)!;

        // Zero Gravity Logic:
        // 1. Random Size
        zeroGravityScale = variation.scaleMult;

        // 2. Slow Zoom In/Out (Z-axis float)
        // Move back and forth slowly
        const floatTime = Date.now() * 0.0005 * variation.speedMult * this.gravityFloatSpeed;

        // Gentle drift in 3D
        floatOffsetX = Math.sin(floatTime + instance.id) * 1.5;
        floatOffsetY = Math.cos(floatTime * 0.7 + instance.id) * 1.5;

        // Zoom/Depth transition: Move widely on Z axis
        // Range: -5 to +5 relative to base (Reduced from 15 to prevent clipping behind camera)
        floatOffsetZ = Math.sin(floatTime * 0.3 + variation.zOffset) * 5.0;

        // Reset transparency to ensure solid rendering
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.visible = true; // Force visible
            if (child.material) {
              // Ensure material is solid
              child.material.transparent = false;
              child.material.opacity = 1.0;
              child.material.depthWrite = true;
            }
          }
        });
      } else {
        // Reset opacity if not in gravity mode (or ensure it's 1)
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            if (child.material.transparent) {
              child.material.opacity = 1.0;
              child.material.transparent = false;
            }
          }
        });
      }

      // Scale Calculation
      let baseScale = instance.scale * sizeMultiplier * scaleBoost;

      if (this.antigravityMode && !instance.mediaData) {
        // Apply random zero gravity scale
        // Combine with user size slider but emphasize randomness
        baseScale = baseScale * zeroGravityScale;
      }

      if (false) { // Mirror Ball Mode Deleted
        // ...
      } else if (symmetryEnabled && !instance.mediaData) {
        // Determine if this specific mesh index is a "reflected" copy
        let isReflected = false;
        let effectiveAngle = 0;

        // Base rotation
        const baseRotationRad = (this.baseRotation * Math.PI) / 180;

        if (_reflectMode && meshes.length === symmetryCount * 2) {
          // Reflect Mode: Second half of meshes are reflections
          if (index >= symmetryCount) {
            isReflected = true;
            // Mirror angle
            const originalIdx = index - symmetryCount;
            const originalAngle = (originalIdx / symmetryCount) * Math.PI * 2 + baseRotationRad;
            effectiveAngle = -originalAngle + (baseRotationRad * 2);
          } else {
            // Original
            effectiveAngle = (index / symmetryCount) * Math.PI * 2 + baseRotationRad;
          }
        } else {
          // Normal Mode
          effectiveAngle = (index / symmetryCount) * Math.PI * 2 + baseRotationRad;
        }

        // Position Calculation
        const ringOffset = (instance.id % 8) * 3.0;
        const radius = (spacingMultiplier + ringOffset) * spreadMultiplier;

        const x = radius * Math.cos(effectiveAngle) + floatOffsetX;
        const y = radius * Math.sin(effectiveAngle) + floatOffsetY;
        const z = instance.position.z * spreadMultiplier + floatOffsetZ;

        mesh.position.set(x, y, z);

        // Rotation Calculation
        // Invert rotation for reflected meshes to maintain mirror symmetry
        const rotDir = isReflected ? -1 : 1;

        mesh.rotation.set(
          // User Request: "Rotation speed too fast" -> Slower coefficients
          instance.rotation.x + (time * 0.05 * speedMultiplier * rotDir) + audioBoost,
          instance.rotation.y + (time * 0.08 * speedMultiplier * rotDir) + audioBoost,
          instance.rotation.z + (time * 0.02 * speedMultiplier * rotDir) + audioBoost
        );

        // Scale Calculation
        // User Request: "Make ALL reflect" -> If reflectMode, ALL get negative scale
        // This makes everything flipped, consistent with user request "All reflect"
        if (_reflectMode) {
          mesh.scale.set(baseScale * -1, baseScale, baseScale);
        } else {
          mesh.scale.set(baseScale, baseScale, baseScale);
        }

      } else {
        // Update normal position (Non-Mandala or Media)

        // For Zero Gravity, we want to emphasize the Z-depth and randomness
        // The floatOffsetZ already contains the wide Z-sway

        let posX = instance.position.x * spreadMultiplier + floatOffsetX;
        let posY = instance.position.y * spreadMultiplier + floatOffsetY;
        let posZ = instance.position.z * spreadMultiplier + floatOffsetZ;

        if (this.antigravityMode) {
          // In Zero Gravity, spread out X/Y/Z more to fill the "Space" (distant view)
          posX = posX * 2.5;
          posY = posY * 2.5;
          posZ = posZ * 1.8; // Also push Z further back
        }

        mesh.position.set(posX, posY, posZ);

        // Generic Rotation (Only for non-mandala)
        mesh.rotation.set(
          instance.rotation.x + time * 0.2 + audioBoost,
          instance.rotation.y + time * 0.3 + audioBoost,
          instance.rotation.z + time * 0.1 + audioBoost
        );

        // Generic Scale
        mesh.scale.set(baseScale, baseScale, baseScale);
      }

      // Apply vibration (shake)
      if (this.vibrationIntensities.has(instance.id)) {
        let intensity = this.vibrationIntensities.get(instance.id)!;
        if (intensity > 0.01) {
          mesh.position.x += (Math.random() - 0.5) * intensity;
          mesh.position.y += (Math.random() - 0.5) * intensity;
          mesh.position.z += (Math.random() - 0.5) * intensity;

          intensity *= 0.85; // Fast decay for sharp shake
          this.vibrationIntensities.set(instance.id, intensity);
        } else {
          this.vibrationIntensities.delete(instance.id);
        }
      }

      // Apply individual dispersion
      if (mesh.userData.dispersion) {
        const offset = mesh.userData.dispersion as THREE.Vector3;

        mesh.position.add(offset);

        // Decay - Slower (0.92) for smoother, less frantic return
        offset.multiplyScalar(0.92);

        if (offset.lengthSq() < 0.01) {
          mesh.userData.dispersion = undefined;
        }
      }
    });
  }

  // Map to store vibration intensity
  private vibrationIntensities: Map<number, number> = new Map();

  /**
   * Apply dispersion force to all objects (e.g. on bass kick)
   */
  public disperseObjects(force: number, pattern: 'outward' | 'inward' | 'spiral' | 'vortex' | 'random' | 'expandX' | 'expandY' = 'outward'): void {
    let count = 0;
    const UP = new THREE.Vector3(0, 1, 0);

    this.meshCache.forEach((meshes) => {
      meshes.forEach(mesh => {
        let direction = new THREE.Vector3();

        switch (pattern) {
          case 'inward':
            direction = mesh.position.clone().normalize().multiplyScalar(-1);
            break;
          case 'spiral':
            {
              const radial = mesh.position.clone().normalize();
              const tangent = radial.clone().cross(UP).normalize();
              direction = radial.add(tangent.multiplyScalar(0.5)).normalize();
            }
            break;
          case 'vortex':
            direction = mesh.position.clone().normalize().cross(UP).normalize();
            break;
          case 'random':
            direction.set(
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2,
              (Math.random() - 0.5) * 2
            ).normalize();
            break;
          case 'expandX':
            direction.set(mesh.position.x, 0, 0).normalize();
            break;
          case 'expandY':
            direction.set(0, mesh.position.y, 0).normalize();
            break;
          case 'outward':
          default:
            direction = mesh.position.clone().normalize();
            break;
        }

        // If position is at center (0,0,0) or direction became zero, use random fallback
        if (direction.lengthSq() < 0.001) {
          direction.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ).normalize();
        }

        direction.multiplyScalar(force);

        if (!mesh.userData.dispersion) {
          mesh.userData.dispersion = new THREE.Vector3();
        }
        (mesh.userData.dispersion as THREE.Vector3).add(direction);
        count++;
      });
    });
    console.log(`💥 DISPERSE APPLIED Pattern: ${pattern.toUpperCase()}, Force: ${force}`);
  }

  /**
   * Vibrate all objects (shake effect)
   */
  public vibrateObjects(intensity: number): void {
    this.meshCache.forEach((_meshes, instanceId) => {
      // Set or accumulate vibration intensity
      const current = this.vibrationIntensities.get(instanceId) || 0;
      this.vibrationIntensities.set(instanceId, Math.max(current, intensity));
    });
  }

  /**
   * Render the scene
   */
  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Set antigravity mode
   */
  public setAntigravityMode(enabled: boolean): void {
    this.antigravityMode = enabled;

    // Clear velocities when disabled
    if (!enabled) {
      this.antigravityVelocities.clear();
      // Keep floatVariations for consistent random seed if re-enabled, 
      // or clear them if we want fresh randoms? 
      // User might prefer stability, so keep them.
    }
  }

  /**
   * Set gravity float speed
   */
  public setGravityFloatSpeed(speed: number): void {
    this.gravityFloatSpeed = speed;
  }

  /**
   * Apply antigravity effect to objects (gentle floating without rising)
   */
  private applyAntigravity(_instances: ObjectInstance[]): void {
    // Logic moved to updateMeshesForInstance for tighter integration with positioning
    // Kept empty or used for state management if needed
  }

  /**
   * Begin fade-out animation for an instance (Zero Gravity cosmic effect)
   */
  public fadeOutInstance(instanceId: number, duration: number = 800): void {
    const meshes = this.meshCache.get(instanceId);
    if (!meshes || meshes.length === 0) return;

    // Clone meshes references — they'll animate via updateCosmicEffects
    this.fadeOutInstances.set(instanceId, {
      startTime: Date.now(),
      duration,
      meshes: [...meshes]
    });

    // Make materials transparent for fade
    meshes.forEach(mesh => {
      mesh.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          mat.transparent = true;
        }
      });
    });
  }

  /**
   * Spawn burst particles at a position (cosmic explosion effect)
   */
  public spawnBurst(position: THREE.Vector3, color?: THREE.Color): void {
    const particleCount = 40 + Math.floor(Math.random() * 30); // More particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      // Random outward velocity (much slower for gradual diffusion)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.005 + Math.random() * 0.015; // Reduced from 0.02-0.08 to 0.005-0.02
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      sizes[i] = 0.03 + Math.random() * 0.05; // Slightly larger particles
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const burstColor = color || new THREE.Color().setHSL(Math.random(), 0.7, 0.7);
    const material = new THREE.PointsMaterial({
      color: burstColor,
      size: 0.08, // Larger base size
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    (points as any)._burstVelocities = velocities;
    (points as any)._burstStartTime = Date.now();
    (points as any)._burstDuration = 3000 + Math.random() * 2000; // 3-5 seconds (was 1.2-1.8s)

    this.scene.add(points);
    this.burstParticles.push(points);
  }

  /**
   * Update all cosmic effects (fade-outs and burst particles)
   */
  public updateCosmicEffects(): void {
    const now = Date.now();

    // Update fade-out instances
    const completedFades: number[] = [];
    this.fadeOutInstances.forEach((fade, instanceId) => {
      const elapsed = now - fade.startTime;
      const progress = Math.min(elapsed / fade.duration, 1.0);
      const eased = 1.0 - Math.pow(1.0 - progress, 2); // ease-out quad

      fade.meshes.forEach(mesh => {
        // Shrink
        const scale = Math.max(0.01, 1.0 - eased);
        mesh.scale.multiplyScalar(scale / Math.max(mesh.scale.x, 0.01));

        // Fade opacity
        mesh.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;
            mat.opacity = 1.0 - eased;
          }
        });
      });

      if (progress >= 1.0) {
        completedFades.push(instanceId);
      }
    });

    // Clean up completed fades
    completedFades.forEach(id => {
      const fade = this.fadeOutInstances.get(id);
      if (fade) {
        // Spawn burst at the position of the faded object
        if (fade.meshes.length > 0) {
          const pos = fade.meshes[0].position.clone();
          this.spawnBurst(pos);
        }
      }
      this.fadeOutInstances.delete(id);
      this.removeMeshesForInstance(id);
    });

    // Update burst particles
    const aliveBursts: THREE.Points[] = [];
    this.burstParticles.forEach(points => {
      const startTime = (points as any)._burstStartTime;
      const duration = (points as any)._burstDuration;
      const velocities = (points as any)._burstVelocities as Float32Array;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      if (progress >= 1.0) {
        // Remove
        this.scene.remove(points);
        points.geometry.dispose();
        (points.material as THREE.PointsMaterial).dispose();
        return;
      }

      // Update positions
      const positions = points.geometry.attributes.position as THREE.BufferAttribute;
      const count = positions.count;
      for (let i = 0; i < count; i++) {
        positions.setX(i, positions.getX(i) + velocities[i * 3]);
        positions.setY(i, positions.getY(i) + velocities[i * 3 + 1]);
        positions.setZ(i, positions.getZ(i) + velocities[i * 3 + 2]);
        // Slow down very gradually for extended diffusion
        velocities[i * 3] *= 0.99;
        velocities[i * 3 + 1] *= 0.99;
        velocities[i * 3 + 2] *= 0.99;
      }
      positions.needsUpdate = true;

      // Fade out
      const mat = points.material as THREE.PointsMaterial;
      mat.opacity = 1.0 - Math.pow(progress, 1.5);

      aliveBursts.push(points);
    });
    this.burstParticles = aliveBursts;
  }

  /**
   * Apply smooth drag interpolation to objects being dragged
   */
  private applySmoothDrag(): void {
    if (this.dragTargets.size === 0) return;

    this.dragTargets.forEach((targetPosition, mesh) => {
      // Smoothly interpolate current position to target position using lerp
      mesh.position.lerp(targetPosition, this.dragDamping);

      // Update previous position for next frame
      this.dragPrevPositions.set(mesh, mesh.position.clone());
    });
  }

  /**
   * Create media mesh (image/video)
   */
  private createMediaMesh(instance: ObjectInstance): THREE.Mesh | null {
    if (!instance.mediaData) return null;

    const { mediaData } = instance;

    // Calculate canvas size based on camera FOV
    const distance = this.camera.position.z;
    const vFov = (this.camera.fov * Math.PI) / 180;
    const canvasHeight = 2 * Math.tan(vFov / 2) * distance;
    const canvasWidth = canvasHeight * this.camera.aspect;

    // Calculate size based on aspect ratio
    const aspectRatio = mediaData.aspectRatio || 1;
    let width: number, height: number;

    if (aspectRatio > this.camera.aspect) {
      width = canvasWidth * MEDIA_CONFIG.CANVAS_SIZE_MULTIPLIER;
      height = width / aspectRatio;
    } else {
      height = canvasHeight * MEDIA_CONFIG.CANVAS_SIZE_MULTIPLIER;
      width = height * aspectRatio;
    }

    const geometry = new THREE.PlaneGeometry(width, height);
    let texture: THREE.Texture;

    // Cache texture
    if (!instance.cachedTexture) {
      if (mediaData.type === 'image') {
        texture = new THREE.TextureLoader().load(mediaData.url);
        texture.colorSpace = THREE.SRGBColorSpace;
      } else {
        if (!instance.videoElement) {
          const video = document.createElement('video');
          video.src = mediaData.url;
          video.loop = true;
          video.muted = true;
          video.play();
          instance.videoElement = video;
        }
        texture = new THREE.VideoTexture(instance.videoElement);
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      instance.cachedTexture = texture;
    } else {
      texture = instance.cachedTexture;
    }

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, MEDIA_CONFIG.MEDIA_Z_OFFSET);
    mesh.userData.vel = new THREE.Vector3(0.01, 0.01, 0.01);
    mesh.userData.isMedia = true;
    mesh.userData.instanceId = instance.id;
    mesh.renderOrder = RENDER_ORDER.BACKGROUND;

    return mesh;
  }

  /**
   * Create normal (non-symmetric) mesh
   */
  private createNormalMesh(
    instance: ObjectInstance,
    sizeMultiplier: number,
    speedMultiplier: number,
    spreadMultiplier: number,
    avgFrequency: number
  ): THREE.Object3D | null {
    if (instance.materialIndex === undefined) return null;

    // Get material and create mesh
    const material = MATERIALS[instance.materialIndex];
    if (!material) return null;

    // For mixed mode, create a group with both solid and wireframe
    const mesh = instance.wireframe === 'mixed'
      ? this.createMixedMesh(material)
      : material.create3D(instance.wireframe === 'solid');

    // Apply instance transformations
    mesh.position.set(
      instance.position.x * spreadMultiplier,
      instance.position.y * spreadMultiplier,
      instance.position.z * spreadMultiplier
    );

    // Audio-reactive rotation


    // For static mesh creation, we don't apply time-based rotation yet.
    // updateMeshesForInstance handles the animation.
    mesh.rotation.set(
      instance.rotation.x,
      instance.rotation.y,
      instance.rotation.z
    );

    // Audio-reactive scale
    const scaleBoost = 1 + (avgFrequency / 255) * 0.3;
    mesh.scale.set(
      instance.scale * sizeMultiplier * scaleBoost,
      instance.scale * sizeMultiplier * scaleBoost,
      instance.scale * sizeMultiplier * scaleBoost
    );

    // Apply color if specified
    if (instance.color) {
      this.applyColorToMesh(mesh, instance.color);
    }

    // Store instance data
    mesh.userData.instanceId = instance.id;
    mesh.userData.isPinned = instance.pinned;
    mesh.userData.speedMultiplier = speedMultiplier;

    return mesh;
  }

  /**
   * Create symmetric mesh
   */
  private createSymmetricMesh(
    instance: ObjectInstance,
    angle: number,
    sizeMultiplier: number,
    speedMultiplier: number,
    spreadMultiplier: number,
    spacingMultiplier: number,
    avgFrequency: number
  ): THREE.Object3D | null {
    if (instance.materialIndex === undefined) return null;

    // Get material and create mesh
    const material = MATERIALS[instance.materialIndex];
    if (!material) return null;

    // For mixed mode, create a group with both solid and wireframe
    const mesh = instance.wireframe === 'mixed'
      ? this.createMixedMesh(material)
      : material.create3D(instance.wireframe === 'solid');

    // Calculate symmetric position
    // Use spacingMultiplier as base radius, plus INDEX-BASED offset for stable multi-layer distribution
    const ringOffset = (instance.id % 8) * 3.0;
    const radius = (spacingMultiplier + ringOffset) * spreadMultiplier;

    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const z = instance.position.z * spreadMultiplier;

    mesh.position.set(x, y, z);

    // Audio-reactive rotation
    const time = Date.now() * 0.001 * speedMultiplier;
    const audioBoost = (avgFrequency / 255) * 0.5;

    mesh.rotation.set(
      instance.rotation.x + time * 0.5 + audioBoost,
      instance.rotation.y + time * 0.7 + audioBoost,
      instance.rotation.z + time * 0.3 + audioBoost
    );

    // Audio-reactive scale
    const scaleBoost = 1 + (avgFrequency / 255) * 0.3;
    mesh.scale.set(
      instance.scale * sizeMultiplier * scaleBoost,
      instance.scale * sizeMultiplier * scaleBoost,
      instance.scale * sizeMultiplier * scaleBoost
    );

    // Apply color if specified
    if (instance.color) {
      this.applyColorToMesh(mesh, instance.color);
    }

    // Store instance data
    mesh.userData.instanceId = instance.id;
    mesh.userData.isPinned = instance.pinned;
    mesh.userData.speedMultiplier = speedMultiplier;
    mesh.userData.symmetryAngle = angle;

    return mesh;
  }

  /**
   * Create mixed mesh (50% solid, 50% wireframe)
   */
  private createMixedMesh(material: any): THREE.Object3D {
    // 50% chance for solid, 50% chance for wireframe
    const isSolid = Math.random() < 0.5;
    return material.create3D(isSolid);
  }

  /**
   * Apply color to mesh
   */
  private applyColorToMesh(mesh: THREE.Object3D, color: RGBColor): void {
    const threeColor = rgbToThreeColor(color);

    // Check if this is VJ mode white (for emissive glow)
    const isVJWhite = color.r === 255 && color.g === 255 && color.b === 255;

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color = threeColor;

          // In VJ mode (white), add emissive glow for brightness
          if (isVJWhite) {
            child.material.emissive = new THREE.Color(0.8, 0.8, 0.8); // Bright emissive glow
            child.material.emissiveIntensity = 0.5;
          } else {
            child.material.emissive = new THREE.Color(0, 0, 0);
            child.material.emissiveIntensity = 0;
          }
        }
      } else if (child instanceof THREE.LineSegments) {
        if (child.material instanceof THREE.LineBasicMaterial) {
          child.material.color = threeColor;
        }
      }
    });
  }

  /**
   * Clear all meshes from the scene
   */
  private clearMeshes(): void {
    // Clear all cached instances
    const instanceIds = Array.from(this.meshCache.keys());
    instanceIds.forEach(id => this.removeMeshesForInstance(id));

    this.currentMeshes = [];
    this.meshCache.clear();
  }

  /**
   * Update drag controls
   */
  private updateDragControls(): void {
    if (this.dragControls) {
      this.dragControls.dispose();
      this.dragControls = null;
    }

    if (this.currentMeshes.length > 0) {
      console.log(`🎯 Setting up drag controls for ${this.currentMeshes.length} meshes`);

      this.dragControls = new DragControls(
        this.currentMeshes,
        this.camera,
        this.renderer.domElement
      );

      // Enable drag controls
      this.dragControls.enabled = true;

      // Setup drag event handlers
      this.setupDragEvents();

      console.log('✅ Drag controls initialized and enabled');
    } else {
      console.log('⚠️ No meshes available for drag controls');
    }
  }

  /**
   * Setup drag control event handlers
   */
  private setupDragEvents(): void {
    if (!this.dragControls) return;

    // Hover events for visual feedback
    this.dragControls.addEventListener('hoveron', (event: any) => {
      if (event.object) {
        this.renderer.domElement.style.cursor = 'grab';
        console.log('🖱️ Hovering over draggable object');
      }
    });

    this.dragControls.addEventListener('hoveroff', (_event: any) => {
      this.renderer.domElement.style.cursor = 'default';
    });

    this.dragControls.addEventListener('dragstart', (event: any) => {
      console.log('🎯 Drag started', event.object);
      if (event.object) {
        event.object.userData.isDragging = true;
        // Store original scale for restoration
        event.object.userData.originalScale = event.object.scale.clone();
        // Slightly enlarge object being dragged for visual feedback
        event.object.scale.multiplyScalar(1.2);

        // --- SELECTION HIGHLIGHT (RED) ---
        // --- SELECTION HIGHLIGHT (RED) ---
        // User Request: "Object's selection color... to red"
        event.object.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // 1. Force Base Color to Red (Strongest visual cue)
            if (child.material.color) {
              child.userData.originalColor = child.material.color.clone();
              child.material.color.setHex(0xff0000);
            }

            // 2. Add Red Emissive if supported (for glow)
            if (child.material.emissive) {
              child.userData.originalEmissive = child.material.emissive.clone();
              child.userData.originalEmissiveIntensity = child.material.emissiveIntensity;

              child.material.emissive.setHex(0xff0000);
              child.material.emissiveIntensity = 0.5;
            }
          }
        });

        // Store current position as previous position
        this.dragPrevPositions.set(event.object, event.object.position.clone());
        // Initialize target to current position
        this.dragTargets.set(event.object, event.object.position.clone());
        // Change cursor to grabbing
        this.renderer.domElement.style.cursor = 'grabbing';
      }
    });

    this.dragControls.addEventListener('drag', (event: any) => {
      // Update target position during drag for smooth interpolation
      if (event.object && event.object.userData.isDragging) {
        // Capture the new target position (where DragControls wants to move the object)
        const newTarget = event.object.position.clone();

        // Get previous position
        const prevPos = this.dragPrevPositions.get(event.object);

        if (prevPos) {
          // Reset position to previous (undo DragControls' direct position change)
          event.object.position.copy(prevPos);

          // Store the new target for smooth interpolation
          this.dragTargets.set(event.object, newTarget);

          // In mandala mode, update all symmetric meshes
          if (this.currentMandalaMode) {
            const instanceId = event.object.userData.instanceId;
            if (instanceId !== undefined) {
              const allMeshes = this.meshCache.get(instanceId);
              if (allMeshes && allMeshes.length > 1) {
                // Find which symmetric copy is being dragged
                const draggedIndex = allMeshes.indexOf(event.object);
                if (draggedIndex !== -1) {
                  // Calculate position change relative to center
                  const baseAngle = (draggedIndex / this.currentSymmetryCount) * Math.PI * 2;
                  const baseRotationRad = (this.baseRotation * Math.PI) / 180;
                  const totalAngle = baseAngle + baseRotationRad;

                  // Calculate the center position from the dragged mesh position
                  // Inverse of: x = centerX + distance * cos(angle)
                  const distance = Math.sqrt(newTarget.x ** 2 + newTarget.y ** 2);
                  const dragAngle = Math.atan2(newTarget.y, newTarget.x);
                  const centerDistance = distance;
                  const centerAngle = dragAngle - totalAngle;

                  // Update all other symmetric meshes
                  allMeshes.forEach((mesh, index) => {
                    if (index !== draggedIndex && mesh !== event.object) {
                      const meshAngle = (index / this.currentSymmetryCount) * Math.PI * 2 + baseRotationRad;
                      const targetX = centerDistance * Math.cos(centerAngle + meshAngle);
                      const targetY = centerDistance * Math.sin(centerAngle + meshAngle);
                      const targetZ = newTarget.z; // Keep same Z

                      // Store target for this symmetric mesh
                      this.dragTargets.set(mesh, new THREE.Vector3(targetX, targetY, targetZ));

                      // Store previous position if not already stored
                      if (!this.dragPrevPositions.has(mesh)) {
                        this.dragPrevPositions.set(mesh, mesh.position.clone());
                      }
                    }
                  });
                }
              }
            }
          }
        }

        // Emit drag event for potential listeners
        this.emit('object:dragged', event.object);
      }
    });

    this.dragControls.addEventListener('dragend', (event: any) => {
      console.log('🎯 Drag ended', event.object);
      if (event.object) {
        event.object.userData.isDragging = false;

        // Restore original scale
        if (event.object.userData.originalScale) {
          event.object.scale.copy(event.object.userData.originalScale);
          delete event.object.userData.originalScale;
        }

        // --- RESTORE SELECTION HIGHLIGHT ---
        event.object.traverse((child: any) => {
          if (child.isMesh && child.material) {
            // Restore Base Color
            if (child.userData.originalColor) {
              child.material.color.copy(child.userData.originalColor);
              delete child.userData.originalColor;
            }

            // Restore Emissive
            if (child.userData.originalEmissive) {
              child.material.emissive.copy(child.userData.originalEmissive);
              child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
              delete child.userData.originalEmissive;
              delete child.userData.originalEmissiveIntensity;
            }
          }
        });

        // Restore cursor
        this.renderer.domElement.style.cursor = 'grab';

        // Update instance position from mesh position
        const instanceId = event.object.userData.instanceId;
        if (instanceId !== undefined) {
          const newPosition = {
            x: event.object.position.x,
            y: event.object.position.y,
            z: event.object.position.z
          };

          console.log(`📍 Updating instance ${instanceId} position:`, newPosition);

          // Clean up drag tracking for all meshes in this instance
          const allMeshes = this.meshCache.get(instanceId);
          if (allMeshes) {
            allMeshes.forEach(mesh => {
              this.dragTargets.delete(mesh);
              this.dragPrevPositions.delete(mesh);
              // Restore scale for symmetric meshes too
              if (mesh.userData.originalScale) {
                mesh.scale.copy(mesh.userData.originalScale);
                delete mesh.userData.originalScale;
              }
            });
          } else {
            // Fallback: just clean up the dragged object
            this.dragTargets.delete(event.object);
            this.dragPrevPositions.delete(event.object);
          }

          // Emit dragend event with position data
          this.emit('object:dragend', {
            instanceId,
            position: newPosition,
            object: event.object
          });
        } else {
          // No instance ID, just clean up the dragged object
          this.dragTargets.delete(event.object);
          this.dragPrevPositions.delete(event.object);
        }
      }
    });
  }

  /**
   * Start animation loop
   */
  public startAnimation(onUpdate: (renderer: THREE.WebGLRenderer) => void): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Call update callback
      onUpdate(this.renderer);

      // Render scene
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Stop animation loop
   */
  public stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get renderer canvas as data URL
   */
  public captureScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Get current meshes
   */
  public getMeshes(): THREE.Object3D[] {
    return this.currentMeshes;
  }

  /**
   * Get camera
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get renderer
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Set background color
   */
  public setBackgroundColor(color: { r: number; g: number; b: number }): void {
    this.scene.background = new THREE.Color(color.r / 255, color.g / 255, color.b / 255);
  }

  /**
   * Set base rotation offset (in degrees)
   */
  public setBaseRotation(degrees: number): void {
    this.baseRotation = degrees;
    // Clear cache to force rebuild with new rotation
    this.clearMeshCache();
  }

  /**
   * Set the camera mosaic background
   */
  public setCameraBackground(canvas: HTMLCanvasElement | null): void {
    if (!canvas) {
      if (this.cameraBackgroundPlane) {
        this.cameraBackgroundPlane.visible = false;
      }
      return;
    }

    if (!this.cameraTexture) {
      // Create texture from canvas
      this.cameraTexture = new THREE.CanvasTexture(canvas);
      this.cameraTexture.colorSpace = THREE.SRGBColorSpace;

      // Calculate size to fill viewport at Z=0
      const distance = this.camera.position.z; // usually 100
      const vFov = (this.camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFov / 2) * distance;
      const width = height * this.camera.aspect;

      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshBasicMaterial({
        map: this.cameraTexture,
        depthWrite: false, // Don't write to depth buffer so it stays in background
        transparent: true
      });

      this.cameraBackgroundPlane = new THREE.Mesh(geometry, material);
      this.cameraBackgroundPlane.position.set(0, 0, 0);
      this.cameraBackgroundPlane.renderOrder = RENDER_ORDER.BACKGROUND - 1; // Stay behind everything

      this.scene.add(this.cameraBackgroundPlane);
    }

    // Update texture and ensure visibility
    this.cameraTexture.needsUpdate = true;
    this.cameraBackgroundPlane!.visible = true;
  }

  /**
   * Clear mesh cache to force rebuild
   */
  public clearMeshCache(): void {
    // Remove all meshes from scene before clearing cache
    const instanceIds = Array.from(this.meshCache.keys());
    instanceIds.forEach(id => this.removeMeshesForInstance(id));

    // Now clear the cache
    this.meshCache.clear();
  }

  /**
   * Cleanup
   */
  public dispose(): void {
    this.stopAnimation();
    this.clearMeshes();

    if (this.dragControls) {
      this.dragControls.dispose();
    }

    this.renderer.dispose();
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.removeAllListeners();
  }
}
