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
    const customConfirmModal = document.getElementById('custom-confirm-modal');

    // --- Application State ---
    let appData = { quizzes: [], results: [] };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let totalPoints = 0; // DIUBAH: dari score ke points
    let questionCounter = 0;
    let questionTimer; // Variabel untuk interval timer

    // --- Notifikasi Kustom ---
    const showNotification = (message, type = 'info') => {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        notificationContainer.appendChild(notif);
        setTimeout(() => notif.remove(), 4000);
    };

    // PERBAIKAN 1: Modal Konfirmasi Kustom
    const showCustomConfirm = (message) => {
        return new Promise((resolve) => {
            document.getElementById('custom-confirm-text').textContent = message;
            customConfirmModal.style.display = 'flex';

            const yesBtn = document.getElementById('custom-confirm-yes');
            const noBtn = document.getElementById('custom-confirm-no');

            const listener = (e) => {
                customConfirmModal.style.display = 'none';
                yesBtn.removeEventListener('click', listener);
                noBtn.removeEventListener('click', listener);
                resolve(e.target === yesBtn);
            };

            yesBtn.addEventListener('click', listener);
            noBtn.addEventListener('click', listener);
        });
    };

    // --- Page Navigation ---
    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        // PERUBAHAN 3: Sembunyikan ikon admin selama kuis/skor
        const isQuizActive = pageId === 'quiz-page' || pageId === 'score-page';
        adminIcon.style.display = isQuizActive ? 'none' : 'flex';
    };

    const showLoader = (show) => { loader.style.display = show ? 'flex' : 'none'; };

    // --- API Interaction (Diperkuat) ---
    const fetchData = async () => { /* ... (tidak berubah) ... */ };
    const updateData = async () => { /* ... (tidak berubah) ... */ };

    // --- Quiz Logic ---
    const startQuiz = (quizCode, username) => {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) {
            showNotification('Error: Kode quiz tidak ditemukan.', 'error');
            return;
        }
        
        currentQuiz = quiz;
        currentQuestionIndex = 0;
        totalPoints = 0;
        document.getElementById('quiz-title-display').textContent = currentQuiz.title;
        showPage('quiz-page');
        displayQuestion();
    };

    const displayQuestion = () => {
        if (currentQuestionIndex >= currentQuiz.questions.length) {
            showFinalScore();
            return;
        }

        clearInterval(questionTimer); // Hentikan timer sebelumnya
        const question = currentQuiz.questions[currentQuestionIndex];
        const timeLimit = question.timer || 30; // Default 30 detik jika tidak di-set
        let timeLeft = timeLimit;

        document.getElementById('question-corner-counter').textContent = currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.text;
        
        // PERUBAHAN 1 & 2: Tampilkan dan jalankan timer
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = `00:${String(timeLeft).padStart(2, '0')}`;
        
        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `00:${String(timeLeft).padStart(2, '0')}`;
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                selectAnswer(-1, null, timeLimit); // Waktu habis, kirim jawaban salah
            }
        }, 1000);

        const answerOptions = document.getElementById('answer-options');
        answerOptions.innerHTML = '';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.textContent = option;
            button.classList.add('option-btn');
            button.addEventListener('click', () => selectAnswer(index, button, timeLimit, timeLeft));
            answerOptions.appendChild(button);
        });
    };

    // PERUBAHAN 4: Logika Skor Berdasarkan Kecepatan
    const selectAnswer = (selectedIndex, button, timeLimit, timeLeft) => {
        clearInterval(questionTimer); // Selalu hentikan timer saat jawaban dipilih
        const question = currentQuiz.questions[currentQuestionIndex];
        const correctIndex = question.answer;

        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            // Kalkulasi poin: 500 poin dasar + bonus kecepatan (maks 500)
            const pointsGained = 500 + Math.round((timeLeft / timeLimit) * 500);
            totalPoints += pointsGained;
            if(button) button.classList.add('correct');
        } else {
            if(button) button.classList.add('incorrect');
            // Highlight jawaban yang benar
            const correctBtn = document.querySelectorAll('.option-btn')[correctIndex];
            if(correctBtn) correctBtn.classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 1500);
    };

    const showFinalScore = async () => {
        document.getElementById('final-score').textContent = totalPoints;
        showPage('score-page');

        const newResult = {
            username: document.getElementById('username').value,
            quizCode: currentQuiz.code,
            points: totalPoints, // Simpan poin
            timestamp: new Date().toISOString()
        };
        appData.results.push(newResult);
        await updateData(); // PERUBAHAN 6: Pastikan data selalu tersimpan
    };

    // --- Admin Logic ---
    const renderAdminPanel = () => {
        const quizListContainer = document.getElementById('quiz-list');
        quizListContainer.innerHTML = '';
        if (!appData.quizzes || appData.quizzes.length === 0) {
            quizListContainer.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
            return;
        }
        appData.quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.classList.add('quiz-item');
            // PERUBAHAN 5: Tampilkan poin di daftar hasil admin
            const quizResults = appData.results.filter(r => r.quizCode === quiz.code)
                                      .sort((a, b) => b.points - a.points);
            const playerList = quizResults.map(r => `<li>${r.username}: ${r.points} poin</li>`).join('');

            quizItem.innerHTML = `<h4>${quiz.title} (Kode: ${quiz.code})</h4> ... <button class="btn delete-quiz-btn" data-code="${quiz.code}">Hapus</button> ... <ul>${playerList || '<li>Belum ada pemain.</li>'}</ul>`;
            quizListContainer.appendChild(quizItem);
        });
            
        document.querySelectorAll('.delete-quiz-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const quizCode = e.target.getAttribute('data-code');
                const confirmed = await showCustomConfirm(`Anda yakin ingin menghapus quiz dengan kode ${quizCode}?`);
                if (confirmed) {
                    appData.quizzes = appData.quizzes.filter(q => q.code !== quizCode);
                    appData.results = appData.results.filter(r => r.quizCode !== quizCode);
                    await updateData();
                    renderAdminPanel();
                    renderGlobalLeaderboard();
                    showNotification(`Quiz ${quizCode} berhasil dihapus.`, 'success');
                }
            });
        });
        renderGlobalLeaderboard();
    };

    // PERUBAHAN 5: Leaderboard berdasarkan total poin
    const renderGlobalLeaderboard = () => {
        const leaderboardContainer = document.getElementById('global-leaderboard');
        if (!appData.results || appData.results.length === 0) {
            leaderboardContainer.innerHTML = '<p>Belum ada hasil kuis.</p>';
            return;
        }
        
        const userPoints = {};
        appData.results.forEach(result => {
            if (!userPoints[result.username]) {
                userPoints[result.username] = { totalPoints: 0, quizCount: 0 };
            }
            userPoints[result.username].totalPoints += result.points;
            userPoints[result.username].quizCount++;
        });
        
        const leaderboard = Object.entries(userPoints).map(([username, data]) => ({
            username,
            totalPoints: data.totalPoints,
            quizCount: data.quizCount
        }));
        
        leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
        
        leaderboardContainer.innerHTML = leaderboard.slice(0, 10).map((user, index) => `
            <div class="leaderboard-item"> ... <strong>${user.username}</strong> ... <div class="leaderboard-score">${user.totalPoints} Poin</div> ... </div>
        `).join('');
    };

    const addQuestionField = () => {
        questionCounter++;
        const div = document.createElement('div');
        div.classList.add('question-block');
        div.innerHTML = `
            <h5>Pertanyaan ${questionCounter}</h5>
            <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" required>
            <input type="number" class="input-field question-timer" placeholder="Waktu (detik), cth: 30" value="30" required>
            <input type="text" class="input-field option" placeholder="Opsi 1" required>
            <input type="text" class="input-field option" placeholder="Opsi 2" required>
            <input type="text" class="input-field option" placeholder="Opsi 3" required>
            <input type="text" class="input-field option" placeholder="Opsi 4" required>
            <div class="correct-answer-selector">
                <div class="form-label">Jawaban Benar:</div>
                <div class="answer-choice-container">
                    <button type="button" class="answer-choice-btn" data-value="0">Opsi 1</button>
                    <button type="button" class="answer-choice-btn" data-value="1">Opsi 2</button>
                    <button type="button" class="answer-choice-btn" data-value="2">Opsi 3</button>
                    <button type="button" class="answer-choice-btn" data-value="3">Opsi 4</button>
                </div>
            </div>
            <input type="hidden" class="correct-answer-input" required>
        `;
        document.getElementById('questions-container').appendChild(div);

        // Event listener untuk custom answer selector
        div.querySelector('.answer-choice-container').addEventListener('click', (e) => {
            if (e.target.matches('.answer-choice-btn')) {
                const container = e.target.parentElement;
                container.querySelectorAll('.answer-choice-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                container.closest('.question-block').querySelector('.correct-answer-input').value = e.target.dataset.value;
            }
        });
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-quiz-title').value;
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');
        
        let isValid = true;
        questionBlocks.forEach(block => {
            const answer = block.querySelector('.correct-answer-input').value;
            if (answer === "") isValid = false;
            
            questions.push({
                text: block.querySelector('.question-text').value,
                timer: parseInt(block.querySelector('.question-timer').value, 10),
                options: Array.from(block.querySelectorAll('.option')).map(opt => opt.value),
                answer: parseInt(answer)
            });
        });

        if (!isValid) {
            showNotification('Pastikan semua field dan jawaban benar telah diisi.', 'error');
            return;
        }

        const newQuiz = { title, code: `QM${Math.random().toString(36).substr(2, 5).toUpperCase()}`, questions };
        appData.quizzes.push(newQuiz);
        await updateData();
        showNotification(`Quiz berhasil dibuat! Kode: ${newQuiz.code}`, 'success');
        // ... reset form ...
    };

    // --- Event Listeners & Initialization ---
    // ... (Sebagian besar tidak berubah, hanya inisialisasi awal) ...
    const initializeApp = async () => {
        await fetchData();
        showPage('landing-page');
        addQuestionField();
    };

    initializeApp();
});
