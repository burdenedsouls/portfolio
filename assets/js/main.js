import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Main Application Class
class Y2KPortfolio {
    constructor() {
        // Wait for fonts before initialization
        this.waitForFonts();
    }

    async waitForFonts() {
        try {
            await document.fonts.ready;
            document.documentElement.classList.remove('fonts-not-loaded');
            document.documentElement.classList.add('fonts-loaded');
            console.log('Fonts loaded successfully');
            this.init();
        } catch (error) {
            console.error('Font loading error:', error);
            // Initialize anyway after a timeout
            setTimeout(() => this.init(), 1000);
        }
    }

    async init() {
        console.log('Initializing Y2K Portfolio');
        
        try {
            // Initialize components
            await this.handleLoading();
            
            // Initialize Three.js
            await this.initThreeJS();
            
            console.log('Initialization complete');
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleError(error);
        }
    }

    async initThreeJS() {
        console.log('Setting up Three.js');
        
        try {
            // Create orb menu container if it doesn't exist
            let container = document.getElementById('orb-menu');
            if (!container) {
                container = document.createElement('div');
                container.id = 'orb-menu';
                container.style.position = 'fixed';
                container.style.top = '0';
                container.style.left = '0';
                container.style.width = '100%';
                container.style.height = '100%';
                container.style.pointerEvents = 'none';
                container.style.zIndex = '1';
                document.body.appendChild(container);
            }

            // Scene setup
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            
            this.renderer = new THREE.WebGLRenderer({ 
                alpha: true, 
                antialias: true,
                powerPreference: "high-performance"
            });
            
            // Configure renderer
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            container.appendChild(this.renderer.domElement);

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            this.scene.add(ambientLight);

            // Add point light
            const pointLight = new THREE.PointLight(0x00ff41, 1, 100);
            pointLight.position.set(10, 10, 10);
            this.scene.add(pointLight);

            // Position camera
            this.camera.position.z = 8;
            this.camera.position.y = 2;
            this.camera.lookAt(0, 0, 0);

            // Setup camera animation
            this.targetCameraPos = this.camera.position.clone();
            this.targetLookAt = new THREE.Vector3(0, 0, 0);

            // Start animation loop
            this.animate();
            
            console.log('Three.js setup complete');
        } catch (error) {
            console.warn('Error initializing Three.js:', error);
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Update orb menu
        if (this.orbMenu) {
            this.orbMenu.update();
        }

        // Smooth camera movement
        this.camera.position.lerp(this.targetCameraPos, 0.05);
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        const targetDirection = this.targetLookAt.clone().sub(this.camera.position).normalize();
        const newDirection = currentLookAt.lerp(targetDirection, 0.05);
        this.camera.lookAt(this.camera.position.clone().add(newDirection));

        this.renderer.render(this.scene, this.camera);
    }

    // Matrix Rain Effect
    initMatrixRain() {
        const canvas = document.createElement('canvas');
        canvas.classList.add('matrix-bg');
        document.querySelector('.section-about').appendChild(canvas);

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops = Array(Math.floor(columns)).fill(1);

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#00ff41';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        setInterval(drawMatrix, 50);
    }

    // Terminal Effect
    initTerminalEffect() {
        const terminal = document.querySelector('.terminal-container');
        if (!terminal) return;

        const text = terminal.getAttribute('data-text') || 'Hello, World!';
        const speed = 50; // typing speed in milliseconds
        const cursor = document.createElement('span');
        cursor.classList.add('cursor');
        cursor.textContent = '█';
        
        // Create terminal header
        const header = document.createElement('div');
        header.classList.add('terminal-header');
        header.innerHTML = `
            <div class="terminal-buttons">
                <span class="terminal-button close"></span>
                <span class="terminal-button minimize"></span>
                <span class="terminal-button maximize"></span>
            </div>
            <div class="terminal-title">about.exe</div>
        `;
        terminal.insertBefore(header, terminal.firstChild);

        // Create terminal content
        const content = document.createElement('div');
        content.classList.add('terminal-content');
        terminal.appendChild(content);
        terminal.appendChild(cursor);

        let charIndex = 0;
        const commands = [
            'Loading personal data...',
            'Initializing about section...',
            '> SKILLS: JavaScript, Three.js, WebGL',
            '> INTERESTS: Creative Coding, 3D Graphics',
            '> STATUS: Available for projects',
            '> Type "help" for more information'
        ];

        function typeCommand(command, callback) {
            if (charIndex < command.length) {
                content.innerHTML += command.charAt(charIndex);
                charIndex++;
                setTimeout(() => typeCommand(command, callback), speed);
            } else {
                content.innerHTML += '<br>';
                charIndex = 0;
                if (callback) callback();
            }
        }

        function startTyping() {
            let currentCommand = 0;
            
            function typeNext() {
                if (currentCommand < commands.length) {
                    typeCommand(commands[currentCommand], () => {
                        currentCommand++;
                        setTimeout(typeNext, 500);
                    });
                }
            }
            
            typeNext();
        }

        // Start the terminal effect when section is in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startTyping();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(terminal);
    }

    // Loading Screen
    async handleLoading() {
        const loadingScreen = document.querySelector('.loading-screen');
        const progress = document.querySelector('.loading-progress');
        
        // Simulate loading progress
        let loadProgress = 0;
        const interval = setInterval(() => {
            loadProgress += Math.random() * 15;
            if (loadProgress > 100) {
                loadProgress = 100;
                clearInterval(interval);
                
                // Hide loading screen
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            progress.style.width = `${loadProgress}%`;
        }, 200);
    }

    // Event Listeners
    setupEventListeners() {
        // Device detection
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Adjust for mobile
        if (this.isMobile) {
            this.adjustForMobile();
        }

        // Resize handler with debounce
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Touch events for orb menu
        const orbMenu = document.getElementById('orb-menu');
        if (orbMenu) {
            orbMenu.addEventListener('touchstart', (e) => this.handleTouch(e), { passive: false });
            orbMenu.addEventListener('touchmove', (e) => this.handleTouch(e), { passive: false });
            orbMenu.addEventListener('touchend', () => this.handleTouchEnd());
        }

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleResize(), 100);
        });

