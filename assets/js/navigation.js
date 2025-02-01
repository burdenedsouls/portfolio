class DynamicNavigation {
    constructor() {
        this.container = document.querySelector('.bubble-nav');
        this.sections = document.querySelectorAll('.section');
        this.bubbles = document.querySelectorAll('.nav-bubble');
        this.bgBubbles = [];
        this.currentSection = 0;
        this.isAnimating = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.mouse = { x: 0, y: 0 };
        this.lastMouse = { x: 0, y: 0 };
        this.velocity = { x: 0, y: 0 };
        this.bubblePositions = new Map();
        this.springs = new Map();
        this.dampening = 0.8; // Spring dampening
        this.tension = 0.1;   // Spring tension
        this.lastScrollTime = Date.now();
        this.scrollVelocity = 0;
        this.isScrolling = false;
        this.lastTouchY = 0;
        this.touchVelocityY = 0;

        this.init();
    }

    init() {
        // Initialize spring physics for each bubble
        this.bubbles.forEach(bubble => {
            const rect = bubble.getBoundingClientRect();
            const basePos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            this.bubblePositions.set(bubble, basePos);
            
            // Initialize spring state
            this.springs.set(bubble, {
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                target: { x: 0, y: 0 }
            });
        });

        this.createBackgroundBubbles();
        this.setupEventListeners();
        this.navigateToSection(0);
        this.animate();

        // Add performance monitoring
        this.fpsMonitoring();
    }

    fpsMonitoring() {
        let lastTime = performance.now();
        let frames = 0;
        const checkFPS = () => {
            frames++;
            const currentTime = performance.now();
            if (currentTime - lastTime > 1000) {
                const fps = Math.round((frames * 1000) / (currentTime - lastTime));
                if (fps < 30) {
                    this.optimizePerformance();
                }
                frames = 0;
                lastTime = currentTime;
            }
            requestAnimationFrame(checkFPS);
        };
        checkFPS();
    }

    optimizePerformance() {
        this.dampening = Math.min(this.dampening + 0.1, 0.95);
        this.tension = Math.max(this.tension - 0.02, 0.05);
        document.body.classList.add('high-performance');
    }

    createBackgroundBubbles() {
        const bg = document.querySelector('.dynamic-bg');
        if (!bg) return;

        // Clear existing bubbles
        this.bgBubbles.forEach(bubble => bubble.remove());
        this.bgBubbles = [];

        // Create new bubbles with varied sizes and positions
        for (let i = 0; i < 5; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bg-bubble';
            const size = Math.random() * 300 + 100;
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `${Math.random() * 100}%`;
            bubble.style.opacity = `${Math.random() * 0.1 + 0.05}`;
            bg.appendChild(bubble);
            this.bgBubbles.push(bubble);
        }
    }

    setupEventListeners() {
        // Enhanced mouse tracking with acceleration
        let mouseVelocityTracker = { x: 0, y: 0 };
        let lastMouseEvent = null;

        document.addEventListener('mousemove', (e) => {
            const currentTime = performance.now();
            this.lastMouse = { ...this.mouse };
            this.mouse = { x: e.clientX, y: e.clientY };

            if (lastMouseEvent) {
                const dt = (currentTime - lastMouseEvent.time) / 1000;
                mouseVelocityTracker = {
                    x: (this.mouse.x - this.lastMouse.x) / dt,
                    y: (this.mouse.y - this.lastMouse.y) / dt
                };
            }

            lastMouseEvent = {
                x: this.mouse.x,
                y: this.mouse.y,
                time: currentTime
            };

            // Update velocity with smoothing
            this.velocity = {
                x: this.velocity.x * 0.8 + mouseVelocityTracker.x * 0.2,
                y: this.velocity.y * 0.8 + mouseVelocityTracker.y * 0.2
            };
        });

        // Enhanced touch handling with inertia
        let touchVelocityTracker = { x: 0, y: 0 };
        let lastTouchEvent = null;

        const handleTouchStart = (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            touchVelocityTracker = { x: 0, y: 0 };
            lastTouchEvent = {
                x: this.touchStartX,
                y: this.lastTouchY,
                time: performance.now()
            };
            this.isScrolling = false;
        };

        const handleTouchMove = (e) => {
            if (!lastTouchEvent) return;

            const currentTime = performance.now();
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const dt = (currentTime - lastTouchEvent.time) / 1000;

            // Calculate velocities
            touchVelocityTracker = {
                x: (touchX - lastTouchEvent.x) / dt,
                y: (touchY - lastTouchEvent.y) / dt
            };

            // Determine if scrolling or swiping
            const diffX = Math.abs(touchX - this.touchStartX);
            const diffY = Math.abs(touchY - this.lastTouchY);

            if (!this.isScrolling && diffX > diffY && diffX > 10) {
                e.preventDefault();
                this.showTouchIndicator(touchX < this.touchStartX ? 'right' : 'left');
            } else {
                this.isScrolling = true;
            }

            lastTouchEvent = {
                x: touchX,
                y: touchY,
                time: currentTime
            };
        };

        const handleTouchEnd = (e) => {
            if (!lastTouchEvent) return;

            const currentTime = performance.now();
            const touchX = e.changedTouches[0].clientX;
            const dt = (currentTime - lastTouchEvent.time) / 1000;
            const velocity = Math.abs(touchVelocityTracker.x);

            this.hideTouchIndicators();

            if (!this.isScrolling && !this.isAnimating) {
                const diffX = this.touchStartX - touchX;
                const swipeThreshold = velocity > 1000 ? 30 : velocity > 500 ? 50 : 100;

                if (Math.abs(diffX) > swipeThreshold) {
                    if (diffX > 0 && this.currentSection < this.sections.length - 1) {
                        this.navigateToSection(this.currentSection + 1);
                    } else if (diffX < 0 && this.currentSection > 0) {
                        this.navigateToSection(this.currentSection - 1);
                    }
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        // Enhanced wheel navigation with momentum
        let wheelMomentum = 0;
        let wheelDirection = 0;
        let wheelTimeout;

        const handleWheel = (e) => {
            if (this.isAnimating) return;

            clearTimeout(wheelTimeout);
            
            // Add to momentum with direction
            const deltaX = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            wheelDirection = Math.sign(deltaX);
            wheelMomentum += Math.abs(deltaX);

            wheelTimeout = setTimeout(() => {
                if (wheelMomentum > 50) {
                    if (wheelDirection > 0 && this.currentSection < this.sections.length - 1) {
                        this.navigateToSection(this.currentSection + 1);
                    } else if (wheelDirection < 0 && this.currentSection > 0) {
                        this.navigateToSection(this.currentSection - 1);
                    }
                }
                wheelMomentum = 0;
            }, 100);
        };

        document.addEventListener('wheel', handleWheel, { passive: true });

        // Keyboard navigation with visual feedback
        document.addEventListener('keydown', (e) => {
            if (this.isAnimating) return;

            if (e.key === 'ArrowRight' && this.currentSection < this.sections.length - 1) {
                this.showTouchIndicator('right');
                this.navigateToSection(this.currentSection + 1);
            } else if (e.key === 'ArrowLeft' && this.currentSection > 0) {
                this.showTouchIndicator('left');
                this.navigateToSection(this.currentSection - 1);
            }
        });

        // Bubble interactions
        this.bubbles.forEach((bubble, index) => {
            bubble.addEventListener('click', () => {
                if (!this.isAnimating) {
                    this.navigateToSection(index);
                }
            });

            bubble.addEventListener('mouseenter', () => {
                bubble.classList.add('hover');
                this.updateSpringTarget(bubble, { x: 0, y: -10 });
            });

            bubble.addEventListener('mouseleave', () => {
                bubble.classList.remove('hover');
                this.updateSpringTarget(bubble, { x: 0, y: 0 });
            });
        });

        // Handle resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateBubblePositions();
                this.createBackgroundBubbles();
            }, 250);
        });
    }

    showTouchIndicator(direction) {
        const indicator = document.querySelector(`.touch-indicator.${direction}`);
        indicator?.classList.add('visible');
        setTimeout(() => indicator?.classList.remove('visible'), 300);
    }

    hideTouchIndicators() {
        document.querySelectorAll('.touch-indicator').forEach(indicator => {
            indicator.classList.remove('visible');
        });
    }

    updateSpringTarget(bubble, target) {
        const spring = this.springs.get(bubble);
        if (spring) {
            spring.target = target;
        }
    }

    updateBubblePositions() {
        this.bubbles.forEach(bubble => {
            const rect = bubble.getBoundingClientRect();
            this.bubblePositions.set(bubble, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            });
        });
    }

    navigateToSection(index) {
        if (this.isAnimating || index === this.currentSection) return;
        
        this.isAnimating = true;
        const direction = index > this.currentSection ? 1 : -1;
        
        document.body.classList.add('is-transitioning');
        
        // Prepare sections for transition
        this.sections.forEach((section, i) => {
            section.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';
            
            if (i === index) {
                section.className = 'section active';
                section.style.opacity = '0';
                requestAnimationFrame(() => {
                    section.style.opacity = '1';
                });
            } else if (i === this.currentSection) {
                section.className = `section ${direction > 0 ? 'prev' : 'next'}`;
            } else if (i < index) {
                section.className = 'section prev';
            } else {
                section.className = 'section next';
            }
        });

        // Animate bubbles
        this.bubbles.forEach((bubble, i) => {
            bubble.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            
            if (i === index) {
                bubble.setAttribute('aria-current', 'page');
                bubble.classList.add('active');
                this.updateSpringTarget(bubble, { x: 0, y: -15 });
            } else {
                bubble.removeAttribute('aria-current');
                bubble.classList.remove('active');
                this.updateSpringTarget(bubble, { x: 0, y: 0 });
            }
        });

        this.currentSection = index;

        // Clean up transitions
        setTimeout(() => {
            this.isAnimating = false;
            document.body.classList.remove('is-transitioning');
            
            this.sections.forEach(section => {
                section.style.transition = '';
            });
            
            this.bubbles.forEach(bubble => {
                bubble.style.transition = '';
            });
        }, 600);
    }

    animate() {
        // Update springs
        this.bubbles.forEach((bubble, index) => {
            const spring = this.springs.get(bubble);
            const basePos = this.bubblePositions.get(bubble);
            if (!spring || !basePos) return;

            // Spring physics
            const dx = this.mouse.x - basePos.x;
            const dy = this.mouse.y - basePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 300;

            // Calculate spring forces
            if (distance < maxDistance) {
                const force = (1 - distance / maxDistance) * 0.2;
                spring.target.x = dx * force + this.velocity.x * 0.3;
                spring.target.y = dy * force + this.velocity.y * 0.3;
            }

            // Update spring
            const ax = (spring.target.x - spring.position.x) * this.tension;
            const ay = (spring.target.y - spring.position.y) * this.tension;

            spring.velocity.x += ax;
            spring.velocity.y += ay;
            spring.velocity.x *= this.dampening;
            spring.velocity.y *= this.dampening;
            spring.position.x += spring.velocity.x;
            spring.position.y += spring.velocity.y;

            // Add floating animation
            const time = Date.now() * 0.001;
            const floatOffset = Math.sin(time + index) * 5;

            // Apply transform with spring position
            const transform = `translate(${spring.position.x}px, ${spring.position.y + floatOffset}px)`;
            bubble.style.transform = transform;
        });

        // Animate background bubbles
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        this.bgBubbles.forEach((bubble, index) => {
            const speed = 0.02 + (index * 0.01);
            const x = (this.mouse.x - centerX) * speed;
            const y = (this.mouse.y - centerY) * speed;
            
            // Add subtle rotation based on mouse movement
            const rotation = Math.atan2(this.velocity.y, this.velocity.x) * (180 / Math.PI) * 0.1;
            bubble.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DynamicNavigation();
}); 