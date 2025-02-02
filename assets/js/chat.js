import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, push, onChildAdded, query, limitToLast, onValue, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { app } from './firebase-config.js';

export class RetroChat {
    constructor() {
        // Use the existing Firebase app instance
        this.database = getDatabase(app);
        this.messagesRef = ref(this.database, 'messages');
        this.statusRef = ref(this.database, '.info/connected');

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
            maxMessages: 50,
            maxLength: 250,
            minInterval: 1000,
            maxRepeatedChars: 3,
            defaultEmoji: '👾'
        };

        // Initialize profanity filter
        this.initializeProfanityFilter();

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

        // Initialize chat
        this.initializeChat()
            .then(() => {
                console.log('Chat initialized successfully');
                this.setupConnectionMonitor();
                this.setupMessageListener();
            })
            .catch(error => console.error('Chat initialization failed:', error));
    }

    initializeProfanityFilter() {
        // Common profanity patterns (using l33t speak variations and common misspellings)
        this.profanityPatterns = [
            // Basic profanity list - keeping it mild for the example
            /\b(bad|offensive|words|here)\b/gi,
            // Add more patterns as needed
        ];

        // Common letter substitutions
        this.letterSubstitutions = {
            'a': '[a@4]',
            'i': '[i1!]',
            'o': '[o0]',
            'e': '[e3]',
            's': '[s$5]',
            't': '[t7]',
            'l': '[l1]',
            // Add more substitutions as needed
        };

        // Create regex patterns that account for letter substitutions
        this.profanityRegex = this.createProfanityRegex();
    }

    createProfanityRegex() {
        // Convert basic patterns to account for letter substitutions
        const patterns = this.profanityPatterns.map(pattern => {
            let source = pattern.source;
            Object.entries(this.letterSubstitutions).forEach(([letter, substitutions]) => {
                source = source.replace(new RegExp(letter, 'gi'), substitutions);
            });
            return new RegExp(source, 'gi');
        });

        return patterns;
    }

    filterProfanity(text) {
        let filteredText = text;
        
        // Check for exact matches and common variations
        this.profanityRegex.forEach(regex => {
            filteredText = filteredText.replace(regex, match => {
                // Replace with asterisks of the same length
                return '*'.repeat(match.length);
            });
        });

        // Check for intentional letter substitutions
        Object.entries(this.letterSubstitutions).forEach(([letter, substitutions]) => {
            const pattern = new RegExp(substitutions, 'gi');
            filteredText = filteredText.replace(pattern, letter);
        });

        // Final check with normalized text
        this.profanityRegex.forEach(regex => {
            filteredText = filteredText.replace(regex, match => {
                return '*'.repeat(match.length);
            });
        });

        return filteredText;
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

            // Set up event listeners
            this.setupEventListeners();

            // Load recent messages
            await this.loadRecentMessages();

            console.log('Chat initialization complete');
        } catch (error) {
            console.error('Error during chat initialization:', error);
            throw error;
        }
    }

    async loadRecentMessages() {
        try {
            const recentMessagesQuery = query(this.messagesRef, limitToLast(this.config.maxMessages));
            onChildAdded(recentMessagesQuery, (snapshot) => {
                const message = snapshot.val();
                this.renderMessage(message);
            });
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }

    setupMessageListener() {
        onChildAdded(this.messagesRef, (snapshot) => {
            const message = snapshot.val();
            if (!this.state.messages.find(m => m.id === message.id)) {
                this.renderMessage(message);
            }
        });
    }

    setupConnectionMonitor() {
        onValue(this.statusRef, (snapshot) => {
            this.state.connected = snapshot.val();
            this.updateStatus(this.state.connected ? 'Connected' : 'Disconnected');
            console.log('Connection status:', this.state.connected);
        });
    }

    async sendMessage(text, emoji) {
        if (!text.trim() || !this.state.connected) return;

        // Filter profanity before sending
        const filteredText = this.filterProfanity(text);

        const message = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: filteredText.slice(0, this.config.maxLength),
            emoji: emoji || this.config.defaultEmoji,
            timestamp: Date.now(), // Use numeric timestamp instead of serverTimestamp
            filtered: filteredText !== text
        };

        try {
            await push(this.messagesRef, message);
            this.elements.input.value = '';
            if (this.state.isMobile) {
                this.elements.input.blur();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            this.updateStatus('Error sending message: ' + error.message);
            throw error; // Re-throw to allow handling by caller
        }
    }

    renderMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        if (message.filtered) {
            messageDiv.className += ' message-filtered';
        }
        messageDiv.dataset.messageId = message.id;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-emoji">${message.emoji}</span>
                <span class="message-text">${this.escapeHtml(message.text)}</span>
                <span class="message-time">${this.formatTime(message.timestamp)}</span>
            </div>
        `;

        this.elements.messages.appendChild(messageDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        this.state.messages.push(message);

        // Keep message count within limit
        if (this.state.messages.length > this.config.maxMessages) {
            this.state.messages.shift();
            const firstMessage = this.elements.messages.firstChild;
            if (firstMessage) {
                this.elements.messages.removeChild(firstMessage);
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    updateStatus(status) {
        if (this.elements.status) {
            this.elements.status.textContent = status;
            this.elements.status.className = 'chat-status ' + 
                (status === 'Connected' ? 'connected' : 'disconnected');
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

    validateElements() {
        const requiredElements = {
            window: '.chat-window',
            messages: '.chat-messages',
            input: '.message-input',
            emojiPicker: '.emoji-picker',
            sendButton: '.send-button',
            taskbarButton: '.taskbar-chat-toggle',
            inputArea: '.chat-input',
            status: '.chat-status'
        };

        let allValid = true;
        for (const [key, selector] of Object.entries(requiredElements)) {
            const element = document.querySelector(selector);
            if (!element) {
                console.error(`Missing required chat element: ${selector}`);
                allValid = false;
            }
            this.elements[key] = element;
        }

        return allValid;
    }

    setupEventListeners() {
        // Message sending
        const sendMessage = () => {
            const text = this.elements.input.value.trim();
            const emoji = this.elements.emojiPicker.value || this.config.defaultEmoji;
            
            if (text) {
                this.sendMessage(text, emoji);
                this.elements.input.value = '';
                if (this.state.isMobile) {
                    this.elements.input.blur();
                }
            }
        };

        // Input events
        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Send button
        this.elements.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            sendMessage();
        });

        // Window toggle
        this.elements.taskbarButton.addEventListener('click', () => {
            this.toggleWindow();
        });

        // Mobile swipe handling
        if (this.state.isMobile) {
            let touchStartY = 0;
            let currentTranslateY = 0;
            let isSwiping = false;

            this.elements.window.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                touchStartY = touch.clientY;
                currentTranslateY = 0;
                
                // Allow swiping in header area or swipe area
                const touchTarget = e.target;
                if (touchTarget.closest('.chat-header') || touchTarget.closest('.swipe-area')) {
                    isSwiping = true;
                    this.elements.window.style.transition = 'none';
                }
            }, { passive: true });

            this.elements.window.addEventListener('touchmove', (e) => {
                if (!isSwiping) return;
                
                const touch = e.touches[0];
                const deltaY = Math.max(0, touch.clientY - touchStartY);
                currentTranslateY = deltaY;
                
                requestAnimationFrame(() => {
                    this.elements.window.style.transform = `translateY(${deltaY}px)`;
                });
                
                e.preventDefault();
            }, { passive: false });

            this.elements.window.addEventListener('touchend', () => {
                if (!isSwiping) return;
                
                isSwiping = false;
                this.elements.window.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                
                if (currentTranslateY > 100) {
                    this.minimizeWindow();
                } else {
                    requestAnimationFrame(() => {
                        this.elements.window.style.transform = '';
                    });
                }
                
                currentTranslateY = 0;
            });
        }

        // Close button
        const closeButton = this.elements.window.querySelector('.close-bubble');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.minimizeWindow();
            });
        }
    }
} 