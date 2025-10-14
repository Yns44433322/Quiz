// =============================================================================
// KONFIGURASI APLIKASI
// =============================================================================

// GANTI nilai di bawah ini dengan informasi jsonbin.io milikmu sebelum menjalankan
const JSONBIN_BIN_ID = "YOUR_BIN_ID";               // contoh: "68e5a3d743b1c97be95e228b"
const JSONBIN_MASTER_KEY = "YOUR_JSONBIN_MASTER_KEY"; // JANGAN masukkan real key di repositori publik
const JSONBIN_ACCESS_KEY = "YOUR_JSONBIN_ACCESS_KEY"; // opsional jika diperlukan

// Kredensial Admin
const ADMIN_CREDENTIALS = {
    username: "AdminQuiz",
    password: "YD23FW"
};

// Konfigurasi Skor
const SCORE_CONFIG = {
    BASE_SCORE: 100, // Skor dasar per soal benar
    BONUS_MULTIPLIER: 0.5, // Pengali bonus waktu
    MAX_BONUS: 50 // Bonus maksimal (50% dari base score)
};

// State Aplikasi
let appState = {
    currentPage: 'landing',
    quizData: null,
    userSession: null,
    adminLoggedIn: false,
    currentTheme: null,
    editingQuestion: null
};

// =============================================================================
// FUNGSI UTILITAS
// =============================================================================

/**
 * Menampilkan halaman tertentu dan menyembunyikan lainnya
 */
function showPage(pageId) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Tampilkan halaman yang diminta
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;
    }
}

/**
 * Menampilkan loading indicator
 */
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

/**
 * Menyembunyikan loading indicator
 */
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

/**
 * Menampilkan pesan error
 */
function showError(message) {
    const toast = document.getElementById('errorToast');
    const messageEl = document.getElementById('errorMessage');
    
    messageEl.textContent = message;
    toast.classList.remove('hidden');
    
    // Auto hide setelah 5 detik
    setTimeout(hideError, 5000);
}

/**
 * Menyembunyikan pesan error
 */
function hideError() {
    document.getElementById('errorToast').classList.add('hidden');
}

/**
 * Mengacak array menggunakan Fisher-Yates algorithm
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * Generate ID unik
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format waktu dari detik ke menit:detik
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// FUNGSI JSONBIN.IO
// =============================================================================

/**
 * Fetch data dari JSONBin.io
 */
async function fetchBin() {
    try {
        showLoading();
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_MASTER_KEY
            }
        });
        
        if (!res.ok) throw new Error("Gagal fetch data dari server");
        
        const data = await res.json();
        hideLoading();
        return data.record;
        
    } catch (error) {
        hideLoading();
        showError('Gagal memuat data: ' + error.message);
        console.error('Error fetching bin:', error);
        throw error;
    }
}

/**
 * Update data di JSONBin.io
 */
async function updateBin(newData) {
    try {
        showLoading();
        const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": JSONBIN_MASTER_KEY
            },
            body: JSON.stringify(newData)
        });
        
        if (!res.ok) throw new Error("Gagal update data ke server");
        
        const data = await res.json();
        hideLoading();
        return data;
        
    } catch (error) {
        hideLoading();
        showError('Gagal menyimpan data: ' + error.message);
        console.error('Error updating bin:', error);
        throw error;
    }
}

/**
 * Inisialisasi data default jika bin kosong
 */