        // Performance monitoring
        if (window.performance) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.value > 100) {
                        this.optimizePerformance();
                    }
                }
            });
            
            observer.observe({ entryTypes: ['measure'] });
        }

        // Smooth scroll
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Scroll handler
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });

        // Intersection Observer for sections
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const section = entry.target;
                    this.animateSection(section);
                }
            });
        }, { threshold: 0.3 });

        // Observe all sections
        document.querySelectorAll('section').forEach(section => {
            observer.observe(section);
        });
    }

    adjustForMobile() {
        // Immediately inject critical mobile styles
        const criticalStyles = document.createElement('style');
        criticalStyles.id = 'critical-mobile-styles';
        criticalStyles.textContent = `
            /* Force dark background and proper height */
            :root {
                background-color: #000000 !important;
                background-color: var(--bg-color, #000000) !important;
                color-scheme: dark !important;
            }
            
            html {
                background-color: #000000 !important;
                background-color: var(--bg-color, #000000) !important;
                height: 100% !important;
                overflow: auto !important;
            }
            
            body {
                background-color: #000000 !important;
                background-color: var(--bg-color, #000000) !important;
                min-height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                position: relative !important;
                overflow-x: hidden !important;
            }

            /* Fix chat positioning */
            .taskbar-chat-toggle {
                position: fixed !important;
                bottom: calc(env(safe-area-inset-bottom) + 85px) !important;
                right: 20px !important;
                z-index: 100000 !important;
                transform: translateZ(0) !important;
                -webkit-transform: translateZ(0) !important;
            }

            /* Ensure content stays above mobile browser UI */
            .content-wrapper {
                padding-bottom: calc(env(safe-area-inset-bottom) + 70px) !important;
                min-height: 100% !important;
                background-color: #000000 !important;
                background-color: var(--bg-color, #000000) !important;
            }

            /* iOS specific fixes */
            @supports (-webkit-touch-callout: none) {
                html, body {
                    height: -webkit-fill-available !important;
                    overflow: auto !important;
                    position: fixed !important;
                    width: 100% !important;
                    top: 0 !important;
                    left: 0 !important;
                }

                .taskbar-chat-toggle {
                    bottom: calc(env(safe-area-inset-bottom) + 100px) !important;
                }

                #app {
                    min-height: -webkit-fill-available !important;
                }
            }
        `;
        document.head.insertBefore(criticalStyles, document.head.firstChild);

        // Force immediate background color
        document.documentElement.style.backgroundColor = '#000000';
        document.body.style.backgroundColor = '#000000';

        // Add viewport meta for iOS
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
            viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            document.head.appendChild(viewportMeta);
        }
        viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, minimal-ui, user-scalable=no';

        // Add theme color meta
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
            themeColorMeta = document.createElement('meta');
            themeColorMeta.name = 'theme-color';
            document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.content = '#000000';

        // Add iOS specific meta tags
        const metas = {
            'apple-mobile-web-app-capable': 'yes',
            'apple-mobile-web-app-status-bar-style': 'black-translucent'
        };

        Object.entries(metas).forEach(([name, content]) => {
            let meta = document.querySelector(`meta[name="${name}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.name = name;
                document.head.appendChild(meta);
            }
            meta.content = content;
        });

        // Ensure proper viewport height
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--safe-area-inset-bottom', 
                getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)'));
        };

        // Call immediately and on events
        setViewportHeight();
        ['resize', 'orientationchange', 'visibilitychange'].forEach(event => {
            window.addEventListener(event, () => {
                setTimeout(setViewportHeight, 100);
            });
        });
    }

    handleResize() {
        // Update viewport dimensions
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Update Three.js
        if (this.camera && this.renderer) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }

        // Update matrix rain
        const canvas = document.querySelector('.matrix-bg');
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
            if (this.isMobile) {
                canvas.style.opacity = '0.3';
            }
        }

        // Adjust terminal size
        const terminal = document.querySelector('.terminal-container');
        if (terminal && width <= 480) {
            terminal.style.height = 'auto';
            terminal.style.maxHeight = '70vh';
        }
    }

    handleTouch(e) {
        if (!this.renderer || !this.camera) return;

        // Prevent default only if touching orb menu
        if (e.target.closest('#orb-menu')) {
            e.preventDefault();
        }

        // Convert touch to mouse position
        const touch = e.touches[0];
        const rect = this.renderer.domElement.getBoundingClientRect();
        
        this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for intersections
        if (this.orbMenu) {
            this.orbMenu.checkIntersection();
        }
    }

    handleTouchEnd() {
        // Reset hover states
        if (this.orbMenu) {
            this.orbMenu.activeItem = null;
            document.body.style.cursor = 'default';
        }
    }

    optimizePerformance() {
        // Reduce particle count
        if (this.particles && this.particles.geometry) {
            const currentCount = this.particles.geometry.attributes.position.count;
            if (currentCount > 50) {
                // Reduce particle count by 20%
                const newCount = Math.floor(currentCount * 0.8);
                this.updateParticleCount(newCount);
            }
        }

        // Reduce animation complexity
        if (this.isMobile) {
            document.body.classList.add('reduced-motion');
        }

        // Adjust render quality
        if (this.renderer) {
            this.renderer.setPixelRatio(1);
        }
    }

    handleScroll() {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        
        // Update camera position based on scroll with easing
        const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const easedScroll = ease(scrollPercent);
        
        // Camera movement
        this.targetCameraPos.y = 2 - easedScroll * 4;
        this.targetCameraPos.z = 8 - easedScroll * 2;
        this.targetCameraPos.x = Math.sin(easedScroll * Math.PI * 2) * 2;
        
        // Update target look at point with parallax effect
        this.targetLookAt.y = -easedScroll * 2;
        this.targetLookAt.x = Math.sin(easedScroll * Math.PI) * 1.5;

        // Update section parallax effects
        this.updateParallax();
        
        // Update active section in navigation
        this.updateActiveSection();
    }

    updateParallax() {
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            // Calculate how far the section is from the center of the viewport
            const distanceFromCenter = (rect.top + rect.height / 2) - (viewportHeight / 2);
            const parallaxAmount = (distanceFromCenter / viewportHeight) * 30;

            // Apply different parallax effects based on section type
            if (section.id === 'home') {
                const title = section.querySelector('h1');
                const subtitle = section.querySelector('p');
                if (title && subtitle) {
                    title.style.transform = `translateY(${parallaxAmount * 0.5}px)`;
                    subtitle.style.transform = `translateY(${parallaxAmount * 0.3}px)`;
                }
            } else if (section.id === 'projects') {
                const cards = section.querySelectorAll('.project-card');
                cards.forEach((card, index) => {
                    const offset = (index % 2 === 0 ? 1 : -1) * parallaxAmount * 0.2;
                    card.style.transform = `translateY(${offset}px)`;
                });
            }
        });
    }

    updateActiveSection() {
        const sections = document.querySelectorAll('section');
        let activeSection = null;
        let maxVisibility = 0;

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const visibility = this.calculateVisibility(rect);
            
            if (visibility > maxVisibility) {
                maxVisibility = visibility;
                activeSection = section;
            }
        });

        if (activeSection) {
            // Update navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href') === `#${activeSection.id}`) {
                    item.classList.add('active');
                }
            });

            // Update orb menu
            if (this.orbMenu) {
                this.orbMenu.highlightSection(activeSection.id);
            }
        }
    }

    calculateVisibility(rect) {
        const windowHeight = window.innerHeight;
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        return Math.max(0, visibleHeight / Math.min(windowHeight, rect.height));
    }

    animateSection(section) {
        if (!section || section.classList.contains('animated')) return;

        // Add class to prevent re-animation
        section.classList.add('animated');

        // Common animation delay calculator
        const getDelay = (index, base = 100) => index * base;

        switch(section.id) {
            case 'home':
                const title = section.querySelector('h1');
                const subtitle = section.querySelector('p');
                const cta = section.querySelector('.cta-button');

                if (title) {
                    title.classList.add('animate-glitch');
                    title.style.animationDelay = '0.2s';
                }
                if (subtitle) {
                    subtitle.classList.add('animate-fade-in');
                    subtitle.style.animationDelay = '0.8s';
                }
                if (cta) {
                    cta.classList.add('animate-scale-in');
                    cta.style.animationDelay = '1.2s';
                }
                break;

            case 'projects':
                const cards = Array.from(section.querySelectorAll('.project-card'));
                cards.forEach((card, index) => {
                    // Stagger card animations
                    card.style.animationDelay = `${getDelay(index, 200)}ms`;
                    card.classList.add('animate-slide-in');

                    // Animate card contents
                    const title = card.querySelector('.project-title');
                    const tags = card.querySelectorAll('.tag');
                    const description = card.querySelector('.project-description');
                    const links = card.querySelector('.project-links');

                    if (title) {
                        title.style.animationDelay = `${getDelay(index, 200) + 200}ms`;
                        title.classList.add('animate-glitch');
                    }

                    tags.forEach((tag, tagIndex) => {
                        tag.style.animationDelay = `${getDelay(index, 200) + getDelay(tagIndex, 100) + 400}ms`;
                        tag.classList.add('animate-scale-in');
                    });

                    if (description) {
                        description.style.animationDelay = `${getDelay(index, 200) + 600}ms`;
                        description.classList.add('animate-fade-in');
                    }

                    if (links) {
                        links.style.animationDelay = `${getDelay(index, 200) + 800}ms`;
                        links.classList.add('animate-fade-in');
                    }
                });
                break;

            case 'about':
                const terminal = section.querySelector('.terminal-container');
                const matrix = section.querySelector('.matrix-bg');

                if (terminal) {
                    terminal.classList.add('animate-scale-in');
                    // Terminal content animation is handled by the terminal effect
                }

                if (matrix) {
                    matrix.style.opacity = '0';
                    setTimeout(() => {
                        matrix.style.transition = 'opacity 1s ease';
                        matrix.style.opacity = '1';
                    }, 500);
                }
                break;
        }

        // Add glitch transition effect
        const glitchOverlay = document.createElement('div');
        glitchOverlay.classList.add('glitch-overlay');
        section.appendChild(glitchOverlay);
        
        setTimeout(() => {
            glitchOverlay.remove();
        }, 1000);
    }

    handleError(error) {
        console.error('Application error:', error);
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Error loading application. Please refresh.';
            loadingText.style.color = '#ff0000';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating Y2K Portfolio instance');
    window.y2kPortfolio = new Y2KPortfolio();
});

