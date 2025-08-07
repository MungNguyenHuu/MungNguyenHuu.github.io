let flashcards = [];
let filteredFlashcards = [];

// Tự động tải file Excel từ cùng thư mục
const filePath = "/data/TuVungN4N5.xlsx";

function loadExcel() {
    fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            flashcards = parseData(jsonData);
            populateLessons();
            filterByLesson();
        })
        .catch(err => console.error("Không thể đọc file Excel:", err));
}

function parseData(jsonData, kanjiOnly = false) {
    let cards = [];
    let currentLesson = '';
    jsonData.forEach(row => {
        if (row[0] && row[0].toString().includes('Bài')) {
            currentLesson = row[0];
        } else {
            if (row.length >= 5) {
                const tuVung = row[0] || '';
                const hanTu = row[1] || '';
                const amHan = row[2] || '';
                const phatAm = row[3] || '';
                const nghia = row[4] || '';

                if (kanjiOnly && !hanTu.trim()) return; // bỏ nếu không có hán tự

                let front = kanjiOnly ? hanTu : `${tuVung}\n${hanTu}`;
                let back = kanjiOnly
                    ? `${amHan}\n${tuVung}\n${phatAm}\n${nghia}`
                    : `${phatAm}\n${amHan}\n${nghia}`;

                cards.push({
                    lesson: currentLesson,
                    front,
                    back
                });
            }
        }
    });
    return cards;
}


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function populateLessons() {
    const lessonSelect = document.getElementById('lessonSelect');
    lessonSelect.innerHTML = ''; // Clear cũ

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.innerText = 'All';
    lessonSelect.appendChild(allOption);

    const lessons = [...new Set(flashcards.map(f => f.lesson))]
        .filter(lesson => lesson)
        .sort((a, b) => {
            // Trích số bài từ chuỗi kiểu "Bài 12", "Bài 3", v.v.
            const numA = parseInt(a.match(/\d+/));
            const numB = parseInt(b.match(/\d+/));
            return numB - numA; // Giảm dần
        });

    lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson;
        option.innerText = lesson;
        lessonSelect.appendChild(option);
    });
}


function filterByLesson() {
    const lessonSelect = document.getElementById('lessonSelect');
    const selectedLesson = lessonSelect.value;
    filteredFlashcards = selectedLesson === 'all' ? flashcards : flashcards.filter(f => f.lesson === selectedLesson);
    shuffleArray(filteredFlashcards);
    currentIndex = 0;
    learnedCount = 1;
    displayFlashcard();
}

function displayFlashcard() {
    const flashcard = document.getElementById('flashcard');
    if (filteredFlashcards.length > 0) {
        flashcard.classList.remove('flipped');
        document.getElementById('front').innerText = filteredFlashcards[currentIndex].front;
        document.getElementById('back').innerText = filteredFlashcards[currentIndex].back;
    } else {
        document.getElementById('front').innerText = 'Không có từ vựng';
        document.getElementById('back').innerText = '';
    }
}

function flipFlashcard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
}

function prevFlashcard() {
    if (currentIndex > 0) {
        currentIndex--;
        displayFlashcard();
    }
}

function nextFlashcard() {
    if (currentIndex < filteredFlashcards.length - 1) {
        currentIndex++;
        displayFlashcard();
    }
}

document.addEventListener('keydown', ({ key }) => {
    if (key === 'ArrowRight' || key === 'f') return nextFlashcard();
    if (key === 'ArrowLeft' || key === 's') return prevFlashcard();
    if (['ArrowUp', 'ArrowDown', 'd'].includes(key)) return flipFlashcard();
});

let learnedCount = 0;

function updateProgress() {
    const progress = document.getElementById('progress');
    if (filteredFlashcards.length > 0) {
        progress.innerText = `Learned: ${learnedCount}/${filteredFlashcards.length}`;
    } else {
        progress.innerText = '';
    }
}

function displayFlashcard() {
    const flashcard = document.getElementById('flashcard');
    if (filteredFlashcards.length > 0) {
        flashcard.classList.remove('flipped');
        document.getElementById('front').innerText = filteredFlashcards[currentIndex].front;
        document.getElementById('back').innerText = filteredFlashcards[currentIndex].back;
        updateProgress();
    } else {
        document.getElementById('front').innerText = 'Không có từ vựng';
        document.getElementById('back').innerText = '';
        updateProgress();
    }
}

function nextFlashcard() {
    if (currentIndex < filteredFlashcards.length - 1) {
        currentIndex++;
        learnedCount++;
        displayFlashcard();
    }
}

function prevFlashcard() {
    if (currentIndex > 0) {
        currentIndex--;
        learnedCount = Math.max(0, learnedCount - 1);
        displayFlashcard();
    }
}

document.getElementById("showPdfButton").addEventListener("click", function () {
    const pdfFilePath = "/data/TuVungN4N5.pdf";
    window.open(pdfFilePath, "_blank"); // Mở file PDF trong tab mới
});

document.getElementById("quizButton").addEventListener("click", function () {
    window.location.href = "quiz.html";
});


function loadAllExcel() {
    loadExcel();
}

function loadKanjiExcel() {
    fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            flashcards = parseData(jsonData, true); // true = chế độ Hán tự
            populateLessons();
            filterByLesson();
        })
        .catch(err => console.error("Không thể đọc file Excel:", err));
    document.getElementById("flashcard").classList.add("kanji-mode");
}