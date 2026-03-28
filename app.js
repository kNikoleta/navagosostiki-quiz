const TXT_FILE = "p1.txt";
const GENERAL_TEST_COUNT = 50;
const SECTION_TEST_COUNT = 100;
const GROUP_SIZE = 100;
const MAX_ERRORS_TO_PASS = 3;

let allQuestions = [];
let testQuestions = [];
let userAnswers = [];
let currentIndex = 0;
let currentMode = null;
let currentQuestionCount = GENERAL_TEST_COUNT;

const loadingEl = document.getElementById("loading");
const appEl = document.getElementById("app");
const startScreenEl = document.getElementById("startScreen");
const statsBarEl = document.getElementById("statsBar");
const quizScreenEl = document.getElementById("quizScreen");
const resultScreenEl = document.getElementById("resultScreen");

const modeLabelEl = document.getElementById("modeLabel");
const progressEl = document.getElementById("progress");
const answeredCountEl = document.getElementById("answeredCount");
const errorCountEl = document.getElementById("errorCount");
const questionNumberEl = document.getElementById("questionNumber");
const questionTextEl = document.getElementById("questionText");
const optionsContainerEl = document.getElementById("optionsContainer");
const feedbackEl = document.getElementById("feedback");

const prevBtnEl = document.getElementById("prevBtn");
const nextBtnEl = document.getElementById("nextBtn");
const finishBtnEl = document.getElementById("finishBtn");
const restartBtnEl = document.getElementById("restartBtn");
const backToStartBtnEl = document.getElementById("backToStartBtn");
const newTestBtnEl = document.getElementById("newTestBtn");
const resultBackBtnEl = document.getElementById("resultBackBtn");

const resultTitleEl = document.getElementById("resultTitle");
const resultTextEl = document.getElementById("resultText");
const reviewListEl = document.getElementById("reviewList");

const modeButtons = [...document.querySelectorAll(".mode-btn")];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function parseQuestionsFromText(text) {
  text = text.replace(/---\s*Page\s+\d+\s*---/gi, "");
  const blocks = text.split(/\n---\s*\n/g);
  const questions = [];

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block.startsWith("Question")) continue;

    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const body = lines.slice(1).join("\n");
    const answerMatch = body.match(/Ορθή\s+απάντηση:\s*([1234])/);
    if (!answerMatch) continue;

    const correctIndex = Number(answerMatch[1]) - 1;
    const bodyWithoutAnswer = body.replace(/Ορθή\s+απάντηση:\s*[1234]/, "").trim();

    const optionRegex = /([1-4]):/g;
    const matches = [...bodyWithoutAnswer.matchAll(optionRegex)];
    if (matches.length < 2) continue;

    const questionText = bodyWithoutAnswer.slice(0, matches[0].index).trim();
    const options = [];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : bodyWithoutAnswer.length;
      options.push(bodyWithoutAnswer.slice(start, end).trim());
    }

    if (correctIndex >= 0 && correctIndex < options.length) {
      questions.push({
        question: questionText,
        options,
        answer: correctIndex
      });
    }
  }

  return questions;
}

async function loadQuestions() {
  const response = await fetch(TXT_FILE);
  if (!response.ok) {
    throw new Error("Δεν βρέθηκε το p1.txt");
  }
  const text = await response.text();
  return parseQuestionsFromText(text);
}

function getModeLabel(mode) {
  return mode === "all" ? "Γενικό" : `Τεστ ${mode}`;
}

function getQuestionPool(mode) {
  if (mode === "all") {
    return allQuestions;
  }

  const modeNumber = Number(mode);
  const start = (modeNumber - 1) * GROUP_SIZE;
  const end = start + GROUP_SIZE;
  return allQuestions.slice(start, end);
}

function getAnsweredCount() {
  return userAnswers.filter(answer => answer !== null).length;
}

function getErrorCount() {
  let errors = 0;

  testQuestions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    if (userAnswer !== null && userAnswer !== q.answer) {
      errors++;
    }
  });

  return errors;
}

function showStartScreen() {
  startScreenEl.classList.remove("hidden");
  statsBarEl.classList.add("hidden");
  quizScreenEl.classList.add("hidden");
  resultScreenEl.classList.add("hidden");
}

function updateStats() {
  progressEl.textContent = `${currentIndex + 1} / ${currentQuestionCount}`;
  answeredCountEl.textContent = getAnsweredCount();
  errorCountEl.textContent = getErrorCount();
  questionNumberEl.textContent = `Ερώτηση ${currentIndex + 1}`;
  modeLabelEl.textContent = getModeLabel(currentMode);
}

function clearFeedback() {
  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
}

function selectModeQuestions(mode) {
  const pool = getQuestionPool(mode);

  if (mode === "all") {
    currentQuestionCount = GENERAL_TEST_COUNT;
    return shuffle(pool).slice(0, GENERAL_TEST_COUNT);
  }

  currentQuestionCount = SECTION_TEST_COUNT;
  return pool.slice(0, SECTION_TEST_COUNT);
}

