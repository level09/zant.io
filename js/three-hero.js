/**
 * ZANT — Three.js Hero
 * Brutalist. Minimal. Menacing.
 *
 * A noise membrane - dark surface breathing in the void
 */

(function() {
    'use strict';

    const SIGNAL = 0x00ff41;
    const VOID = 0x0a0a0a;

    let scene, camera, renderer, clock;
    let membrane, particles;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let isInitialized = false;

    // Simplex-like noise
    function noise(x, y, z) {
        const p = (x * 12.9898 + y * 78.233 + z * 37.719);
        return (Math.sin(p) * 43758.5453) % 1;
    }

    function smoothNoise(x, y, z) {
        const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
        const fx = x - x0, fy = y - y0, fz = z - z0;

        // Smoothstep
        const sx = fx * fx * (3 - 2 * fx);
        const sy = fy * fy * (3 - 2 * fy);
        const sz = fz * fz * (3 - 2 * fz);

        let n = 0;
        for (let i = 0; i <= 1; i++) {
            for (let j = 0; j <= 1; j++) {
                for (let k = 0; k <= 1; k++) {
                    const weight =
                        (i === 0 ? 1 - sx : sx) *
                        (j === 0 ? 1 - sy : sy) *
                        (k === 0 ? 1 - sz : sz);
                    n += weight * noise(x0 + i, y0 + j, z0 + k);
                }
            }
        }
        return n * 2 - 1;
    }

    function init() {
        const container = document.getElementById('three-hero');
        if (!container) return;

        scene = new THREE.Scene();

        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 8, 20);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(VOID, 0);
        container.appendChild(renderer.domElement);

        clock = new THREE.Clock();

        createMembrane();
        createSparseParticles();

        window.addEventListener('resize', onResize, false);
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('touchmove', onTouchMove, { passive: true });

        isInitialized = true;
        animate();
    }

    function createMembrane() {
        // A plane that will be displaced by noise
        const geometry = new THREE.PlaneGeometry(80, 80, 128, 128);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({
            color: SIGNAL,
            wireframe: true,
            transparent: true,
            opacity: 0.08
        });

        membrane = new THREE.Mesh(geometry, material);
        membrane.position.y = -5;
        scene.add(membrane);

        // Store original positions
        const positions = geometry.attributes.position.array;
        geometry.userData.originalPositions = new Float32Array(positions);
    }

    function createSparseParticles() {
        // Very few particles - just enough to create depth
        const count = 80;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Spread in a wide area but sparse
            positions[i3] = (Math.random() - 0.5) * 100;
            positions[i3 + 1] = (Math.random() - 0.5) * 40 - 5;
            positions[i3 + 2] = (Math.random() - 0.5) * 60 - 20;
            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            color: SIGNAL,
            size: 0.5,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);
    }

    function updateMembrane(time) {
        if (!membrane) return;

        const geometry = membrane.geometry;
        const positions = geometry.attributes.position.array;
        const original = geometry.userData.originalPositions;

        const noiseScale = 0.03;
        const noiseSpeed = time * 0.0003;
        const mouseInfluence = 15;

        for (let i = 0; i < positions.length; i += 3) {
            const ox = original[i];
            const oz = original[i + 2];

            // Distance from mouse position (mapped to world space)
            const mx = (mouse.x - 0.5) * 60;
            const mz = (mouse.y - 0.5) * -40;
            const distToMouse = Math.sqrt((ox - mx) ** 2 + (oz - mz) ** 2);

            // Base noise displacement
            let displacement = smoothNoise(
                ox * noiseScale,
                oz * noiseScale,
                noiseSpeed
            ) * 3;

            // Mouse creates a subtle ripple/depression
            if (distToMouse < mouseInfluence) {
                const influence = 1 - (distToMouse / mouseInfluence);
                displacement += Math.sin(influence * Math.PI) * 2;
            }

            // Edge fade - less displacement at edges
            const distFromCenter = Math.sqrt(ox * ox + oz * oz);
            const edgeFade = Math.max(0, 1 - distFromCenter / 50);

            positions[i + 1] = original[i + 1] + displacement * edgeFade;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    function updateParticles(time) {
        if (!particles) return;

        const positions = particles.geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            // Subtle drift
            positions[i] += Math.sin(time * 0.0001 + i) * 0.01;
            positions[i + 1] += Math.cos(time * 0.00015 + i * 0.5) * 0.005;

            // Wrap around
            if (positions[i] > 50) positions[i] = -50;
            if (positions[i] < -50) positions[i] = 50;
        }

        particles.geometry.attributes.position.needsUpdate = true;

        // Subtle opacity pulse
        const pulse = Math.sin(time * 0.001) * 0.1 + 0.25;
        particles.material.opacity = pulse;
    }

    function animate() {
        if (!isInitialized) return;
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime() * 1000;

        // Smooth mouse
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;

        updateMembrane(time);
        updateParticles(time);

        // Subtle camera movement
        camera.position.x += ((mouse.x - 0.5) * 4 - camera.position.x) * 0.02;
        camera.position.y += (8 + (mouse.y - 0.5) * 2 - camera.position.y) * 0.02;
        camera.lookAt(0, -2, 0);

        // Very slow rotation
        membrane.rotation.z += 0.0001;

        renderer.render(scene, camera);
    }

    function onResize() {
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.ZantHero = { init, scene, camera, renderer };

})();