function getDefaultData() {
    return {
        themes: {
            "MATH001": {
                title: "Matematika Dasar",
                code: "MATH001",
                settings: {
                    timerPerQuestion: 30,
                    minQuestions: 5,
                    maxQuestions: 20,
                    questionsCount: 10
                },
                questions: [
                    {
                        id: "q1",
                        type: "mc",
                        text: "Berapa hasil dari 15 + 27?",
                        image: null,
                        choices: ["40", "42", "32", "38"],
                        correctIndex: 1
                    },
                    {
                        id: "q2",
                        type: "mc",
                        text: "Manakah bilangan prima?",
                        image: null,
                        choices: ["9", "15", "17", "21"],
                        correctIndex: 2
                    },
                    {
                        id: "q3",
                        type: "essay",
                        text: "Jelaskan apa yang dimaksud dengan bilangan prima dan berikan 3 contoh!",
                        image: null
                    }
                ]
            },
            "SCI002": {
                title: "Sains Umum",
                code: "SCI002",
                settings: {
                    timerPerQuestion: 45,
                    minQuestions: 5,
                    maxQuestions: 15,
                    questionsCount: 8
                },
                questions: [
                    {
                        id: "q1",
                        type: "mc",
                        text: "Planet mana yang terdekat dengan matahari?",
                        image: null,
                        choices: ["Venus", "Mars", "Merkurius", "Bumi"],
                        correctIndex: 2
                    },
                    {
                        id: "q2",
                        type: "essay",
                        text: "Jelaskan proses fotosintesis secara singkat!",
                        image: null
                    }
                ]
            }
        },
        players: {},
        leaderboards: {
            "MATH001": [
                { username: "user1", score: 850, completedAt: "2024-01-15T10:00:00Z" },
                { username: "user2", score: 720, completedAt: "2024-01-14T15:30:00Z" },
                { username: "user3", score: 680, completedAt: "2024-01-13T09:15:00Z" }
            ],
            "SCI002": [
                { username: "science_lover", score: 920, completedAt: "2024-01-16T14:20:00Z" },
                { username: "curious_mind", score: 780, completedAt: "2024-01-15T11:45:00Z" }
            ]
        }
    };
}

// =============================================================================
// MANAJEMEN STATE & INISIALISASI
// =============================================================================

/**
 * Inisialisasi aplikasi
 */
async function initializeApp() {
    try {
        // Coba load data dari JSONBin
        appState.quizData = await fetchBin();
        
        // Jika data null, gunakan data default
        if (!appState.quizData) {
            appState.quizData = getDefaultData();
            await updateBin(appState.quizData);
        }
        
    } catch (error) {
        // Jika gagal fetch, gunakan data default
        console.warn('Using default data due to fetch error:', error);
        appState.quizData = getDefaultData();
    }
    
    setupEventListeners();
    renderAvailableQuizCodes();
}

/**
 * Setup semua event listeners
 */
function setupEventListeners() {
    // Navigation
    document.getElementById('startQuizBtn').addEventListener('click', () => showPage('quizStartPage'));
    document.getElementById('backToLanding').addEventListener('click', () => showPage('landingPage'));
    document.getElementById('backToStart').addEventListener('click', () => showPage('landingPage'));
    
    // Admin buttons
    document.getElementById('adminLoginBtn').addEventListener('click', showLoginModal);
    document.getElementById('adminLoginBtn2').addEventListener('click', showLoginModal);
    document.getElementById('closeLogin').addEventListener('click', hideLoginModal);
    document.getElementById('adminLogout').addEventListener('click', handleAdminLogout);
    
    // Quiz start form
    document.getElementById('quizStartForm').addEventListener('submit', startQuizSession);
    document.getElementById('usernameInput').addEventListener('input', validateQuizStartForm);
    document.getElementById('quizCodeInput').addEventListener('input', validateQuizStartForm);
    
    // Quiz session
    document.getElementById('prevQuestion').addEventListener('click', showPreviousQuestion);
    document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
    document.getElementById('nextQuestion').addEventListener('click', showNextQuestion);
    
    // Badge modal
    document.getElementById('useBadgeBtn').addEventListener('click', showBadgeModal);
    document.getElementById('skipBadge').addEventListener('click', finishQuiz);
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);
    
    // Admin tabs
    document.getElementById('themesTab').addEventListener('click', () => switchAdminTab('themes'));
    document.getElementById('leaderboardsTab').addEventListener('click', () => switchAdminTab('leaderboards'));
    
    // Admin actions
    document.getElementById('createTheme').addEventListener('click', createNewTheme);
}

// =============================================================================
// QUIZ FLOW - START & VALIDATION
// =============================================================================

/**
 * Render daftar kode quiz yang tersedia
 */
function renderAvailableQuizCodes() {
    if (!appState.quizData?.themes) return;
    
    const codeList = document.querySelector('.code-list');
    if (codeList) {
        codeList.innerHTML = Object.values(appState.quizData.themes)
            .map(theme => `<div>• ${theme.code} - ${theme.title}</div>`)
            .join('');
    }
}

/**
 * Validasi form start quiz
 */
