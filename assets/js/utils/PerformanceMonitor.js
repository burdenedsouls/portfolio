export class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        this.fps = 60;
        this.frameTime = 0;
        this.frames = 0;
        this.lastTime = performance.now();
        this.fpsUpdateInterval = 1000; // Update FPS every second
        this.lastFpsUpdate = 0;
        this.isLowPerformance = false;
        this.optimizationLevels = ['high', 'medium', 'low'];
        this.currentOptimizationLevel = 'high';

        // Performance thresholds
        this.thresholds = {
            fps: {
                low: 30,
                medium: 45
            },
            frameTime: {
                high: 16, // ~60fps
                medium: 33 // ~30fps
            }
        };

        this.setupPerformanceObserver();
    }

    setupPerformanceObserver() {
        if (window.PerformanceObserver) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'measure' && entry.duration > 100) {
                        this.handlePerformanceIssue('longTask', entry.duration);
                    }
                }
            });

            observer.observe({ entryTypes: ['measure', 'longtask'] });
        }
    }

    update() {
        const currentTime = performance.now();
        this.frames++;

        // Update FPS counter
        if (currentTime > this.lastFpsUpdate + this.fpsUpdateInterval) {
            this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastFpsUpdate));
            this.lastFpsUpdate = currentTime;
            this.frames = 0;

            // Check performance level
            this.checkPerformance();
        }

        // Calculate frame time
        this.frameTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Monitor for frame drops
        if (this.frameTime > 50) { // More than 20fps
            this.handlePerformanceIssue('frameDrop', this.frameTime);
        }
    }

    checkPerformance() {
        let newLevel = 'high';

        if (this.fps < this.thresholds.fps.low || this.frameTime > this.thresholds.frameTime.medium) {
            newLevel = 'low';
        } else if (this.fps < this.thresholds.fps.medium || this.frameTime > this.thresholds.frameTime.high) {
            newLevel = 'medium';
        }

        if (newLevel !== this.currentOptimizationLevel) {
            this.currentOptimizationLevel = newLevel;
            this.applyOptimizations(newLevel);
        }
    }

    handlePerformanceIssue(type, value) {
        console.warn(`Performance issue detected: ${type}, value: ${value}`);
        
        switch (type) {
            case 'frameDrop':
                this.optimizeRendering();
                break;
            case 'longTask':
                this.optimizeProcessing();
                break;
            case 'memoryHigh':
                this.cleanupResources();
                break;
        }
    }

    optimizeRendering() {
        const renderer = this.app.renderer;
        if (!renderer) return;

        switch (this.currentOptimizationLevel) {
            case 'low':
                renderer.setPixelRatio(1);
                renderer.setSize(
                    window.innerWidth * 0.75,
                    window.innerHeight * 0.75,
                    false
                );
                break;
            case 'medium':
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
                renderer.setSize(
                    window.innerWidth * 0.85,
                    window.innerHeight * 0.85,
                    false
                );
                break;
            case 'high':
                renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                renderer.setSize(
                    window.innerWidth,
                    window.innerHeight,
                    false
                );
                break;
        }
    }

    optimizeProcessing() {
        // Reduce particle count
        if (this.app.particles) {
            const currentCount = this.app.particles.geometry.attributes.position.count;
            const reductionFactor = {
                low: 0.5,
                medium: 0.7,
                high: 1
            }[this.currentOptimizationLevel];

            this.app.updateParticleCount(Math.floor(currentCount * reductionFactor));
        }

        // Adjust animation complexity
        document.body.classList.remove('high-quality', 'medium-quality', 'low-quality');
        document.body.classList.add(`${this.currentOptimizationLevel}-quality`);
    }

    cleanupResources() {
        // Dispose unused textures
        if (this.app.textureManager) {
            this.app.textureManager.cleanup();
        }

        // Clear any cached data
        if (this.app.cache) {
            this.app.cache.clear();
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    applyOptimizations(level) {
        console.log(`Applying ${level} performance optimizations`);
        
        this.optimizeRendering();
        this.optimizeProcessing();

        // Emit event for other components to optimize
        const event = new CustomEvent('performanceOptimization', {
            detail: { level }
        });
        window.dispatchEvent(event);
    }

    getPerformanceMetrics() {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            optimizationLevel: this.currentOptimizationLevel,
            isLowPerformance: this.isLowPerformance
        };
    }
} 