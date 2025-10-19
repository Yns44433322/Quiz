document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const JSONBIN_API = {
        baseURL: 'https://api.jsonbin.io/v3/b',
        binId: '68e5a3d743b1c97be95e228b',
        masterKey: '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG',
        accessKey: '$2a$10$T.eHULy6ck/GKr48zzsI2OKfuZA.KsXl.kwHHEoiJEEf/abmhaNZm'
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
    let editingQuiz = null;
    let editQuestionCounter = 0;

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
            customConfirmModal.classList.add('active');

            const yesBtn = document.getElementById('custom-confirm-yes');
            const noBtn = document.getElementById('custom-confirm-no');

            const cleanUp = (result) => {
                customConfirmModal.classList.remove('active');
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

    const showLoader = (show) => { 
        loader.style.display = show ? 'flex' : 'none'; 
    };

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
            console.log('Data berhasil diambil:', appData);
        } catch (error) {
            console.error('Error fetching data:', error);
            appData = { quizzes: [], results: [] };
            showNotification('Gagal memuat data dari server.', 'error');
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
            console.log('Data berhasil disimpan:', appData);
            return true;
        } catch (error) {
            console.error('Error updating data:', error);
            showNotification('Gagal menyimpan data ke server.', 'error');
            return false;
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
                selectAnswer(-1, null, timeLimit, 0);
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

    // --- Fungsi untuk Menambah Pertanyaan ---
    const addQuestionField = (container = questionsContainer, isEditMode = false) => {
        let counter = isEditMode ? ++editQuestionCounter : ++questionCounter;
        
        const div = document.createElement('div');
        div.classList.add('question-block');
        div.innerHTML = `
            <div class="question-header">
                <h5>Pertanyaan ${counter}</h5>
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
                reorderQuestionNumbers(container, isEditMode);
            } else {
                showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            }
        });

        div.querySelector('.answer-choice-container').addEventListener('click', (e) => {
            if (e.target.matches('.answer-choice-btn')) {
                const parent = e.target.parentElement;
                parent.querySelectorAll('.answer-choice-btn').forEach(btn => btn.classList.remove('selected'));
                e.target.classList.add('selected');
                parent.closest('.question-block').querySelector('.correct-answer-input').value = e.target.dataset.value;
            }
        });
    };

    const reorderQuestionNumbers = (container, isEditMode) => {
        const questionBlocks = container.querySelectorAll('.question-block');
        questionBlocks.forEach((block, index) => {
            block.querySelector('h5').textContent = `Pertanyaan ${index + 1}`;
        });
        if (isEditMode) {
            editQuestionCounter = questionBlocks.length;
        } else {
            questionCounter = questionBlocks.length;
        }
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

        // Event delegation untuk tombol edit dan delete
        quizListContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-quiz-btn')) {
                const quizCode = e.target.dataset.code;
                openEditQuizModal(quizCode);
            }
            
            if (e.target.classList.contains('delete-quiz-btn')) {
                const quizCode = e.target.dataset.code;
                deleteQuiz(quizCode);
            }
        });
    };

    // --- Handle Create Quiz ---
    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        console.log('Form create quiz disubmit');
        
        const title = document.getElementById('new-quiz-title').value.trim();
        const customCode = document.getElementById('custom-quiz-code').value.trim();
        
        if (!title) {
            showNotification('Judul Quiz tidak boleh kosong!', 'error');
            return;
        }

        const questions = [];
        const questionBlocks = questionsContainer.querySelectorAll('.question-block');
        let allQuestionsValid = true;

        // Reset semua border terlebih dahulu
        questionBlocks.forEach(block => {
            const questionTextInput = block.querySelector('.question-text');
            const optionInputs = block.querySelectorAll('.option');
            const answerSelector = block.querySelector('.correct-answer-selector');
            
            questionTextInput.style.border = '';
            optionInputs.forEach(input => input.style.border = '');
            answerSelector.style.border = '';
        });

        for (const block of questionBlocks) {
            const questionTextInput = block.querySelector('.question-text');
            const optionInputs = block.querySelectorAll('.option');
            const answerInput = block.querySelector('.correct-answer-input');
            const answerSelector = answerInput.closest('.correct-answer-selector');

            const questionText = questionTextInput.value.trim();
            const options = Array.from(optionInputs).map(opt => opt.value.trim());
            const answer = answerInput.value;

            let currentQuestionValid = true;
            
            // Validasi teks pertanyaan
            if (!questionText) {
                questionTextInput.style.border = '1px solid red';
                currentQuestionValid = false;
            }
            
            // Validasi opsi jawaban
            options.forEach((opt, index) => {
                if (!opt) {
                    optionInputs[index].style.border = '1px solid red';
                    currentQuestionValid = false;
                }
            });
            
            // Validasi jawaban benar
            if (answer === '') {
                answerSelector.style.border = '1px solid red';
                currentQuestionValid = false;
            }

            if (!currentQuestionValid) {
                allQuestionsValid = false;
            } else {
                questions.push({
                    text: questionText,
                    image: block.querySelector('.question-image').value.trim(),
                    timer: parseInt(block.querySelector('.question-timer').value, 10) || 30,
                    options: options,
                    answer: parseInt(answer)
                });
            }
        }

        if (!allQuestionsValid) {
            showNotification('Pastikan semua field pertanyaan, opsi, dan jawaban benar telah diisi!', 'error');
            return;
        }

        if (questions.length === 0) {
            showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            return;
        }

        let quizCode = customCode.toUpperCase() || `QM${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

        if (appData.quizzes.some(q => q.code === quizCode)) {
            showNotification('Kode quiz ini sudah digunakan. Coba kode lain.', 'error');
            return;
        }

        const newQuiz = { 
            title, 
            code: quizCode, 
            questions, 
            createdAt: new Date().toISOString() 
        };
        
        appData.quizzes.push(newQuiz);
        const success = await updateData();
        
        if (success) {
            showNotification(`Quiz berhasil dibuat! Kode: ${newQuiz.code}`, 'success');
            createQuizForm.reset();
            questionsContainer.innerHTML = '';
            questionCounter = 0;
            addQuestionField();
            renderAdminPanel();
        } else {
            appData.quizzes.pop();
            showNotification('Gagal menyimpan quiz ke server!', 'error');
        }
    };

    // --- Fungsi untuk Edit Quiz ---
    const openEditQuizModal = async (quizCode) => {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) {
            showNotification('Quiz tidak ditemukan!', 'error');
            return;
        }

        editingQuiz = quiz;
        editQuizTitle.value = quiz.title;
        editQuizCode.value = quiz.code;
        
        // Kosongkan container pertanyaan
        editQuestionsContainer.innerHTML = '';
        editQuestionCounter = 0;
        
        // Tambahkan pertanyaan yang sudah ada
        quiz.questions.forEach(question => {
            addQuestionField(editQuestionsContainer, true);
            const lastQuestion = editQuestionsContainer.lastElementChild;
            
            // Isi data pertanyaan
            lastQuestion.querySelector('.question-text').value = question.text;
            lastQuestion.querySelector('.question-timer').value = question.timer;
            lastQuestion.querySelector('.question-image').value = question.image || '';
            
            // Isi opsi jawaban
            const optionInputs = lastQuestion.querySelectorAll('.option');
            question.options.forEach((option, index) => {
                if (optionInputs[index]) {
                    optionInputs[index].value = option;
                }
            });
            
            // Set jawaban benar
            const correctAnswerInput = lastQuestion.querySelector('.correct-answer-input');
            correctAnswerInput.value = question.answer;
            const answerButtons = lastQuestion.querySelectorAll('.answer-choice-btn');
            answerButtons.forEach(btn => btn.classList.remove('selected'));
            if (answerButtons[question.answer]) {
                answerButtons[question.answer].classList.add('selected');
            }
        });
        
        editQuizModal.classList.add('active');
    };

    const handleEditQuiz = async (e) => {
        e.preventDefault();
        const title = editQuizTitle.value.trim();
        
        if (!title) {
            showNotification('Judul Quiz tidak boleh kosong!', 'error');
            return;
        }

        const questions = [];
        const questionBlocks = editQuestionsContainer.querySelectorAll('.question-block');
        let allQuestionsValid = true;

        // Reset semua border terlebih dahulu
        questionBlocks.forEach(block => {
            const questionTextInput = block.querySelector('.question-text');
            const optionInputs = block.querySelectorAll('.option');
            const answerSelector = block.querySelector('.correct-answer-selector');
            
            questionTextInput.style.border = '';
            optionInputs.forEach(input => input.style.border = '');
            answerSelector.style.border = '';
        });

        for (const block of questionBlocks) {
            const questionTextInput = block.querySelector('.question-text');
            const optionInputs = block.querySelectorAll('.option');
            const answerInput = block.querySelector('.correct-answer-input');
            const answerSelector = answerInput.closest('.correct-answer-selector');

            const questionText = questionTextInput.value.trim();
            const options = Array.from(optionInputs).map(opt => opt.value.trim());
            const answer = answerInput.value;

            let currentQuestionValid = true;
            
            // Validasi teks pertanyaan
            if (!questionText) {
                questionTextInput.style.border = '1px solid red';
                currentQuestionValid = false;
            }
            
            // Validasi opsi jawaban
            options.forEach((opt, index) => {
                if (!opt) {
                    optionInputs[index].style.border = '1px solid red';
                    currentQuestionValid = false;
                }
            });
            
            // Validasi jawaban benar
            if (answer === '') {
                answerSelector.style.border = '1px solid red';
                currentQuestionValid = false;
            }

            if (!currentQuestionValid) {
                allQuestionsValid = false;
                showNotification('Harap periksa kembali semua field yang ditandai dengan warna merah!', 'error');
            } else {
                questions.push({
                    text: questionText,
                    image: block.querySelector('.question-image').value.trim(),
                    timer: parseInt(block.querySelector('.question-timer').value, 10) || 30,
                    options: options,
                    answer: parseInt(answer)
                });
            }
        }

        if (!allQuestionsValid) {
            return;
        }

        if (questions.length === 0) {
            showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            return;
        }

        // Update quiz yang sedang diedit
        editingQuiz.title = title;
        editingQuiz.questions = questions;

        const success = await updateData();
        
        if (success) {
            showNotification(`Quiz berhasil diperbarui!`, 'success');
            editQuizModal.classList.remove('active');
            renderAdminPanel();
        } else {
            showNotification('Gagal menyimpan perubahan quiz!', 'error');
        }
    };

    // --- Fungsi untuk Hapus Quiz ---
    const deleteQuiz = async (quizCode) => {
        const confirmed = await showCustomConfirm(`Apakah Anda yakin ingin menghapus quiz dengan kode ${quizCode}?`);
        if (!confirmed) return;

        const quizIndex = appData.quizzes.findIndex(q => q.code === quizCode);
        if (quizIndex === -1) {
            showNotification('Quiz tidak ditemukan!', 'error');
            return;
        }

        // Hapus quiz
        appData.quizzes.splice(quizIndex, 1);
        
        // Hapus juga hasil yang terkait dengan quiz ini
        appData.results = appData.results.filter(r => r.quizCode !== quizCode);

        const success = await updateData();
        
        if (success) {
            showNotification('Quiz berhasil dihapus!', 'success');
            renderAdminPanel();
        } else {
            showNotification('Gagal menghapus quiz!', 'error');
        }
    };

    // --- Event Listeners Setup ---
    const setupEventListeners = () => {
        // Navigation
        document.getElementById('start-btn').addEventListener('click', () => showPage('player-entry-page'));
        document.getElementById('back-to-landing-btn').addEventListener('click', () => showPage('landing-page'));
        document.getElementById('back-to-home-btn').addEventListener('click', () => showPage('landing-page'));
        
        // Admin
        adminIcon.addEventListener('click', () => document.getElementById('admin-login-popup').classList.add('active'));
        document.querySelector('#admin-login-popup .close-btn').addEventListener('click', () => document.getElementById('admin-login-popup').classList.remove('active'));
        document.getElementById('admin-logout-btn').addEventListener('click', () => showPage('landing-page'));
        
        // Quiz Creation
        document.getElementById('add-question-btn').addEventListener('click', () => addQuestionField(questionsContainer, false));
        
        // Forms
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

        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            if (username === 'admin' && password === 'quizmaster123') {
                document.getElementById('admin-login-popup').classList.remove('active');
                showPage('admin-panel');
                renderAdminPanel();
            } else {
                showNotification('Username atau Password salah!', 'error');
            }
        });
        
        createQuizForm.addEventListener('submit', handleCreateQuiz);

        // Edit Quiz Modal
        closeEditModal.addEventListener('click', () => editQuizModal.classList.remove('active'));
        cancelEditBtn.addEventListener('click', () => editQuizModal.classList.remove('active'));
        editAddQuestionBtn.addEventListener('click', () => addQuestionField(editQuestionsContainer, true));
        editQuizForm.addEventListener('submit', handleEditQuiz);
    };

    // --- Initialization ---
    const initializeApp = async () => {
        console.log('Aplikasi diinisialisasi');
        setupEventListeners();
        await fetchData();
        showPage('landing-page');
        questionCounter = 0;
        questionsContainer.innerHTML = '';
        addQuestionField();
    };

    initializeApp();
});