function validateQuizStartForm() {
    const username = document.getElementById('usernameInput').value.trim();
    const quizCode = document.getElementById('quizCodeInput').value.trim().toUpperCase();
    const startBtn = document.getElementById('startBtn');
    
    const isValid = username && quizCode && appState.quizData?.themes?.[quizCode];
    startBtn.disabled = !isValid;
}

/**
 * Memulai sesi quiz
 */
async function startQuizSession(event) {
    event.preventDefault();
    
    const username = document.getElementById('usernameInput').value.trim();
    const quizCode = document.getElementById('quizCodeInput').value.trim().toUpperCase();
    const theme = appState.quizData.themes[quizCode];
    
    if (!theme) {
        showError('Kode quiz tidak ditemukan');
        return;
    }
    
    // Validasi jumlah soal
    if (!theme.questions || theme.questions.length < theme.settings.minQuestions) {
        showError(`Quiz belum siap. Minimal ${theme.settings.minQuestions} soal diperlukan.`);
        return;
    }
    
    // Inisialisasi sesi user
    appState.userSession = {
        username,
        quizCode,
        currentQuestion: 0,
        score: 0,
        answers: [],
        startTime: Date.now(),
        consecutiveCorrect: 0,
        hasBadge: false,
        usedBadge: false,
        timer: null,
        timeLeft: theme.settings.timerPerQuestion,
        // Acak soal untuk sesi ini
        questions: shuffleArray([...theme.questions]).slice(0, theme.settings.questionsCount)
    };
    
    showPage('quizSessionPage');
    renderQuizSession();
}

// =============================================================================
// QUIZ FLOW - SESSION MANAGEMENT
// =============================================================================

/**
 * Render tampilan quiz session
 */
function renderQuizSession() {
    if (!appState.userSession) return;
    
    const session = appState.userSession;
    const theme = appState.quizData.themes[session.quizCode];
    const question = session.questions[session.currentQuestion];
    
    // Update header
    document.getElementById('quizTitle').textContent = theme.title;
    document.getElementById('quizUser').textContent = `User: ${session.username}`;
    document.getElementById('quizScore').textContent = session.score;
    document.getElementById('questionProgress').textContent = 
        `Soal ${session.currentQuestion + 1} dari ${session.questions.length}`;
    
    // Reset UI state
    document.getElementById('result').classList.add('hidden');
    document.getElementById('nextQuestion').classList.add('hidden');
    document.getElementById('submitAnswer').classList.remove('hidden');
    document.getElementById('mcAnswers').classList.add('hidden');
    document.getElementById('essayAnswer').classList.add('hidden');
    document.getElementById('questionImage').classList.add('hidden');
    
    // Render pertanyaan
    document.getElementById('questionText').textContent = question.text;
    
    // Render gambar jika ada
    if (question.image) {
        const imgElement = document.getElementById('questionImage').querySelector('img');
        imgElement.src = question.image;
        imgElement.alt = 'Gambar soal';
        document.getElementById('questionImage').classList.remove('hidden');
    }
    
    // Render jawaban berdasarkan tipe
    if (question.type === 'mc') {
        renderMultipleChoice(question);
    } else {
        renderEssayQuestion();
    }
    
    // Update navigation
    document.getElementById('prevQuestion').disabled = session.currentQuestion === 0;
    
    // Start timer
    startTimer();
}

/**
 * Render pilihan ganda
 */
function renderMultipleChoice(question) {
    const container = document.getElementById('mcAnswers');
    container.innerHTML = '';
    container.classList.remove('hidden');
    
    // Acak urutan pilihan
    const shuffledChoices = shuffleArray([...question.choices]);
    
    shuffledChoices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.className = 'answer-option';
        button.textContent = choice;
        button.addEventListener('click', () => selectAnswer(choice));
        container.appendChild(button);
    });
}

/**
 * Render pertanyaan essay
 */
function renderEssayQuestion() {
    const container = document.getElementById('essayAnswer');
    container.classList.remove('hidden');
    container.querySelector('textarea').value = '';
}

/**
 * Pilih jawaban (untuk MC)
 */
