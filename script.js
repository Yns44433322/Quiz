// Konfigurasi JSONBin.io
const JSONBIN_CONFIG = {
    baseURL: 'https://api.jsonbin.io/v3/b',
    binId: '67d2a31eacd3cb34a88b6c9c',
    accessKey: '$2a$10$V2VyaWZha2VyQXBpS2V5.OdR2QnZhLm1vc3Rlc3RlcnNlY3JldGtleQ==',
    masterKey: '$2a$10$V2VyaWZha2VyQXBpS2V5.OdR2QnZhLm1vc3Rlc3RlcnNlY3JldGtleQ=='
};

// Data aplikasi
let appData = {
    quizzes: [],
    leaderboard: [],
    quizCodes: [],
    currentUser: null,
    currentQuiz: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    score: 0,
    timer: null,
    timeLeft: 30,
    isAdmin: false,
    streak: 0,
    correctAnswers: 0
};

// ===== MODAL CUSTOM SYSTEM =====
let modalResolve = null;

function showCustomModal(title, message, type = 'alert') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Setup berdasarkan tipe modal
        if (type === 'alert') {
            modalCancel.style.display = 'none';
            modalConfirm.textContent = 'OK';
        } else {
            modalCancel.style.display = 'block';
            modalConfirm.textContent = 'Ya';
        }
        
        modalResolve = resolve;
        modal.classList.add('active');
        
        // Event listeners
        const closeModal = () => {
            modal.classList.remove('active');
            if (modalResolve) {
                modalResolve(type === 'alert' ? true : false);
                modalResolve = null;
            }
        };
        
        modalConfirm.onclick = () => {
            closeModal();
            if (type === 'confirm') resolve(true);
        };
        
        modalCancel.onclick = () => {
            closeModal();
            if (type === 'confirm') resolve(false);
        };
        
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = closeModal;
        });
        
        // Close modal ketika klik di luar
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };
    });
}

// Ganti semua alert dengan modal custom
async function showAlert(message) {
    await showCustomModal('Informasi', message, 'alert');
}

// Ganti semua confirm dengan modal custom
async function showConfirm(message) {
    return await showCustomModal('Konfirmasi', message, 'confirm');
}

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Inisialisasi data aplikasi
async function initializeApp() {
    // Coba load data dari JSONBin
    try {
        const response = await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            appData = { ...appData, ...data.record };
        } else {
            // Jika gagal, gunakan data default dari localStorage
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading data from JSONBin:', error);
        loadFromLocalStorage();
    }
    
    // Inisialisasi data default jika kosong
    if (appData.quizzes.length === 0) {
        initializeSampleData();
    }
    
    // Update tampilan
    updateQuizCodeForm();
    updateEditQuestionForm();
    updateQuizCodesList();
    updateQuestionList();
    updateLeaderboardDisplay();
}

