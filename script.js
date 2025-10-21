// QUIZ MASTER - SCRIPT UTAMA YANG SUDAH DIPERBAIKI
document.addEventListener('DOMContentLoaded', function() {
    console.log('QUIZ MASTER - Aplikasi dimulai');

    // State aplikasi
    let appData = {
        quizzes: [],
        results: [],
        mainAdmin: {
            username: 'admin',
            password: 'quizmaster123'
        },
        subAdmins: []
    };
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userScore = 0;
    let questionTimer = null;
    let questionStartTime = 0;
    let currentEditingQuiz = null;
    
    // Sistem lencana
    let currentStreak = 0;
    let hasStreakBadge = false;
    let hasSpeedBadge = false;
    let badgesEarned = [];

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
        adminManagerBtn: document.getElementById('admin-manager-btn'),
        backToAdminBtn: document.getElementById('back-to-admin-btn'),
        globalLeaderboard: document.getElementById('global-leaderboard'),
        quizFilter: document.getElementById('quiz-filter'),
        timeFilter: document.getElementById('time-filter'),
        adminList: document.getElementById('admin-list'),
        changeMainAdminForm: document.getElementById('change-main-admin-form'),
        addAdminForm: document.getElementById('add-admin-form'),
        editQuizForm: document.getElementById('edit-quiz-form'),
        editQuestionsContainer: document.getElementById('edit-questions-container'),
        editAddQuestionBtn: document.getElementById('edit-add-question-btn')
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
        const hideAdminIcon = ['quiz-page', 'score-page', 'admin-panel', 'leaderboard-page', 'admin-manager-page'].includes(pageId);
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
                const parsedData = JSON.parse(data);
                // Pastikan struktur data konsisten
                if (!parsedData.mainAdmin) {
                    parsedData.mainAdmin = { username: 'admin', password: 'quizmaster123' };
                }
                if (!parsedData.subAdmins) {
                    parsedData.subAdmins = [];
                }
                return parsedData;
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }
        return { quizzes: [], results: [], mainAdmin: { username: 'admin', password: 'quizmaster123' }, subAdmins: [] };
    }

    // Fungsi untuk mendapatkan konfigurasi API (disembunyikan)
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
                const serverData = data.record || { quizzes: [], results: [], mainAdmin: { username: 'admin', password: 'quizmaster123' }, subAdmins: [] };
                
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
                
                // Update admin data dari server
                if (serverData.mainAdmin) {
                    appData.mainAdmin = serverData.mainAdmin;
                }
                if (serverData.subAdmins) {
                    appData.subAdmins = serverData.subAdmins;
                }
                
                // Pastikan struktur data konsisten
                if (!appData.quizzes) appData.quizzes = [];
                if (!appData.results) appData.results = [];
                if (!appData.mainAdmin) appData.mainAdmin = { username: 'admin', password: 'quizmaster123' };
                if (!appData.subAdmins) appData.subAdmins = [];
                
                // Simpan data gabungan ke localStorage
                saveToLocalStorage(appData);
                
                console.log('Data berhasil diambil dari server:', appData);
                // NOTIFIKASI SINKRONISASI SUKSES DIHILANGKAN
            } else {
                console.warn('Tidak bisa mengakses server, menggunakan data lokal. Status:', response.status);
                showNotification('Tidak dapat terhubung ke server', 'error');
            }
        } catch (error) {
            console.warn('Error fetching from server, using localStorage data:', error);
            showNotification('Error: Gagal mengambil data dari server', 'error');
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
                // NOTIFIKASI SUKSES DIHAPUS
            } else {
                const errorText = await response.text();
                console.error('Server response error:', response.status, errorText);
                throw new Error(`Server response: ${response.status}`);
            }
        } catch (error) {
            console.warn('Gagal menyimpan ke server, menggunakan localStorage:', error);
            showNotification('Error: Gagal menyimpan ke server', 'error');
        } finally {
            showLoader(false);
        }
        
        return serverSuccess;
    }

    // ==================== FUNGSI MANAJEMEN ADMIN ====================

    // Render daftar admin
    function renderAdminList() {
        const container = elements.adminList;
        container.innerHTML = '';

        if (!appData.subAdmins || appData.subAdmins.length === 0) {
            container.innerHTML = '<p>Belum ada admin tambahan.</p>';
            return;
        }

        appData.subAdmins.forEach((admin, index) => {
            const expiryDate = new Date(admin.expiryDate);
            const now = new Date();
            const isExpired = expiryDate < now;
            
            const adminHTML = `
                <div class="admin-item ${isExpired ? 'expired' : ''}">
                    <div class="admin-item-header">
                        <div class="admin-item-info">
                            <div class="admin-item-username">${admin.username}</div>
                            <div class="admin-item-expiry">
                                Masa berlaku: ${expiryDate.toLocaleDateString('id-ID')}
                                ${isExpired ? ' (KADALUARSA)' : ''}
                            </div>
                        </div>
                        <div class="admin-item-actions">
                            <button class="btn btn-danger delete-admin-btn" data-index="${index}" type="button">Hapus</button>
                        </div>
                    </div>
                    <div class="admin-item-permissions">
                        ${admin.permissions.edit ? '<span class="permission-tag">Edit Soal</span>' : ''}
                        ${admin.permissions.create ? '<span class="permission-tag">Buat Materi</span>' : ''}
                        ${admin.permissions.delete ? '<span class="permission-tag">Hapus Quiz</span>' : ''}
                    </div>
                </div>
            `;
            
            container.insertAdjacentHTML('beforeend', adminHTML);
        });

        // Event listener untuk tombol hapus admin
        container.querySelectorAll('.delete-admin-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                deleteSubAdmin(index);
            });
        });
    }

    // Hapus admin tambahan
    async function deleteSubAdmin(index) {
        if (index >= 0 && index < appData.subAdmins.length) {
            const admin = appData.subAdmins[index];
            
            // Gunakan confirm bawaan browser (BUKAN POPUP PUTIH)
            if (confirm(`Apakah Anda yakin ingin menghapus admin "${admin.username}"?`)) {
                appData.subAdmins.splice(index, 1);
                await saveData();
                renderAdminList();
                showNotification('Admin berhasil dihapus!', 'success');
            }
        }
    }

    // Tambah admin baru
    async function addSubAdmin(username, password, expiryDate, permissions) {
        // Cek duplikasi username
        if (appData.subAdmins.some(admin => admin.username === username) || username === appData.mainAdmin.username) {
            showNotification('Username sudah digunakan!', 'error');
            return false;
        }

        const newAdmin = {
            username: username,
            password: password,
            expiryDate: expiryDate,
            permissions: permissions,
            createdAt: new Date().toISOString()
        };

        appData.subAdmins.push(newAdmin);
        await saveData();
        renderAdminList();
        showNotification(`Admin "${username}" berhasil ditambahkan!`, 'success');
        return true;
    }

    // Update admin utama
    async function updateMainAdmin(newUsername, newPassword) {
        if (newUsername && newUsername !== appData.mainAdmin.username) {
            appData.mainAdmin.username = newUsername;
        }
        
        if (newPassword) {
            appData.mainAdmin.password = newPassword;
        }
        
        await saveData();
        showNotification('Admin utama berhasil diperbarui!', 'success');
        return true;
    }

    // Cek apakah user adalah admin utama
    function isMainAdmin(username, password) {
        return username === appData.mainAdmin.username && password === appData.mainAdmin.password;
    }

    // Cek apakah user adalah admin tambahan
    function isSubAdmin(username, password) {
        const now = new Date();
        return appData.subAdmins.some(admin => 
            admin.username === username && 
            admin.password === password &&
            new Date(admin.expiryDate) >= now
        );
    }

    // Dapatkan permissions admin
    function getAdminPermissions(username) {
        if (username === appData.mainAdmin.username) {
            return {
                edit: true,
                create: true,
                delete: true,
                manageAdmins: true
            };
        }
        
        const admin = appData.subAdmins.find(a => a.username === username);
        return admin ? admin.permissions : null;
    }

    // ==================== FUNGSI QUIZ & SISTEM POINT ====================

    // Mulai quiz
    function startQuiz(quizCode, username) {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) {
            showNotification('Kode quiz tidak ditemukan!', 'error');
            return;
        }

        // Cek apakah username sudah pernah mengerjakan quiz ini
        const existingResult = appData.results.find(r => 
            r.quizCode === quizCode && r.username === username
        );

        if (existingResult) {
            showNotification(`Username "${username}" sudah pernah mengerjakan quiz ini! Silakan gunakan username lain.`, 'error');
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
            currentQuestionIndex++;
            showQuestion();
        }, 2000);
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

    // ==================== FUNGSI ADMIN QUIZ ====================

    // Tambah field pertanyaan
    function addQuestionField(container = elements.questionsContainer, questionData = null) {
        const questionCount = container.querySelectorAll('.question-block').length + 1;
        
        const questionHTML = `
            <div class="question-block">
                <div class="question-header">
                    <h5>Pertanyaan ${questionCount}</h5>
                    <button type="button" class="delete-question-btn">Hapus</button>
                </div>
                <input type="text" class="input-field question-text" placeholder="Teks Pertanyaan" value="${questionData ? questionData.text : ''}" required>
                <input type="number" class="input-field question-timer" placeholder="Waktu (detik)" value="${questionData ? questionData.timer : 30}" min="10" required>
                <input type="url" class="input-field question-image" placeholder="URL Gambar (opsional)" value="${questionData ? questionData.image || '' : ''}">
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 1" value="${questionData ? questionData.options[0] || '' : ''}" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 2" value="${questionData ? questionData.options[1] || '' : ''}" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 3" value="${questionData ? questionData.options[2] || '' : ''}" required>
                <input type="text" class="input-field option" placeholder="Opsi Jawaban 4" value="${questionData ? questionData.options[3] || '' : ''}" required>
                <div class="correct-answer-selector">
                    <div class="form-label">Pilih Jawaban Benar:</div>
                    <div class="answer-choice-container">
                        <button type="button" class="answer-choice-btn" data-index="0">Opsi 1</button>
                        <button type="button" class="answer-choice-btn" data-index="1">Opsi 2</button>
                        <button type="button" class="answer-choice-btn" data-index="2">Opsi 3</button>
                        <button type="button" class="answer-choice-btn" data-index="3">Opsi 4</button>
                    </div>
                </div>
                <input type="hidden" class="correct-answer" value="${questionData ? questionData.answer : ''}">
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

        // Jika ada data pertanyaan, set jawaban yang benar
        if (questionData && questionData.answer !== undefined) {
            const correctBtn = newQuestion.querySelector(`.answer-choice-btn[data-index="${questionData.answer}"]`);
            if (correctBtn) {
                correctBtn.classList.add('selected');
            }
        }
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

    // Edit quiz
    function editQuiz(quizCode) {
        const quiz = appData.quizzes.find(q => q.code === quizCode);
        if (!quiz) return;

        currentEditingQuiz = quiz;
        
        // Isi form edit dengan data quiz
        document.getElementById('edit-quiz-title').value = quiz.title;
        document.getElementById('edit-quiz-code').value = quiz.code;
        
        // Kosongkan container pertanyaan
        elements.editQuestionsContainer.innerHTML = '';
        
        // Tambahkan pertanyaan dari quiz
        quiz.questions.forEach(question => {
            addQuestionField(elements.editQuestionsContainer, question);
        });
        
        // Tampilkan modal edit
        document.getElementById('edit-quiz-popup').classList.add('active');
    }

    // Handle update quiz
    async function handleUpdateQuiz(e) {
        e.preventDefault();
        
        if (!currentEditingQuiz) return;

        const title = document.getElementById('edit-quiz-title').value.trim();

        if (!title) {
            showNotification('Judul quiz tidak boleh kosong!', 'error');
            return;
        }

        // Kumpulkan data pertanyaan
        const questions = [];
        const questionBlocks = elements.editQuestionsContainer.querySelectorAll('.question-block');
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

        // Update quiz
        currentEditingQuiz.title = title;
        currentEditingQuiz.questions = questions;
        currentEditingQuiz.updatedAt = new Date().toISOString();

        const success = await saveData();

        if (success) {
            showNotification(`Quiz "${title}" berhasil diperbarui!`, 'success');
            
            // Tutup modal
            document.getElementById('edit-quiz-popup').classList.remove('active');
            
            // Refresh daftar quiz
            renderQuizList();
        } else {
            showNotification('Quiz berhasil diperbarui secara lokal!', 'success');
            
            // Tutup modal
            document.getElementById('edit-quiz-popup').classList.remove('active');
            
            // Refresh daftar quiz
            renderQuizList();
        }
    }

    // Hapus quiz (TANPA POP-UP PUTIH)
    async function deleteQuiz(quizCode) {
        // Gunakan confirm bawaan browser (BUKAN POPUP PUTIH)
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
        
        document.querySelector('#edit-quiz-popup .close-btn').addEventListener('click', () => {
            document.getElementById('edit-quiz-popup').classList.remove('active');
        });
        
        document.getElementById('admin-logout-btn').addEventListener('click', () => {
            showPage('landing-page');
        });
        
        // Admin Manager
        elements.adminManagerBtn.addEventListener('click', () => {
            // Isi form dengan data admin utama saat ini
            document.getElementById('main-admin-username').value = appData.mainAdmin.username;
            document.getElementById('main-admin-password').value = '';
            document.getElementById('main-admin-new-password').value = '';
            
            // Set tanggal minimal untuk masa berlaku admin (hari ini)
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('admin-expiry-date').min = tomorrow.toISOString().split('T')[0];
            
            renderAdminList();
            showPage('admin-manager-page');
        });
        
        elements.backToAdminBtn.addEventListener('click', () => showPage('admin-panel'));
        
        // Forms admin manager
        elements.changeMainAdminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('main-admin-username').value.trim();
            const currentPassword = document.getElementById('main-admin-password').value;
            const newPassword = document.getElementById('main-admin-new-password').value;
            
            // Verifikasi password saat ini
            if (currentPassword !== appData.mainAdmin.password) {
                showNotification('Password saat ini salah!', 'error');
                return;
            }
            
            await updateMainAdmin(username, newPassword || currentPassword);
        });
        
        elements.addAdminForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('new-admin-username').value.trim();
            const password = document.getElementById('new-admin-password').value;
            const expiryDate = document.getElementById('admin-expiry-date').value;
            
            const permissions = {
                edit: document.getElementById('permission-edit').checked,
                create: document.getElementById('permission-create').checked,
                delete: document.getElementById('permission-delete').checked
            };
            
            await addSubAdmin(username, password, expiryDate, permissions);
            elements.addAdminForm.reset();
        });
        
        // Leaderboard
        elements.showLeaderboardBtn.addEventListener('click', showLeaderboard);
        document.getElementById('back-to-admin-from-leaderboard').addEventListener('click', () => showPage('admin-panel'));
        elements.quizFilter.addEventListener('change', renderLeaderboard);
        elements.timeFilter.addEventListener('change', renderLeaderboard);
        
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
            
            // Cek login sebagai admin utama atau admin tambahan
            if (isMainAdmin(username, password) || isSubAdmin(username, password)) {
                document.getElementById('admin-login-popup').classList.remove('active');
                showPage('admin-panel');
                renderQuizList();
                
                // Sembunyikan tombol manajemen admin jika bukan admin utama
                if (!isMainAdmin(username, password)) {
                    elements.adminManagerBtn.style.display = 'none';
                } else {
                    elements.adminManagerBtn.style.display = 'block';
                }
            } else {
                showNotification('Username atau password salah!', 'error');
            }
        });
        
        // Quiz creation
        elements.addQuestionBtn.addEventListener('click', () => addQuestionField());
        elements.createQuizForm.addEventListener('submit', handleCreateQuiz);

        // Edit quiz
        elements.editAddQuestionBtn.addEventListener('click', () => addQuestionField(elements.editQuestionsContainer));
        elements.editQuizForm.addEventListener('submit', handleUpdateQuiz);

        // Event delegation untuk quiz list (hanya sekali dipasang)
        elements.quizListContainer.addEventListener('click', function(e) {
            const quizCode = e.target.dataset.code;
            
            if (e.target.classList.contains('delete-quiz-btn')) {
                deleteQuiz(quizCode);
            } else if (e.target.classList.contains('edit-quiz-btn')) {
                editQuiz(quizCode);
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