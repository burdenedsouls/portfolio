export class OrbMenu {
    constructor() {
        this.orb = null;
        this.particles = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isHovered = false;
        this.clock = new THREE.Clock();
        this.menuItems = [
            { id: 'home', position: new THREE.Vector3(-2, 1, 0), label: 'HOME' },
            { id: 'projects', position: new THREE.Vector3(0, 1, 0), label: 'PROJECTS' },
            { id: 'about', position: new THREE.Vector3(2, 1, 0), label: 'ABOUT' }
        ];
        this.activeItem = null;
    }

    init(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Create navigation orbs
        this.createNavigationOrbs();
        
        // Create particle system
        this.createParticles();
        
        // Add event listeners
        this.addEventListeners();

        // Create labels
        this.createLabels();
    }

    createNavigationOrbs() {
        const geometry = new THREE.IcosahedronGeometry(0.3, 2);
        
        // Create custom shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                hover: { value: 0 },
                active: { value: 0 },
                color: { value: new THREE.Color(0x00ff41) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                uniform float time;
                uniform float hover;
                uniform float active;
                
                void main() {
                    vUv = uv;
                    vNormal = normal;
                    
                    // Add wave effect
                    vec3 pos = position;
                    float wave = sin(pos.x * 5.0 + time) * cos(pos.y * 5.0 + time) * 0.1;
                    pos += normal * (wave * hover + active * 0.2);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying vec3 vNormal;
                uniform vec3 color;
                uniform float hover;
                uniform float active;
                
                void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 finalColor = mix(color, vec3(1.0), fresnel * 0.5);
                    
                    // Add hover and active glow
                    finalColor += color * (hover * 0.5 + active * 0.8);
                    
                    gl_FragColor = vec4(finalColor, 0.8 + fresnel * 0.2);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        this.menuItems.forEach(item => {
            const orb = new THREE.Mesh(geometry, material.clone());
            orb.position.copy(item.position);
            orb.userData = { id: item.id };
            this.scene.add(orb);
            item.orb = orb;
        });
    }

    createLabels() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        this.menuItems.forEach(item => {
            // Create label texture
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#00ff41';
            ctx.font = 'bold 32px "Orbitron"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.label, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ 
                map: texture,
                transparent: true,
                opacity: 0.8
            });

            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(1, 0.25, 1);
            sprite.position.copy(item.position);
            sprite.position.y -= 0.5;
            this.scene.add(sprite);
            item.label = sprite;
        });
    }

    createParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 1.5 + Math.random() * 0.5;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            velocities.push({
                theta: Math.random() * Math.PI * 2,
                phi: Math.random() * Math.PI,
                speed: 0.001 + Math.random() * 0.002
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00ff41,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.particleVelocities = velocities;
        this.scene.add(this.particles);
    }

    addEventListeners() {
        const container = document.getElementById('orb-menu');
        
        container.addEventListener('mousemove', (event) => {
            const rect = container.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            this.checkIntersection();
        });

        container.addEventListener('click', () => {
            if (this.activeItem) {
                const element = document.getElementById(this.activeItem.id);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        container.addEventListener('mouseleave', () => {
            this.menuItems.forEach(item => {
                if (item.orb) {
                    item.orb.material.uniforms.hover.value = 0;
                }
            });
        });
    }

    checkIntersection() {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        this.menuItems.forEach(item => {
            const intersects = this.raycaster.intersectObject(item.orb);
            
            if (intersects.length > 0) {
                item.orb.material.uniforms.hover.value = 1;
                this.activeItem = item;
                document.body.style.cursor = 'pointer';
            } else {
                item.orb.material.uniforms.hover.value = 0;
                if (this.activeItem === item) {
                    this.activeItem = null;
                    document.body.style.cursor = 'default';
                }
            }
        });
    }

    update() {
        const time = this.clock.getElapsedTime();

        // Update orbs
        this.menuItems.forEach(item => {
            if (item.orb) {
                item.orb.material.uniforms.time.value = time;
                
                // Add floating animation
                item.orb.position.y = item.position.y + Math.sin(time + item.position.x) * 0.1;
                
                // Rotate orbs
                item.orb.rotation.x += 0.001;
                item.orb.rotation.y += 0.002;

                // Update label position
                if (item.label) {
                    item.label.position.y = item.orb.position.y - 0.5;
                }
            }
        });

        // Update particles
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length / 3; i++) {
                const velocity = this.particleVelocities[i];
                velocity.theta += velocity.speed;
                const radius = 1.5 + Math.sin(time + i) * 0.1;
                
                positions[i * 3] = radius * Math.sin(velocity.phi) * Math.cos(velocity.theta);
                positions[i * 3 + 1] = radius * Math.sin(velocity.phi) * Math.sin(velocity.theta);
                positions[i * 3 + 2] = radius * Math.cos(velocity.phi);
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
} 