// Simpan data ke JSONBin
async function saveAppData() {
    // Simpan ke localStorage sebagai fallback
    localStorage.setItem('quizMasterData', JSON.stringify(appData));
    
    // Simpan ke JSONBin
    try {
        await fetch(`${JSONBIN_CONFIG.baseURL}/${JSONBIN_CONFIG.binId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.masterKey
            },
            body: JSON.stringify(appData)
        });
    } catch (error) {
        console.error('Error saving data to JSONBin:', error);
    }
}

// Load data dari localStorage
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('quizMasterData');
    if (savedData) {
        appData = { ...appData, ...JSON.parse(savedData) };
    }
}

// Inisialisasi data sampel
function initializeSampleData() {
    appData.quizzes = [
        {
            id: 1,
            theme: "Matematika Dasar",
            code: "83027",
            questions: [
                {
                    id: 1,
                    text: "Berapakah hasil dari 15 + 27?",
                    type: "multiple",
                    options: ["32", "42", "52", "62"],
                    correctAnswer: "B",
                    timer: 30
                },
                {
                    id: 2,
                    text: "Jika sebuah persegi memiliki sisi 5 cm, berapakah luasnya?",
                    type: "multiple",
                    options: ["10 cm²", "15 cm²", "20 cm²", "25 cm²"],
                    correctAnswer: "D",
                    timer: 30
                },
                {
                    id: 3,
                    text: "Jelaskan teorema Pythagoras dalam kata-kata Anda sendiri.",
                    type: "essay",
                    timer: 45
                }
            ]
        },
        {
            id: 2,
            theme: "Bahasa Inggris",
            code: "ENG02",
            questions: [
                {
                    id: 1,
                    text: "What is the past tense of 'go'?",
                    type: "multiple",
                    options: ["goed", "went", "gone", "goes"],
                    correctAnswer: "B",
                    timer: 25
                },
                {
                    id: 2,
                    text: "Describe your favorite hobby in English.",
                    type: "essay",
                    timer: 60
                }
            ]
        }
    ];
    
    appData.quizCodes = [
        { code: "83027", theme: "Matematika Dasar" },
        { code: "ENG02", theme: "Bahasa Inggris" }
    ];
    
    appData.leaderboard = [
        { username: "QuizMaster", score: 250, date: "2023-10-15" },
        { username: "MathWizard", score: 200, date: "2023-10-14" },
        { username: "LanguageExpert", score: 180, date: "2023-10-13" }
    ];
    
    saveAppData();
}

// Setup event listeners
function setupEventListeners() {
    // Tombol di halaman utama
    document.getElementById('start-quiz-btn').addEventListener('click', showInputPage);
    
    // Tombol di halaman input
    document.getElementById('start-quiz-btn-2').addEventListener('click', startQuiz);
    document.getElementById('user-input-form').addEventListener('submit', function(e) {
        e.preventDefault();
        startQuiz();
    });
    
    // Validasi form input
    document.getElementById('username').addEventListener('input', validateInputForm);
    document.getElementById('quiz-code').addEventListener('input', validateInputForm);
    
    // Tombol di halaman quiz
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    
    // Tombol di halaman hasil
    document.getElementById('view-leaderboard-btn').addEventListener('click', showLeaderboard);
    document.getElementById('restart-quiz-btn').addEventListener('click', restartQuiz);
    
    // Tombol di halaman leaderboard
    document.getElementById('back-to-results').addEventListener('click', showResultsPage);
    
    // Ikon profil (login admin)
    document.getElementById('profile-icon').addEventListener('click', showAdminLogin);
    document.getElementById('profile-icon-2').addEventListener('click', showAdminLogin);
    
    // Modal login admin
    document.getElementById('admin-login-form').addEventListener('submit', loginAdmin);
    document.querySelector('.close').addEventListener('click', closeAdminLogin);
    
    // Dashboard admin
    document.getElementById('logout-admin').addEventListener('click', logoutAdmin);
    
    // Tab admin
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchAdminTab(this.dataset.tab);
        });
    });
    
    // Form tambah soal
    document.getElementById('add-question-form').addEventListener('submit', addNewQuestion);
    
    // Form tambah kode quiz
    document.getElementById('add-quiz-code-form').addEventListener('submit', addNewQuizCode);
    
    // Tombol reset leaderboard
    document.getElementById('reset-leaderboard-btn').addEventListener('click', resetLeaderboard);
    
    // Toggle multiple choice fields berdasarkan jenis soal
    document.getElementById('question-type').addEventListener('change', toggleMultipleChoiceFields);
    
    // Event listeners baru untuk modal
    document.getElementById('edit-question-type').addEventListener('change', toggleEditMultipleChoiceFields);
    document.getElementById('save-edit-question').addEventListener('click', saveEditedQuestion);
    
    // Event listeners untuk tutup modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
            currentEditingQuestion = null;
        });
    });
    
    // Tutup modal ketika klik di luar
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                currentEditingQuestion = null;
            }
        });
    });
}

// ===== SISTEM TEMA DAN KODE QUIZ YANG TERHUBUNG =====

// Update form tambah soal dengan dropdown tema
function updateQuizCodeForm() {
    const themeSelect = document.getElementById('quiz-theme');
    themeSelect.innerHTML = '';
    
    // Ambil semua tema unik dari quizzes
    const uniqueThemes = [...new Set(appData.quizzes.map(quiz => quiz.theme))];
    
    uniqueThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelect.appendChild(option);
    });
    
    // Update form kode quiz
    const codeThemeSelect = document.getElementById('quiz-code-theme');
    codeThemeSelect.innerHTML = '';
    
    uniqueThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        codeThemeSelect.appendChild(option);
    });
}

// Update form edit soal dengan dropdown tema
function updateEditQuestionForm() {
    const themeSelect = document.getElementById('edit-quiz-theme');
    themeSelect.innerHTML = '';
    
    const uniqueThemes = [...new Set(appData.quizzes.map(quiz => quiz.theme))];
    
    uniqueThemes.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelect.appendChild(option);
    });
}

// Tambah kode quiz baru
async function addNewQuizCode(e) {
    e.preventDefault();
    
    const code = document.getElementById('new-quiz-code').value.toUpperCase().trim();
    const theme = document.getElementById('quiz-code-theme').value;
    
    if (!code) {
        await showAlert('Kode quiz harus diisi!');
        return;
    }
    
    // Validasi kode unik
    if (appData.quizCodes.find(qc => qc.code === code)) {
        await showAlert('Kode quiz sudah digunakan!');
        return;
    }
    
    // Tambahkan ke daftar kode quiz
    appData.quizCodes.push({
        code: code,
        theme: theme
    });
    
    // Jika tema belum ada di quizzes, buat quiz baru
    if (!appData.quizzes.find(q => q.theme === theme)) {
        appData.quizzes.push({
            id: Date.now(),
            theme: theme,
            code: code,
            questions: []
        });
    } else {
        // Jika tema sudah ada, update kode quiz yang ada
        const existingQuiz = appData.quizzes.find(q => q.theme === theme);
        if (existingQuiz) {
            existingQuiz.code = code;
        }
    }
    
    // Simpan perubahan
    saveAppData();
    
    // Reset form
    e.target.reset();
    
    // Update tampilan
    updateQuizCodesList();
    updateQuizCodeForm();
    
    await showAlert('Kode quiz berhasil ditambahkan!');
}

// ===== SISTEM EDIT SOAL YANG DIPERBAIKI =====

let currentEditingQuestion = null;

// Tampilkan modal edit soal
function showEditQuestionModal(quizId, questionId) {
    const quiz = appData.quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return;
    
    currentEditingQuestion = { quizId, questionId };
    
    // Isi form dengan data soal
    document.getElementById('edit-quiz-theme').value = quiz.theme;
    document.getElementById('edit-question-text').value = question.text;
    document.getElementById('edit-question-image-url').value = question.imageUrl || '';
    document.getElementById('edit-question-type').value = question.type;
    document.getElementById('edit-question-timer').value = question.timer || 30;
    
    // Tampilkan/sembunyikan bagian pilihan ganda
    toggleEditMultipleChoiceFields();
    
    // Isi opsi untuk pilihan ganda
    if (question.type === 'multiple') {
        document.getElementById('edit-option-a').value = question.options[0] || '';
        document.getElementById('edit-option-b').value = question.options[1] || '';
        document.getElementById('edit-option-c').value = question.options[2] || '';
        document.getElementById('edit-option-d').value = question.options[3] || '';
        
        // Set jawaban benar
        const correctAnswerRadio = document.querySelector(`input[name="edit-correct-answer"][value="${question.correctAnswer}"]`);
        if (correctAnswerRadio) {
            correctAnswerRadio.checked = true;
        }
    }
    
    // Tampilkan modal
    document.getElementById('edit-question-modal').classList.add('active');
}

// Toggle fields pilihan ganda di form edit
function toggleEditMultipleChoiceFields() {
    const questionType = document.getElementById('edit-question-type').value;
    const multipleChoiceSection = document.getElementById('edit-multiple-choice-admin');
    
    if (questionType === 'multiple') {
        multipleChoiceSection.style.display = 'block';
    } else {
        multipleChoiceSection.style.display = 'none';
    }
}

// Toggle fields pilihan ganda di form tambah soal
function toggleMultipleChoiceFields() {
    const questionType = document.getElementById('question-type').value;
    const multipleChoiceSection = document.getElementById('multiple-choice-admin');
    
    if (questionType === 'multiple') {
        multipleChoiceSection.style.display = 'block';
    } else {
        multipleChoiceSection.style.display = 'none';
    }
}

// Simpan perubahan soal
async function saveEditedQuestion() {
    if (!currentEditingQuestion) return;
    
    const quiz = appData.quizzes.find(q => q.id === currentEditingQuestion.quizId);
    if (!quiz) return;
    
    const question = quiz.questions.find(q => q.id === currentEditingQuestion.questionId);
    if (!question) return;
    
    const theme = document.getElementById('edit-quiz-theme').value;
    const questionText = document.getElementById('edit-question-text').value;
    const imageUrl = document.getElementById('edit-question-image-url').value;
    const questionType = document.getElementById('edit-question-type').value;
    const timer = parseInt(document.getElementById('edit-question-timer').value) || 30;
    
    // Update data soal
    question.text = questionText;
    question.type = questionType;
    question.timer = timer;
    
    if (imageUrl) {
        question.imageUrl = imageUrl;
    } else {
        delete question.imageUrl;
    }
    
    if (questionType === 'multiple') {
        const optionA = document.getElementById('edit-option-a').value;
        const optionB = document.getElementById('edit-option-b').value;
        const optionC = document.getElementById('edit-option-c').value;
        const optionD = document.getElementById('edit-option-d').value;
        const correctAnswer = document.querySelector('input[name="edit-correct-answer"]:checked');
        
        if (!optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            await showAlert('Harap isi semua opsi dan pilih jawaban yang benar!');
            return;
        }
        
        question.options = [optionA, optionB, optionC, optionD];
        question.correctAnswer = correctAnswer.value;
    } else {
        // Hapus properti untuk soal esai
        delete question.options;
        delete question.correctAnswer;
    }
    
    // Jika tema diubah, pindahkan soal ke quiz dengan tema yang sesuai
    if (theme !== quiz.theme) {
        // Cari quiz dengan tema yang baru
        let targetQuiz = appData.quizzes.find(q => q.theme === theme);
        
        if (!targetQuiz) {
            // Buat quiz baru jika tema tidak ada
            targetQuiz = {
                id: Date.now(),
                theme: theme,
                code: generateQuizCode(theme),
                questions: []
            };
            appData.quizzes.push(targetQuiz);
            
            // Tambahkan kode quiz baru
            appData.quizCodes.push({
                code: targetQuiz.code,
                theme: theme
            });
        }
        
        // Pindahkan soal ke quiz baru
        quiz.questions = quiz.questions.filter(q => q.id !== question.id);
        targetQuiz.questions.push(question);
    }
    
    // Simpan perubahan
    saveAppData();
    
    // Update tampilan
    updateQuestionList();
    updateQuizCodeForm();
    updateQuizCodesList();
    
    // Tutup modal
    document.getElementById('edit-question-modal').classList.remove('active');
    currentEditingQuestion = null;
    
    await showAlert('Soal berhasil diperbarui!');
}

// ===== FUNGSI UTAMA APLIKASI =====

// Validasi form input
function validateInputForm() {
    const username = document.getElementById('username').value.trim();
    const quizCode = document.getElementById('quiz-code').value.trim();
    const startButton = document.getElementById('start-quiz-btn-2');
    
    startButton.disabled = !(username && quizCode);
}

// Navigasi halaman
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function showInputPage() {
    showPage('input-page');
}

function showQuizPage() {
    showPage('quiz-page');
}

function showResultsPage() {
    showPage('results-page');
    displayResults();
}

function showLeaderboard() {
    showPage('leaderboard-page');
    updateLeaderboardDisplay();
}

function restartQuiz() {
    showPage('home-page');
    resetQuizState();
}

// Mulai quiz
async function startQuiz() {
    const username = document.getElementById('username').value.trim();
    const quizCode = document.getElementById('quiz-code').value.trim().toUpperCase();
    
    // Validasi kode quiz
    const quiz = appData.quizzes.find(q => q.code === quizCode);
    if (!quiz) {
        await showAlert('Kode quiz tidak valid! Silakan periksa kembali.');
        return;
    }
    
    // Set data pengguna dan quiz
    appData.currentUser = username;
    appData.currentQuiz = quiz;
    appData.currentQuestionIndex = 0;
    appData.userAnswers = [];
    appData.score = 0;
    appData.streak = 0;
    appData.correctAnswers = 0;
    
    // Tampilkan halaman quiz
    showQuizPage();
    loadQuestion();
}

// Reset state quiz
function resetQuizState() {
    appData.currentUser = null;
    appData.currentQuiz = null;
    appData.currentQuestionIndex = 0;
    appData.userAnswers = [];
    appData.score = 0;
    appData.streak = 0;
    appData.correctAnswers = 0;
    
    // Reset form input
    document.getElementById('username').value = '';
    document.getElementById('quiz-code').value = '';
    validateInputForm();
}

// Muat pertanyaan
function loadQuestion() {
    if (!appData.currentQuiz || appData.currentQuestionIndex >= appData.currentQuiz.questions.length) {
        finishQuiz();
        return;
    }
    
    const question = appData.currentQuiz.questions[appData.currentQuestionIndex];
    
    // Update header quiz
    document.getElementById('quiz-title').textContent = appData.currentQuiz.theme;
    document.getElementById('question-counter').textContent = 
        `Soal ${appData.currentQuestionIndex + 1} dari ${appData.currentQuiz.questions.length}`;
    
    // Set timer
    appData.timeLeft = question.timer || 30;
    document.getElementById('timer').textContent = appData.timeLeft;
    
    // Reset timer sebelumnya
    if (appData.timer) {
        clearInterval(appData.timer);
    }
    
    // Mulai timer baru
    startTimer();
    
    // Tampilkan pertanyaan
    document.getElementById('question-text').textContent = question.text;
    
    // Tampilkan gambar jika ada
    const questionImage = document.getElementById('question-image');
    if (question.imageUrl) {
        questionImage.innerHTML = `<img src="${question.imageUrl}" alt="Gambar soal">`;
    } else {
        questionImage.innerHTML = '';
    }
    
    // Tampilkan opsi berdasarkan jenis soal
    if (question.type === 'multiple') {
        document.getElementById('multiple-choice').style.display = 'block';
        document.getElementById('essay-answer').style.display = 'none';
        
        displayMultipleChoiceOptions(question);
    } else {
        document.getElementById('multiple-choice').style.display = 'none';
        document.getElementById('essay-answer').style.display = 'block';
        
        document.getElementById('essay-text').value = '';
    }
    
    // Sembunyikan tombol selanjutnya untuk sementara
    document.getElementById('next-question-btn').style.display = 'none';
}

// Tampilkan opsi pilihan ganda
function displayMultipleChoiceOptions(question) {
    const optionsContainer = document.getElementById('multiple-choice');
    optionsContainer.innerHTML = '';
    
    const optionLetters = ['A', 'B', 'C', 'D'];
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.innerHTML = `
            <div class="option-letter">${optionLetters[index]}</div>
            <div class="option-text">${option}</div>
        `;
        
        optionElement.addEventListener('click', function() {
            // Hapus seleksi sebelumnya
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // Tandai opsi yang dipilih
            this.classList.add('selected');
            
            // Simpan jawaban
            appData.userAnswers[appData.currentQuestionIndex] = optionLetters[index];
            
            // Tampilkan tombol selanjutnya
            document.getElementById('next-question-btn').style.display = 'block';
        });
        
        optionsContainer.appendChild(optionElement);
    });
}

// Timer
function startTimer() {
    appData.timer = setInterval(function() {
        appData.timeLeft--;
        document.getElementById('timer').textContent = appData.timeLeft;
        
        if (appData.timeLeft <= 0) {
            clearInterval(appData.timer);
            nextQuestion();
        }
    }, 1000);
}

// Pertanyaan berikutnya
function nextQuestion() {
    // Hentikan timer
    if (appData.timer) {
        clearInterval(appData.timer);
    }
    
    // Untuk soal esai, simpan jawaban
    const currentQuestion = appData.currentQuiz.questions[appData.currentQuestionIndex];
    if (currentQuestion.type === 'essay') {
        appData.userAnswers[appData.currentQuestionIndex] = document.getElementById('essay-text').value;
    }
    
    // Lanjut ke pertanyaan berikutnya
    appData.currentQuestionIndex++;
    loadQuestion();
}

// Selesaikan quiz
function finishQuiz() {
    // Hentikan timer
    if (appData.timer) {
        clearInterval(appData.timer);
    }
    
    // Hitung skor
    calculateScore();
    
    // Simpan ke leaderboard
    saveToLeaderboard();
    
    // Tampilkan halaman hasil
    showResultsPage();
}

// Hitung skor
function calculateScore() {
    let correctAnswers = 0;
    
    for (let i = 0; i < appData.currentQuiz.questions.length; i++) {
        const question = appData.currentQuiz.questions[i];
        const userAnswer = appData.userAnswers[i];
        
        if (question.type === 'multiple' && userAnswer === question.correctAnswer) {
            correctAnswers++;
            appData.streak++;
            
            // Beri bonus untuk streak
            if (appData.streak >= 5) {
                appData.score += 15; // Bonus untuk streak
            } else {
                appData.score += 10;
            }
        } else if (question.type === 'essay') {
            // Untuk soal esai, beri skor minimal
            if (userAnswer && userAnswer.trim().length > 0) {
                appData.score += 5;
                correctAnswers += 0.5; // Setengah poin untuk esai yang diisi
            }
            appData.streak = 0; // Reset streak untuk esai
        } else {
            appData.streak = 0; // Reset streak untuk jawaban salah
        }
    }
    
    appData.correctAnswers = Math.round(correctAnswers);
}

// Tampilkan hasil
function displayResults() {
    document.getElementById('final-score').textContent = appData.score;
    document.getElementById('correct-answers').textContent = appData.correctAnswers;
    document.getElementById('total-questions').textContent = appData.currentQuiz.questions.length;
    document.getElementById('total-time').textContent = 'Waktu tidak dihitung';
    
    // Tampilkan badge jika ada streak
    const badgeContainer = document.getElementById('badge-container');
    badgeContainer.innerHTML = '';
    
    if (appData.streak >= 5) {
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = 'Master Streak!';
        badgeContainer.appendChild(badge);
    }
}

// Simpan ke leaderboard
function saveToLeaderboard() {
    const leaderboardEntry = {
        username: appData.currentUser,
        score: appData.score,
        date: new Date().toISOString().split('T')[0],
        quiz: appData.currentQuiz.theme
    };
    
    appData.leaderboard.push(leaderboardEntry);
    
    // Urutkan leaderboard berdasarkan skor
    appData.leaderboard.sort((a, b) => b.score - a.score);
    
    // Simpan perubahan
    saveAppData();
}

// Update tampilan leaderboard
function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';
    
    // Tampilkan maksimal 10 entri
    const topScores = appData.leaderboard.slice(0, 10);
    
    if (topScores.length === 0) {
        leaderboardList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Belum ada data leaderboard</p>';
        return;
    }
    
    topScores.forEach((entry, index) => {
        const leaderboardItem = document.createElement('div');
        leaderboardItem.className = `leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}`;
        
        leaderboardItem.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-name">${entry.username}</div>
            <div class="leaderboard-score">${entry.score}</div>
        `;
        
        leaderboardList.appendChild(leaderboardItem);
    });
}