// Navigation System
class Navigation {
    constructor() {
        this.orbs = document.querySelectorAll('.nav-orb');
        this.sections = document.querySelectorAll('.section');
        this.init();
    }

    init() {
        this.orbs.forEach(orb => {
            orb.addEventListener('click', () => this.handleNavigation(orb));
        });
    }

    handleNavigation(clickedOrb) {
        // Remove active class from all orbs and sections
        this.orbs.forEach(orb => orb.classList.remove('active'));
        this.sections.forEach(section => section.classList.remove('active'));

        // Add active class to clicked orb and corresponding section
        clickedOrb.classList.add('active');
        const targetSection = document.querySelector(`.${clickedOrb.classList[1]}-section`);
        if (targetSection) targetSection.classList.add('active');
    }
}

// Loading System
class LoadingSystem {
    constructor() {
        this.loadingScreen = document.querySelector('.loading-screen');
        this.init();
    }

    init() {
        // Simulate loading process
        setTimeout(() => {
            this.updateLoadingStatus('Checking System Requirements...');
        }, 1000);

        setTimeout(() => {
            this.updateLoadingStatus('Initializing Interface Components...');
        }, 2000);

        setTimeout(() => {
            this.updateLoadingStatus('Loading Complete');
        }, 3000);

        setTimeout(() => {
            this.hideLoadingScreen();
        }, 3500);
    }

