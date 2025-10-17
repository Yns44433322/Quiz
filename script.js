document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const JSONBIN_API = {
        baseURL: 'https://api.jsonbin.io/v3/b',
        binId: '6658145ee41b4d34e4fa4411',
        masterKey: '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG'
    };
    
    // --- DOM Elements ---
    const pages = document.querySelectorAll('.page');
    const adminIcon = document.getElementById('admin-icon');
    const loader = document.getElementById('loader');
    const notificationContainer = document.getElementById('notification-container');
    // Page specific elements
    const playerForm = document.getElementById('player-form');
    const usernameInput = document.getElementById('username');
    const quizCodeInput = document.getElementById('quiz-code');
    const adminLoginForm = document.getElementById('admin-login-form');
    const createQuizForm = document.getElementById('create-quiz-form');
    const questionsContainer = document.getElementById('questions-container');
    const quizListContainer = document.getElementById('quiz-list');
    const remedialContainer = document.getElementById('remedial-container');

    // --- Application State ---
    let appData = { quizzes: [], results: [] };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let score = 0;
    let questionCounter = 0;
    let correctStreak = 0;
    let earnedRemedial = false;
    let incorrectAnswers = [];

    // --- PERBAIKAN 5: Sistem Notifikasi Kustom ---
    const showNotification = (message, type = 'info') => { // types: info, success, error
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        notificationContainer.appendChild(notif);
        setTimeout(() => {
            notif.remove();
        }, 4000); // Notifikasi hilang setelah 4 detik
    };

    // --- Page Navigation ---
    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
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
            appData = { quizzes: [], results: [] };
        } finally {
            showLoader(false);
        }
    };

    // --- PERBAIKAN 3: Update Data dibuat "Senyap" ---
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
            // Gagal menyimpan tidak akan menampilkan alert, hanya log di console
            console.error('Error updating data:', error);
        } finally {
            showLoader(false);
        }
    };

    // --- Quiz Logic ---
    const startQuiz = (quiz, username, isRemedial = false) => {
        if (!isRemedial) {
            const originalQuiz = appData.quizzes.find(q => q.code === quiz.code);
            if (!originalQuiz) {
                showNotification('Error: Kode quiz tidak ditemukan.', 'error');
                return;
            }
             const isUsernameTaken = appData.results.some(
                result => result.quizCode === quiz.code && result.username.toLowerCase() === username.toLowerCase()
            );
            if (isUsernameTaken) {
                showNotification('Username ini sudah digunakan. Gunakan nama lain.', 'error');
                return;
            }
        }

        currentQuiz = quiz;
        currentQuestionIndex = 0;
        score = 0; // Reset score for the new quiz/remedial
        if (!isRemedial) { // Reset state hanya jika bukan kuis perbaikan
            correctStreak = 0;
            earnedRemedial = false;
            incorrectAnswers = [];
        }
        
        document.getElementById('quiz-title-display').textContent = isRemedial ? `${currentQuiz.title} (Perbaikan)` : currentQuiz.title;
        showPage('quiz-page');
        displayQuestion();
    };

    const displayQuestion = () => {
        if (currentQuestionIndex >= currentQuiz.questions.length) {
            showFinalScore();
            return;
        }

        const question = currentQuiz.questions[currentQuestionIndex];
        // PERBAIKAN 1: Update nomor soal di pojok
        document.getElementById('question-corner-counter').textContent = currentQuestionIndex + 1;
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

        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            score++;
            button.classList.add('correct');
            correctStreak++;
            if (correctStreak >= 5) {
                earnedRemedial = true; // Dapat lencana/kesempatan perbaikan
            }
        } else {
            button.classList.add('incorrect');
            document.querySelectorAll('.option-btn')[correctIndex].classList.add('correct');
            correctStreak = 0; // Reset streak
            // Simpan soal yang salah untuk perbaikan
            incorrectAnswers.push(question);
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    };

    // --- PERBAIKAN 2: Logika Halaman Skor Baru ---
    const showFinalScore = async () => {
        const totalQuestions = currentQuiz.questions.length;
        const correctAnswers = score;
        const wrongAnswers = totalQuestions - correctAnswers;

        document.getElementById('score-details').innerHTML = `
            <span class="correct-count">Benar: ${correctAnswers} soal</span>
            <span class="incorrect-count">Salah: ${wrongAnswers} soal</span>
        `;
        
        remedialContainer.innerHTML = ''; // Kosongkan kontainer perbaikan
        if (earnedRemedial && incorrectAnswers.length > 0) {
            showNotification('Selamat! Anda mendapat kesempatan perbaikan soal.', 'success');
            const remedialBtn = document.createElement('button');
            remedialBtn.textContent = 'Pilih 3 Soal Perbaikan';
            remedialBtn.className = 'btn btn-secondary';
            remedialBtn.onclick = () => {
                // Ambil 3 soal salah secara acak
                const shuffledWrong = incorrectAnswers.sort(() => 0.5 - Math.random());
                const remedialQuestions = shuffledWrong.slice(0, 3);
                
                const remedialQuiz = {
                    title: currentQuiz.title,
                    questions: remedialQuestions
                };
                startQuiz(remedialQuiz, usernameInput.value.trim(), true); // Mulai kuis perbaikan
            };
            remedialContainer.appendChild(remedialBtn);
        }
        
        showPage('score-page');

        // Simpan hasil kuis utama (bukan perbaikan)
        if (!currentQuiz.isRemedial) {
            const newResult = {
                username: usernameInput.value,
                quizCode: currentQuiz.code,
                score: Math.round((correctAnswers / totalQuestions) * 100), // Skor persen tetap disimpan di DB
                correctAnswers: correctAnswers,
                totalQuestions: totalQuestions,
                timestamp: new Date().toISOString()
            };
            appData.results.push(newResult);
            await updateData();
        }
    };

    // --- Enhanced Admin Logic ---
    const renderAdminPanel = () => {
        quizListContainer.innerHTML = '';
        if (!appData.quizzes || appData.quizzes.length === 0) {
            quizListContainer.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
        } else {
            appData.quizzes.forEach(quiz => {
                const quizItem = document.createElement('div');
                quizItem.classList.add('quiz-item');
                const quizResults = appData.results.filter(r => r.quizCode === quiz.code);
                const playerList = quizResults.map(r => `<li>${r.username}: ${r.score}%</li>`).join('');
                
                quizItem.innerHTML = `
                    <div class="quiz-item-header">
                        <h4>${quiz.title} (Kode: ${quiz.code})</h4>
                        <div class="quiz-controls">
                            <button class="btn delete-quiz-btn" data-code="${quiz.code}">Hapus</button>
                        </div>
                    </div>
                    <div class="quiz-meta">
                        <div class="quiz-stats">
                            <span>Soal: ${quiz.questions.length}</span> | 
                            <span>Pemain: ${quizResults.length}</span>
                        </div>
                    </div>
                    <details>
                        <summary>Lihat Hasil (${quizResults.length})</summary>
                        <ul>${playerList || '<li>Belum ada pemain.</li>'}</ul>
                    </details>
                `;
                quizListContainer.appendChild(quizItem);
            });
            
            document.querySelectorAll('.delete-quiz-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const quizCode = e.target.getAttribute('data-code');
                    if (confirm(`Anda yakin ingin menghapus quiz dengan kode ${quizCode}?`)) {
                        appData.quizzes = appData.quizzes.filter(q => q.code !== quizCode);
                        appData.results = appData.results.filter(r => r.quizCode !== quizCode);
                        await updateData();
                        renderAdminPanel();
                        renderGlobalLeaderboard();
                        showNotification(`Quiz ${quizCode} berhasil dihapus.`, 'success');
                    }
                });
            });
        }
        renderGlobalLeaderboard();
    };

    const renderGlobalLeaderboard = () => {
        const leaderboardContainer = document.getElementById('global-leaderboard');
        if (!appData.results || appData.results.length === 0) {
            leaderboardContainer.innerHTML = '<p>Belum ada hasil kuis.</p>';
            return;
        }
        
        const userScores = {};
        appData.results.forEach(result => {
            if (!userScores[result.username]) {
                userScores[result.username] = { totalScore: 0, quizCount: 0 };
            }
            userScores[result.username].totalScore += result.score;
            userScores[result.username].quizCount++;
        });
        
        const leaderboard = Object.entries(userScores).map(([username, data]) => ({
            username,
            averageScore: Math.round(data.totalScore / data.quizCount),
            quizCount: data.quizCount
        }));
        
        leaderboard.sort((a, b) => b.averageScore - a.averageScore);
        
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
        
        div.querySelector('.delete-question-btn').addEventListener('click', function() {
            if (questionsContainer.children.length > 1) {
                this.closest('.question-block').remove();
                reorderQuestionNumbers();
            } else {
                showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            }
        });
    };

    const reorderQuestionNumbers = () => {
        const questionBlocks = document.querySelectorAll('.question-block');
        questionBlocks.forEach((block, index) => {
            block.querySelector('h5').textContent = `Pertanyaan ${index + 1}`;
        });
        questionCounter = questionBlocks.length;
    };
    
    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-quiz-title').value;
        const customCode = document.getElementById('custom-quiz-code').value.trim();
        
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');

        if (questionBlocks.length === 0) {
            showNotification('Tambahkan minimal satu pertanyaan.', 'error');
            return;
        }

        let isValid = true;
        questionBlocks.forEach(block => {
            const text = block.querySelector('.question-text').value.trim();
            const options = Array.from(block.querySelectorAll('.option')).map(opt => opt.value.trim());
            const answer = block.querySelector('.correct-answer').value;

            if (!text || options.some(opt => !opt) || answer === "") {
                isValid = false;
            }
            questions.push({ 
                text, 
                image: block.querySelector('.question-image').value.trim(), 
                options, 
                answer: parseInt(answer) 
            });
        });

        if (!isValid) {
            showNotification('Pastikan semua field pertanyaan dan opsi terisi.', 'error');
            return;
        }
        
        let quizCode;
        if (customCode) {
            if (appData.quizzes.some(q => q.code === customCode.toUpperCase())) {
                showNotification('Kode quiz sudah digunakan. Gunakan kode lain.', 'error');
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
            createdAt: new Date().toISOString()
        };

        appData.quizzes.push(newQuiz);
        await updateData();
        showNotification(`Quiz berhasil dibuat! Kode: ${newQuiz.code}`, 'success');
        createQuizForm.reset();
        questionsContainer.innerHTML = '';
        questionCounter = 0;
        addQuestionField();
        renderAdminPanel();
    };

    const handleAdminLogin = (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        if (username === 'admin' && password === 'quizmaster123') {
            document.getElementById('admin-login-popup').style.display = 'none';
            showPage('admin-panel');
            renderAdminPanel();
        } else {
            showNotification('Username atau Password salah!', 'error');
        }
    };

    // --- Event Listeners ---
    document.getElementById('start-btn').addEventListener('click', () => showPage('player-entry-page'));
    document.getElementById('back-to-landing-btn').addEventListener('click', () => showPage('landing-page'));
    document.getElementById('back-to-home-btn').addEventListener('click', () => showPage('landing-page'));
    adminIcon.addEventListener('click', () => document.getElementById('admin-login-popup').style.display = 'flex');
    document.querySelector('.close-btn').addEventListener('click', () => document.getElementById('admin-login-popup').style.display = 'none');
    document.getElementById('admin-logout-btn').addEventListener('click', () => showPage('landing-page'));
    document.getElementById('add-question-btn').addEventListener('click', addQuestionField);
    
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const quizCode = quizCodeInput.value.trim().toUpperCase();
        if (username && quizCode) {
            const quizToStart = appData.quizzes.find(q => q.code === quizCode);
            if(quizToStart) {
                startQuiz(quizToStart, username);
            } else {
                showNotification('Kode quiz tidak valid.', 'error');
            }
        } else {
            showNotification('Username dan kode quiz tidak boleh kosong.', 'error');
        }
    });

    adminLoginForm.addEventListener('submit', handleAdminLogin);
    createQuizForm.addEventListener('submit', handleCreateQuiz);

    // --- Initialization ---
    const initializeApp = async () => {
        await fetchData();
        showPage('landing-page');
        addQuestionField();
        renderGlobalLeaderboard();
    };

    initializeApp();
});