// ===== FUNGSI ADMIN =====

function showAdminLogin() {
    document.getElementById('admin-login-modal').classList.add('active');
}

function closeAdminLogin() {
    document.getElementById('admin-login-modal').classList.remove('active');
}

async function loginAdmin(e) {
    e.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (username === 'AdminQuiz' && password === 'YD23FW') {
        appData.isAdmin = true;
        closeAdminLogin();
        showPage('admin-dashboard');
        updateQuestionList();
        updateQuizCodesList();
    } else {
        await showAlert('Username atau password salah!');
    }
}

function logoutAdmin() {
    appData.isAdmin = false;
    showPage('home-page');
}

function switchAdminTab(tabId) {
    // Update tab aktif
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    
    // Update konten tab
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabId).classList.add('active');
}

// Tambah soal baru
async function addNewQuestion(e) {
    e.preventDefault();
    
    const theme = document.getElementById('quiz-theme').value;
    const questionText = document.getElementById('question-text-admin').value;
    const imageUrl = document.getElementById('question-image-url').value;
    const questionType = document.getElementById('question-type').value;
    const timer = parseInt(document.getElementById('question-timer').value) || 30;
    
    let newQuestion = {
        id: Date.now(),
        text: questionText,
        type: questionType,
        timer: timer
    };
    
    if (imageUrl) {
        newQuestion.imageUrl = imageUrl;
    }
    
    if (questionType === 'multiple') {
        const optionA = document.getElementById('option-a').value;
        const optionB = document.getElementById('option-b').value;
        const optionC = document.getElementById('option-c').value;
        const optionD = document.getElementById('option-d').value;
        const correctAnswer = document.querySelector('input[name="correct-answer"]:checked');
        
        if (!optionA || !optionB || !optionC || !optionD || !correctAnswer) {
            await showAlert('Harap isi semua opsi dan pilih jawaban yang benar!');
            return;
        }
        
        newQuestion.options = [optionA, optionB, optionC, optionD];
        newQuestion.correctAnswer = correctAnswer.value;
    }
    
    // Cari quiz dengan tema yang sesuai atau buat baru
    let quiz = appData.quizzes.find(q => q.theme === theme);
    
    if (!quiz) {
        // Buat quiz baru
        const code = generateQuizCode(theme);
        quiz = {
            id: Date.now(),
            theme: theme,
            code: code,
            questions: []
        };
        appData.quizzes.push(quiz);
        
        // Tambahkan ke daftar kode quiz
        appData.quizCodes.push({
            code: code,
            theme: theme
        });
        
        updateQuizCodesList();
    }
    
    // Tambahkan pertanyaan ke quiz
    quiz.questions.push(newQuestion);
    
    // Simpan perubahan
    saveAppData();
    
    // Reset form
    e.target.reset();
    
    // Update daftar soal
    updateQuestionList();
    
    await showAlert('Soal berhasil ditambahkan!');
}