    updateLoadingStatus(status) {
        const statusElement = document.querySelector('.loading-status');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            this.loadingScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
                // Add loading-complete class to body to show chat button
                document.body.classList.add('loading-complete');
            }, 500);
        }
    }
}

// Initialize systems
document.addEventListener('DOMContentLoaded', () => {
    const loadingSystem = new LoadingSystem();
    const navigation = new Navigation();
    // RetroChat is already initialized globally
    
    // Handle system entry button
    const systemButton = document.querySelector('.system-button');
    if (systemButton) {
        systemButton.addEventListener('click', () => {
            // Add your system entry logic here
            console.log('Entering system...');
        });
    }
});

class RetroChat {
    constructor() {
        // Core state
        this.state = {
            isMinimized: true,
            isMaximized: false,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            messages: [],
            lastMessageTime: 0,
            messageCount: 0,
            connected: false
        };

        // Configuration
        this.config = {
            maxMessages: 100,
            maxLength: 25,
            minInterval: 1000,
            maxRepeatedChars: 3,
            defaultEmoji: '👾',
            spamWindow: 10000,
            maxMessagesInWindow: 5,
            mobileBreakpoint: 768,
            wsUrl: `ws://${window.location.hostname}:3000`
        };

        // Initialize elements
        this.elements = {
            window: document.querySelector('.chat-window'),
            messages: document.querySelector('.chat-messages'),
            input: document.querySelector('.message-input'),
            emojiPicker: document.querySelector('.emoji-picker'),
            sendButton: document.querySelector('.send-button'),
            taskbarButton: document.querySelector('.taskbar-chat-toggle'),
            inputArea: document.querySelector('.chat-input'),
            status: document.querySelector('.chat-status')
        };

        // Validate required elements
        if (!this.validateElements()) {
            console.error('Required chat elements not found');
            return;
        }

        // Initialize
        this.initializeChat()
            .then(() => {
                console.log('Chat initialized successfully');
                this.connectWebSocket();
            })
            .catch(error => console.error('Chat initialization failed:', error));
    }