function selectAnswer(answer) {
    // Hapus selected class dari semua button
    document.querySelectorAll('.answer-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Tambah selected class ke button yang diklik
    event.target.classList.add('selected');
}

/**
 * Start timer untuk soal saat ini
 */
function startTimer() {
    const session = appState.userSession;
    if (!session) return;
    
    const timerElement = document.getElementById('timer');
    const theme = appState.quizData.themes[session.quizCode];
    
    session.timeLeft = theme.settings.timerPerQuestion;
    timerElement.textContent = `${session.timeLeft}s`;
    timerElement.className = 'timer';
    
    // Clear existing timer
    if (session.timer) {
        clearInterval(session.timer);
    }
    
    session.timer = setInterval(() => {
        session.timeLeft--;
        timerElement.textContent = `${session.timeLeft}s`;
        
        // Update warna berdasarkan waktu tersisa
        if (session.timeLeft <= 10) {
            timerElement.classList.add('warning');
        }
        if (session.timeLeft <= 5) {
            timerElement.classList.add('danger');
        }
        
        if (session.timeLeft <= 0) {
            clearInterval(session.timer);
            handleTimeUp();
        }
    }, 1000);
}

/**
 * Handle ketika waktu habis
 */
function handleTimeUp() {
    submitAnswer(true);
}

/**
 * Submit jawaban
 */
function submitAnswer(isTimeUp = false) {
    const session = appState.userSession;
    const question = session.questions[session.currentQuestion];
    
    // Clear timer
    if (session.timer) {
        clearInterval(session.timer);
        session.timer = null;
    }
    
    let userAnswer, isCorrect, scoreEarned = 0;
    
    // Get user's answer berdasarkan tipe soal
    if (question.type === 'mc') {
        const selectedButton = document.querySelector('.answer-option.selected');
        userAnswer = selectedButton ? selectedButton.textContent : '';
        isCorrect = userAnswer === question.choices[question.correctIndex];
    } else {
        userAnswer = document.getElementById('essayAnswer').querySelector('textarea').value;
        isCorrect = false; // Essay dinilai manual
    }
    
    // Hitung skor untuk soal MC
    if (isCorrect && question.type === 'mc') {
        scoreEarned = calculateScore(session.timeLeft, question.type);
    }
    
    // Update session
    session.score += scoreEarned;
    session.consecutiveCorrect = isCorrect ? session.consecutiveCorrect + 1 : 0;
    session.answers.push({
        questionId: question.id,
        answer: userAnswer,
        isCorrect: isCorrect,
        score: scoreEarned,
        timeSpent: appState.quizData.themes[session.quizCode].settings.timerPerQuestion - session.timeLeft
    });
    
    // Cek lencana (5 jawaban benar beruntun)
    if (isCorrect && session.consecutiveCorrect >= 5 && !session.hasBadge) {
        session.hasBadge = true;
    }
    
    // Tampilkan hasil
    showResult(isCorrect, scoreEarned, isTimeUp);
}

/**
 * Hitung skor berdasarkan waktu tersisa
 * Rumus: BASE_SCORE + floor((waktu_tersisa / total_waktu) * BASE_SCORE * BONUS_MULTIPLIER)
 */
function calculateScore(timeLeft, questionType) {
    if (questionType !== 'mc') return 0;
    
    const theme = appState.quizData.themes[appState.userSession.quizCode];
    const totalTime = theme.settings.timerPerQuestion;
    
    const baseScore = SCORE_CONFIG.BASE_SCORE;
    const bonus = Math.floor((timeLeft / totalTime) * baseScore * SCORE_CONFIG.BONUS_MULTIPLIER);
    
    return baseScore + Math.min(bonus, SCORE_CONFIG.MAX_BONUS);
}

/**
 * Tampilkan hasil jawaban
 */
function showResult(isCorrect, scoreEarned, isTimeUp) {
    const resultElement = document.getElementById('result');
    resultElement.classList.remove('hidden');
    
    if (isTimeUp) {
        resultElement.textContent = '⏰ Waktu habis!';
        resultElement.className = 'result-message error';
    } else if (isCorrect) {
        resultElement.textContent = `✅ Benar! +${scoreEarned} poin`;
        resultElement.className = 'result-message success';
    } else {
        resultElement.textContent = '❌ Salah';
        resultElement.className = 'result-message error';
    }
    
    // Update navigation
    document.getElementById('submitAnswer').classList.add('hidden');
    document.getElementById('nextQuestion').classList.remove('hidden');
    
    // Update score display
    document.getElementById('quizScore').textContent = appState.userSession.score;
}

/**
 * Navigasi ke soal sebelumnya
 */
function showPreviousQuestion() {
    const session = appState.userSession;
    if (session.currentQuestion > 0) {
        session.currentQuestion--;
        renderQuizSession();
    }
}

/**
 * Navigasi ke soal berikutnya
 */
function showNextQuestion() {
    const session = appState.userSession;
    
    if (session.currentQuestion < session.questions.length - 1) {
        session.currentQuestion++;
        renderQuizSession();
    } else {
        finishQuiz();
    }
}

// =============================================================================
// QUIZ FLOW - FINISH & RESULTS
// =============================================================================

/**
 * Selesaikan quiz dan tampilkan hasil
 */
async function finishQuiz() {
    const session = appState.userSession;
    
    // Update player history dan leaderboard
    await updatePlayerScore();
    
    // Tampilkan hasil
    showPage('resultsPage');
    renderResults();
    
    // Tampilkan opsi lencana jika available
    if (session.hasBadge && !session.usedBadge) {
        document.getElementById('useBadgeBtn').classList.remove('hidden');
    }
}

/**
 * Render hasil quiz
 */
function renderResults() {
    const session = appState.userSession;
    
    // Tampilkan skor akhir
    document.getElementById('finalScore').textContent = session.score;
    
    // Tampilkan info lencana
    const badgeInfo = document.getElementById('badgeInfo');
    if (session.hasBadge && !session.usedBadge) {
        badgeInfo.classList.remove('hidden');
    } else {
        badgeInfo.classList.add('hidden');
    }
    
    // Render leaderboard
    renderLeaderboardPublic();
}

/**
 * Update skor player dan leaderboard
 */
async function updatePlayerScore() {
    const session = appState.userSession;
    const themeCode = session.quizCode;
    
    // Update player history
    if (!appState.quizData.players) appState.quizData.players = {};
    if (!appState.quizData.players[session.username]) {
        appState.quizData.players[session.username] = { history: {} };
    }
    
    const playerHistory = appState.quizData.players[session.username].history;
    const existingScore = playerHistory[themeCode];
    
    // Hanya simpan/update jika ini attempt pertama atau skor lebih tinggi
    if (!existingScore || session.score > existingScore.score) {
        playerHistory[themeCode] = {
            score: session.score,
            completedAt: new Date().toISOString(),
            usedBadge: session.usedBadge
        };
        
        // Update leaderboard
        await updateLeaderboard();
    }
    
    // Simpan perubahan
    await updateBin(appState.quizData);
}

/**
 * Update leaderboard untuk tema saat ini
 */
async function updateLeaderboard() {
    const session = appState.userSession;
    const themeCode = session.quizCode;
    
    if (!appState.quizData.leaderboards) appState.quizData.leaderboards = {};
    if (!appState.quizData.leaderboards[themeCode]) {
        appState.quizData.leaderboards[themeCode] = [];
    }
    
    const leaderboard = appState.quizData.leaderboards[themeCode];
    const existingEntryIndex = leaderboard.findIndex(entry => 
        entry.username === session.username
    );
    
    if (existingEntryIndex !== -1) {
        // Update jika skor lebih tinggi
        if (session.score > leaderboard[existingEntryIndex].score) {
            leaderboard[existingEntryIndex].score = session.score;
            leaderboard[existingEntryIndex].completedAt = new Date().toISOString();
        }
    } else {
        // Tambah entry baru
        leaderboard.push({
            username: session.username,
            score: session.score,
            completedAt: new Date().toISOString()
        });
    }
    
    // Urutkan dan ambil top entries
    appState.quizData.leaderboards[themeCode] = leaderboard
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Simpan top 10
}

/**
 * Render leaderboard untuk public view
 */
function renderLeaderboardPublic() {
    const session = appState.userSession;
    const themeCode = session.quizCode;
    const leaderboard = appState.quizData.leaderboards?.[themeCode] || [];
    const container = document.getElementById('leaderboard');
    
    if (leaderboard.length === 0) {
        container.innerHTML = '<div class="leaderboard-item">Belum ada data leaderboard</div>';
        return;
    }
    
    // Tampilkan top 3
    const top3 = leaderboard.slice(0, 3);
    container.innerHTML = top3.map((entry, index) => `
        <div class="leaderboard-item">
            <span class="leaderboard-rank">${index + 1}</span>
            <span class="leaderboard-user">${entry.username}</span>
            <span class="leaderboard-score">${entry.score}</span>
        </div>
    `).join('');
}

// =============================================================================
// BADGE SYSTEM
// =============================================================================

/**
 * Tampilkan modal lencana
 */
function showBadgeModal() {
    const modal = document.getElementById('badgeModal');
    modal.classList.remove('hidden');
    renderWrongQuestions();
}

/**
 * Sembunyikan modal lencana
 */
function hideBadgeModal() {
    document.getElementById('badgeModal').classList.add('hidden');
}

/**
 * Render daftar soal yang salah untuk dipilih ulang
 */
function renderWrongQuestions() {
    const session = appState.userSession;
    const container = document.getElementById('wrongQuestionsList');
    
    const wrongAnswers = session.answers
        .map((answer, index) => ({ ...answer, originalIndex: index }))
        .filter(answer => !answer.isCorrect);
    
    if (wrongAnswers.length === 0) {
        container.innerHTML = '<p>Tidak ada soal yang salah</p>';
        return;
    }
    
    // Acak urutan soal yang salah untuk label I, II, III
    const shuffledWrong = shuffleArray([...wrongAnswers]);
    
    container.innerHTML = shuffledWrong.map((answer, index) => `
        <button class="wrong-question-btn" data-index="${answer.originalIndex}">
            Soal ${String.fromCharCode(65 + index)} <!-- A, B, C, ... -->
        </button>
    `).join('');
    
    // Tambah event listeners
    container.querySelectorAll('.wrong-question-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questionIndex = parseInt(e.target.getAttribute('data-index'));
            useBadge(questionIndex);
        });
    });
}

