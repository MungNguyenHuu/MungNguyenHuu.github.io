let vocabulary = [];
let questions = [];
let currentIndex = 0;
let correctAnswer = '';
const filePath = "/data/TuVungN4N5.xlsx";

function loadExcel() {
    fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            vocabulary = parseData(jsonData);
            populateLessons();
        })
        .catch(err => console.error("Không thể đọc file Excel:", err));
}

function parseData(jsonData) {
    const vocabList = [];
    let currentLesson = '';

    jsonData.forEach(row => {
        if (row[0] && row[0].toString().includes("Bài")) {
            currentLesson = row[0];
        } else if (row.length >= 5) {
            vocabList.push({
                lesson: currentLesson,
                word: row[0] || '',
                kanji: row[1] || '',
                onyomi: row[2] || '',
                reading: row[3] || '',
                meaning: row[4] || ''
            });
        }
    });

    return vocabList;
}

function populateLessons() {
    const lessonSelect = document.getElementById('lessonSelect');
    lessonSelect.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.innerText = 'All';
    lessonSelect.appendChild(allOption);

    const lessons = [...new Set(vocabulary.map(f => f.lesson))]
        .filter(Boolean)
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/));
            const numB = parseInt(b.match(/\d+/));
            return numB - numA;
        });

    lessons.forEach(lesson => {
        const option = document.createElement('option');
        option.value = lesson;
        option.innerText = lesson;
        lessonSelect.appendChild(option);
    });
}

