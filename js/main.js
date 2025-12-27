/**
 * ZANT — Enhanced Interactions
 * Cryptic. Sleek. Alive.
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════════
    // TEXT SCRAMBLE EFFECT
    // Characters decode from noise to signal
    // ═══════════════════════════════════════════════════════════════
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#_______';
            this.update = this.update.bind(this);
        }

        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise(resolve => this.resolve = resolve);
            this.queue = [];

            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }

            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }

        update() {
            let output = '';
            let complete = 0;

            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];

                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="scramble-char">${char}</span>`;
                } else {
                    output += from;
                }
            }

            this.el.innerHTML = output;

            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }

        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // SPLIT TEXT ANIMATION
    // Staggered character reveals
    // ═══════════════════════════════════════════════════════════════
    function splitTextIntoSpans(element) {
        const text = element.textContent;
        element.innerHTML = '';
        element.setAttribute('aria-label', text);

        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.className = 'split-char';
            span.style.setProperty('--char-index', i);
            span.style.animationDelay = `${i * 0.03}s`;
            element.appendChild(span);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // MAGNETIC BUTTONS
    // Subtle cursor attraction
    // ═══════════════════════════════════════════════════════════════
    function initMagneticButtons() {
        const buttons = document.querySelectorAll('.hero__cta, .cta__button');

        buttons.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;

                const inner = btn.querySelector('span');
                if (inner) {
                    inner.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
                }
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0)';
                const inner = btn.querySelector('span');
                if (inner) {
                    inner.style.transform = 'translate(0, 0)';
                }
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // CUSTOM CURSOR
    // Context-aware crosshair
    // ═══════════════════════════════════════════════════════════════
    function initCustomCursor() {
        const cursor = document.createElement('div');
        cursor.className = 'custom-cursor';
        cursor.innerHTML = `
            <div class="cursor-dot"></div>
            <div class="cursor-ring"></div>
        `;
        document.body.appendChild(cursor);

        const dot = cursor.querySelector('.cursor-dot');
        const ring = cursor.querySelector('.cursor-ring');

        let mouseX = 0, mouseY = 0;
        let dotX = 0, dotY = 0;
        let ringX = 0, ringY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        function animate() {
            // Dot follows immediately
            dotX += (mouseX - dotX) * 0.5;
            dotY += (mouseY - dotY) * 0.5;
            dot.style.transform = `translate(${dotX}px, ${dotY}px)`;

            // Ring follows with lag
            ringX += (mouseX - ringX) * 0.15;
            ringY += (mouseY - ringY) * 0.15;
            ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

            requestAnimationFrame(animate);
        }
        animate();

        // Hover states
        const interactives = document.querySelectorAll('a, button, .pillar, .anti__item');
        interactives.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('cursor-hover'));
        });

        // Hide on mobile
        if ('ontouchstart' in window) {
            cursor.style.display = 'none';
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // AMBIENT PARTICLES
    // Floating dust throughout the page
    // ═══════════════════════════════════════════════════════════════
    function initAmbientParticles() {
        const canvas = document.createElement('canvas');
        canvas.className = 'ambient-particles';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 50;

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = document.body.scrollHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += 0.02;

                // Wrap around
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                const opacity = p.opacity * (0.5 + Math.sin(p.pulse) * 0.5);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        }
        animate();
    }

    // ═══════════════════════════════════════════════════════════════
    // PARALLAX DEPTH
    // Elements move at different scroll speeds
    // ═══════════════════════════════════════════════════════════════
    function initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        function update() {
            const scrollY = window.scrollY;

            parallaxElements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.1;
                const yPos = scrollY * speed;
                el.style.transform = `translateY(${yPos}px)`;
            });
        }

        window.addEventListener('scroll', update, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // ENHANCED SCROLL REVEAL
    // Staggered, more sophisticated
    // ═══════════════════════════════════════════════════════════════
    function initScrollReveal() {
        const reveals = document.querySelectorAll('.reveal');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    // Stagger children if they have .stagger class
                    const staggerChildren = entry.target.querySelectorAll('.stagger');
                    staggerChildren.forEach((child, i) => {
                        child.style.animationDelay = `${i * 0.1}s`;
                        child.classList.add('stagger-visible');
                    });

                    // Trigger text scramble if present
                    const scrambleEl = entry.target.querySelector('[data-scramble]');
                    if (scrambleEl && !scrambleEl.dataset.scrambled) {
                        const fx = new TextScramble(scrambleEl);
                        fx.setText(scrambleEl.dataset.scramble);
                        scrambleEl.dataset.scrambled = 'true';
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '-50px'
        });

        reveals.forEach(el => observer.observe(el));
    }

    // ═══════════════════════════════════════════════════════════════
    // PILLAR HOVER EFFECTS
    // Enhanced interaction feedback
    // ═══════════════════════════════════════════════════════════════
    function initPillarEffects() {
        const pillars = document.querySelectorAll('.pillar');

        pillars.forEach(pillar => {
            pillar.addEventListener('mousemove', (e) => {
                const rect = pillar.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                pillar.style.setProperty('--mouse-x', `${x}%`);
                pillar.style.setProperty('--mouse-y', `${y}%`);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // GLITCH ON HOVER
    // Elements briefly distort
    // ═══════════════════════════════════════════════════════════════
    function initGlitchHover() {
        const glitchTargets = document.querySelectorAll('.anti__item, .pillar__name');

        glitchTargets.forEach(el => {
            el.addEventListener('mouseenter', () => {
                el.classList.add('glitch-hover');
                setTimeout(() => el.classList.remove('glitch-hover'), 200);
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // TERMINAL TYPING EFFECT
    // Re-type on scroll into view
    // ═══════════════════════════════════════════════════════════════
    function initTerminalEffect() {
        const terminal = document.querySelector('.terminal__body');
        if (!terminal) return;

        const lines = terminal.querySelectorAll('.terminal__line');
        let hasPlayed = false;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !hasPlayed) {
                    hasPlayed = true;
                    lines.forEach((line, i) => {
                        line.style.opacity = '0';
                        line.style.animation = 'none';
                        setTimeout(() => {
                            line.style.animation = `terminalReveal 0.5s forwards`;
                        }, i * 400);
                    });
                }
            });
        }, { threshold: 0.3 });

        observer.observe(terminal);
    }

    // ═══════════════════════════════════════════════════════════════
    // SMOOTH SCROLL
    // ═══════════════════════════════════════════════════════════════
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                target?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // INITIALIZE
    // ═══════════════════════════════════════════════════════════════
    function init() {
        initScrollReveal();
        initSmoothScroll();
        initMagneticButtons();
        initCustomCursor();
        initAmbientParticles();
        initPillarEffects();
        initGlitchHover();
        initTerminalEffect();

        // Add scramble data attributes to key elements
        document.querySelectorAll('.manifesto__quote').forEach(el => {
            el.dataset.scramble = el.textContent;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