/**
 * Gunakan lencana untuk mengulang satu soal
 */
function useBadge(questionIndex) {
    const session = appState.userSession;
    
    // Set status lencana digunakan
    session.usedBadge = true;
    
    // Siapkan sesi untuk mengulang satu soal
    session.questions = [session.questions[questionIndex]];
    session.currentQuestion = 0;
    session.answers = []; // Reset answers untuk soal ini
    
    hideBadgeModal();
    showPage('quizSessionPage');
    renderQuizSession();
}

// =============================================================================
// ADMIN SYSTEM
// =============================================================================

/**
 * Tampilkan modal login admin
 */
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
}

/**
 * Sembunyikan modal login admin
 */
function hideLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginForm').reset();
}

/**
 * Handle login admin
 */
function handleAdminLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorElement = document.getElementById('loginError');
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        appState.adminLoggedIn = true;
        hideLoginModal();
        showAdminPanel();
    } else {
        errorElement.textContent = 'Username atau password salah';
        errorElement.classList.remove('hidden');
    }
}

/**
 * Handle logout admin
 */
function handleAdminLogout() {
    appState.adminLoggedIn = false;
    appState.currentTheme = null;
    hideAdminPanel();
    showPage('landingPage');
}

/**
 * Tampilkan panel admin
 */