function generateQuizCode(theme) {
    const prefix = theme.substring(0, 3).toUpperCase();
    let counter = 1;
    
    // Cari kode yang belum digunakan
    while (appData.quizCodes.find(qc => qc.code === `${prefix}${counter.toString().padStart(2, '0')}`)) {
        counter++;
    }
    
    return `${prefix}${counter.toString().padStart(2, '0')}`;
}

// Update daftar soal
function updateQuestionList() {
    const questionList = document.getElementById('question-list');
    questionList.innerHTML = '';
    
    if (appData.quizzes.length === 0) {
        questionList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Belum ada soal</p>';
        return;
    }
    
    appData.quizzes.forEach(quiz => {
        if (quiz.questions.length === 0) return;
        
        const quizHeader = document.createElement('div');
        quizHeader.className = 'quiz-header-item';
        quizHeader.innerHTML = `
            <h4>${quiz.theme} (Kode: ${quiz.code}) - ${quiz.questions.length} soal</h4>
        `;
        questionList.appendChild(quizHeader);
        
        quiz.questions.forEach(question => {
            const questionItem = document.createElement('div');
            questionItem.className = 'question-item';
            questionItem.innerHTML = `
                <div class="question-info">
                    <strong>${question.text.substring(0, 80)}${question.text.length > 80 ? '...' : ''}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 5px;">
                        ${question.type === 'multiple' ? 'Pilihan Ganda' : 'Esai'} - ${question.timer} detik
                        ${question.type === 'multiple' ? ` - Jawaban: ${question.correctAnswer}` : ''}
                    </div>
                </div>
                <div class="question-actions">
                    <button class="btn-secondary edit-question-btn" data-quiz-id="${quiz.id}" data-question-id="${question.id}">Edit</button>
                    <button class="btn-danger delete-question-btn" data-quiz-id="${quiz.id}" data-question-id="${question.id}">Hapus</button>
                </div>
            `;
            
            questionList.appendChild(questionItem);
        });
    });
    
    // Event listeners untuk tombol edit dan hapus
    document.querySelectorAll('.edit-question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const quizId = parseInt(this.dataset.quizId);
            const questionId = parseInt(this.dataset.questionId);
            showEditQuestionModal(quizId, questionId);
        });
    });
    
    document.querySelectorAll('.delete-question-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const quizId = parseInt(this.dataset.quizId);
            const questionId = parseInt(this.dataset.questionId);
            deleteQuestion(quizId, questionId);
        });
    });
}