    async connectWebSocket() {
        try {
            // Determine if we're on GitHub Pages or local development
            const isProduction = window.location.hostname.includes('github.io');
            
            // Use secure WebSocket in production, fallback to local in development
            const protocol = isProduction ? 'wss://' : 'ws://';
            const host = isProduction ? 'wss://your-websocket-service.com' : 'localhost:3000';
            
            this.ws = new WebSocket(`${protocol}${host}`);
            
            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.updateStatus('Connected');
                this.isConnected = true;
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.updateStatus('Disconnected');
                this.isConnected = false;
                
                // Attempt to reconnect in development only
                if (!isProduction) {
                    setTimeout(() => this.connectWebSocket(), 3000);
                }
            };
            
            this.ws.onerror = (error) => {
                console.log('WebSocket error:', error);
                this.updateStatus('Error connecting');
                this.isConnected = false;
                
                if (isProduction) {
                    // In production, fallback to static mode
                    this.initializeStaticMode();
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat') {
                        this.renderMessage(data);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            };
        } catch (error) {
            console.error('Chat initialization failed:', error);
            // Fallback to static mode
            this.initializeStaticMode();
        }
    }

    initializeStaticMode() {
        // Initialize chat in static mode (no real-time functionality)
        console.log('Initializing chat in static mode');
        this.updateStatus('Static Mode');
        
        // Add some default messages
        this.addDefaultMessages();
        
        // Override send functionality for static mode
        this.sendMessage = async (text, emoji) => {
            const message = {
                id: Date.now(),
                text,
                emoji,
                timestamp: new Date().toISOString(),
                isStatic: true
            };
            this.renderMessage(message);
            return true;
        };
    }