function showAdminPanel() {
    document.getElementById('adminPanel').classList.remove('hidden');
    renderAdminPanel();
}

/**
 * Sembunyikan panel admin
 */
function hideAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

/**
 * Render panel admin
 */
function renderAdminPanel() {
    renderThemesList();
    renderLeaderboardsAdmin();
}

/**
 * Switch tab di admin panel
 */
function switchAdminTab(tabName) {
    // Update tab buttons
    document.getElementById('themesTab').classList.toggle('active', tabName === 'themes');
    document.getElementById('leaderboardsTab').classList.toggle('active', tabName === 'leaderboards');
    
    // Update tab content
    document.getElementById('themesContent').classList.toggle('active', tabName === 'themes');
    document.getElementById('leaderboardsContent').classList.toggle('active', tabName === 'leaderboards');
}

// =============================================================================
// ADMIN - THEMES MANAGEMENT
// =============================================================================

/**
 * Render daftar tema
 */
function renderThemesList() {
    const container = document.getElementById('themesList');
    if (!appState.quizData?.themes) return;
    
    container.innerHTML = Object.entries(appState.quizData.themes).map(([code, theme]) => `
        <div class="theme-item ${appState.currentTheme === code ? 'active' : ''}" 
             onclick="selectTheme('${code}')">
            <div class="theme-title">${theme.title}</div>
            <div class="theme-code">Kode: ${theme.code}</div>
            <div class="theme-stats">${theme.questions?.length || 0} soal</div>
        </div>
    `).join('');
}

