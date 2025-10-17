document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const JSONBIN_API = {
        baseURL: 'https://api.jsonbin.io/v3/b',
        binId: '6658145ee41b4d34e4fa4411',
        accessKey: '$2a$10$T.eHULy6ck/GKr48zzsI2OKfuZA.KsVl.kwHHEoiJEEf/abmhaNZm',
        masterKey: '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG'
    };
    
    // --- DOM Elements ---
    const pages = document.querySelectorAll('.page');
    const landingPage = document.getElementById('landing-page');
    const playerEntryPage = document.getElementById('player-entry-page');
    const quizPage = document.getElementById('quiz-page');
    const scorePage = document.getElementById('score-page');
    const adminPanel = document.getElementById('admin-panel');

    const startBtn = document.getElementById('start-btn');
    const backToLandingBtn = document.getElementById('back-to-landing-btn');
    const playerForm = document.getElementById('player-form');
    const usernameInput = document.getElementById('username');
    const quizCodeInput = document.getElementById('quiz-code');
    
    const adminIcon = document.getElementById('admin-icon');
    const adminLoginPopup = document.getElementById('admin-login-popup');
    const closeBtn = document.querySelector('.close-btn');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    const createQuizForm = document.getElementById('create-quiz-form');
    const questionsContainer = document.getElementById('questions-container');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const quizListContainer = document.getElementById('quiz-list');

    const loader = document.getElementById('loader');

    // --- Application State ---
    let appData = {
        quizzes: [],
        results: []
    };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let questionCounter = 0;

    // --- Page Navigation ---
    const showPage = (pageId) => {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        adminIcon.style.display = (pageId === 'admin-panel' || pageId === 'quiz-page') ? 'none' : 'block';
    };

    // --- Loader ---
    const showLoader = (show) => {
        loader.style.display = show ? 'flex' : 'none';
    };

    // --- API Interaction ---
    const fetchData = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_API.baseURL}/${JSONBIN_API.binId}/latest`, {
                headers: { 'X-Master-Key': JSONBIN_API.masterKey }
            });
            if (!response.ok) throw new Error('Failed to fetch data.');
            const data = await response.json();
            appData = data.record;
        } catch (error) {
            console.error('Error fetching data:', error);
            // Initialize with empty structure if bin is empty or new
            appData = { quizzes: [], results: [] };
        } finally {
            showLoader(false);
        }
    };

    const updateData = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_API.baseURL}/${JSONBIN_API.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API.masterKey,
                },
                body: JSON.stringify(appData)
            });
            if (!response.ok) throw new Error('Failed to update data.');
        } catch (error) {
            console.error('Error updating data:', error);
            alert('Gagal menyimpan data ke server.');
        } finally {
            showLoader(false);
        }
    };

    // --- Quiz Logic ---
    const startQuiz = (quizCode, username) => {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) {
            alert('Error: Kode quiz tidak ditemukan.');
            return;
        }

        // Check player limits
        const currentPlayers = appData.results.filter(result => result.quizCode === quizCode).length;
        const minPlayers = quiz.minPlayers || 3;
        const maxPlayers = quiz.maxPlayers;
        
        if (currentPlayers < minPlayers - 1) { // -1 because current player hasn't been added yet
            const needed = minPlayers - currentPlayers - 1;
            alert(`Quiz ini membutuhkan minimal ${minPlayers} pemain. Masih butuh ${needed} pemain lagi.`);
            return;
        }
        
        if (maxPlayers && currentPlayers >= maxPlayers) {
            alert(`Quiz ini sudah mencapai batas maksimal ${maxPlayers} pemain.`);
            return;
        }

        const isUsernameTaken = appData.results.some(
            result => result.quizCode === quizCode && result.username.toLowerCase() === username.toLowerCase()
        );
        if (isUsernameTaken) {
            alert('Username ini sudah digunakan untuk quiz ini. Gunakan nama lain.');
            return;
        }
        
        currentQuiz = quiz;
        currentQuestionIndex = 0;
        score = 0;
        document.getElementById('quiz-title-display').textContent = currentQuiz.title;
        showPage('quiz-page');
        displayQuestion();
    };

    const displayQuestion = () => {
        if (currentQuestionIndex >= currentQuiz.questions.length) {
            showFinalScore();
            return;
        }

        const question = currentQuiz.questions[currentQuestionIndex];
        document.getElementById('question-number').textContent = `Pertanyaan ${currentQuestionIndex + 1}/${currentQuiz.questions.length}`;
        document.getElementById('question-text').textContent = question.text;
        
        const questionImage = document.getElementById('question-image');
        if (question.image && question.image.trim() !== '') {
            questionImage.src = question.image;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        const answerOptions = document.getElementById('answer-options');
        answerOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(index, button));
            answerOptions.appendChild(button);
        });
    };

    const selectAnswer = (selectedIndex, button) => {
        const question = currentQuiz.questions[currentQuestionIndex];
        const correctIndex = question.answer;

        // Disable all buttons after an answer is selected
        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            score++;
            button.classList.add('correct');
        } else {
            button.classList.add('incorrect');
            // Highlight the correct answer
            document.querySelectorAll('.option-btn')[correctIndex].classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500); // Wait 1.5 seconds before next question
    };

    const showFinalScore = async () => {
        const correctAnswers = score;
        const totalQuestions = currentQuiz.questions.length;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        document.getElementById('final-score').textContent = `${percentage}%`;
        document.getElementById('score-details').textContent = `${correctAnswers} dari ${totalQuestions} soal benar`;
        
        showPage('score-page');

        const newResult = {
            username: usernameInput.value,
            quizCode: currentQuiz.code,
            score: percentage,
            correctAnswers: correctAnswers,
            totalQuestions: totalQuestions,
            timestamp: new Date().toISOString()
        };
        appData.results.push(newResult);
        await updateData();
    };

    // --- Enhanced Admin Logic ---
    const renderAdminPanel = () => {
        quizListContainer.innerHTML = '';
        if (appData.quizzes.length === 0) {
            quizListContainer.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
        } else {
            appData.quizzes.forEach(quiz => {
                const quizItem = document.createElement('div');
                quizItem.classList.add('quiz-item');
                
                const quizResults = appData.results.filter(r => r.quizCode === quiz.code);
                const playerList = quizResults.map(r => `<li>${r.username}: ${r.score}%</li>`).join('');
                
                // Calculate player count for this quiz
                const playerCount = quizResults.length;
                const minPlayers = quiz.minPlayers || 3;
                const maxPlayers = quiz.maxPlayers || 'Tidak terbatas';
                
                quizItem.innerHTML = `
                    <div class="quiz-item-header">
                        <h4>${quiz.title} (Kode: ${quiz.code})</h4>
                        <div class="quiz-controls">
                            <button class="btn delete-quiz-btn" data-code="${quiz.code}">Hapus</button>
                        </div>
                    </div>
                    <div class="quiz-meta">
                        <div class="quiz-stats">
                            <span>Pertanyaan: ${quiz.questions.length}</span> | 
                            <span>Pemain: ${playerCount}</span> |
                            <span>Batas: ${minPlayers}-${maxPlayers}</span>
                        </div>
                    </div>
                    <details>
                        <summary>Lihat Hasil Pemain (${quizResults.length})</summary>
                        <ul>${playerList || '<li>Belum ada pemain.</li>'}</ul>
                    </details>
                `;
                quizListContainer.appendChild(quizItem);
            });
            
            // Add event listeners for delete buttons
            document.querySelectorAll('.delete-quiz-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const quizCode = e.target.getAttribute('data-code');
                    if (confirm(`Anda yakin ingin menghapus quiz dengan kode ${quizCode}?`)) {
                        appData.quizzes = appData.quizzes.filter(q => q.code !== quizCode);
                        appData.results = appData.results.filter(r => r.quizCode !== quizCode);
                        await updateData();
                        renderAdminPanel();
                        renderGlobalLeaderboard();
                    }
                });
            });
        }
        
        // Render global leaderboard
        renderGlobalLeaderboard();
    };

    // Global leaderboard function
    const renderGlobalLeaderboard = () => {
        const leaderboardContainer = document.getElementById('global-leaderboard');
        
        if (appData.results.length === 0) {
            leaderboardContainer.innerHTML = '<p>Belum ada hasil kuis.</p>';
            return;
        }
        
        // Calculate average scores per user
        const userScores = {};
        appData.results.forEach(result => {
            if (!userScores[result.username]) {
                userScores[result.username] = {
                    totalScore: 0,
                    quizCount: 0
                };
            }
            userScores[result.username].totalScore += result.score;
            userScores[result.username].quizCount++;
        });
        
        // Calculate average and create leaderboard array
        const leaderboard = Object.entries(userScores).map(([username, data]) => ({
            username,
            averageScore: Math.round(data.totalScore / data.quizCount),
            quizCount: data.quizCount
        }));
        
        // Sort by average score (descending)
        leaderboard.sort((a, b) => b.averageScore - a.averageScore);
        
        // Render leaderboard
        leaderboardContainer.innerHTML = leaderboard.slice(0, 10).map((user, index) => `
            <div class="leaderboard-item">
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-user">
                    <strong>${user.username}</strong>
                    <div style="font-size: 0.8rem; opacity: 0.8;">${user.quizCount} kuis</div>
                </div>
                <div class="leaderboard-score">${user.averageScore}%</div>
            </div>
        `).join('');
    };

    // Enhanced add question function with delete capability
    const addQuestionField = () => {
        questionCounter++;
        const div = document.createElement('div');
        div.classList.add('question-block');
        div.innerHTML = `
            <div class="question-actions">
                <button type="button" class="delete-question-btn" data-id="${questionCounter}">Hapus</button>
            </div>
            <h5>Pertanyaan ${questionCounter}</h5>
            <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" required>
            <input type="url" class="input-field question-image" placeholder="URL Gambar (Opsional)">
            <input type="text" class="input-field option" placeholder="Opsi 1" required>
            <input type="text" class="input-field option" placeholder="Opsi 2" required>
            <input type="text" class="input-field option" placeholder="Opsi 3" required>
            <input type="text" class="input-field option" placeholder="Opsi 4" required>
            <select class="input-field correct-answer" required>
                <option value="">-- Pilih Jawaban Benar --</option>
                <option value="0">Opsi 1</option>
                <option value="1">Opsi 2</option>
                <option value="2">Opsi 3</option>
                <option value="3">Opsi 4</option>
            </select>
        `;
        questionsContainer.appendChild(div);
        
        // Add event listener for delete question button
        div.querySelector('.delete-question-btn').addEventListener('click', function() {
            if (questionsContainer.children.length > 1) {
                this.closest('.question-block').remove();
                // Reorder question numbers
                reorderQuestionNumbers();
            } else {
                alert('Quiz harus memiliki minimal 1 pertanyaan!');
            }
        });
    };

    // Reorder question numbers after deletion
    const reorderQuestionNumbers = () => {
        const questionBlocks = document.querySelectorAll('.question-block');
        questionBlocks.forEach((block, index) => {
            block.querySelector('h5').textContent = `Pertanyaan ${index + 1}`;
        });
        questionCounter = questionBlocks.length;
    };

    // Enhanced create quiz function with custom code and player limits
    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-quiz-title').value;
        const customCode = document.getElementById('custom-quiz-code').value.trim();
        const minPlayers = parseInt(document.getElementById('min-players').value) || 3;
        const maxPlayersInput = document.getElementById('max-players').value;
        const maxPlayers = maxPlayersInput ? parseInt(maxPlayersInput) : null;
        
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');

        if (questionBlocks.length === 0) {
            alert('Tambahkan minimal satu pertanyaan.');
            return;
        }
        
        if (questionBlocks.length < 5) {
            alert('Quiz harus memiliki minimal 5 pertanyaan!');
            return;
        }

        // Validate player limits
        if (maxPlayers && maxPlayers < minPlayers) {
            alert('Batas maksimal pemain tidak boleh kurang dari batas minimal!');
            return;
        }

        questionBlocks.forEach(block => {
            const text = block.querySelector('.question-text').value;
            const image = block.querySelector('.question-image').value;
            const options = Array.from(block.querySelectorAll('.option')).map(opt => opt.value);
            const answer = parseInt(block.querySelector('.correct-answer').value);
            
            // Validate that all options are filled
            if (options.some(opt => !opt.trim())) {
                alert('Semua opsi jawaban harus diisi!');
                return;
            }
            
            questions.push({ text, image, options, answer });
        });

        // Generate code or use custom code
        let quizCode;
        if (customCode) {
            // Check if custom code already exists
            if (appData.quizzes.some(q => q.code === customCode)) {
                alert('Kode quiz sudah digunakan. Silakan gunakan kode lain.');
                return;
            }
            quizCode = customCode.toUpperCase();
        } else {
            quizCode = `QM${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        }

        const newQuiz = {
            title,
            code: quizCode,
            questions,
            minPlayers,
            maxPlayers,
            createdAt: new Date().toISOString()
        };

        appData.quizzes.push(newQuiz);
        await updateData();
        alert(`Quiz berhasil dibuat! Kode quiz: ${newQuiz.code}`);
        createQuizForm.reset();
        questionsContainer.innerHTML = '';
        questionCounter = 0;
        addQuestionField(); // Add one default question
        renderAdminPanel();
    };

    // --- Admin Logic ---
    const openAdminLogin = () => {
        adminLoginPopup.style.display = 'flex';
    };

    const closeAdminLogin = () => {
        adminLoginPopup.style.display = 'none';
    };

    const handleAdminLogin = (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        if (username === 'admin' && password === 'quizmaster123') {
            closeAdminLogin();
            showPage('admin-panel');
            renderAdminPanel();
        } else {
            alert('Username atau Password salah!');
        }
    };

    // --- Event Listeners ---
    startBtn.addEventListener('click', () => showPage('player-entry-page'));
    backToLandingBtn.addEventListener('click', () => showPage('landing-page'));
    document.getElementById('back-to-home-btn').addEventListener('click', () => showPage('landing-page'));
    adminIcon.addEventListener('click', openAdminLogin);
    closeBtn.addEventListener('click', closeAdminLogin);
    window.addEventListener('click', (e) => {
        if (e.target === adminLoginPopup) closeAdminLogin();
    });

    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const quizCode = quizCodeInput.value.trim();
        if (username && quizCode) {
            startQuiz(quizCode, username);
        } else {
            alert('Username dan kode quiz tidak boleh kosong.');
        }
    });

    adminLoginForm.addEventListener('submit', handleAdminLogin);
    adminLogoutBtn.addEventListener('click', () => showPage('landing-page'));
    addQuestionBtn.addEventListener('click', addQuestionField);
    createQuizForm.addEventListener('submit', handleCreateQuiz);

    // --- Initialization ---
    const initializeApp = async () => {
        await fetchData();
        showPage('landing-page');
        addQuestionField(); // Add one question field by default for admin
        renderGlobalLeaderboard();
    };

    initializeApp();
});