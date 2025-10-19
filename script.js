// QUIZ MASTER - SCRIPT UTAMA YANG SUDAH DIPERBAIKI
document.addEventListener('DOMContentLoaded', function() {
    console.log('QUIZ MASTER - Aplikasi dimulai');

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

    // ==================== FUNGSI DATA STORAGE ====================

    // Simpan data ke localStorage (fallback)
    function saveToLocalStorage(data) {
        try {
            localStorage.setItem('quizMasterData', JSON.stringify(data));
            console.log('Data berhasil disimpan ke localStorage');
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    // Ambil data dari localStorage
    function loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('quizMasterData');
            if (data) {
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return { quizzes: [], results: [] };
    }

    function getApiConfig() {
        const part1 = '68f4fb0d';
        const part2 = '43b1c97be971204d';
        const part3 = '$2a$10$pGIBtyGF2MLAh5h1WMv9M';
        const part4 = 'ui7K7lSjiAyCFZepc93/RkDHXIyg3E4O';
        const part5 = '$2a$10$JIK5xVBYHYbe80vauAzE4';
        const part6 = 'OO55eXdVw30b/a/B2DF7Mi38LppKmQQO';
        
        return {
            binId: part1 + part2,
            masterKey: part3 + part4,
            accessKey: part5 + part6,
            baseURL: 'https://api.jsonbin.io/v3/b'
        };
    }

    // Ambil data dari JSONBin (dengan fallback ke localStorage)
    async function fetchData() {
        showLoader(true);
        
        // Coba ambil dari localStorage dulu untuk loading cepat
        const localData = loadFromLocalStorage();
        if (localData.quizzes.length > 0 || localData.results.length > 0) {
            appData = localData;
            console.log('Data dimuat dari localStorage:', appData);
        }

        try {
            // Dapatkan config secara dinamis
            const JSONBIN_CONFIG = getApiConfig();
            
            // Coba ambil dari JSONBin dengan X-Access-Key
            const response = await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}/latest`, {
                headers: {
                    'X-Access-Key': JSONBIN_CONFIG.accessKey
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const serverData = data.record || { quizzes: [], results: [] };
                
                console.log('Data dari server:', serverData);
                
                // Prioritaskan data dari server, tapi gabungkan dengan data lokal untuk results
                if (serverData.quizzes && serverData.quizzes.length > 0) {
                    appData.quizzes = serverData.quizzes;
                }
                if (serverData.results && serverData.results.length > 0) {
                    // Gabungkan results dari server dan lokal, hindari duplikat
                    const localResults = appData.results || [];
                    const serverResults = serverData.results || [];
                    
                    // Gabungkan dan hapus duplikat berdasarkan timestamp dan username
                    const combinedResults = [...localResults];
                    serverResults.forEach(serverResult => {
                        const exists = localResults.some(localResult => 
                            localResult.username === serverResult.username && 
                            localResult.quizCode === serverResult.quizCode &&
                            localResult.timestamp === serverResult.timestamp
                        );
                        if (!exists) {
                            combinedResults.push(serverResult);
                        }
                    });
                    
                    appData.results = combinedResults;
                }
                
                // Pastikan struktur data konsisten
                if (!appData.quizzes) appData.quizzes = [];
                if (!appData.results) appData.results = [];
                
                // Simpan data gabungan ke localStorage
                saveToLocalStorage(appData);
                
                console.log('Data berhasil diambil dari server:', appData);
                showNotification('Data berhasil disinkronisasi dengan server', 'success');
            } else {
                console.warn('Tidak bisa mengakses server, menggunakan data lokal. Status:', response.status);
                showNotification('Mode offline: menggunakan data lokal', 'info');
            }
        } catch (error) {
            console.warn('Error fetching from server, using localStorage data:', error);
            showNotification('Mode offline: menggunakan data lokal', 'info');
        } finally {
            showLoader(false);
        }
    }

    // Simpan data ke JSONBin (dengan fallback ke localStorage)
    async function saveData() {
        showLoader(true);
        let serverSuccess = false;

        try {
            // Simpan ke localStorage terlebih dahulu (untuk keamanan)
            const localSuccess = saveToLocalStorage(appData);
            
            if (!localSuccess) {
                throw new Error('Gagal menyimpan ke localStorage');
            }
            
            // Dapatkan config secara dinamis
            const JSONBIN_CONFIG = getApiConfig();
            
            // Coba simpan ke JSONBin dengan X-Access-Key
            const response = await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Key': JSONBIN_CONFIG.accessKey,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify(appData)
            });
            
            if (response.ok) {
                serverSuccess = true;
                console.log('Data berhasil disimpan ke server:', appData);
                showNotification('Data berhasil disimpan ke server dan lokal', 'success');
            } else {
                const errorText = await response.text();
                console.error('Server response error:', response.status, errorText);
                throw new Error(`Server response: ${response.status}`);
            }
        } catch (error) {
            console.warn('Gagal menyimpan ke server, menggunakan localStorage:', error);
            
            // Fallback: sudah disimpan ke localStorage sebelumnya
            showNotification('Data disimpan secara lokal (offline mode)', 'info');
        } finally {
            showLoader(false);
        }
        
        return serverSuccess;
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
            questionImage.classList.add('question-image-loaded');
        } else {
            questionImage.style.display = 'none';
            questionImage.classList.remove('question-image-loaded');
        }

        // Timer
        let timeLeft = question.timer || 30;
        const timerDisplay = document.getElementById('timer-display');
        timerDisplay.textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
        
        if (questionTimer) clearInterval(questionTimer);
        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `00:${timeLeft.toString().padStart(2, '0')}`;
            
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
        options.forEach(btn => {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
        });

        // Tampilkan jawaban benar/salah
        if (selectedIndex === correctIndex) {
            if (selectedIndex !== -1) {
                options[selectedIndex].classList.add('correct');
            }
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
        
        // Tambah hasil ke data
        if (!appData.results) {
            appData.results = [];
        }
        appData.results.push(result);
        
        // Simpan data
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

        // Reset semua border error
        questionBlocks.forEach(block => {
            block.querySelector('.question-text').style.border = '';
            block.querySelectorAll('.option').forEach(input => input.style.border = '');
            block.querySelector('.correct-answer-selector').style.border = '';
        });

        for (const block of questionBlocks) {
            const questionText = block.querySelector('.question-text').value.trim();
            const timer = parseInt(block.querySelector('.question-timer').value) || 30;
            const image = block.querySelector('.question-image').value.trim();
            const options = Array.from(block.querySelectorAll('.option')).map(input => input.value.trim());
            const correctAnswer = block.querySelector('.correct-answer').value;

            // Validasi
            let questionValid = true;
            
            if (!questionText) {
                block.querySelector('.question-text').style.border = '1px solid red';
                questionValid = false;
                isValid = false;
            }
            
            const hasEmptyOption = options.some(opt => !opt);
            if (hasEmptyOption) {
                block.querySelectorAll('.option').forEach(input => {
                    if (!input.value.trim()) input.style.border = '1px solid red';
                });
                questionValid = false;
                isValid = false;
            }
            
            if (correctAnswer === '') {
                block.querySelector('.correct-answer-selector').style.border = '1px solid red';
                questionValid = false;
                isValid = false;
            }

            if (questionValid) {
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
            showNotification('Harap isi semua field yang diperlukan! Periksa field yang berwarna merah.', 'error');
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
        if (!appData.quizzes) {
            appData.quizzes = [];
        }
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
            showNotification('Quiz berhasil dibuat dan disimpan secara lokal!', 'success');
            
            // Reset form meskipun hanya tersimpan lokal
            elements.createQuizForm.reset();
            elements.questionsContainer.innerHTML = '';
            addQuestionField();
            renderQuizList();
        }
    }

    // Render daftar quiz
    function renderQuizList() {
        const container = elements.quizListContainer;
        container.innerHTML = '';

        if (!appData.quizzes || appData.quizzes.length === 0) {
            container.innerHTML = '<p>Belum ada quiz yang dibuat.</p>';
            return;
        }

        appData.quizzes.forEach(quiz => {
            const results = appData.results ? appData.results.filter(r => r.quizCode === quiz.code) : [];
            const resultsHTML = results.length > 0 
                ? results.map(r => `<li>${r.username}: ${r.score} poin</li>`).join('')
                : '<li>Belum ada hasil</li>';

            const quizHTML = `
                <div class="quiz-item">
                    <div class="quiz-item-header">
                        <h4>${quiz.title} (Kode: ${quiz.code})</h4>
                        <div class="quiz-controls">
                            <button class="btn edit-quiz-btn" data-code="${quiz.code}" type="button">Edit</button>
                            <button class="btn btn-danger delete-quiz-btn" data-code="${quiz.code}" type="button">Hapus</button>
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
        if (appData.results) {
            appData.results = appData.results.filter(r => r.quizCode !== quizCode);
        }

        const success = await saveData();
        
        if (success) {
            showNotification('Quiz berhasil dihapus!', 'success');
            renderQuizList();
        } else {
            showNotification('Quiz berhasil dihapus dari penyimpanan lokal!', 'success');
            renderQuizList();
        }
    }

    // ==================== EVENT LISTENER GLOBAL ====================

    // Setup global event listeners (hanya sekali dipanggil)
    function setupGlobalEventListeners() {
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

        // Event delegation untuk quiz list (hanya sekali dipasang)
        elements.quizListContainer.addEventListener('click', function(e) {
            const quizCode = e.target.dataset.code;
            
            if (e.target.classList.contains('delete-quiz-btn')) {
                deleteQuiz(quizCode);
            } else if (e.target.classList.contains('edit-quiz-btn')) {
                showNotification('Fitur edit sedang dalam pengembangan', 'info');
            }
        });
    }

    // ==================== INISIALISASI APLIKASI ====================

    // Inisialisasi aplikasi
    async function initializeApp() {
        console.log('Menginisialisasi aplikasi...');
        
        setupGlobalEventListeners();
        
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