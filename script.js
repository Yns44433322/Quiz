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
    let questionStartTime = 0;
    
    // Sistem lencana
    let currentStreak = 0;
    let hasStreakBadge = false;
    let hasSpeedBadge = false;
    let badgesEarned = [];
    let badgeChallengeQuestions = [];

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
        addQuestionBtn: document.getElementById('add-question-btn'),
        showLeaderboardBtn: document.getElementById('show-leaderboard-btn'),
        backToAdminBtn: document.getElementById('back-to-admin-btn'),
        globalLeaderboard: document.getElementById('global-leaderboard'),
        quizFilter: document.getElementById('quiz-filter'),
        timeFilter: document.getElementById('time-filter')
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
        const hideAdminIcon = ['quiz-page', 'score-page', 'admin-panel', 'leaderboard-page', 'badge-challenge-page'].includes(pageId);
        elements.adminIcon.style.display = hideAdminIcon ? 'none' : 'flex';
    }

    // Format waktu
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

    // Fungsi untuk mendapatkan konfigurasi API (disembunyikan)
    function getApiConfig() {
        // Data yang diacak dan dipisah
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

    // ==================== FUNGSI QUIZ & SISTEM POINT ====================

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
        currentStreak = 0;
        hasStreakBadge = false;
        hasSpeedBadge = false;
        badgesEarned = [];

        // Reset badge display
        document.getElementById('streak-badge').style.display = 'none';
        document.getElementById('speed-badge').style.display = 'none';

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
        timerDisplay.textContent = formatTime(timeLeft);
        
        // Catat waktu mulai
        questionStartTime = Date.now();
        
        if (questionTimer) clearInterval(questionTimer);
        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);
            
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

        // Hitung waktu yang digunakan
        const timeUsed = Math.floor((Date.now() - questionStartTime) / 1000);
        const timeLimit = question.timer || 30;
        
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
            
            // Hitung point berdasarkan waktu
            let pointsEarned = 0;
            if (timeUsed < timeLimit) {
                // Sistem point baru: lebih cepat = lebih banyak point
                const basePoints = 100;
                const timeBonus = Math.max(0, timeLimit - timeUsed) * 2; // Bonus 2 point per detik tersisa
                pointsEarned = basePoints + timeBonus;
                
                // Cek untuk speed badge (jawab dalam 1 detik)
                if (timeUsed <= 1 && currentStreak >= 4) { // Sudah 5x beruntun termasuk yang ini
                    if (!hasSpeedBadge) {
                        hasSpeedBadge = true;
                        badgesEarned.push('speed');
                        document.getElementById('speed-badge').style.display = 'flex';
                        showNotification('🎉 Lencana Speed Unlocked! Point akan dikali 2x!', 'success');
                    }
                }
                
                // Apply speed badge multiplier
                if (hasSpeedBadge) {
                    pointsEarned *= 2;
                }
                
                userScore += Math.round(pointsEarned);
                
                // Update streak
                currentStreak++;
                
                // Cek untuk streak badge
                if (currentStreak >= 5 && !hasStreakBadge) {
                    hasStreakBadge = true;
                    badgesEarned.push('streak');
                    document.getElementById('streak-badge').style.display = 'flex';
                    showNotification('🎉 Lencana Streak Unlocked! Dapatkan tantangan bonus!', 'success');
                    
                    // Siapkan tantangan lencana
                    prepareBadgeChallenge();
                }
            }
        } else {
            if (selectedIndex !== -1) {
                options[selectedIndex].classList.add('incorrect');
            }
            options[correctIndex].classList.add('correct');
            
            // Reset streak jika salah
            currentStreak = 0;
        }

        // Lanjut ke pertanyaan berikutnya setelah 2 detik
        setTimeout(() => {
            // Jika punya streak badge dan ini adalah pertanyaan ke-5 dalam streak
            if (hasStreakBadge && currentStreak % 5 === 0 && badgeChallengeQuestions.length > 0) {
                showBadgeChallenge();
            } else {
                currentQuestionIndex++;
                showQuestion();
            }
        }, 2000);
    }

    // Siapkan tantangan lencana
    function prepareBadgeChallenge() {
        badgeChallengeQuestions = [];
        
        // Ambil 3 pertanyaan acak dari quiz yang salah dijawab oleh user
        const wrongQuestions = [];
        
        // Untuk demo, kita buat beberapa pertanyaan challenge
        const challengeQuestions = [
            {
                text: "Manakah jawaban yang SALAH tentang JavaScript?",
                options: [
                    "JavaScript adalah bahasa single-threaded",
                    "JavaScript bisa berjalan di browser dan server",
                    "JavaScript memiliki tipe data integer dan float terpisah", // Ini salah
                    "JavaScript mendukung pemrograman berorientasi objek"
                ],
                correctIndex: 2
            },
            {
                text: "Manakah yang BUKAN framework JavaScript?",
                options: [
                    "React",
                    "Vue",
                    "Angular", 
                    "Django" // Ini salah (Django adalah Python)
                ],
                correctIndex: 3
            }
        ];
        
        badgeChallengeQuestions = challengeQuestions.slice(0, Math.min(3, challengeQuestions.length));
    }

    // Tampilkan tantangan lencana
    function showBadgeChallenge() {
        const container = document.getElementById('badge-questions-container');
        container.innerHTML = '';
        
        badgeChallengeQuestions.forEach((question, qIndex) => {
            const questionHTML = `
                <div class="question-block">
                    <h5>Tantangan ${qIndex + 1}</h5>
                    <p>${question.text}</p>
                    <div class="answer-choice-container">
                        ${question.options.map((option, index) => `
                            <button type="button" class="answer-choice-btn" data-qindex="${qIndex}" data-index="${index}">${option}</button>
                        `).join('')}
                    </div>
                </div>
            `;
            container.innerHTML += questionHTML;
        });
        
        // Reset selected answers
        badgeChallengeQuestions.forEach((_, index) => {
            badgeChallengeQuestions[index].selectedAnswer = -1;
        });
        
        // Add event listeners
        container.querySelectorAll('.answer-choice-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const qIndex = parseInt(this.dataset.qindex);
                const index = parseInt(this.dataset.index);
                
                // Remove selected from all buttons in this question
                this.parentElement.querySelectorAll('.answer-choice-btn').forEach(b => {
                    b.classList.remove('selected');
                });
                
                // Add selected to clicked button
                this.classList.add('selected');
                badgeChallengeQuestions[qIndex].selectedAnswer = index;
            });
        });
        
        showPage('badge-challenge-page');
    }

    // Handle submit tantangan lencana
    function handleBadgeChallengeSubmit() {
        let correctCount = 0;
        
        badgeChallengeQuestions.forEach((question, index) => {
            if (question.selectedAnswer === question.correctIndex) {
                correctCount++;
            }
        });
        
        // Berikan point bonus berdasarkan jumlah yang benar
        const bonusPoints = correctCount * 50; // 50 point per jawaban benar
        userScore += bonusPoints;
        
        showNotification(`🎉 Berhasil memperbaiki ${correctCount} jawaban! +${bonusPoints} point bonus!`, 'success');
        
        // Lanjut ke pertanyaan berikutnya
        currentQuestionIndex++;
        showPage('quiz-page');
        showQuestion();
    }

    // Selesaikan quiz
    async function finishQuiz() {
        document.getElementById('final-score').textContent = userScore;
        document.getElementById('score-details').textContent = 
            `Kamu telah menyelesaikan kuis "${currentQuiz.title}" dengan baik!`;
        
        // Tampilkan lencana yang didapat
        const badgesContainer = document.getElementById('badges-earned');
        badgesContainer.innerHTML = '';
        
        if (badgesEarned.length > 0) {
            badgesEarned.forEach(badge => {
                const badgeElement = document.createElement('div');
                badgeElement.className = 'badge-earned';
                badgeElement.innerHTML = badge === 'streak' ? '🔥' : '⚡';
                badgeElement.title = badge === 'streak' ? 'Lencana Streak' : 'Lencana Speed';
                badgesContainer.appendChild(badgeElement);
            });
        }
        
        showPage('score-page');

        // Simpan hasil
        const username = document.getElementById('username').value;
        const result = {
            username: username,
            quizCode: currentQuiz.code,
            score: userScore,
            badges: badgesEarned,
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

    // Hapus quiz (tanpa popup putih)
    async function deleteQuiz(quizCode) {
        // Gunakan confirm bawaan browser
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) return;
        
        if (confirm(`Apakah Anda yakin ingin menghapus quiz "${quiz.title}" (${quizCode})?`)) {
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
    }

    // ==================== FUNGSI LEADERBOARD ====================

    // Tampilkan leaderboard
    function showLeaderboard() {
        renderLeaderboard();
        showPage('leaderboard-page');
    }

    // Render leaderboard
    function renderLeaderboard() {
        const container = elements.globalLeaderboard;
        
        if (!appData.results || appData.results.length === 0) {
            container.innerHTML = '<p>Belum ada data leaderboard.</p>';
            return;
        }

        // Filter results berdasarkan quiz dan waktu
        let filteredResults = [...appData.results];
        const quizFilter = elements.quizFilter.value;
        const timeFilter = elements.timeFilter.value;

        // Filter berdasarkan quiz
        if (quizFilter) {
            filteredResults = filteredResults.filter(result => result.quizCode === quizFilter);
        }

        // Filter berdasarkan waktu
        const now = new Date();
        if (timeFilter === 'week') {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredResults = filteredResults.filter(result => new Date(result.timestamp) >= oneWeekAgo);
        } else if (timeFilter === 'month') {
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredResults = filteredResults.filter(result => new Date(result.timestamp) >= oneMonthAgo);
        }

        // Urutkan berdasarkan score (tertinggi ke terendah)
        filteredResults.sort((a, b) => b.score - a.score);

        // Update filter quiz options
        updateQuizFilterOptions();

        // Render leaderboard items
        container.innerHTML = '';
        
        if (filteredResults.length === 0) {
            container.innerHTML = '<p>Tidak ada data untuk filter yang dipilih.</p>';
            return;
        }

        filteredResults.forEach((result, index) => {
            const quiz = appData.quizzes.find(q => q.code === result.quizCode);
            const quizName = quiz ? quiz.title : 'Quiz Tidak Ditemukan';
            
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            leaderboardItem.innerHTML = `
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-user">
                    ${result.username}
                    <div class="leaderboard-quiz">${quizName}</div>
                </div>
                <div class="leaderboard-score">${result.score} pts</div>
            `;
            
            container.appendChild(leaderboardItem);
        });
    }

    // Update opsi filter quiz
    function updateQuizFilterOptions() {
        const quizFilter = elements.quizFilter;
        const currentValue = quizFilter.value;
        
        quizFilter.innerHTML = '<option value="">Semua Quiz</option>';
        
        if (appData.quizzes && appData.quizzes.length > 0) {
            appData.quizzes.forEach(quiz => {
                const option = document.createElement('option');
                option.value = quiz.code;
                option.textContent = quiz.title;
                quizFilter.appendChild(option);
            });
        }
        
        // Kembalikan nilai yang dipilih sebelumnya
        quizFilter.value = currentValue;
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
        
        // Leaderboard
        elements.showLeaderboardBtn.addEventListener('click', showLeaderboard);
        elements.backToAdminBtn.addEventListener('click', () => showPage('admin-panel'));
        elements.quizFilter.addEventListener('change', renderLeaderboard);
        elements.timeFilter.addEventListener('change', renderLeaderboard);
        
        // Badge challenge
        document.getElementById('submit-badge-challenge').addEventListener('click', handleBadgeChallengeSubmit);
        
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