/**
 * Pilih tema untuk diedit
 */
function selectTheme(themeCode) {
    appState.currentTheme = themeCode;
    renderThemesList();
    renderThemeEditor();
}

/**
 * Render editor tema
 */
function renderThemeEditor() {
    const container = document.querySelector('.theme-editor');
    const theme = appState.quizData.themes[appState.currentTheme];
    
    if (!theme) {
        container.innerHTML = `
            <div class="editor-placeholder">
                <div class="placeholder-icon">📚</div>
                <h3>Pilih Tema untuk Diedit</h3>
                <p>Pilih tema dari daftar di sebelah kiri atau buat tema baru</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="theme-editor-content">
            <div class="theme-editor-header">
                <h3>Edit Tema: ${theme.title}</h3>
                <button class="btn-danger" onclick="deleteCurrentTheme()">Hapus Tema</button>
            </div>
            
            <div class="theme-settings">
                <div class="form-group">
                    <label>Judul Tema</label>
                    <input type="text" id="themeTitle" value="${theme.title}" 
                           onchange="updateThemeSetting('title', this.value)">
                </div>
                <div class="form-group">
                    <label>Kode Quiz</label>
                    <input type="text" id="themeCode" value="${theme.code}" class="uppercase"
                           onchange="updateThemeSetting('code', this.value.toUpperCase())">
                </div>
                <div class="form-group">
                    <label>Timer per Soal (detik)</label>
                    <input type="number" id="themeTimer" value="${theme.settings.timerPerQuestion}" 
                           min="5" max="300"
                           onchange="updateThemeSetting('timerPerQuestion', parseInt(this.value))">
                </div>
                <div class="form-group">
                    <label>Jumlah Soal</label>
                    <input type="number" id="themeQuestionsCount" value="${theme.settings.questionsCount}" 
                           min="${theme.settings.minQuestions}" max="${theme.settings.maxQuestions}"
                           onchange="updateThemeSetting('questionsCount', parseInt(this.value))">
                </div>
            </div>
            
            <div class="questions-management">
                <div class="questions-header">
                    <h4>Daftar Soal</h4>
                    <button class="btn-success" onclick="showAddQuestionModal()">+ Tambah Soal</button>
                </div>
                <div class="questions-list" id="questionsList">
                    ${renderQuestionsList(theme.questions)}
                </div>
            </div>
            
            <button class="btn-primary" onclick="saveThemeChanges()">Simpan Perubahan</button>
        </div>
    `;
}

/**
 * Render daftar soal dalam editor tema
 */
function renderQuestionsList(questions) {
    if (!questions || questions.length === 0) {
        return '<div class="question-item">Belum ada soal</div>';
    }
    
    return questions.map((question, index) => `
        <div class="question-item">
            <div class="question-header">
                <div class="question-meta">
                    <span class="question-number">${index + 1}.</span>
                    <span class="question-type">${question.type === 'mc' ? 'Pilihan Ganda' : 'Essay'}</span>
                </div>
                <div class="question-actions">
                    <button class="btn-secondary" onclick="editQuestion('${question.id}')">Edit</button>
                    <button class="btn-danger" onclick="deleteQuestion('${question.id}')">Hapus</button>
                </div>
            </div>
            <div class="question-text">${question.text}</div>
            ${question.type === 'mc' ? `
                <div class="question-choices">
                    Opsi: ${question.choices.join(', ')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

/**
 * Update pengaturan tema
 */
function updateThemeSetting(setting, value) {
    if (!appState.currentTheme) return;
    
    const theme = appState.quizData.themes[appState.currentTheme];
    
    if (setting === 'title' || setting === 'code') {
        theme[setting] = value;
    } else {
        theme.settings[setting] = value;
    }
    
    // Jika kode berubah, update key di themes object
    if (setting === 'code' && value !== appState.currentTheme) {
        appState.quizData.themes[value] = theme;
        delete appState.quizData.themes[appState.currentTheme];
        appState.currentTheme = value;
        renderThemesList();
    }
}

/**
 * Buat tema baru
 */
function createNewTheme() {
    const newCode = `QUIZ${Date.now().toString().slice(-4)}`;
    const newTheme = {
        title: "Tema Baru",
        code: newCode,
        settings: {
            timerPerQuestion: 30,
            minQuestions: 5,
            maxQuestions: 20,
            questionsCount: 10
        },
        questions: []
    };

    appState.quizData.themes[newCode] = newTheme;
    appState.currentTheme = newCode;
    
    renderThemesList();
    renderThemeEditor();
}

/**
 * Hapus tema saat ini
 */
async function deleteCurrentTheme() {
    if (!appState.currentTheme) return;
    
    const theme = appState.quizData.themes[appState.currentTheme];
    if (!confirm(`Hapus tema "${theme.title}"?`)) return;
    
    delete appState.quizData.themes[appState.currentTheme];
    appState.currentTheme = null;
    
    try {
        await updateBin(appState.quizData);
        renderThemesList();
        renderThemeEditor();
    } catch (error) {
        showError('Gagal menghapus tema');
    }
}

/**
 * Simpan perubahan tema
 */
async function saveThemeChanges() {
    if (!appState.currentTheme) return;
    
    try {
        await updateBin(appState.quizData);
        showError('Perubahan berhasil disimpan', 'success');
    } catch (error) {
        showError('Gagal menyimpan perubahan');
    }
}

// =============================================================================
// ADMIN - QUESTIONS MANAGEMENT
// =============================================================================

/**
 * Tampilkan modal tambah/edit soal
 */
function showAddQuestionModal() {
    // Implementasi modal untuk tambah soal
    // Untuk versi sederhana, kita tambah soal default
    addNewQuestion();
}

/**
 * Tambah soal baru
 */
function addNewQuestion() {
    if (!appState.currentTheme) return;
    
    const theme = appState.quizData.themes[appState.currentTheme];
    const newQuestion = {
        id: generateId(),
        type: 'mc',
        text: 'Pertanyaan baru',
        image: null,
        choices: ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
        correctIndex: 0
    };
    
    theme.questions.push(newQuestion);
    renderThemeEditor();
}

/**
 * Edit soal
 */
function editQuestion(questionId) {
    // Implementasi edit soal
    // Untuk versi sederhana, kita skip dulu
    console.log('Edit question:', questionId);
}

/**
 * Hapus soal
 */
function deleteQuestion(questionId) {
    if (!appState.currentTheme) return;
    
    const theme = appState.quizData.themes[appState.currentTheme];
    theme.questions = theme.questions.filter(q => q.id !== questionId);
    renderThemeEditor();
}

// =============================================================================
// ADMIN - LEADERBOARDS MANAGEMENT
// =============================================================================

/**
 * Render leaderboard untuk admin view
 */
function renderLeaderboardsAdmin() {
    const container = document.getElementById('leaderboardsList');
    if (!appState.quizData?.leaderboards) return;
    
    container.innerHTML = Object.entries(appState.quizData.leaderboards).map(([themeCode, entries]) => {
        const theme = appState.quizData.themes[themeCode];
        return `
            <div class="leaderboard-theme">
                <div class="leaderboard-theme-header">
                    <div class="leaderboard-theme-title">
                        ${theme?.title || themeCode} (${entries.length} peserta)
                    </div>
                    <button class="btn-danger" onclick="resetLeaderboard('${themeCode}')">
                        Reset Leaderboard
                    </button>
                </div>
                <div class="leaderboard-full">
                    ${entries.map((entry, index) => `
                        <div class="leaderboard-full-item">
                            <div class="leaderboard-full-user">
                                <span class="leaderboard-full-rank">${index + 1}</span>
                                <span>${entry.username}</span>
                            </div>
                            <div>
                                <strong>${entry.score}</strong>
                                <div class="leaderboard-full-date">
                                    ${new Date(entry.completedAt).toLocaleDateString('id-ID')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('') || '<p>Belum ada data leaderboard</p>';
}

/**
 * Reset leaderboard untuk tema tertentu
 */
async function resetLeaderboard(themeCode) {
    if (!confirm(`Reset leaderboard untuk ${themeCode}?`)) return;
    
    appState.quizData.leaderboards[themeCode] = [];
    
    try {
        await updateBin(appState.quizData);
        renderLeaderboardsAdmin();
        showError('Leaderboard berhasil direset', 'success');
    } catch (error) {
        showError('Gagal mereset leaderboard');
    }
}

// =============================================================================
// INISIALISASI APLIKASI
// =============================================================================

// Start aplikasi ketika DOM siap
document.addEventListener('DOMContentLoaded', initializeApp);