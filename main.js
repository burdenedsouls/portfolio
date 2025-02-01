import { PerformanceMonitor } from './utils/PerformanceMonitor.js';
import { TextureManager } from './three/TextureManager.js';
import { AeroGlassShader } from './shaders/AeroGlass.js';

class App {
    constructor() {
        this.performanceMonitor = new PerformanceMonitor(this);
        this.textureManager = new TextureManager();
        this.textures = {};
        this.isInitialized = false;
        this.clock = new THREE.Clock();
    }

    async init() {
        try {
            // Load textures
            await this.loadTextures();
            
            // Initialize scene
            this.initScene();
            
            // Initialize post-processing
            this.initPostProcessing();
            
            // Start animation loop
            this.animate();
            
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize:', error);
        }
    }

    async loadTextures() {
        try {
            const texturePromises = [
                this.textureManager.loadTexture('noise', 'assets/textures/noise.png'),
                this.textureManager.loadTexture('grid', 'assets/textures/grid.png'),
                this.textureManager.loadTexture('scanline', 'assets/textures/scanline.png')
            ];

            const loadedTextures = await Promise.all(texturePromises);
            ['noise', 'grid', 'scanline'].forEach((name, index) => {
                this.textures[name] = loadedTextures[index];
            });

            console.log('Textures loaded successfully');
        } catch (error) {
            console.warn('Using fallback textures:', error);
        }
    }

    initScene() {
        // Initialize Three.js scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        // Apply textures to materials
        this.initMaterials();
        
        // Setup scene
        this.setupScene();
    }

    initPostProcessing() {
        this.composer = new THREE.EffectComposer(this.renderer);
        
        // Add render pass
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);
        
        // Add aero glass effect
        const aeroPass = new THREE.ShaderPass(AeroGlassShader);
        aeroPass.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        this.composer.addPass(aeroPass);
        
        // Store reference for animation
        this.aeroPass = aeroPass;
    }

    initMaterials() {
        // Create materials using loaded textures
        this.materials = {
            glass: new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uNoiseTexture: { value: this.textures.noise },
                    uGridTexture: { value: this.textures.grid },
                    uColor: { value: new THREE.Color(0x00b4ff) }
                },
                vertexShader: `
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    
                    void main() {
                        vUv = uv;
                        vNormal = normal;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform sampler2D uNoiseTexture;
                    uniform sampler2D uGridTexture;
                    uniform vec3 uColor;
                    
                    varying vec2 vUv;
                    varying vec3 vNormal;
                    
                    void main() {
                        vec2 uv = vUv;
                        
                        // Sample noise texture
                        vec4 noise = texture2D(uNoiseTexture, uv + uTime * 0.1);
                        
                        // Sample grid texture
                        vec4 grid = texture2D(uGridTexture, uv * 2.0);
                        
                        // Create fresnel effect
                        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                        
                        // Mix everything together
                        vec3 color = mix(uColor, vec3(1.0), fresnel * 0.5);
                        color = mix(color, grid.rgb, grid.a * 0.3);
                        color += noise.rgb * 0.1;
                        
                        gl_FragColor = vec4(color, 0.8);
                    }
                `,
                transparent: true
            })
        };
    }

    setupScene() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.body.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 5;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add point light
        const pointLight = new THREE.PointLight(0x00b4ff, 1, 100);
        pointLight.position.set(5, 5, 5);
        this.scene.add(pointLight);

        // Add event listeners
        window.addEventListener('resize', () => this.onWindowResize());
    }

    animate() {
        const time = this.clock.getElapsedTime();
        
        // Update performance monitor
        this.performanceMonitor.update();
        
        // Update uniforms
        if (this.materials.glass) {
            this.materials.glass.uniforms.uTime.value = time;
        }
        
        if (this.aeroPass) {
            this.aeroPass.uniforms.uTime.value = time;
        }
        
        // Render scene
        if (this.composer && this.isInitialized) {
            this.composer.render();
        }
        
        requestAnimationFrame(() => this.animate());
    }

    onWindowResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
            
            if (this.aeroPass) {
                this.aeroPass.uniforms.uResolution.value.set(
                    window.innerWidth,
                    window.innerHeight
                );
            }
        }
    }

    cleanup() {
        this.textureManager.dispose();
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.composer) {
            this.composer.dispose();
        }
    }
}

// Initialize application
const app = new App();
app.init().catch(console.error);

// Handle cleanup on page unload
window.addEventListener('unload', () => app.cleanup()); 