// Hapus soal
async function deleteQuestion(quizId, questionId) {
    const result = await showConfirm('Apakah Anda yakin ingin menghapus soal ini?');
    if (result) {
        const quiz = appData.quizzes.find(q => q.id === quizId);
        if (quiz) {
            quiz.questions = quiz.questions.filter(q => q.id !== questionId);
            saveAppData();
            updateQuestionList();
            await showAlert('Soal berhasil dihapus!');
        }
    }
}

// Update daftar kode quiz
function updateQuizCodesList() {
    const quizCodesList = document.getElementById('quiz-codes-list');
    quizCodesList.innerHTML = '';
    
    if (appData.quizCodes.length === 0) {
        quizCodesList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Belum ada kode quiz</p>';
        return;
    }
    
    appData.quizCodes.forEach(qc => {
        const codeItem = document.createElement('div');
        codeItem.className = 'quiz-code-item';
        codeItem.innerHTML = `
            <div class="quiz-code-info">
                <strong>${qc.code}</strong> - ${qc.theme}
            </div>
            <div class="quiz-code-actions">
                <button class="btn-danger delete-quiz-code-btn" data-code="${qc.code}">Hapus</button>
            </div>
        `;
        
        quizCodesList.appendChild(codeItem);
    });
    
    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.delete-quiz-code-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const code = this.dataset.code;
            deleteQuizCode(code);
        });
    });
}

// Hapus kode quiz
async function deleteQuizCode(code) {
    const result = await showConfirm('Apakah Anda yakin ingin menghapus kode quiz ini?');
    if (result) {
        // Hapus dari daftar kode quiz
        appData.quizCodes = appData.quizCodes.filter(qc => qc.code !== code);
        
        // Hapus quiz yang terkait
        appData.quizzes = appData.quizzes.filter(q => q.code !== code);
        
        // Simpan perubahan
        saveAppData();
        
        // Update tampilan
        updateQuizCodesList();
        updateQuestionList();
        updateQuizCodeForm();
        
        await showAlert('Kode quiz berhasil dihapus!');
    }
}

// Reset leaderboard
async function resetLeaderboard() {
    const result = await showConfirm('Apakah Anda yakin ingin mereset leaderboard? Tindakan ini tidak dapat dibatalkan!');
    if (result) {
        appData.leaderboard = [];
        saveAppData();
        await showAlert('Leaderboard berhasil direset!');
    }
}