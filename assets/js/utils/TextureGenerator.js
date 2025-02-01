export class TextureGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    generateNoiseTexture(width = 256, height = 256, intensity = 1) {
        this.canvas.width = width;
        this.canvas.height = height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const value = Math.floor(Math.random() * 255 * intensity);
            data[i] = value;     // R
            data[i + 1] = value; // G
            data[i + 2] = value; // B
            data[i + 3] = 255;   // A
        }

        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL('image/png');
    }

    generateGridTexture(width = 256, height = 256, majorGridSize = 32, minorGridSize = 8) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Background
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, width, height);
        
        // Major grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.3)';
        this.ctx.lineWidth = 1;
        this.drawGrid(majorGridSize);
        
        // Minor grid lines
        this.ctx.strokeStyle = 'rgba(0, 255, 65, 0.1)';
        this.ctx.lineWidth = 0.5;
        this.drawGrid(minorGridSize, majorGridSize);
        
        return this.canvas.toDataURL('image/png');
    }

    generateScanlineTexture(width = 2, height = 256) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 65, 0)');
        gradient.addColorStop(0.25, 'rgba(0, 255, 65, 0.05)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 65, 0.1)');
        gradient.addColorStop(0.75, 'rgba(0, 255, 65, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 255, 65, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        return this.canvas.toDataURL('image/png');
    }

    drawGrid(gridSize, skipMultiple = null) {
        this.ctx.beginPath();
        
        // Vertical lines
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            if (skipMultiple && x % skipMultiple === 0) continue;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        
        // Horizontal lines
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            if (skipMultiple && y % skipMultiple === 0) continue;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        
        this.ctx.stroke();
    }

    generateAllTextures() {
        return {
            noise: this.generateNoiseTexture(),
            grid: this.generateGridTexture(),
            scanline: this.generateScanlineTexture()
        };
    }
} 