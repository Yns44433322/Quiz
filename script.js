document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const JSONBIN_API = {
        baseURL: 'https://api.jsonbin.io/v3/b',
        binId: '68e5a3d743b1c97be95e228b',
        masterKey: '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG',
        accessKey: '$2a$10$T.eHULy6ck/GKr48zzsI2OKfuZA.KsVl.kwHHEoiJEEf/abmhaNZm'
    };
    
    // --- DOM Elements ---
    const pages = document.querySelectorAll('.page');
    const adminIcon = document.getElementById('admin-icon');
    const loader = document.getElementById('loader');
    const notificationContainer = document.getElementById('notification-container');
    const customConfirmModal = document.getElementById('custom-confirm-modal');
    const playerForm = document.getElementById('player-form');
    const usernameInput = document.getElementById('username');
    const quizCodeInput = document.getElementById('quiz-code');
    const adminLoginForm = document.getElementById('admin-login-form');
    const createQuizForm = document.getElementById('create-quiz-form');
    const questionsContainer = document.getElementById('questions-container');
    const quizListContainer = document.getElementById('quiz-list');
    
    // Elemen untuk edit quiz
    const editQuizModal = document.getElementById('edit-quiz-modal');
    const editQuizForm = document.getElementById('edit-quiz-form');
    const editQuestionsContainer = document.getElementById('edit-questions-container');
    const editQuizTitle = document.getElementById('edit-quiz-title');
    const editQuizCode = document.getElementById('edit-quiz-code');
    const editAddQuestionBtn = document.getElementById('edit-add-question-btn');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    // --- Application State ---
    let appData = { quizzes: [], results: [] };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let totalPoints = 0;
    let questionCounter = 0;
    let questionTimer;
    let editingQuiz = null; // Menyimpan quiz yang sedang diedit
    let editQuestionCounter = 0; // Counter untuk pertanyaan di modal edit

    // --- Notifikasi Kustom ---
    const showNotification = (message, type = 'info') => {
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        notificationContainer.appendChild(notif);
        setTimeout(() => notif.remove(), 4000);
    };

    // --- Modal Konfirmasi Kustom ---
    const showCustomConfirm = (message) => {
        return new Promise((resolve) => {
            document.getElementById('custom-confirm-text').textContent = message;
            customConfirmModal.style.display = 'flex';

            const yesBtn = document.getElementById('custom-confirm-yes');
            const noBtn = document.getElementById('custom-confirm-no');

            const cleanUp = (result) => {
                customConfirmModal.style.display = 'none';
                yesBtn.removeEventListener('click', yesListener);
                noBtn.removeEventListener('click', noListener);
                resolve(result);
            };

            const yesListener = () => cleanUp(true);
            const noListener = () => cleanUp(false);

            yesBtn.addEventListener('click', yesListener);
            noBtn.addEventListener('click', noListener);
        });
    };

    // --- Page Navigation ---
    const showPage = (pageId) => {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        const isQuizActive = pageId === 'quiz-page' || pageId === 'score-page' || pageId === 'admin-panel';
        adminIcon.style.display = isQuizActive ? 'none' : 'flex';
    };

    const showLoader = (show) => { loader.style.display = show ? 'flex' : 'none'; };

    // --- API Interaction ---
    const fetchData = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_API.baseURL}/${JSONBIN_API.binId}/latest`, {
                headers: { 
                    'X-Master-Key': JSONBIN_API.masterKey,
                    'X-Access-Key': JSONBIN_API.accessKey
                }
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

    const updateData = async () => {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_API.baseURL}/${JSONBIN_API.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_API.masterKey,
                    'X-Access-Key': JSONBIN_API.accessKey
                },
                body: JSON.stringify(appData)
            });
            if (!response.ok) throw new Error('Failed to update data.');
        } catch (error) {
            console.error('Error updating data:', error);
            showNotification('Gagal menyimpan data ke server.', 'error');
        } finally {
            showLoader(false);
        }
    };

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

        clearInterval(questionTimer);
        const question = currentQuiz.questions[currentQuestionIndex];
        const timeLimit = question.timer || 30;
        let timeLeft = timeLimit;

        document.getElementById('question-corner-counter').textContent = currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.text;
        
        const questionImage = document.getElementById('question-image');
        if (question.image && question.image.trim() !== '') {
            questionImage.src = question.image;
            questionImage.style.display = 'block';
            questionImage.classList.add('question-image-loaded');
        } else {
            questionImage.style.display = 'none';
            questionImage.classList.remove('question-image-loaded');
        }

        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = `00:${String(timeLeft).padStart(2, '0')}`;
        
        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `00:${String(timeLeft).padStart(2, '0')}`;
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                selectAnswer(-1, null, timeLimit, 0); // Waktu habis
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

    const selectAnswer = (selectedIndex, button, timeLimit, timeLeft) => {
        clearInterval(questionTimer);
        const question = currentQuiz.questions[currentQuestionIndex];
        const correctIndex = question.answer;

        document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

        if (selectedIndex === correctIndex) {
            const pointsGained = 500 + Math.round((timeLeft / timeLimit) * 500);
            totalPoints += pointsGained;
            if (button) button.classList.add('correct');
        } else {
            if (button) button.classList.add('incorrect');
            const correctBtn = document.querySelectorAll('.option-btn')[correctIndex];
            if (correctBtn) correctBtn.classList.add('correct');
        }

        setTimeout(() => {
            currentQuestionIndex++;
            displayQuestion();
        }, 2000);
    };

    const showFinalScore = async () => {
        document.getElementById('final-score').textContent = totalPoints;
        document.getElementById('score-details').textContent = `Kamu telah menyelesaikan kuis "${currentQuiz.title}".`;
        showPage('score-page');

        const newResult = {
            username: usernameInput.value,
            quizCode: currentQuiz.code,
            points: totalPoints,
            timestamp: new Date().toISOString()
        };
        appData.results.push(newResult);
        await updateData();
    };

    // --- Admin Logic ---
    const renderAdminPanel = () => {
        quizListContainer.innerHTML = '';
        if (!appData.quizzes || appData.quizzes.length === 0) {
            quizListContainer.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
            return;
        }
        appData.quizzes.forEach(quiz => {
            const quizItem = document.createElement('div');
            quizItem.classList.add('quiz-item');
            const quizResults = appData.results.filter(r => r.quizCode === quiz.code)
                                      .sort((a, b) => b.points - a.points);
            const playerList = quizResults.map(r => `<li>${r.username}: ${r.points} poin</li>`).join('');

            quizItem.innerHTML = `
                <div class="quiz-item-header">
                    <h4>${quiz.title} (Kode: ${quiz.code})</h4>
                    <div class="quiz-controls">
                        <button class="btn edit-quiz-btn" data-code="${quiz.code}">Edit</button>
                        <button class="btn delete-quiz-btn btn-danger" data-code="${quiz.code}">Hapus</button>
                    </div>
                </div>
                <details>
                    <summary>Lihat Hasil Pemain (${quizResults.length})</summary>
                    <ul>${playerList || '<li>Belum ada pemain.</li>'}</ul>
                </details>
            `;
            quizListContainer.appendChild(quizItem);
        });
            
        document.querySelectorAll('.delete-quiz-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const quizCode = e.target.getAttribute('data-code');
                const confirmed = await showCustomConfirm(`Anda yakin ingin menghapus quiz dengan kode ${quizCode}? Tindakan ini tidak dapat dibatalkan.`);
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

        // Event listener untuk tombol edit
        document.querySelectorAll('.edit-quiz-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const quizCode = e.target.getAttribute('data-code');
                openEditQuizModal(quizCode);
            });
        });

        renderGlobalLeaderboard();
    };

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
            <div class="leaderboard-item">
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-user">
                    <strong>${user.username}</strong>
                    <div style="font-size: 0.8rem; opacity: 0.8;">${user.quizCount} kuis</div>
                </div>
                <div class="leaderboard-score">${user.totalPoints} Poin</div>
            </div>
        `).join('');
    };

    // --- Fungsi untuk Menambah Pertanyaan ---
    const addQuestionField = (container = questionsContainer, counter = 'questionCounter') => {
        window[counter]++;
        const div = document.createElement('div');
        div.classList.add('question-block');
        div.innerHTML = `
            <div class="question-header">
                <h5>Pertanyaan ${window[counter]}</h5>
                <button type="button" class="delete-question-btn">Hapus</button>
            </div>
            <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" required>
            <input type="number" class="input-field question-timer" placeholder="Waktu (detik), cth: 30" value="30" required>
            <input type="url" class="input-field question-image" placeholder="URL Gambar (Opsional)">
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
            <input type="hidden" class="correct-answer-input" value="">
        `;
        container.appendChild(div);

        div.querySelector('.delete-question-btn').addEventListener('click', function() {
            if (container.children.length > 1) {
                this.closest('.question-block').remove();
                reorderQuestionNumbers(container, counter);
            } else {
                showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            }
        });

        div.querySelector('.answer-choice-container').addEventListener('click', (e) => {
            if (e.target.matches('.answer-choice-btn')) {
                const container = e.target.parentElement;
                container.querySelectorAll('.answer-choice-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                const hiddenInput = container.closest('.question-block').querySelector('.correct-answer-input');
                hiddenInput.value = e.target.dataset.value;
                hiddenInput.dispatchEvent(new Event('input'));
            }
        });
    };

    const reorderQuestionNumbers = (container = questionsContainer, counter = 'questionCounter') => {
        const questionBlocks = container.querySelectorAll('.question-block');
        questionBlocks.forEach((block, index) => {
            block.querySelector('h5').textContent = `Pertanyaan ${index + 1}`;
        });
        window[counter] = questionBlocks.length;
    };

    // --- Fungsi untuk Edit Quiz ---
    const openEditQuizModal = (quizCode) => {
        editingQuiz = appData.quizzes.find(q => q.code === quizCode);
        if (!editingQuiz) {
            showNotification('Quiz tidak ditemukan!', 'error');
            return;
        }

        // Isi form dengan data quiz
        editQuizTitle.value = editingQuiz.title;
        editQuizCode.value = editingQuiz.code;
        
        // Kosongkan container pertanyaan
        editQuestionsContainer.innerHTML = '';
        editQuestionCounter = 0;
        
        // Tambahkan pertanyaan dari quiz yang akan diedit
        editingQuiz.questions.forEach(question => {
            addEditQuestionField(question);
        });
        
        // Tampilkan modal
        editQuizModal.style.display = 'flex';
    };

    const addEditQuestionField = (questionData = null) => {
        editQuestionCounter++;
        const div = document.createElement('div');
        div.classList.add('question-block');
        div.innerHTML = `
            <div class="question-header">
                <h5>Pertanyaan ${editQuestionCounter}</h5>
                <button type="button" class="delete-question-btn">Hapus</button>
            </div>
            <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" 
                   value="${questionData ? questionData.text : ''}" required>
            <input type="number" class="input-field question-timer" placeholder="Waktu (detik), cth: 30" 
                   value="${questionData ? questionData.timer : 30}" required>
            <input type="url" class="input-field question-image" placeholder="URL Gambar (Opsional)"
                   value="${questionData ? questionData.image || '' : ''}">
            <input type="text" class="input-field option" placeholder="Opsi 1" 
                   value="${questionData ? questionData.options[0] || '' : ''}" required>
            <input type="text" class="input-field option" placeholder="Opsi 2" 
                   value="${questionData ? questionData.options[1] || '' : ''}" required>
            <input type="text" class="input-field option" placeholder="Opsi 3" 
                   value="${questionData ? questionData.options[2] || '' : ''}" required>
            <input type="text" class="input-field option" placeholder="Opsi 4" 
                   value="${questionData ? questionData.options[3] || '' : ''}" required>
            <div class="correct-answer-selector">
                <div class="form-label">Jawaban Benar:</div>
                <div class="answer-choice-container">
                    <button type="button" class="answer-choice-btn" data-value="0">Opsi 1</button>
                    <button type="button" class="answer-choice-btn" data-value="1">Opsi 2</button>
                    <button type="button" class="answer-choice-btn" data-value="2">Opsi 3</button>
                    <button type="button" class="answer-choice-btn" data-value="3">Opsi 4</button>
                </div>
            </div>
            <input type="hidden" class="correct-answer-input" value="${questionData ? questionData.answer : ''}">
        `;
        editQuestionsContainer.appendChild(div);

        // Jika ada data pertanyaan, tandai jawaban yang benar
        if (questionData && questionData.answer !== undefined) {
            const answerButtons = div.querySelectorAll('.answer-choice-btn');
            answerButtons.forEach((btn, index) => {
                if (index === questionData.answer) {
                    btn.classList.add('selected');
                }
            });
        }

        div.querySelector('.delete-question-btn').addEventListener('click', function() {
            if (editQuestionsContainer.children.length > 1) {
                this.closest('.question-block').remove();
                reorderQuestionNumbers(editQuestionsContainer, 'editQuestionCounter');
            } else {
                showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            }
        });

        div.querySelector('.answer-choice-container').addEventListener('click', (e) => {
            if (e.target.matches('.answer-choice-btn')) {
                const container = e.target.parentElement;
                container.querySelectorAll('.answer-choice-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                const hiddenInput = container.closest('.question-block').querySelector('.correct-answer-input');
                hiddenInput.value = e.target.dataset.value;
                hiddenInput.dispatchEvent(new Event('input'));
            }
        });
    };

    const closeEditModalHandler = () => {
        editQuizModal.style.display = 'none';
        editingQuiz = null;
        editQuestionsContainer.innerHTML = '';
        editQuestionCounter = 0;
    };

    const handleEditQuiz = async (e) => {
        e.preventDefault();
        
        const title = editQuizTitle.value;
        const questions = [];
        const questionBlocks = editQuestionsContainer.querySelectorAll('.question-block');
        
        let isValid = true;
        questionBlocks.forEach(block => {
            const answer = block.querySelector('.correct-answer-input').value;
            if (answer === "") {
                isValid = false;
                block.querySelector('.correct-answer-selector').style.border = '1px solid red';
            } else {
                block.querySelector('.correct-answer-selector').style.border = '';
            }
            questions.push({
                text: block.querySelector('.question-text').value,
                image: block.querySelector('.question-image').value,
                timer: parseInt(block.querySelector('.question-timer').value, 10) || 30,
                options: Array.from(block.querySelectorAll('.option')).map(opt => opt.value),
                answer: parseInt(answer)
            });
        });

        if (!isValid) {
            showNotification('Pastikan semua field dan jawaban benar telah diisi.', 'error');
            return;
        }

        // Update quiz yang sedang diedit
        const updatedQuiz = { 
            ...editingQuiz, 
            title, 
            questions,
            updatedAt: new Date().toISOString()
        };

        const index = appData.quizzes.findIndex(q => q.code === editingQuiz.code);
        if (index !== -1) {
            appData.quizzes[index] = updatedQuiz;
            await updateData();
            showNotification(`Quiz "${title}" berhasil diperbarui!`, 'success');
            closeEditModalHandler();
            renderAdminPanel();
        } else {
            showNotification('Gagal memperbarui quiz!', 'error');
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-quiz-title').value;
        const customCode = document.getElementById('custom-quiz-code').value.trim();
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');
        
        let isValid = true;
        questionBlocks.forEach(block => {
            const answer = block.querySelector('.correct-answer-input').value;
            if (answer === "") {
                isValid = false;
            }
            questions.push({
                text: block.querySelector('.question-text').value,
                image: block.querySelector('.question-image').value,
                timer: parseInt(block.querySelector('.question-timer').value, 10) || 30,
                options: Array.from(block.querySelectorAll('.option')).map(opt => opt.value),
                answer: parseInt(answer)
            });
        });

        if (!isValid) {
            showNotification('Pastikan semua field dan jawaban benar telah diisi.', 'error');
            return;
        }

        let quizCode = customCode ? customCode.toUpperCase() : `QM${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        if (appData.quizzes.some(q => q.code === quizCode)) {
            showNotification('Kode quiz ini sudah digunakan. Coba kode lain.', 'error');
            return;
        }

        const newQuiz = { 
            title, 
            code: quizCode, 
            questions, 
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
    document.getElementById('add-question-btn').addEventListener('click', () => addQuestionField());
    
    // Event listeners untuk edit quiz
    editAddQuestionBtn.addEventListener('click', () => addEditQuestionField());
    closeEditModal.addEventListener('click', closeEditModalHandler);
    cancelEditBtn.addEventListener('click', closeEditModalHandler);
    editQuizForm.addEventListener('submit', handleEditQuiz);
    
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const quizCode = quizCodeInput.value.trim().toUpperCase();
        if (username && quizCode) {
            startQuiz(quizCode, username);
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
        addQuestionField(); // Tambah pertanyaan pertama untuk form buat quiz
    };

    initializeApp();
});