function startQuiz() {
    const selectedLesson = document.getElementById("lessonSelect").value;
    const type = document.getElementById("questionType").value;

    const pool = selectedLesson === 'all'
        ? vocabulary
        : vocabulary.filter(item => item.lesson === selectedLesson);

    if (pool.length < 4) {
        alert("Không đủ dữ liệu trong bài để tạo câu hỏi.");
        return;
    }

    questions = generateQuestions(vocabulary, selectedLesson, type);
    shuffleArray(questions);
    currentIndex = 0;
    document.getElementById("quizContainer").classList.remove("hidden");
    showQuestion();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function generateQuestions(allData, selectedLesson, type) {
    const result = [];

    const sortedLessons = [...new Set(allData.map(item => item.lesson))]
        .filter(Boolean)
        .sort((a, b) => {
            const aNum = parseInt(a.match(/\d+/));
            const bNum = parseInt(b.match(/\d+/));
            return aNum - bNum;
        });

    const currentLessonIndex = sortedLessons.indexOf(selectedLesson);
    const previousLesson = currentLessonIndex > 0 ? sortedLessons[currentLessonIndex - 1] : null;

    const currentLessonPool = allData.filter(item => item.lesson === selectedLesson);
    const previousLessonPool = previousLesson ? allData.filter(item => item.lesson === previousLesson) : [];

    currentLessonPool.forEach(item => {
        let question = '', correct = '';

        switch (type) {
            case 'vn-hk':
                question = item.meaning;
                correct = item.word;
                break;
            case 'hk-vn':
                question = item.word;
                correct = item.meaning;
                break;
            case 'kanji-hk':
                question = item.kanji;
                correct = item.word;
                break;
            case 'hk-kanji':
                question = item.word;
                correct = item.kanji;
                break;
            default:
                return;
        }

        const choices = new Set();
        choices.add(correct);

        const tryAdd = (pool, count) => {
            while (choices.size < count && pool.length > 0) {
                const rand = pool[Math.floor(Math.random() * pool.length)];
                let option = '';
                switch (type) {
                    case 'vn-hk': option = rand.word; break;
                    case 'hk-vn': option = rand.meaning; break;
                    case 'kanji-hk': option = rand.word; break;
                    case 'hk-kanji': option = rand.kanji; break;
                }
                if (option && !choices.has(option)) choices.add(option);
            }
        };

        tryAdd(currentLessonPool, 2);
        tryAdd(previousLessonPool, 4);
        tryAdd(allData, 4);

        const shuffled = Array.from(choices);
        shuffleArray(shuffled);

        result.push({
            question,
            choices: shuffled,
            correct,
            questionType: type
        });
    });

    return result;
}

function showQuestion() {
    const questionData = questions[currentIndex];
    document.getElementById("questionBox").innerText = `Question ${currentIndex + 1}/${questions.length}: ${questionData.question}`;

    const choicesDiv = document.getElementById("choices");
    choicesDiv.innerHTML = '';
    choicesDiv.style.display = 'grid';
    choicesDiv.style.gridTemplateColumns = '1fr 1fr';
    choicesDiv.style.gap = '10px';
    choicesDiv.style.marginTop = '15px';

    questionData.choices.forEach((choice, index) => {
        const div = document.createElement("div");
        div.className = "choice";
        div.innerText = `${index + 1}. ${choice}`;
        div.style.padding = '12px';
        div.style.fontSize = '18px';
        div.style.textAlign = 'center';
        div.style.border = '1px solid #ccc';
        div.style.borderRadius = '6px';
        div.style.backgroundColor = '#1e1e1e';
        div.style.color = '#fff';
        div.style.cursor = 'pointer';

        div.onclick = () => handleAnswer(choice);
        choicesDiv.appendChild(div);
    });

    document.getElementById("feedback").innerText = '';
    correctAnswer = questionData.correct;
}

function handleAnswer(choice) {
    const feedback = document.getElementById("feedback");
    const allChoices = document.querySelectorAll(".choice");

    allChoices.forEach(div => {
        const isCorrect = div.innerText.includes(correctAnswer);
        if (isCorrect) div.classList.add("correct");
        if (div.innerText.includes(choice) && !isCorrect) div.classList.add("incorrect");
        div.onclick = null;
    });

    const currentQuestion = questions[currentIndex];
    const type = currentQuestion.questionType;

    const rows = currentQuestion.choices.map(choiceText => {
        const vocab = vocabulary.find(v => {
            switch (type) {
                case 'vn-hk': return v.word === choiceText;
                case 'hk-vn': return v.meaning === choiceText;
                case 'kanji-hk': return v.word === choiceText;
                case 'hk-kanji': return v.kanji === choiceText;
            }
        });

        if (!vocab) return '';

        return `
            <tr style="border-bottom: 1px solid #444;">
                <td style="padding: 8px;">${vocab.word}</td>
                <td style="padding: 8px;">${vocab.kanji}</td>
                <td style="padding: 8px;">${vocab.onyomi}</td>
                <td style="padding: 8px;">${vocab.reading}</td>
                <td style="padding: 8px;">${vocab.meaning}</td>
            </tr>
        `;
    }).join('');

    feedback.innerHTML = `
        <table style="margin-top: 15px; width: 100%; background-color: #2b2b2b; color: #fff; border-radius: 6px;">
            <thead>
                <tr style="background-color: #444;">
                    <th style="padding: 10px;">Từ Vựng</th>
                    <th style="padding: 10px;">Hán Tự</th>
                    <th style="padding: 10px;">Âm Hán</th>
                    <th style="padding: 10px;">Phát Âm</th>
                    <th style="padding: 10px;">Nghĩa</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function prevQuestion() {

    if (currentIndex == 0) {
        alert("This is the first question!");
    } else {
        currentIndex = Math.max(0, currentIndex - 1);
        showQuestion();
    }
}

function nextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
        alert("🎉 Congratulations! You've successfully completed all the questions!");
        document.getElementById("quizContainer").classList.add("hidden");
    } else {
        showQuestion();
    }
}

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (["1", "2", "3", "4"].includes(key)) {
        const index = parseInt(key) - 1;
        const choices = document.querySelectorAll(".choice");
        if (choices[index]) {
            event.preventDefault();
            choices[index].click();
        }
    } else if (key === "ArrowRight") {
        event.preventDefault();
        nextQuestion();
    } else if (key === "ArrowLeft") {
        event.preventDefault();
        prevQuestion();
    }
});

loadExcel();
