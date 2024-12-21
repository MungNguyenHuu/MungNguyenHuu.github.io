let flashcards = [];
let filteredFlashcards = [];
let currentIndex = 0;

// Tự động tải file Excel từ cùng thư mục
const filePath = "vocabularyN5_v2.xlsx";

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

function parseData(jsonData) {
    let cards = [];
    let currentLesson = '';
    jsonData.forEach(row => {
        if (row[0] && row[0].includes('Bài')) {
            currentLesson = row[0];
        } else {
            cards.push({
                lesson: currentLesson,
                front: `${row[0] || ''}\n${row[1] || ''}`,
                back: `${row[3] || ''}\n${row[2] || ''}\n${row[4] || ''}`
            });
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
    const lessons = [...new Set(flashcards.map(f => f.lesson))].filter(lesson => lesson);
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

document.addEventListener('keydown', (event) => {
    if (event.key === 's') {
        flipFlashcard();
    } else if (event.key === 'a') {
        prevFlashcard();
    } else if (event.key === 'd') {
        nextFlashcard();
    }
});

let learnedCount = 0;

function updateProgress() {
    const progress = document.getElementById('progress');
    if (filteredFlashcards.length > 0) {
        progress.innerText = `Learn: ${learnedCount}/${filteredFlashcards.length}`;
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


// Tự động tải file Excel khi trang được tải
loadExcel();
