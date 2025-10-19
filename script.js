// QUIZ MASTER - SCRIPT UTAMA
document.addEventListener('DOMContentLoaded', function() {
    console.log('QUIZ MASTER - Aplikasi dimulai');
    
    // Konfigurasi API
    const JSONBIN_CONFIG = {
        binId: '68e5a3d743b1c97be95e228b',
        masterKey: '$2a$10$IvGjmmJFZX2ZQ6eoZ/42vOTL54rzpy83ya/pnesExdMWpKWV6MDGG',
        accessKey: '$2a$10$T.eHULy6ck/GKr48zzsI2OKfuZA.KsVl.kwHHEoiJEEf/abmhaNZm',
        baseURL: 'https://api.jsonbin.io/v3/b'
    };

    // State aplikasi
    let appData = {
        quizzes: [],
        results: []
    };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userScore = 0;
    let questionTimer = null;

    // DOM Elements
    const elements = {
        pages: document.querySelectorAll('.page'),
        adminIcon: document.getElementById('admin-icon'),
        loader: document.getElementById('loader'),
        notificationContainer: document.getElementById('notification-container'),
        playerForm: document.getElementById('player-form'),
        createQuizForm: document.getElementById('create-quiz-form'),
        questionsContainer: document.getElementById('questions-container'),
        quizListContainer: document.getElementById('quiz-list'),
        addQuestionBtn: document.getElementById('add-question-btn')
    };

    // ==================== FUNGSI UTILITAS ====================

    // Tampilkan notifikasi
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notificationContainer.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Tampilkan loader
    function showLoader(show) {
        elements.loader.style.display = show ? 'flex' : 'none';
    }

    // Navigasi halaman
    function showPage(pageId) {
        elements.pages.forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');
        
        // Sembunyikan admin icon di halaman tertentu
        const hideAdminIcon = ['quiz-page', 'score-page', 'admin-panel'].includes(pageId);
        elements.adminIcon.style.display = hideAdminIcon ? 'none' : 'flex';
    }

    // ==================== FUNGSI API ====================

    // Ambil data dari JSONBin
    async function fetchData() {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}/latest`, {
                headers: {
                    'X-Master-Key': JSONBIN_CONFIG.masterKey,
                    'X-Access-Key': JSONBIN_CONFIG.accessKey
                }
            });
            
            if (!response.ok) {
                throw new Error('Gagal mengambil data');
            }
            
            const data = await response.json();
            appData = data.record || { quizzes: [], results: [] };
            console.log('Data berhasil diambil:', appData);
            return true;
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Gagal memuat data dari server', 'error');
            return false;
        } finally {
            showLoader(false);
        }
    }

    // Simpan data ke JSONBin
    async function saveData() {
        showLoader(true);
        try {
            const response = await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_CONFIG.masterKey,
                    'X-Access-Key': JSONBIN_CONFIG.accessKey
                },
                body: JSON.stringify(appData)
            });
            
            if (!response.ok) {
                throw new Error('Gagal menyimpan data');
            }
            
            console.log('Data berhasil disimpan:', appData);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            showNotification('Gagal menyimpan data ke server', 'error');
            return false;
        } finally {
            showLoader(false);
        }
    }

    // ==================== FUNGSI QUIZ ====================

    // Mulai quiz
    function startQuiz(quizCode, username) {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) {
            showNotification('Kode quiz tidak ditemukan!', 'error');
            return;
        }

        currentQuiz = quiz;
        currentQuestionIndex = 0;
        userScore = 0;

        document.getElementById('quiz-title-display').textContent = quiz.title;
        showPage('quiz-page');
        showQuestion();
    }

    // Tampilkan pertanyaan
    function showQuestion() {
        if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
            finishQuiz();
            return;
        }

        const question = currentQuiz.questions[currentQuestionIndex];
        
        // Update counter
        document.getElementById('question-corner-counter').textContent = currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.text;

        // Handle gambar
        const questionImage = document.getElementById('question-image');
        if (question.image && question.image.trim()) {
            questionImage.src = question.image;
            questionImage.style.display = 'block';
        } else {
            questionImage.style.display = 'none';
        }

        // Timer
        let timeLeft = question.timer || 30;
        document.getElementById('timer-display').textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
        
        if (questionTimer) clearInterval(questionTimer);
        questionTimer = setInterval(() => {
            timeLeft--;
            document.getElementById('timer-display').textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
            
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                handleAnswer(-1); // Timeout
            }
        }, 1000);

        // Tampilkan opsi jawaban
        const optionsContainer = document.getElementById('answer-options');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.onclick = () => handleAnswer(index);
            optionsContainer.appendChild(button);
        });
    }

    // Handle jawaban
    function handleAnswer(selectedIndex) {
        if (questionTimer) clearInterval(questionTimer);

        const question = currentQuiz.questions[currentQuestionIndex];
        const correctIndex = question.answer;
        const options = document.querySelectorAll('.option-btn');

        // Nonaktifkan semua tombol
        options.forEach(btn => btn.disabled = true);

        // Tampilkan jawaban benar/salah
        if (selectedIndex === correctIndex) {
            options[selectedIndex].classList.add('correct');
            userScore += 100;
        } else {
            if (selectedIndex !== -1) {
                options[selectedIndex].classList.add('incorrect');
            }
            options[correctIndex].classList.add('correct');
        }

        // Lanjut ke pertanyaan berikutnya setelah 2 detik
        setTimeout(() => {
            currentQuestionIndex++;
            showQuestion();
        }, 2000);
    }

    // Selesaikan quiz
    async function finishQuiz() {
        document.getElementById('final-score').textContent = userScore;
        document.getElementById('score-details').textContent = 
            `Kamu telah menyelesaikan kuis "${currentQuiz.title}" dengan baik!`;
        
        showPage('score-page');

        // Simpan hasil
        const username = document.getElementById('username').value;
        const result = {
            username: username,
            quizCode: currentQuiz.code,
            score: userScore,
            timestamp: new Date().toISOString()
        };
        
        appData.results.push(result);
        await saveData();
    }

    // ==================== FUNGSI ADMIN ====================

    // Tambah field pertanyaan
    function addQuestionField(container = elements.questionsContainer) {
        const questionCount = container.querySelectorAll('.question-block').length + 1;
        
        const questionHTML = `
            <div class="question-block">
                <div class="question-header">
                    <h5>Pertanyaan ${questionCount}</h5>
                    <button type="button" class="delete-question-btn">Hapus</button>
                </div>
                <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" required>
                <input type="number" class="input-field question-timer" placeholder="Waktu (detik)" value="30" min="10" required>
                <input type="url" class="input-field question-image" placeholder="URL Gambar (opsional)">
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 1" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 2" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 3" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 4" required>
                <div class="correct-answer-selector">
                    <div class="form-label">Pilih Jawaban Benar:</div>
                    <div class="answer-choice-container">
                        <button type="button" class="answer-choice-btn" data-index="0">Opsi 1</button>
                        <button type="button" class="answer-choice-btn" data-index="1">Opsi 2</button>
                        <button type="button" class="answer-choice-btn" data-index="2">Opsi 3</button>
                        <button type="button" class="answer-choice-btn" data-index="3">Opsi 4</button>
                    </div>
                </div>
                <input type="hidden" class="correct-answer" value="">
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', questionHTML);
        
        // Event listener untuk tombol hapus
        const newQuestion = container.lastElementChild;
        const deleteBtn = newQuestion.querySelector('.delete-question-btn');
        deleteBtn.addEventListener('click', function() {
            if (container.querySelectorAll('.question-block').length > 1) {
                this.closest('.question-block').remove();
                updateQuestionNumbers(container);
            } else {
                showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            }
        });
        
        // Event listener untuk pilihan jawaban benar
        const answerButtons = newQuestion.querySelectorAll('.answer-choice-btn');
        answerButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                // Hapus selected dari semua tombol
                answerButtons.forEach(b => b.classList.remove('selected'));
                // Tambah selected ke tombol yang diklik
                this.classList.add('selected');
                // Set nilai jawaban benar
                newQuestion.querySelector('.correct-answer').value = this.dataset.index;
            });
        });
    }

    // Update nomor pertanyaan
    function updateQuestionNumbers(container) {
        const questions = container.querySelectorAll('.question-block');
        questions.forEach((question, index) => {
            question.querySelector('h5').textContent = `Pertanyaan ${index + 1}`;
        });
    }

    // Handle buat quiz baru
    async function handleCreateQuiz(e) {
        e.preventDefault();
        console.log('Membuat quiz baru...');

        const title = document.getElementById('new-quiz-title').value.trim();
        const customCode = document.getElementById('custom-quiz-code').value.trim();

        if (!title) {
            showNotification('Judul quiz tidak boleh kosong!', 'error');
            return;
        }

        // Kumpulkan data pertanyaan
        const questions = [];
        const questionBlocks = elements.questionsContainer.querySelectorAll('.question-block');
        let isValid = true;

        for (const block of questionBlocks) {
            const questionText = block.querySelector('.question-text').value.trim();
            const timer = parseInt(block.querySelector('.question-timer').value) || 30;
            const image = block.querySelector('.question-image').value.trim();
            const options = Array.from(block.querySelectorAll('.option')).map(input => input.value.trim());
            const correctAnswer = block.querySelector('.correct-answer').value;

            // Validasi
            if (!questionText) {
                block.querySelector('.question-text').style.border = '1px solid red';
                isValid = false;
            }
            
            const hasEmptyOption = options.some(opt => !opt);
            if (hasEmptyOption) {
                block.querySelectorAll('.option').forEach(input => {
                    if (!input.value.trim()) input.style.border = '1px solid red';
                });
                isValid = false;
            }
            
            if (correctAnswer === '') {
                block.querySelector('.correct-answer-selector').style.border = '1px solid red';
                isValid = false;
            }

            if (isValid) {
                questions.push({
                    text: questionText,
                    timer: timer,
                    image: image,
                    options: options,
                    answer: parseInt(correctAnswer)
                });
            }
        }

        if (!isValid) {
            showNotification('Harap isi semua field yang diperlukan!', 'error');
            return;
        }

        if (questions.length === 0) {
            showNotification('Quiz harus memiliki minimal 1 pertanyaan!', 'error');
            return;
        }

        // Generate kode quiz
        let quizCode = customCode.toUpperCase() || `QM${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        // Cek kode duplikat
        if (appData.quizzes.some(q => q.code === quizCode)) {
            showNotification('Kode quiz sudah digunakan. Silakan gunakan kode lain.', 'error');
            return;
        }

        // Buat objek quiz
        const newQuiz = {
            title: title,
            code: quizCode,
            questions: questions,
            createdAt: new Date().toISOString()
        };

        // Simpan ke data
        appData.quizzes.push(newQuiz);
        const success = await saveData();

        if (success) {
            showNotification(`Quiz "${title}" berhasil dibuat! Kode: ${quizCode}`, 'success');
            
            // Reset form
            elements.createQuizForm.reset();
            elements.questionsContainer.innerHTML = '';
            addQuestionField();
            
            // Refresh daftar quiz
            renderQuizList();
        } else {
            // Rollback jika gagal
            appData.quizzes.pop();
            showNotification('Gagal menyimpan quiz!', 'error');
        }
    }

    // Render daftar quiz
    function renderQuizList() {
        const container = elements.quizListContainer;
        container.innerHTML = '';

        if (appData.quizzes.length === 0) {
            container.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
            return;
        }

        appData.quizzes.forEach(quiz => {
            const results = appData.results.filter(r => r.quizCode === quiz.code);
            const resultsHTML = results.length > 0 
                ? results.map(r => `<li>${r.username}: ${r.score} poin</li>`).join('')
                : '<li>Belum ada hasil</li>';

            const quizHTML = `
                <div class="quiz-item">
                    <div class="quiz-item-header">
                        <h4>${quiz.title} (Kode: ${quiz.code})</h4>
                        <div class="quiz-controls">
                            <button class="btn edit-quiz-btn" data-code="${quiz.code}">Edit</button>
                            <button class="btn btn-danger delete-quiz-btn" data-code="${quiz.code}">Hapus</button>
                        </div>
                    </div>
                    <details>
                        <summary>Lihat Hasil (${results.length})</summary>
                        <ul>${resultsHTML}</ul>
                    </details>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', quizHTML);
        });

        // Event delegation untuk tombol edit dan hapus
        container.addEventListener('click', function(e) {
            const quizCode = e.target.dataset.code;
            
            if (e.target.classList.contains('delete-quiz-btn')) {
                deleteQuiz(quizCode);
            } else if (e.target.classList.contains('edit-quiz-btn')) {
                // Fungsi edit bisa ditambahkan nanti
                showNotification('Fitur edit sedang dalam pengembangan', 'info');
            }
        });
    }

    // Hapus quiz
    async function deleteQuiz(quizCode) {
        if (!confirm(`Apakah Anda yakin ingin menghapus quiz dengan kode ${quizCode}?`)) {
            return;
        }

        const index = appData.quizzes.findIndex(q => q.code === quizCode);
        if (index === -1) {
            showNotification('Quiz tidak ditemukan!', 'error');
            return;
        }

        // Hapus quiz
        appData.quizzes.splice(index, 1);
        
        // Hapus hasil yang terkait
        appData.results = appData.results.filter(r => r.quizCode !== quizCode);

        const success = await saveData();
        
        if (success) {
            showNotification('Quiz berhasil dihapus!', 'success');
            renderQuizList();
        } else {
            showNotification('Gagal menghapus quiz!', 'error');
        }
    }

    // ==================== INISIALISASI APLIKASI ====================

    // Setup event listeners
    function setupEventListeners() {
        // Navigasi
        document.getElementById('start-btn').addEventListener('click', () => showPage('player-entry-page'));
        document.getElementById('back-to-landing-btn').addEventListener('click', () => showPage('landing-page'));
        document.getElementById('back-to-home-btn').addEventListener('click', () => showPage('landing-page'));
        
        // Admin
        elements.adminIcon.addEventListener('click', () => {
            document.getElementById('admin-login-popup').classList.add('active');
        });
        
        document.querySelector('#admin-login-popup .close-btn').addEventListener('click', () => {
            document.getElementById('admin-login-popup').classList.remove('active');
        });
        
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            showPage('landing-page');
        });
        
        // Forms
        elements.playerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const quizCode = document.getElementById('quiz-code').value.trim().toUpperCase();
            
            if (username && quizCode) {
                startQuiz(quizCode, username);
            } else {
                showNotification('Username dan kode quiz harus diisi!', 'error');
            }
        });
        
        document.getElementById('admin-login-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === 'admin' && password === 'quizmaster123') {
                document.getElementById('admin-login-popup').classList.remove('active');
                showPage('admin-panel');
                renderQuizList();
            } else {
                showNotification('Username atau password salah!', 'error');
            }
        });
        
        // Quiz creation
        elements.addQuestionBtn.addEventListener('click', () => addQuestionField());
        elements.createQuizForm.addEventListener('submit', handleCreateQuiz);
    }

    // Inisialisasi aplikasi
    async function initializeApp() {
        console.log('Menginisialisasi aplikasi...');
        
        setupEventListeners();
        
        // Load data
        await fetchData();
        
        // Tambah pertanyaan pertama
        addQuestionField();
        
        // Tampilkan halaman utama
        showPage('landing-page');
        
        console.log('Aplikasi siap digunakan!');
    }

    // Mulai aplikasi
    initializeApp();
});