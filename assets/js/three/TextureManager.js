import { TextureGenerator } from '../utils/TextureGenerator.js';

export class TextureManager {
    constructor() {
        this.textures = new Map();
        this.textureLoader = new THREE.TextureLoader();
        this.textureGenerator = new TextureGenerator();
        this.defaultOptions = {
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            minFilter: THREE.LinearMipMapLinearFilter,
            magFilter: THREE.LinearFilter
        };
    }

    async loadTexture(name, url, options = {}) {
        try {
            const texture = await new Promise((resolve, reject) => {
                this.textureLoader.load(url, resolve, undefined, () => {
                    // On error, generate procedural texture
                    console.warn(`Failed to load texture ${name}, generating procedural fallback`);
                    const dataUrl = this.textureGenerator.generateAllTextures()[name];
                    this.textureLoader.load(dataUrl, resolve, undefined, reject);
                });
            });

            // Apply options
            const finalOptions = { ...this.defaultOptions, ...options };
            Object.entries(finalOptions).forEach(([key, value]) => {
                if (key === 'repeat' && value instanceof THREE.Vector2) {
                    texture.repeat.copy(value);
                } else {
                    texture[key] = value;
                }
            });

            this.textures.set(name, texture);
            return texture;
        } catch (error) {
            console.error(`Failed to load texture ${name}:`, error);
            return this.createFallbackTexture(name);
        }
    }

    createFallbackTexture(type) {
        const dataUrl = this.textureGenerator.generateAllTextures()[type];
        const texture = this.textureLoader.load(dataUrl);

        // Apply default options
        Object.entries(this.defaultOptions).forEach(([key, value]) => {
            texture[key] = value;
        });

        this.textures.set(type, texture);
        return texture;
    }

    createNoiseTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const imageData = ctx.createImageData(256, 256);

        for (let i = 0; i < imageData.data.length; i += 4) {
            const value = Math.random() * 255;
            imageData.data[i] = value;
            imageData.data[i + 1] = value;
            imageData.data[i + 2] = value;
            imageData.data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
        
        return new THREE.CanvasTexture(canvas);
    }

    createGridTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 256, 256);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        ctx.lineWidth = 1;
        
        // Major grid lines
        ctx.beginPath();
        for (let i = 0; i <= 256; i += 32) {
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
        }
        ctx.stroke();

        // Minor grid lines
        ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
        ctx.beginPath();
        for (let i = 0; i <= 256; i += 8) {
            if (i % 32 !== 0) {
                ctx.moveTo(i, 0);
                ctx.lineTo(i, 256);
                ctx.moveTo(0, i);
                ctx.lineTo(256, i);
            }
        }
        ctx.stroke();
        
        return new THREE.CanvasTexture(canvas);
    }

    createScanlineTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, 'rgba(0, 255, 65, 0)');
        gradient.addColorStop(0.25, 'rgba(0, 255, 65, 0.05)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 65, 0.1)');
        gradient.addColorStop(0.75, 'rgba(0, 255, 65, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 2, 256);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    getTexture(name) {
        return this.textures.get(name) || this.createFallbackTexture(name);
    }

    dispose() {
        this.textures.forEach(texture => texture.dispose());
        this.textures.clear();
    }
} 