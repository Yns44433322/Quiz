// script.js
class QuizMaster {
    constructor() {
        this.baseURL = 'https://api.jsonbin.io/v3/b';
        this.binId = '68e5a3d743b1c97be95e228b';
        this.accessKey = '$2a$10$T.eHULy6ck/GKr48zzsI2OKfuZA.KsVl.kwHHEoiJEEf/abmhaNZm';
        this.masterKey = '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG';
        
        // State management
        this.currentPage = 'landingPage';
        this.currentTheme = null;
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.quizData = null;
        this.userAnswers = [];
        this.username = '';
        this.quizCode = '';
        this.wrongQuestions = [];
        this.hasBadge = false;
        this.usedBadge = false;
        this.adminLoggedIn = false;
        this.currentEditingTheme = null;
        this.currentEditingQuestion = null;
        
        // Initialize default data structure
        this.defaultData = {
            themes: [],
            admin: {
                username: "admin",
                password: "admin123"
            }
        };
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
        this.showPage('landingPage');
        this.hideLoading();
    }

    // Event Binding
    bindEvents() {
        // Navigation
        document.getElementById('startQuizBtn').addEventListener('click', () => this.showPage('quizStartPage'));
        document.getElementById('backToLanding').addEventListener('click', () => this.showPage('landingPage'));
        document.getElementById('backToStart').addEventListener('click', () => this.showPage('landingPage'));
        
        // Quiz Start Form
        document.getElementById('quizStartForm').addEventListener('submit', (e) => this.startQuiz(e));
        document.getElementById('usernameInput').addEventListener('input', () => this.validateStartForm());
        document.getElementById('quizCodeInput').addEventListener('input', () => this.validateStartForm());
        
        // Quiz Navigation
        document.getElementById('prevQuestion').addEventListener('click', () => this.previousQuestion());
        document.getElementById('nextQuestion').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submitAnswer').addEventListener('click', () => this.submitAnswer());
        
        // Results
        document.getElementById('useBadgeBtn').addEventListener('click', () => this.showBadgeModal());
        document.getElementById('skipBadge').addEventListener('click', () => this.hideBadgeModal());
        
        // Admin
        document.getElementById('adminLoginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('adminLoginBtn2').addEventListener('click', () => this.showLoginModal());
        document.getElementById('closeLogin').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('loginForm').addEventListener('submit', (e) => this.adminLogin(e));
        document.getElementById('adminLogout').addEventListener('click', () => this.adminLogout());
        
        // Admin Tabs
        document.getElementById('themesTab').addEventListener('click', () => this.showAdminTab('themes'));
        document.getElementById('leaderboardsTab').addEventListener('click', () => this.showAdminTab('leaderboards'));
        
        // Theme Management
        document.getElementById('createTheme').addEventListener('click', () => this.createNewTheme());
        
        // Question Form
        document.getElementById('closeQuestionForm').addEventListener('click', () => this.hideQuestionForm());
        document.getElementById('cancelQuestionForm').addEventListener('click', () => this.hideQuestionForm());
        document.getElementById('questionForm').addEventListener('submit', (e) => this.saveQuestion(e));
        document.getElementById('addChoice').addEventListener('click', () => this.addChoiceOption());
        
        // Question Type Toggle
        document.querySelectorAll('input[name="questionType"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.toggleQuestionType(e.target.value));
        });
        
        // Confirmation Modal
        document.getElementById('confirmCancel').addEventListener('click', () => this.hideConfirmModal());
        
        // Toast close buttons
        document.querySelectorAll('.toast-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.toast').classList.add('hidden');
            });
        });
        
        // Close modals when clicking outside
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // API Methods
    async loadData() {
        try {
            this.showLoading();
            const response = await fetch(`${this.baseURL}/${this.binId}/latest`, {
                headers: {
                    'X-Access-Key': this.accessKey
                }
            });
            
            if (!response.ok) {
                // If no data exists, create default structure
                await this.saveData(this.defaultData);
                this.quizData = this.defaultData;
                return;
            }
            
            const data = await response.json();
            this.quizData = data.record || this.defaultData;
            
            // Initialize themes if empty
            if (!this.quizData.themes) {
                this.quizData.themes = [];
                await this.saveData(this.quizData);
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.quizData = this.defaultData;
            this.showError('Gagal memuat data. Menggunakan data lokal.');
        } finally {
            this.hideLoading();
        }
    }

    async saveData(data) {
        try {
            const response = await fetch(`${this.baseURL}/${this.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.masterKey,
                    'X-Access-Key': this.accessKey
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) throw new Error('Failed to save data');
            
            return await response.json();
        } catch (error) {
            console.error('Error saving data:', error);
            this.showError('Gagal menyimpan data ke server');
            throw error;
        }
    }

    // Page Navigation
    showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // Show target page
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId;
        
        // Page-specific initialization
        switch(pageId) {
            case 'quizStartPage':
                this.validateStartForm();
                break;
            case 'adminPanel':
                this.loadAdminData();
                break;
        }
    }

    // Loading States
    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    // Toast Notifications
    showError(message) {
        const toast = document.getElementById('errorToast');
        document.getElementById('errorMessage').textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('errorToast').classList.add('hidden');
    }

    showSuccess(message) {
        const toast = document.getElementById('successToast');
        document.getElementById('successMessage').textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            this.hideSuccess();
        }, 3000);
    }

    hideSuccess() {
        document.getElementById('successToast').classList.add('hidden');
    }

    // Modal Management
    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        
        const confirmBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        // Remove previous event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        // Add new event listeners
        newConfirmBtn.addEventListener('click', () => {
            this.hideConfirmModal();
            onConfirm();
        });
        
        newCancelBtn.addEventListener('click', () => this.hideConfirmModal());
        
        this.showModal('confirmModal');
    }

    hideConfirmModal() {
        this.hideModal('confirmModal');
    }

    // Quiz Start Form
    validateStartForm() {
        const username = document.getElementById('usernameInput').value.trim();
        const quizCode = document.getElementById('quizCodeInput').value.trim().toUpperCase();
        const startBtn = document.getElementById('startBtn');
        
        startBtn.disabled = !(username && quizCode);
    }

    async startQuiz(e) {
        e.preventDefault();
        
        this.username = document.getElementById('usernameInput').value.trim();
        this.quizCode = document.getElementById('quizCodeInput').value.trim().toUpperCase();
        
        // Find theme by code
        this.currentTheme = this.quizData.themes.find(theme => 
            theme.code.toUpperCase() === this.quizCode
        );
        
        if (!this.currentTheme) {
            this.showError('Kode quiz tidak ditemukan');
            return;
        }
        
        if (!this.currentTheme.questions || this.currentTheme.questions.length < 3) {
            this.showError('Quiz harus memiliki minimal 3 soal');
            return;
        }
        
        // Initialize quiz state
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.userAnswers = new Array(this.currentTheme.questions.length).fill(null);
        this.wrongQuestions = [];
        this.hasBadge = false;
        this.usedBadge = false;
        
        // Update UI
        document.getElementById('quizTitle').textContent = this.currentTheme.name;
        document.getElementById('quizUser').textContent = `User: ${this.username}`;
        document.getElementById('quizScore').textContent = '0';
        
        this.showPage('quizSessionPage');
        this.loadQuestion();
    }

    // Quiz Session Management
    loadQuestion() {
        const question = this.currentTheme.questions[this.currentQuestionIndex];
        
        // Update progress
        const progress = ((this.currentQuestionIndex + 1) / this.currentTheme.questions.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('questionProgress').textContent = 
            `Soal ${this.currentQuestionIndex + 1} dari ${this.currentTheme.questions.length}`;
        
        // Update question text
        document.getElementById('questionText').textContent = question.text;
        
        // Handle question image
        const questionImage = document.getElementById('questionImage');
        if (question.image) {
            questionImage.querySelector('img').src = question.image;
            questionImage.classList.remove('hidden');
        } else {
            questionImage.classList.add('hidden');
        }
        
        // Handle question type
        const mcAnswers = document.getElementById('mcAnswers');
        const essayAnswer = document.getElementById('essayAnswer');
        
        if (question.type === 'mc') {
            mcAnswers.classList.remove('hidden');
            essayAnswer.classList.add('hidden');
            this.renderMultipleChoice(question);
        } else {
            mcAnswers.classList.add('hidden');
            essayAnswer.classList.remove('hidden');
            this.renderEssayQuestion();
        }
        
        // Update navigation buttons
        document.getElementById('prevQuestion').disabled = this.currentQuestionIndex === 0;
        document.getElementById('submitAnswer').classList.remove('hidden');
        document.getElementById('nextQuestion').classList.add('hidden');
        
        // Clear result message
        document.getElementById('result').classList.add('hidden');
        
        // Start timer
        this.startTimer();
    }

    renderMultipleChoice(question) {
        const container = document.getElementById('mcAnswers');
        container.innerHTML = '';
        
        question.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'answer-option';
            button.innerHTML = `
                <span>${String.fromCharCode(65 + index)}. ${choice}</span>
            `;
            
            // Check if this option was previously selected
            if (this.userAnswers[this.currentQuestionIndex] === index) {
                button.classList.add('selected');
            }
            
            button.addEventListener('click', () => {
                // Deselect all options
                container.querySelectorAll('.answer-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Select current option
                button.classList.add('selected');
                this.userAnswers[this.currentQuestionIndex] = index;
            });
            
            container.appendChild(button);
        });
    }

    renderEssayQuestion() {
        const textarea = document.getElementById('essayAnswer').querySelector('textarea');
        textarea.value = this.userAnswers[this.currentQuestionIndex] || '';
        
        textarea.addEventListener('input', () => {
            this.userAnswers[this.currentQuestionIndex] = textarea.value.trim();
        });
    }

    startTimer() {
        this.timeLeft = this.currentTheme.questions[this.currentQuestionIndex].timer || 30;
        this.updateTimerDisplay();
        
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.submitAnswer();
            }
        }, 1000);
    }

    updateTimerDisplay() {
        const timerText = document.querySelector('.timer-text');
        const timerPath = document.getElementById('timer-path');
        const timerElement = document.getElementById('timer');
        
        timerText.textContent = `${this.timeLeft}s`;
        
        // Update circular progress
        const circumference = 2 * Math.PI * 15.9155;
        const offset = circumference - (this.timeLeft / 30) * circumference;
        timerPath.style.strokeDasharray = `${circumference} ${circumference}`;
        timerPath.style.strokeDashoffset = offset;
        
        // Update timer color based on time left
        timerElement.classList.remove('warning', 'danger');
        if (this.timeLeft <= 10) {
            timerElement.classList.add('danger');
        } else if (this.timeLeft <= 20) {
            timerElement.classList.add('warning');
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.loadQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentTheme.questions.length - 1) {
            this.currentQuestionIndex++;
            this.loadQuestion();
        } else {
            this.finishQuiz();
        }
    }

    submitAnswer() {
        clearInterval(this.timer);
        
        const question = this.currentTheme.questions[this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        const resultElement = document.getElementById('result');
        
        let isCorrect = false;
        let message = '';
        
        if (question.type === 'mc') {
            isCorrect = userAnswer === question.correctAnswer;
            message = isCorrect ? 'Jawaban Benar!' : `Jawaban Salah! Yang benar: ${String.fromCharCode(65 + question.correctAnswer)}. ${question.choices[question.correctAnswer]}`;
        } else {
            // For essay questions, we'll consider any non-empty answer as correct for now
            isCorrect = userAnswer && userAnswer.trim().length > 0;
            message = isCorrect ? 'Jawaban Disimpan!' : 'Silakan isi jawaban essay!';
        }
        
        if (isCorrect) {
            this.score += 10; // 10 points per correct answer
            document.getElementById('quizScore').textContent = this.score;
            resultElement.className = 'result-message success';
        } else {
            resultElement.className = 'result-message error';
            // Add to wrong questions for badge feature
            this.wrongQuestions.push(this.currentQuestionIndex);
        }
        
        resultElement.textContent = message;
        resultElement.classList.remove('hidden');
        
        // Update navigation
        document.getElementById('submitAnswer').classList.add('hidden');
        document.getElementById('nextQuestion').classList.remove('hidden');
        
        // Auto-advance after 2 seconds
        setTimeout(() => {
            if (this.currentQuestionIndex < this.currentTheme.questions.length - 1) {
                this.nextQuestion();
            } else {
                this.finishQuiz();
            }
        }, 2000);
    }

    finishQuiz() {
        // Calculate final score
        const correctAnswers = this.userAnswers.filter((answer, index) => {
            const question = this.currentTheme.questions[index];
            if (question.type === 'mc') {
                return answer === question.correctAnswer;
            }
            return answer && answer.trim().length > 0; // Essay questions get points if answered
        }).length;
        
        this.score = correctAnswers * 10;
        
        // Update results page
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('correctAnswers').textContent = correctAnswers;
        document.getElementById('totalQuestions').textContent = this.currentTheme.questions.length;
        
        // Check for badge eligibility
        this.hasBadge = this.wrongQuestions.length > 0;
        const badgeInfo = document.getElementById('badgeInfo');
        const useBadgeBtn = document.getElementById('useBadgeBtn');
        
        if (this.hasBadge) {
            badgeInfo.classList.remove('hidden');
            useBadgeBtn.classList.remove('hidden');
        } else {
            badgeInfo.classList.add('hidden');
            useBadgeBtn.classList.add('hidden');
        }
        
        // Update leaderboard
        this.updateLeaderboard();
        this.renderLeaderboard();
        
        this.showPage('resultsPage');
    }

    updateLeaderboard() {
        if (!this.currentTheme.leaderboard) {
            this.currentTheme.leaderboard = [];
        }
        
        // Add current score to leaderboard
        this.currentTheme.leaderboard.push({
            username: this.username,
            score: this.score,
            date: new Date().toISOString()
        });
        
        // Sort leaderboard by score (descending)
        this.currentTheme.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10 scores
        this.currentTheme.leaderboard = this.currentTheme.leaderboard.slice(0, 10);
        
        // Save updated data
        this.saveData(this.quizData);
    }

    renderLeaderboard() {
        const leaderboardElement = document.getElementById('leaderboard');
        leaderboardElement.innerHTML = '';
        
        if (!this.currentTheme.leaderboard || this.currentTheme.leaderboard.length === 0) {
            leaderboardElement.innerHTML = '<div class="empty-state">Belum ada skor yang tercatat</div>';
            return;
        }
        
        // Show top 3
        const top3 = this.currentTheme.leaderboard.slice(0, 3);
        
        top3.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-user">${entry.username}</div>
                <div class="leaderboard-score">${entry.score}</div>
            `;
            leaderboardElement.appendChild(item);
        });
    }

    // Badge System
    showBadgeModal() {
        const wrongQuestionsList = document.getElementById('wrongQuestionsList');
        wrongQuestionsList.innerHTML = '';
        
        this.wrongQuestions.forEach(questionIndex => {
            const question = this.currentTheme.questions[questionIndex];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'wrong-question-btn';
            button.textContent = `Soal ${questionIndex + 1}: ${question.text.substring(0, 50)}...`;
            
            button.addEventListener('click', () => {
                this.useBadge(questionIndex);
            });
            
            wrongQuestionsList.appendChild(button);
        });
        
        this.showModal('badgeModal');
    }

    hideBadgeModal() {
        this.hideModal('badgeModal');
        this.usedBadge = true;
        document.getElementById('useBadgeBtn').classList.add('hidden');
    }

    useBadge(questionIndex) {
        this.hideModal('badgeModal');
        this.usedBadge = true;
        
        // Reset the wrong question
        this.userAnswers[questionIndex] = null;
        this.currentQuestionIndex = questionIndex;
        
        // Remove from wrong questions
        const wrongIndex = this.wrongQuestions.indexOf(questionIndex);
        if (wrongIndex > -1) {
            this.wrongQuestions.splice(wrongIndex, 1);
        }
        
        // Go back to the question
        this.showPage('quizSessionPage');
        this.loadQuestion();
    }

    // Admin System
    showLoginModal() {
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').classList.add('hidden');
        this.showModal('loginModal');
    }

    hideLoginModal() {
        this.hideModal('loginModal');
    }

    adminLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;
        const errorElement = document.getElementById('loginError');
        
        if (username === this.quizData.admin.username && password === this.quizData.admin.password) {
            this.adminLoggedIn = true;
            this.hideLoginModal();
            this.showAdminPanel();
            this.showSuccess('Login admin berhasil');
        } else {
            errorElement.textContent = 'Username atau password salah';
            errorElement.classList.remove('hidden');
        }
    }

    adminLogout() {
        this.adminLoggedIn = false;
        this.hideModal('adminPanel');
        this.showSuccess('Logout berhasil');
    }

    showAdminPanel() {
        this.showModal('adminPanel');
        this.showAdminTab('themes');
    }

    showAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activate selected tab
        if (tabName === 'themes') {
            document.getElementById('themesTab').classList.add('active');
            document.getElementById('themesContent').classList.add('active');
            this.renderThemesList();
        } else {
            document.getElementById('leaderboardsTab').classList.add('active');
            document.getElementById('leaderboardsContent').classList.add('active');
            this.renderAdminLeaderboards();
        }
    }

    loadAdminData() {
        this.renderThemesList();
        this.renderAdminLeaderboards();
    }

    // Theme Management
    renderThemesList() {
        const themesList = document.getElementById('themesList');
        
        if (this.quizData.themes.length === 0) {
            themesList.innerHTML = '<div class="empty-state">Belum ada tema yang dibuat</div>';
            return;
        }
        
        themesList.innerHTML = '';
        
        this.quizData.themes.forEach((theme, index) => {
            const themeItem = document.createElement('div');
            themeItem.className = `theme-item ${this.currentEditingTheme === index ? 'active' : ''}`;
            themeItem.innerHTML = `
                <div class="theme-title">${theme.name}</div>
                <div class="theme-code">Kode: ${theme.code}</div>
                <div class="theme-stats">
                    ${theme.questions ? theme.questions.length : 0} soal • 
                    ${theme.leaderboard ? theme.leaderboard.length : 0} peserta
                </div>
            `;
            
            themeItem.addEventListener('click', () => {
                this.editTheme(index);
            });
            
            themesList.appendChild(themeItem);
        });
    }

    createNewTheme() {
        const newTheme = {
            id: Date.now().toString(),
            name: 'Tema Baru',
            code: this.generateQuizCode(),
            questions: [],
            leaderboard: [],
            maxParticipants: 100
        };
        
        this.quizData.themes.push(newTheme);
        this.currentEditingTheme = this.quizData.themes.length - 1;
        
        this.saveData(this.quizData).then(() => {
            this.renderThemesList();
            this.renderThemeEditor();
            this.showSuccess('Tema baru berhasil dibuat');
        });
    }

    generateQuizCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    editTheme(themeIndex) {
        this.currentEditingTheme = themeIndex;
        this.renderThemesList();
        this.renderThemeEditor();
    }

    renderThemeEditor() {
        const themeEditor = document.querySelector('.theme-editor');
        
        if (this.currentEditingTheme === null) {
            themeEditor.innerHTML = `
                <div class="editor-placeholder">
                    <div class="placeholder-icon">📚</div>
                    <h3>Pilih Tema untuk Diedit</h3>
                    <p>Pilih tema dari daftar di sebelah kiri atau buat tema baru</p>
                </div>
            `;
            return;
        }
        
        const theme = this.quizData.themes[this.currentEditingTheme];
        
        themeEditor.innerHTML = `
            <div class="theme-editor-content">
                <div class="theme-editor-header">
                    <h3>Edit Tema: ${theme.name}</h3>
                    <div class="theme-actions">
                        <button class="btn-danger" onclick="quizMaster.deleteTheme(${this.currentEditingTheme})">
                            Hapus Tema
                        </button>
                        <button class="btn-success" onclick="quizMaster.showQuestionForm()">
                            + Tambah Soal
                        </button>
                    </div>
                </div>
                
                <div class="theme-settings-grid">
                    <div class="theme-settings-card">
                        <h4>Informasi Tema</h4>
                        <div class="form-group">
                            <label class="form-label">Nama Tema</label>
                            <input type="text" class="settings-input" value="${theme.name}" 
                                   onchange="quizMaster.updateThemeName(${this.currentEditingTheme}, this.value)">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Kode Quiz</label>
                            <input type="text" class="settings-input" value="${theme.code}" readonly>
                            <small style="color: var(--text-muted);">Kode ini digunakan peserta untuk mengakses quiz</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Maksimal Peserta</label>
                            <input type="number" class="settings-input" value="${theme.maxParticipants || 100}" 
                                   min="1" max="1000"
                                   onchange="quizMaster.updateMaxParticipants(${this.currentEditingTheme}, this.value)">
                        </div>
                    </div>
                    
                    <div class="theme-settings-card">
                        <h4>Statistik</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <div class="breakdown-item">
                                <span class="breakdown-label">Total Soal</span>
                                <span class="breakdown-value">${theme.questions ? theme.questions.length : 0}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Total Peserta</span>
                                <span class="breakdown-value">${theme.leaderboard ? theme.leaderboard.length : 0}</span>
                            </div>
                        </div>
                        <div style="margin-top: 1rem;">
                            <button class="btn-danger btn-full" onclick="quizMaster.resetLeaderboard(${this.currentEditingTheme})">
                                Reset Leaderboard
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="questions-management">
                    <div class="questions-header">
                        <h4>Daftar Soal</h4>
                        <div class="questions-stats">
                            <div class="stat-item">${this.getQuestionTypeCount(theme, 'mc')} Pilihan Ganda</div>
                            <div class="stat-item">${this.getQuestionTypeCount(theme, 'essay')} Essay</div>
                        </div>
                    </div>
                    
                    <div class="questions-grid">
                        ${this.renderQuestionsList(theme)}
                    </div>
                </div>
            </div>
        `;
    }

    getQuestionTypeCount(theme, type) {
        if (!theme.questions) return 0;
        return theme.questions.filter(q => q.type === type).length;
    }

    renderQuestionsList(theme) {
        if (!theme.questions || theme.questions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">❓</div>
                    <h4>Belum Ada Soal</h4>
                    <p>Tambahkan soal pertama untuk memulai kuis ini</p>
                </div>
            `;
        }
        
        return theme.questions.map((question, index) => `
            <div class="question-card-admin">
                <div class="question-header-admin">
                    <div class="question-meta-admin">
                        <div class="question-number-admin">${index + 1}</div>
                        <div class="question-type-badge">
                            ${question.type === 'mc' ? 'Pilihan Ganda' : 'Essay'}
                        </div>
                        <div class="question-type-badge" style="background: var(--blue);">
                            Timer: ${question.timer || 30}s
                        </div>
                    </div>
                    <div class="question-actions-admin">
                        <button class="btn-secondary btn-icon" onclick="quizMaster.editQuestion(${index})">
                            ✏️
                        </button>
                        <button class="btn-danger btn-icon" onclick="quizMaster.deleteQuestion(${index})">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="question-text-admin">${question.text}</div>
                ${question.image ? `
                    <div class="question-image-admin">
                        📷 Gambar: ${question.image}
                    </div>
                ` : ''}
                ${question.type === 'mc' ? `
                    <div class="question-choices-admin">
                        ${question.choices.map((choice, choiceIndex) => `
                            <div>${String.fromCharCode(65 + choiceIndex)}. ${choice} 
                            ${choiceIndex === question.correctAnswer ? '✅' : ''}</div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    updateThemeName(themeIndex, newName) {
        this.quizData.themes[themeIndex].name = newName;
        this.saveData(this.quizData).then(() => {
            this.renderThemesList();
            this.renderThemeEditor();
        });
    }

    updateMaxParticipants(themeIndex, maxParticipants) {
        this.quizData.themes[themeIndex].maxParticipants = parseInt(maxParticipants);
        this.saveData(this.quizData);
    }

    resetLeaderboard(themeIndex) {
        this.showConfirmModal(
            'Reset Leaderboard',
            'Apakah Anda yakin ingin mereset leaderboard? Tindakan ini tidak dapat dibatalkan.',
            () => {
                this.quizData.themes[themeIndex].leaderboard = [];
                this.saveData(this.quizData).then(() => {
                    this.renderThemeEditor();
                    this.showSuccess('Leaderboard berhasil direset');
                });
            }
        );
    }

    deleteTheme(themeIndex) {
        this.showConfirmModal(
            'Hapus Tema',
            'Apakah Anda yakin ingin menghapus tema ini? Tindakan ini tidak dapat dibatalkan.',
            () => {
                this.quizData.themes.splice(themeIndex, 1);
                this.currentEditingTheme = null;
                this.saveData(this.quizData).then(() => {
                    this.renderThemesList();
                    this.renderThemeEditor();
                    this.showSuccess('Tema berhasil dihapus');
                });
            }
        );
    }

    // Question Management
    showQuestionForm(questionIndex = null) {
        this.currentEditingQuestion = questionIndex;
        const formTitle = document.getElementById('questionFormTitle');
        
        if (questionIndex === null) {
            formTitle.textContent = 'Tambah Soal Baru';
            this.resetQuestionForm();
        } else {
            formTitle.textContent = 'Edit Soal';
            this.loadQuestionToForm(questionIndex);
        }
        
        this.showModal('questionFormModal');
    }

    hideQuestionForm() {
        this.hideModal('questionFormModal');
        this.currentEditingQuestion = null;
    }

    resetQuestionForm() {
        document.getElementById('questionText').value = '';
        document.getElementById('questionImage').value = '';
        document.querySelector('input[name="questionType"][value="mc"]').checked = true;
        this.toggleQuestionType('mc');
        
        // Reset choices
        const choicesContainer = document.getElementById('choicesContainer');
        choicesContainer.innerHTML = `
            <div class="choice-item">
                <input type="radio" name="correctAnswer" value="0" checked>
                <input type="text" placeholder="Opsi 1" class="choice-input" required>
                <button type="button" class="btn-danger remove-choice hidden">&times;</button>
            </div>
            <div class="choice-item">
                <input type="radio" name="correctAnswer" value="1">
                <input type="text" placeholder="Opsi 2" class="choice-input" required>
                <button type="button" class="btn-danger remove-choice hidden">&times;</button>
            </div>
        `;
        
        this.bindChoiceEvents();
    }

    loadQuestionToForm(questionIndex) {
        const theme = this.quizData.themes[this.currentEditingTheme];
        const question = theme.questions[questionIndex];
        
        document.getElementById('questionText').value = question.text;
        document.getElementById('questionImage').value = question.image || '';
        
        // Set question type
        document.querySelector(`input[name="questionType"][value="${question.type}"]`).checked = true;
        this.toggleQuestionType(question.type);
        
        if (question.type === 'mc') {
            const choicesContainer = document.getElementById('choicesContainer');
            choicesContainer.innerHTML = '';
            
            question.choices.forEach((choice, index) => {
                const choiceItem = document.createElement('div');
                choiceItem.className = 'choice-item';
                choiceItem.innerHTML = `
                    <input type="radio" name="correctAnswer" value="${index}" ${index === question.correctAnswer ? 'checked' : ''}>
                    <input type="text" class="choice-input" value="${choice}" required>
                    <button type="button" class="btn-danger remove-choice ${index < 2 ? 'hidden' : ''}">&times;</button>
                `;
                choicesContainer.appendChild(choiceItem);
            });
            
            this.bindChoiceEvents();
        }
    }

    bindChoiceEvents() {
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-choice').forEach(button => {
            button.addEventListener('click', function() {
                if (document.querySelectorAll('.choice-item').length > 2) {
                    this.parentElement.remove();
                    quizMaster.updateChoiceRadios();
                }
            });
        });
        
        // Add event listeners for choice inputs
        document.querySelectorAll('.choice-input').forEach(input => {
            input.addEventListener('input', () => {
                quizMaster.validateQuestionForm();
            });
        });
    }

    updateChoiceRadios() {
        document.querySelectorAll('.choice-item').forEach((item, index) => {
            const radio = item.querySelector('input[type="radio"]');
            radio.value = index;
        });
    }

    toggleQuestionType(type) {
        const mcOptions = document.getElementById('mcOptions');
        
        if (type === 'mc') {
            mcOptions.style.display = 'block';
        } else {
            mcOptions.style.display = 'none';
        }
        
        this.validateQuestionForm();
    }

    addChoiceOption() {
        const choicesContainer = document.getElementById('choicesContainer');
        const choiceCount = choicesContainer.children.length;
        
        if (choiceCount >= 6) {
            this.showError('Maksimal 6 opsi pilihan');
            return;
        }
        
        const choiceItem = document.createElement('div');
        choiceItem.className = 'choice-item';
        choiceItem.innerHTML = `
            <input type="radio" name="correctAnswer" value="${choiceCount}">
            <input type="text" placeholder="Opsi ${choiceCount + 1}" class="choice-input" required>
            <button type="button" class="btn-danger remove-choice">&times;</button>
        `;
        
        choicesContainer.appendChild(choiceItem);
        this.bindChoiceEvents();
        this.validateQuestionForm();
    }

    validateQuestionForm() {
        const questionText = document.getElementById('questionText').value.trim();
        const questionType = document.querySelector('input[name="questionType"]:checked').value;
        let isValid = questionText.length > 0;
        
        if (questionType === 'mc') {
            const choices = document.querySelectorAll('.choice-input');
            let hasEmptyChoice = false;
            let hasContent = false;
            
            choices.forEach(choice => {
                if (choice.value.trim().length === 0) {
                    hasEmptyChoice = true;
                } else {
                    hasContent = true;
                }
            });
            
            isValid = isValid && !hasEmptyChoice && hasContent && choices.length >= 2;
        }
        
        document.querySelector('#questionForm button[type="submit"]').disabled = !isValid;
    }

    saveQuestion(e) {
        e.preventDefault();
        
        const theme = this.quizData.themes[this.currentEditingTheme];
        const questionData = {
            id: this.currentEditingQuestion !== null ? 
                theme.questions[this.currentEditingQuestion].id : Date.now().toString(),
            type: document.querySelector('input[name="questionType"]:checked').value,
            text: document.getElementById('questionText').value.trim(),
            image: document.getElementById('questionImage').value.trim() || null,
            timer: 30 // Default timer
        };
        
        if (questionData.type === 'mc') {
            const choices = Array.from(document.querySelectorAll('.choice-input')).map(input => input.value.trim());
            const correctAnswer = parseInt(document.querySelector('input[name="correctAnswer"]:checked').value);
            
            questionData.choices = choices;
            questionData.correctAnswer = correctAnswer;
        } else {
            questionData.correctAnswer = null; // Essay questions don't have a predefined correct answer
        }
        
        if (this.currentEditingQuestion !== null) {
            // Edit existing question
            theme.questions[this.currentEditingQuestion] = questionData;
        } else {
            // Add new question
            if (!theme.questions) theme.questions = [];
            theme.questions.push(questionData);
        }
        
        this.saveData(this.quizData).then(() => {
            this.hideQuestionForm();
            this.renderThemeEditor();
            this.showSuccess(`Soal berhasil ${this.currentEditingQuestion !== null ? 'diperbarui' : 'ditambahkan'}`);
        });
    }

    editQuestion(questionIndex) {
        this.showQuestionForm(questionIndex);
    }

    deleteQuestion(questionIndex) {
        this.showConfirmModal(
            'Hapus Soal',
            'Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.',
            () => {
                const theme = this.quizData.themes[this.currentEditingTheme];
                theme.questions.splice(questionIndex, 1);
                
                this.saveData(this.quizData).then(() => {
                    this.renderThemeEditor();
                    this.showSuccess('Soal berhasil dihapus');
                });
            }
        );
    }

    // Leaderboards Management
    renderAdminLeaderboards() {
        const container = document.getElementById('leaderboardsList');
        
        if (this.quizData.themes.length === 0) {
            container.innerHTML = '<div class="empty-state">Belum ada tema dengan leaderboard</div>';
            return;
        }
        
        container.innerHTML = '';
        
        this.quizData.themes.forEach(theme => {
            if (!theme.leaderboard || theme.leaderboard.length === 0) {
                return;
            }
            
            const themeElement = document.createElement('div');
            themeElement.className = 'leaderboard-theme';
            themeElement.innerHTML = `
                <div class="leaderboard-theme-header">
                    <div class="leaderboard-theme-title">${theme.name} (${theme.code})</div>
                    <div class="questions-stats">
                        <div class="stat-item">${theme.leaderboard.length} Peserta</div>
                    </div>
                </div>
                <div class="leaderboard-full">
                    ${theme.leaderboard.map((entry, index) => `
                        <div class="leaderboard-full-item">
                            <div class="leaderboard-full-user">
                                <div class="leaderboard-full-rank">${index + 1}</div>
                                <div>
                                    <div>${entry.username}</div>
                                    <div class="leaderboard-full-date">
                                        ${new Date(entry.date).toLocaleDateString('id-ID')}
                                    </div>
                                </div>
                            </div>
                            <div class="leaderboard-score">${entry.score}</div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            container.appendChild(themeElement);
        });
        
        if (container.innerHTML === '') {
            container.innerHTML = '<div class="empty-state">Belum ada leaderboard yang tercatat</div>';
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizMaster = new QuizMaster();
});

// Add event listener for question form validation
document.addEventListener('input', function(e) {
    if (e.target.matches('#questionText, .choice-input')) {
        window.quizMaster.validateQuestionForm();
    }
});