function startTest(mode) {
  if (mode) {
    currentMode = mode;
  }

  if (!currentMode) {
    currentMode = "all";
  }

  testQuestions = selectModeQuestions(currentMode);

  if (testQuestions.length < currentQuestionCount) {
    alert(`Η επιλεγμένη ενότητα έχει μόνο ${testQuestions.length} ερωτήσεις.`);
    return;
  }

  userAnswers = new Array(testQuestions.length).fill(null);
  currentIndex = 0;

  startScreenEl.classList.add("hidden");
  resultScreenEl.classList.add("hidden");
  statsBarEl.classList.remove("hidden");
  quizScreenEl.classList.remove("hidden");

  renderQuestion();
}

function renderQuestion() {
  const q = testQuestions[currentIndex];
  const selectedAnswer = userAnswers[currentIndex];

  updateStats();
  clearFeedback();
  questionTextEl.textContent = q.question;
  optionsContainerEl.innerHTML = "";

  q.options.forEach((optionText, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = `${index + 1}. ${optionText}`;

    if (selectedAnswer !== null) {
      btn.disabled = true;

      if (index === q.answer) {
        btn.classList.add("correct");
      }

      if (index === selectedAnswer && selectedAnswer !== q.answer) {
        btn.classList.add("wrong");
      }
    }

    btn.addEventListener("click", () => handleAnswer(index));
    optionsContainerEl.appendChild(btn);
  });

  if (selectedAnswer === null) {
    feedbackEl.textContent = "Επίλεξε μία απάντηση.";
  } else if (selectedAnswer === q.answer) {
    feedbackEl.textContent = "Σωστό.";
    feedbackEl.classList.add("correct");
  } else {
    feedbackEl.textContent = `Λάθος. Σωστή απάντηση: ${q.answer + 1}. ${q.options[q.answer]}`;
    feedbackEl.classList.add("wrong");
  }

  prevBtnEl.disabled = currentIndex === 0;
  nextBtnEl.textContent = currentIndex === currentQuestionCount - 1 ? "Αποτελέσματα →" : "Επόμενη →";
}

function handleAnswer(selectedIndex) {
  if (userAnswers[currentIndex] !== null) return;

  userAnswers[currentIndex] = selectedIndex;
  renderQuestion();
}

function nextQuestion() {
  if (currentIndex >= currentQuestionCount - 1) {
    finishTest();
    return;
  }

  currentIndex++;
  renderQuestion();
}

function prevQuestion() {
  if (currentIndex <= 0) return;
  currentIndex--;
  renderQuestion();
}

function buildReviewList() {
  reviewListEl.innerHTML = "";

  testQuestions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer === q.answer;
    const wasAnswered = userAnswer !== null;

    const card = document.createElement("div");
    card.className = `review-card ${isCorrect ? "review-correct" : "review-wrong"}`;

    const yourAnswerText = wasAnswered
      ? `${userAnswer + 1}. ${q.options[userAnswer]}`
      : "Δεν απαντήθηκε";

    const correctAnswerText = `${q.answer + 1}. ${q.options[q.answer]}`;

    card.innerHTML = `
      <div class="review-question-number">Ερώτηση ${index + 1}</div>
      <div class="review-question-text">${q.question}</div>
      <div class="review-row">
        <span class="review-label">Δική σου απάντηση:</span>
        <span class="review-value ${wasAnswered && isCorrect ? "review-good-text" : "review-bad-text"}">
          ${yourAnswerText}
        </span>
      </div>
      <div class="review-row">
        <span class="review-label">Σωστή απάντηση:</span>
        <span class="review-value review-good-text">${correctAnswerText}</span>
      </div>
    `;

    reviewListEl.appendChild(card);
  });
}

function finishTest() {
  const answeredCount = getAnsweredCount();
  const errorCount = getErrorCount();
  const correctCount = answeredCount - errorCount;
  const passed = errorCount <= MAX_ERRORS_TO_PASS;

  quizScreenEl.classList.add("hidden");
  resultScreenEl.classList.remove("hidden");

  resultTitleEl.textContent = passed ? "ΠΕΡΑΣΕΣ" : "ΔΕΝ ΠΕΡΑΣΕΣ";
  resultTitleEl.className = `result-title ${passed ? "result-pass" : "result-fail"}`;

  resultTextEl.innerHTML = `
    Λειτουργία: <strong>${getModeLabel(currentMode)}</strong><br>
    Απαντημένες: <strong>${answeredCount}</strong> / ${currentQuestionCount}<br>
    Σωστές: <strong>${correctCount}</strong><br>
    Λάθη: <strong>${errorCount}</strong><br><br>
    Περνάς μόνο αν έχεις <strong>${MAX_ERRORS_TO_PASS}</strong> λάθη ή λιγότερα.
  `;

  buildReviewList();
}

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    startTest(button.dataset.mode);
  });
});

prevBtnEl.addEventListener("click", prevQuestion);
nextBtnEl.addEventListener("click", nextQuestion);
finishBtnEl.addEventListener("click", finishTest);
restartBtnEl.addEventListener("click", () => startTest(currentMode));
newTestBtnEl.addEventListener("click", () => startTest(currentMode));
backToStartBtnEl.addEventListener("click", showStartScreen);
resultBackBtnEl.addEventListener("click", showStartScreen);

loadQuestions()
  .then((questions) => {
    allQuestions = questions;
    loadingEl.classList.add("hidden");
    appEl.classList.remove("hidden");
    showStartScreen();
  })
  .catch((err) => {
    loadingEl.textContent = "Σφάλμα: " + err.message;
  });