    addDefaultMessages() {
        const defaultMessages = [
            { text: "Welcome to the Y2K Chat Experience!", emoji: "👾", timestamp: new Date().toISOString() },
            { text: "This is running in static mode", emoji: "💫", timestamp: new Date().toISOString() },
            { text: "Try sending a message!", emoji: "🚀", timestamp: new Date().toISOString() }
        ];
        
        defaultMessages.forEach(msg => this.renderMessage(msg));
    }

    updateStatus(status) {
        if (this.elements.status) {
            this.elements.status.className = `chat-status status-${status}`;
            this.elements.status.textContent = status;
        }
    }

    async sendMessage(text, emoji) {
        if (!this.state.connected) {
            console.log('Not connected to server');
            return;
        }

        const message = {
            type: 'chat',
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: text.slice(0, this.config.maxLength),
            emoji: emoji || this.config.defaultEmoji,
            timestamp: Date.now()
        };

        try {
            this.ws.send(JSON.stringify(message));
        } catch (error) {
            console.error('Error sending message:', error);
            this.updateStatus('error');
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.dataset.messageId = message.id;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-emoji">${message.emoji}</span>
                <span class="message-text">${message.text}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    validateElements() {
        return Object.entries(this.elements).every(([key, element]) => {
            if (!element) {
                console.error(`Missing required element: ${key}`);
                return false;
            }
            return true;
        });
    }

    async initializeChat() {
        try {
            // Set initial state
            this.state.isMinimized = true;
            this.elements.window.style.display = 'none';
            this.elements.window.classList.remove('visible');
            this.elements.taskbarButton.classList.remove('active');

            // Initialize mobile if needed
            if (this.state.isMobile) {
                await this.initializeMobile();
            }

            // Load saved messages
            await this.loadMessages();

            // Set up event listeners
            this.setupEventListeners();

            // Set up viewport handling for mobile
            this.setupViewportHandling();

            console.log('Chat initialization complete');
        } catch (error) {
            console.error('Error during chat initialization:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Message sending
        const sendMessage = () => {
            const text = this.elements.input.value.trim();
            const emoji = this.elements.emojiPicker.value || this.config.defaultEmoji;
            
            if (text && this.canSendMessage(text)) {
                this.sendMessage(text, emoji);
                this.elements.input.value = '';
                if (this.state.isMobile) {
                    this.elements.input.blur();
                }
            }
        };

        // Input events
        this.elements.input.maxLength = this.config.maxLength;
        this.elements.input.setAttribute('placeholder', `Type... (${this.config.maxLength} chars max)`);
        
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Send button
        this.elements.sendButton.addEventListener(this.state.isMobile ? 'touchstart' : 'click', (e) => {
            e.preventDefault();
            sendMessage();
        });

        // Window controls
        this.elements.taskbarButton.addEventListener(this.state.isMobile ? 'touchstart' : 'click', (e) => {
            e.preventDefault();
            this.toggleWindow();
        });

        // Window buttons
        const controls = {
            minimize: document.querySelector('.minimize-button'),
            maximize: document.querySelector('.maximize-button'),
            close: document.querySelector('.close-button')
        };

        if (this.state.isMobile && controls.maximize) {
            controls.maximize.style.display = 'none';
        }

        Object.entries(controls).forEach(([action, button]) => {
            if (button) {
                button.addEventListener(this.state.isMobile ? 'touchstart' : 'click', (e) => {
                    e.preventDefault();
                    this[`${action}Window`]();
                });
            }
        });
    }

    setupViewportHandling() {
        if (!this.state.isMobile) return;

        // Initial setup of safe area insets
        const computeSafeAreas = () => {
            const style = document.documentElement.style;
            style.setProperty('--sat', 'env(safe-area-inset-top)');
            style.setProperty('--sab', 'env(safe-area-inset-bottom)');
        };

        // Update layout on various events
        const events = ['resize', 'orientationchange', 'visualviewportresize'];
        events.forEach(event => {
            window.addEventListener(event, () => {
                computeSafeAreas();
                setTimeout(() => this.adjustMobileLayout(), 100);
            });
        });

        // Handle keyboard events
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                this.adjustMobileLayout();
            });
        }

        // Initial setup
        computeSafeAreas();
        this.adjustMobileLayout();
    }

    async initializeMobile() {
        let touchStartY = 0;
        let currentTranslateY = 0;
        let isSwiping = false;
        let startTime = 0;
        
        const handleTouchStart = (e) => {
            if (!this.elements.window.classList.contains('visible')) return;
            
            const touch = e.touches[0];
            touchStartY = touch.clientY;
            currentTranslateY = 0;
            startTime = Date.now();
            
            // Allow swiping in header area or swipe area
            const touchTarget = e.target;
            if (touchTarget.closest('.chat-header') || touchTarget.closest('.swipe-area')) {
                isSwiping = true;
                this.elements.window.style.transition = 'none';
            }
        };

        const handleTouchMove = (e) => {
            if (!isSwiping) return;
            
            const touch = e.touches[0];
            const deltaY = Math.max(0, touch.clientY - touchStartY); // Only allow downward swipe
            currentTranslateY = deltaY;
            
            // Apply resistance to the swipe as it goes further down
            const resistance = 0.5;
            const resistedDelta = deltaY * (1 - Math.min(deltaY / window.innerHeight, 1) * resistance);
            
            requestAnimationFrame(() => {
                this.elements.window.style.transform = `translateY(${resistedDelta}px)`;
            });
            
            e.preventDefault();
        };

        const handleTouchEnd = () => {
            if (!isSwiping) return;
            
            isSwiping = false;
            const swipeDuration = Date.now() - startTime;
            const velocity = currentTranslateY / swipeDuration; // pixels per ms
            
            this.elements.window.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            
            // Close if swiped down more than 100px OR if swipe velocity is high enough
            if (currentTranslateY > 100 || velocity > 0.5) {
                this.minimizeWindow();
            } else {
                // Snap back
                requestAnimationFrame(() => {
                    this.elements.window.style.transform = '';
                });
            }
            
            // Reset
            currentTranslateY = 0;
            startTime = 0;
        };

        // Clean up old listeners
        this.elements.window.removeEventListener('touchstart', handleTouchStart);
        this.elements.window.removeEventListener('touchmove', handleTouchMove);
        this.elements.window.removeEventListener('touchend', handleTouchEnd);
        
        // Add new listeners
        this.elements.window.addEventListener('touchstart', handleTouchStart, { passive: true });
        this.elements.window.addEventListener('touchmove', handleTouchMove, { passive: false });
        this.elements.window.addEventListener('touchend', handleTouchEnd);

        // Add close button handler
        const closeButton = this.elements.window.querySelector('.close-bubble');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.minimizeWindow();
            });
        }
    }

    adjustMobileLayout() {
        if (!this.state.isMobile) return;

        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const isKeyboardVisible = window.innerHeight > viewportHeight;
        
        // Get safe area insets
        const safeAreaTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        
        if (this.elements.messages) {
            const headerHeight = 50 + safeAreaTop;
            const inputHeight = 60 + safeAreaBottom;
            const keyboardHeight = isKeyboardVisible ? window.innerHeight - viewportHeight : 0;
            const toolbarHeight = 50; // Height of mobile browser toolbar
            
            this.elements.messages.style.height = `calc(100% - ${headerHeight + inputHeight + toolbarHeight}px)`;
            this.elements.messages.style.paddingTop = `${headerHeight}px`;
            this.elements.messages.style.paddingBottom = `${inputHeight + keyboardHeight + toolbarHeight}px`;
            
            if (!this.elements.messages.style.scrollBehavior) {
                this.elements.messages.style.scrollBehavior = 'smooth';
            }
            
            setTimeout(() => {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }, 100);
        }

        if (this.elements.inputArea) {
            const bottom = isKeyboardVisible 
                ? `${keyboardHeight}px` 
                : `calc(${safeAreaBottom}px + 50px)`; // Add extra space for mobile toolbar
            this.elements.inputArea.style.bottom = bottom;
        }

        // Update CSS variables for viewport height
        document.documentElement.style.setProperty('--vh', `${viewportHeight * 0.01}px`);
    }

    canSendMessage(text) {
        const now = Date.now();
        
        // Rate limiting
        if (now - this.state.lastMessageTime < this.config.minInterval) {
            console.log('Message rate limited');
            return false;
        }

        // Basic spam check
        if (this.hasRepeatedCharacters(text) || this.isSpam()) {
            console.log('Message flagged as spam');
            return false;
        }

        return true;
    }

    hasRepeatedCharacters(text) {
        let lastChar = '';
        let repeatCount = 0;
        
        for (const char of text) {
            if (char === lastChar) {
                repeatCount++;
                if (repeatCount >= this.config.maxRepeatedChars) return true;
            } else {
                repeatCount = 0;
            }
            lastChar = char;
        }
        
        return false;
    }

    isSpam() {
        const now = Date.now();
        this.state.messages = this.state.messages.filter(msg => 
            now - msg.timestamp < this.config.spamWindow
        );
        
        return this.state.messages.length >= this.config.maxMessagesInWindow;
    }

    async loadMessages() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const messages = JSON.parse(saved);
                if (Array.isArray(messages)) {
                    // Sort messages by timestamp
                    messages.sort((a, b) => a.timestamp - b.timestamp);
                    
                    // Keep only the last maxMessages
                    this.state.messages = messages.slice(-this.config.maxMessages);
                    
                    // Clear and render all messages
                    this.elements.messages.innerHTML = '';
                    this.state.messages.forEach(msg => this.renderMessage(msg));
                    
                    // Update last message time
                    if (this.state.messages.length > 0) {
                        this.state.lastMessageTime = this.state.messages[this.state.messages.length - 1].timestamp;
                    }

                    // Scroll to bottom
                    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
                }
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    toggleWindow() {
        if (this.state.isMinimized) {
            // Opening
            this.state.isMinimized = false;
            this.elements.window.style.display = 'flex';
            this.elements.window.style.transform = 'translateY(100%)';
            
            // Force reflow
            void this.elements.window.offsetWidth;
            
            // Add visible class
            this.elements.window.classList.add('visible');
            this.elements.taskbarButton.classList.add('active');
            
            // Reset any lingering transforms
            setTimeout(() => {
                this.elements.window.style.transform = '';
            }, 50);
            
            // Scroll to bottom
            if (this.elements.messages) {
                this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            }
        } else {
            this.minimizeWindow();
        }
    }

    minimizeWindow() {
        // Add closing class first
        this.elements.window.classList.add('closing');
        this.elements.window.classList.remove('visible');
        this.elements.taskbarButton.classList.remove('active');
        
        // Wait for animation to complete
        const handleTransitionEnd = () => {
            // Only proceed if the closing class is still present (animation wasn't interrupted)
            if (this.elements.window.classList.contains('closing')) {
                this.state.isMinimized = true;
                this.elements.window.style.display = 'none';
                this.elements.window.classList.remove('closing');
                this.elements.window.style.transform = '';
            }
        };
        
        this.elements.window.addEventListener('transitionend', handleTransitionEnd, { once: true });
    }

    maximizeWindow() {
        this.state.isMaximized = !this.state.isMaximized;
        
        if (this.state.isMaximized) {
            if (this.state.isMobile) {
                Object.assign(this.elements.window.style, {
                    width: '100%',
                    height: '100%',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    transform: 'none'
                });
            } else {
                Object.assign(this.elements.window.style, {
                    width: '90%',
                    height: '90vh',
                    top: '5vh',
                    left: '5%',
                    transform: 'none'
                });
            }
        } else if (!this.state.isMobile) {
            Object.assign(this.elements.window.style, {
                width: '350px',
                height: '500px',
                bottom: '60px',
                right: '20px',
                top: 'auto',
                left: 'auto',
                transform: 'none'
            });
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing RetroChat...');
    window.retroChat = new RetroChat();
}); 