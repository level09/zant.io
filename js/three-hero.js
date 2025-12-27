/**
 * ZANT — Three.js Hero Scene
 * "Kill The Noise" — Particles converging from chaos to signal
 */

(function() {
    'use strict';

    // Colors matching the CSS
    const SIGNAL = 0x00ff41;
    const DANGER = 0xff3131;
    const VOID = 0x0a0a0a;

    let scene, camera, renderer, particles, lines, clock, signalCore;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let windowHalf = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let isInitialized = false;

    // Particle system configuration
    const CONFIG = {
        particleCount: 3000,
        fieldRadius: 60,
        signalCoreRadius: 12,
        mouseInfluence: 20,
        noiseSpeed: 0.0008,
        connectionDistance: 5,
        maxConnections: 4,
        lineOpacity: 0.2
    };

    // Noise function for organic movement
    function noise3D(x, y, z, seed = 0) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719 + seed) * 43758.5453;
        return n - Math.floor(n);
    }

    function init() {
        const container = document.getElementById('three-hero');
        if (!container) return;

        // Scene
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(VOID, 0.015);

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 30;

        // Renderer
        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(VOID, 0);
        container.appendChild(renderer.domElement);

        // Clock for animations
        clock = new THREE.Clock();

        // Create particle system
        createParticles();

        // Create connection lines
        createLines();

        // Create glowing signal core
        createSignalCore();

        // Event listeners
        window.addEventListener('resize', onResize, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        isInitialized = true;
        animate();
    }

    function createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(CONFIG.particleCount * 3);
        const colors = new Float32Array(CONFIG.particleCount * 3);
        const sizes = new Float32Array(CONFIG.particleCount);
        const velocities = new Float32Array(CONFIG.particleCount * 3);
        const phases = new Float32Array(CONFIG.particleCount);
        const states = new Float32Array(CONFIG.particleCount); // 0 = noise, 1 = signal

        const signalColor = new THREE.Color(SIGNAL);
        const dangerColor = new THREE.Color(DANGER);
        const dimColor = new THREE.Color(0x333333);

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;

            // Spherical distribution
            const radius = CONFIG.fieldRadius * Math.pow(Math.random(), 0.5);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Velocity for organic movement
            velocities[i3] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

            // Random phase for varied animation
            phases[i] = Math.random() * Math.PI * 2;

            // Initially all are noise particles
            states[i] = 0;

            // Color based on distance from center (dim in chaos, bright near signal)
            const dist = Math.sqrt(positions[i3]**2 + positions[i3+1]**2 + positions[i3+2]**2);
            const signalStrength = Math.max(0, 1 - dist / CONFIG.signalCoreRadius);

            let color;
            if (signalStrength > 0.5) {
                color = signalColor;
            } else if (Math.random() < 0.1) {
                color = dangerColor;
            } else {
                color = dimColor.clone().lerp(signalColor, signalStrength * 0.5);
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Size based on distance
            sizes[i] = Math.random() * 2 + 0.5 + signalStrength * 2;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.userData = { velocities, phases, states };

        // Point material (simpler, more compatible)
        const material = new THREE.PointsMaterial({
            size: 0.35,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    function createLines() {
        // Dynamic line connections
        const geometry = new THREE.BufferGeometry();
        const maxLines = CONFIG.particleCount * CONFIG.maxConnections;
        const positions = new Float32Array(maxLines * 6);
        const colors = new Float32Array(maxLines * 6);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setDrawRange(0, 0);

        const material = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: CONFIG.lineOpacity,
            blending: THREE.AdditiveBlending
        });

        lines = new THREE.LineSegments(geometry, material);
        scene.add(lines);
    }

    function createSignalCore() {
        // Inner bright core
        const coreGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: SIGNAL,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);

        // Outer glow sphere
        const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: SIGNAL,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);

        // Outer halo
        const haloGeometry = new THREE.SphereGeometry(5, 32, 32);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: SIGNAL,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);

        // Ring around core
        const ringGeometry = new THREE.TorusGeometry(4, 0.05, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: SIGNAL,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;

        // Second ring at different angle
        const ring2 = ring.clone();
        ring2.rotation.x = Math.PI / 3;
        ring2.rotation.y = Math.PI / 4;

        signalCore = new THREE.Group();
        signalCore.add(core, glow, halo, ring, ring2);
        signalCore.position.set(5, -2, 0); // Offset right and down for better composition
        scene.add(signalCore);
    }

    function updateParticles(time) {
        if (!particles) return;

        const positions = particles.geometry.attributes.position.array;
        const colors = particles.geometry.attributes.color.array;
        const sizes = particles.geometry.attributes.size.array;
        const { velocities, phases, states } = particles.geometry.userData;

        const signalColor = new THREE.Color(SIGNAL);
        const dangerColor = new THREE.Color(DANGER);
        const dimColor = new THREE.Color(0x222222);

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const i3 = i * 3;

            // Current position
            let x = positions[i3];
            let y = positions[i3 + 1];
            let z = positions[i3 + 2];

            // Distance from center
            const dist = Math.sqrt(x*x + y*y + z*z);

            // Noise-based organic movement
            const noiseScale = 0.1;
            const noiseTime = time * CONFIG.noiseSpeed;
            const nx = noise3D(x * noiseScale, y * noiseScale, noiseTime + phases[i]) - 0.5;
            const ny = noise3D(y * noiseScale, z * noiseScale, noiseTime + phases[i] + 100) - 0.5;
            const nz = noise3D(z * noiseScale, x * noiseScale, noiseTime + phases[i] + 200) - 0.5;

            // Mouse influence
            const mouseX = (mouse.x - 0.5) * CONFIG.mouseInfluence;
            const mouseY = (mouse.y - 0.5) * -CONFIG.mouseInfluence;

            // Calculate attraction to mouse position in 3D
            const targetX = mouseX;
            const targetY = mouseY;
            const targetZ = 0;

            const dx = targetX - x;
            const dy = targetY - y;
            const dz = targetZ - z;
            const distToMouse = Math.sqrt(dx*dx + dy*dy + dz*dz);

            // Particles close to mouse get attracted to signal core
            const mouseAttractionRadius = 20;
            let attractionForce = 0;
            if (distToMouse < mouseAttractionRadius) {
                attractionForce = (1 - distToMouse / mouseAttractionRadius) * 0.02;
            }

            // Apply forces
            x += velocities[i3] + nx * 0.1 + dx * attractionForce;
            y += velocities[i3 + 1] + ny * 0.1 + dy * attractionForce;
            z += velocities[i3 + 2] + nz * 0.1 + dz * attractionForce;

            // Slight pull toward center (gravity to prevent dispersion)
            const centerPull = 0.001;
            x -= x * centerPull;
            y -= y * centerPull;
            z -= z * centerPull;

            // Boundary: keep within field
            const maxDist = CONFIG.fieldRadius * 1.2;
            const currentDist = Math.sqrt(x*x + y*y + z*z);
            if (currentDist > maxDist) {
                const scale = maxDist / currentDist;
                x *= scale;
                y *= scale;
                z *= scale;
            }

            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;

            // Update color based on distance
            const newDist = Math.sqrt(x*x + y*y + z*z);
            const signalStrength = Math.max(0, 1 - newDist / (CONFIG.signalCoreRadius * 2));
            const pulse = Math.sin(time * 0.002 + phases[i]) * 0.2 + 0.8;

            let color;
            if (signalStrength > 0.7) {
                color = signalColor.clone();
                color.multiplyScalar(pulse);
            } else if (distToMouse < 10) {
                // Particles near mouse glow
                const mouseGlow = 1 - distToMouse / 10;
                color = dimColor.clone().lerp(signalColor, mouseGlow * 0.8);
            } else if (states[i] > 0.5 || Math.random() < 0.001) {
                // Random danger flashes (data errors/noise)
                color = dangerColor.clone();
                states[i] = Math.random() < 0.1 ? 1 : 0;
            } else {
                color = dimColor.clone().lerp(signalColor, signalStrength * 0.4);
            }

            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            // Update size
            sizes[i] = (0.5 + signalStrength * 3 + (distToMouse < 15 ? (1 - distToMouse/15) * 2 : 0)) * pulse;
        }

        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.color.needsUpdate = true;
        particles.geometry.attributes.size.needsUpdate = true;
    }

    function updateLines() {
        if (!particles || !lines) return;

        const positions = particles.geometry.attributes.position.array;
        const linePositions = lines.geometry.attributes.position.array;
        const lineColors = lines.geometry.attributes.color.array;

        const signalColor = new THREE.Color(SIGNAL);
        let lineIndex = 0;

        // Only check particles near the mouse for connections (performance)
        const mouseX = (mouse.x - 0.5) * CONFIG.mouseInfluence;
        const mouseY = (mouse.y - 0.5) * -CONFIG.mouseInfluence;

        for (let i = 0; i < CONFIG.particleCount && lineIndex < CONFIG.particleCount * CONFIG.maxConnections; i++) {
            const i3 = i * 3;
            const x1 = positions[i3];
            const y1 = positions[i3 + 1];
            const z1 = positions[i3 + 2];

            // Only create connections for particles near signal core or mouse
            const distToCenter = Math.sqrt(x1*x1 + y1*y1 + z1*z1);
            const distToMouse = Math.sqrt((x1-mouseX)**2 + (y1-mouseY)**2 + z1*z1);

            if (distToCenter > CONFIG.signalCoreRadius * 3 && distToMouse > 12) continue;

            let connectionCount = 0;

            for (let j = i + 1; j < CONFIG.particleCount && connectionCount < CONFIG.maxConnections; j++) {
                const j3 = j * 3;
                const x2 = positions[j3];
                const y2 = positions[j3 + 1];
                const z2 = positions[j3 + 2];

                const dx = x2 - x1;
                const dy = y2 - y1;
                const dz = z2 - z1;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                if (dist < CONFIG.connectionDistance) {
                    const li = lineIndex * 6;
                    linePositions[li] = x1;
                    linePositions[li + 1] = y1;
                    linePositions[li + 2] = z1;
                    linePositions[li + 3] = x2;
                    linePositions[li + 4] = y2;
                    linePositions[li + 5] = z2;

                    // Line color fades with distance
                    const alpha = 1 - dist / CONFIG.connectionDistance;
                    const color = signalColor.clone().multiplyScalar(alpha * 0.5);

                    lineColors[li] = color.r;
                    lineColors[li + 1] = color.g;
                    lineColors[li + 2] = color.b;
                    lineColors[li + 3] = color.r;
                    lineColors[li + 4] = color.g;
                    lineColors[li + 5] = color.b;

                    lineIndex++;
                    connectionCount++;
                }
            }
        }

        lines.geometry.attributes.position.needsUpdate = true;
        lines.geometry.attributes.color.needsUpdate = true;
        lines.geometry.setDrawRange(0, lineIndex * 2);
    }

    function animate() {
        if (!isInitialized) return;
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime() * 1000;

        // Smooth mouse movement
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        // Update particles
        updateParticles(time);
        updateLines();

        // Update particle size dynamically
        if (particles && particles.material) {
            const pulse = Math.sin(time * 0.001) * 0.05 + 0.35;
            particles.material.size = pulse;
        }

        // Subtle camera movement based on mouse
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 3 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);

        // Subtle rotation
        particles.rotation.y += 0.0002;
        lines.rotation.y = particles.rotation.y;

        // Animate signal core
        if (signalCore) {
            signalCore.rotation.y += 0.002;
            signalCore.rotation.x = Math.sin(time * 0.0005) * 0.2;

            // Pulse the core
            const pulse = Math.sin(time * 0.002) * 0.2 + 1;
            signalCore.scale.set(pulse, pulse, pulse);

            // Animate rings
            if (signalCore.children[3]) signalCore.children[3].rotation.z += 0.005;
            if (signalCore.children[4]) signalCore.children[4].rotation.z -= 0.003;
        }

        renderer.render(scene, camera);
    }

    function onResize() {
        windowHalf.x = window.innerWidth / 2;
        windowHalf.y = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    function onMouseMove(event) {
        mouse.targetX = event.clientX / window.innerWidth;
        mouse.targetY = event.clientY / window.innerHeight;
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            mouse.targetX = event.touches[0].clientX / window.innerWidth;
            mouse.targetY = event.touches[0].clientY / window.innerHeight;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging if needed
    window.ZantHero = { init, scene, camera, renderer };

})();
