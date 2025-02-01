export const AeroGlassShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uBlurStrength: { value: 0.3 },
        uDistortionStrength: { value: 0.15 },
        uColorShift: { value: 0.1 },
        uGlowStrength: { value: 0.2 },
        uPrismStrength: { value: 0.15 },
        uDepthStrength: { value: 0.2 },
        uPrimaryColor: { value: new THREE.Vector3(0.69, 0.81, 1.0) },  // Pastel blue
        uSecondaryColor: { value: new THREE.Vector3(0.78, 0.69, 1.0) },  // Pastel purple
        uAccentColor: { value: new THREE.Vector3(1.0, 0.69, 0.81) }   // Pastel pink
    },

    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vDepth;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vDepth = -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform float uBlurStrength;
        uniform float uDistortionStrength;
        uniform float uColorShift;
        uniform float uGlowStrength;
        uniform float uPrismStrength;
        uniform float uDepthStrength;
        uniform vec3 uPrimaryColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uAccentColor;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vDepth;
        
        // Enhanced noise function
        float noise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            
            float n = i.x + i.y * 157.0 + 113.0 * i.z;
            vec4 v = vec4(n + 0.0, n + 1.0, n + 157.0, n + 158.0);
            v = fract(sin(v) * 43758.5453);
            v = mix(v, vec4(0.5), 0.3);
            
            float x1 = mix(v.x, v.y, f.x);
            float x2 = mix(v.z, v.w, f.x);
            return mix(x1, x2, f.y);
        }
        
        // Prismatic dispersion effect
        vec3 prismDispersion(vec2 uv, float strength) {
            vec2 direction = normalize(vec2(0.5) - uv);
            vec3 color;
            color.r = texture2D(tDiffuse, uv - direction * strength * 1.0).r;
            color.g = texture2D(tDiffuse, uv - direction * strength * 0.7).g;
            color.b = texture2D(tDiffuse, uv - direction * strength * 0.4).b;
            return color;
        }
        
        // Enhanced distortion
        vec2 enhancedDistort(vec2 uv) {
            float t = uTime * 0.15;
            vec2 center = vec2(0.5);
            vec2 toCenter = center - uv;
            float dist = length(toCenter);
            
            vec3 p1 = vec3(uv * 3.0, t);
            vec3 p2 = vec3(uv * 4.0, t * 1.5);
            
            float noise1 = noise(p1);
            float noise2 = noise(p2);
            
            vec2 offset = vec2(noise1, noise2) * uDistortionStrength;
            offset += toCenter * sin(dist * 8.0 - t) * uDistortionStrength * 0.2;
            
            // Add depth-based distortion
            float depthFactor = smoothstep(0.0, 1.0, vDepth * uDepthStrength);
            offset *= mix(1.0, 1.5, depthFactor);
            
            return uv + offset;
        }
        
        // Enhanced glow
        vec3 enhancedGlow(vec2 uv, vec3 color) {
            float d = length(uv - 0.5);
            float radialGlow = exp(-d * 3.0) * uGlowStrength;
            float edgeGlow = (1.0 - d * 2.0) * uGlowStrength * 0.5;
            
            // Add depth-based glow
            float depthGlow = smoothstep(0.0, 1.0, vDepth * uDepthStrength);
            vec3 glowColor = mix(uPrimaryColor, uAccentColor, noise(vec3(uv * 5.0, uTime * 0.1)));
            glowColor = mix(glowColor, vec3(1.0), depthGlow * 0.3);
            
            return mix(color, glowColor, (radialGlow + edgeGlow) * (1.0 + depthGlow * 0.5));
        }
        
        // Color blend with prism effect
        vec3 colorBlend(vec2 uv) {
            float t = uTime * 0.08;
            vec3 p = vec3(uv * 2.0, t);
            float blend = noise(p);
            
            vec3 color1 = mix(uPrimaryColor, uSecondaryColor, blend);
            vec3 color2 = mix(color1, uAccentColor, blend * blend);
            vec3 baseColor = mix(color2, vec3(1.0), 0.2);
            
            // Add depth-based color shift
            float depthFactor = smoothstep(0.0, 1.0, vDepth * uDepthStrength);
            baseColor = mix(baseColor, vec3(1.0), depthFactor * 0.2);
            
            float highlight = pow(1.0 - abs(uv.y - 0.5) * 2.0, 3.0);
            vec3 prismColor = mix(uPrimaryColor, uAccentColor, noise(vec3(uv * 8.0 + vDepth, uTime * 0.2)));
            
            return mix(baseColor, prismColor, highlight * uPrismStrength * (1.0 + depthFactor * 0.3));
        }
        
        void main() {
            // Apply enhanced distortion
            vec2 distortedUv = enhancedDistort(vUv);
            
            // Sample with blur
            vec4 color = vec4(0.0);
            float total = 0.0;
            
            for(float x = -3.0; x <= 3.0; x += 1.0) {
                for(float y = -3.0; y <= 3.0; y += 1.0) {
                    vec2 offset = vec2(x, y) * uBlurStrength / uResolution;
                    float weight = 1.0 - length(vec2(x, y)) * 0.1;
                    if(weight <= 0.0) continue;
                    
                    vec2 sampleUv = distortedUv + offset;
                    vec4 sampleColor = texture2D(tDiffuse, sampleUv);
                    
                    // Apply color blend
                    float shift = noise(vec3(sampleUv * 3.0, uTime * 0.1));
                    sampleColor.rgb = mix(
                        sampleColor.rgb,
                        colorBlend(sampleUv),
                        shift * uColorShift
                    );
                    
                    color += sampleColor * weight;
                    total += weight;
                }
            }
            
            color /= total;
            
            // Add enhanced glow with depth
            color.rgb = enhancedGlow(vUv, color.rgb);
            
            // Add subtle noise and depth-based effects
            float noise = noise(vec3(vUv * 8.0, uTime)) * 0.03;
            float depthNoise = noise * (1.0 + vDepth * uDepthStrength);
            color.rgb = mix(color.rgb, vec3(1.0), depthNoise);
            
            // Final adjustments with depth consideration
            float depthFactor = smoothstep(0.0, 1.0, vDepth * uDepthStrength);
            color.rgb = mix(color.rgb, vec3(1.0), depthFactor * 0.1);
            color.rgb = pow(color.rgb, vec3(0.95));
            
            gl_FragColor = color;
        }
    `
}; 