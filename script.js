let words = [];
let clues = [];
let selectedWords = [];
let selectedClues = [];
let puzzle = [];
let timer;
let score = 1000;
let hintsUsed = 0;
let startTime;

document.addEventListener('DOMContentLoaded', function() {
    addBackgroundImage();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('csvFile').addEventListener('change', handleFileSelect);
    document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
    document.getElementById('checkBtn').addEventListener('click', checkAnswers);
    document.getElementById('hintBtn').addEventListener('click', getHint);
    document.getElementById('downloadPuzzleBtn').addEventListener('click', downloadPuzzle);
    document.getElementById('downloadAnswerBtn').addEventListener('click', downloadAnswer);
    document.getElementById('selectAllBtn').addEventListener('click', selectAllWords);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAllWords);
}

function addBackgroundImage() {
    const body = document.body;
    const backgroundDiv = document.createElement('div');
    backgroundDiv.style.position = 'fixed';
    backgroundDiv.style.right = '10px';
    backgroundDiv.style.bottom = '10px';
    backgroundDiv.style.width = '150px';
    backgroundDiv.style.height = '150px';
    backgroundDiv.style.backgroundImage = 'url("https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbYbt9e%2FbtsH8GZR9N5%2FS2OKCshqvmQuhy6AV7WZv1%2Fimg.jpg")';
    backgroundDiv.style.backgroundSize = 'cover';
    backgroundDiv.style.backgroundPosition = 'center';
    backgroundDiv.style.borderRadius = '50%';
    backgroundDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    backgroundDiv.style.zIndex = '-1';
    body.appendChild(backgroundDiv);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = e.target.result;
        if (file.name.endsWith('.csv')) {
            Papa.parse(data, {
                complete: function(results) {
                    processData(results.data);
                }
            });
        } else if (file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(data, {type: 'binary'});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, {header: 1});
            processData(jsonData);
        }
    };

    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else if (file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
    }
}

function processData(data) {
    words = [];
    clues = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
            words.push(data[i][0].toUpperCase());
            clues.push(data[i][1]);
        }
    }
    displayWordSelection();
}

function displayWordSelection() {
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    words.forEach((word, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `word-${index}`;
        checkbox.value = index;

        const label = document.createElement('label');
        label.htmlFor = `word-${index}`;
        label.textContent = `${word} - ${clues[index]}`;

        const div = document.createElement('div');
        div.appendChild(checkbox);
        div.appendChild(label);
        wordList.appendChild(div);
    });
    document.getElementById('wordSelectionContainer').style.display = 'block';
    document.getElementById('generateBtn').style.display = 'block';
}

function selectAllWords() {
    const checkboxes = document.querySelectorAll('#wordList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllWords() {
    const checkboxes = document.querySelectorAll('#wordList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
}

// ... (중간 코드는 그대로 유지)

function downloadPuzzle() {
    const { jsPDF } = window.jspdf;
    
    // A4 크기 설정 (단위: mm)
    const pageWidth = 210;
    const pageHeight = 297;
    
    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const gridSize = puzzle[0].direction[1]; // 그리드 크기
    const cellSize = Math.min((pageWidth - 20) / gridSize, (pageHeight - 100) / gridSize); // 셀 크기 계산
    const margin = 10; // 여백

    // 한글 폰트 추가 (폰트 파일이 같은 디렉토리에 있다고 가정)
    doc.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    doc.setFont('NanumGothic', 'normal');

    // UTF-8 인코딩을 사용하여 텍스트를 렌더링하는 함수
    function drawText(text, x, y, options = {}) {
        const defaultOptions = { align: 'left', baseline: 'top' };
        const mergedOptions = { ...defaultOptions, ...options };
        
        doc.text(text, x, y, mergedOptions);
    }

    // 퍼즐 그리기
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = margin + j * cellSize;
            const y = margin + i * cellSize;
            
            // 셀 그리기
            if (puzzle.some(word => {
                const [dy, dx] = word.direction;
                return (word.row <= i && i < word.row + word.word.length * dy) &&
                       (word.col <= j && j < word.col + word.word.length * dx);
            })) {
                // 단어가 들어갈 셀
                doc.setFillColor(255, 255, 255); // 흰색
            } else {
                // 빈 셀
                doc.setFillColor(0, 0, 0); // 검은색
            }
            doc.rect(x, y, cellSize, cellSize, 'F');
            
            // 테두리 그리기
            doc.setDrawColor(0);
            doc.rect(x, y, cellSize, cellSize, 'S');
        }
    }

    // 단서 추가
    let yOffset = margin + gridSize * cellSize + 10;
    doc.setFontSize(10);

    drawText("Across:", margin, yOffset);
    yOffset += 5;
    puzzle.filter(word => word.direction[1] === 1 && word.direction[0] === 0).forEach((word, index) => {
        const clueText = `${index + 1}. ${selectedClues[selectedWords.indexOf(word.word)]}`;
        drawText(clueText, margin + 5, yOffset, { maxWidth: pageWidth - 20 });
        yOffset += 5;
        if (yOffset > pageHeight - 10) {
            doc.addPage();
            yOffset = 10;
        }
    });

    yOffset += 5;
    drawText("Down:", margin, yOffset);
    yOffset += 5;
    puzzle.filter(word => word.direction[0] === 1 && word.direction[1] === 0).forEach((word, index) => {
        const clueText = `${index + 1}. ${selectedClues[selectedWords.indexOf(word.word)]}`;
        drawText(clueText, margin + 5, yOffset, { maxWidth: pageWidth - 20 });
        yOffset += 5;
        if (yOffset > pageHeight - 10) {
            doc.addPage();
            yOffset = 10;
        }
    });

    doc.save('crossword_puzzle.pdf');
}

function downloadAnswer() {
    const { jsPDF } = window.jspdf;
    
    // A4 크기 설정 (단위: mm)
    const pageWidth = 210;
    const pageHeight = 297;
    
    const doc = new jsPDF({
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const gridSize = puzzle[0].direction[1]; // 그리드 크기
    const cellSize = Math.min((pageWidth - 20) / gridSize, (pageHeight - 100) / gridSize); // 셀 크기 계산
    const margin = 10; // 여백

    // 한글 폰트 추가 (폰트 파일이 같은 디렉토리에 있다고 가정)
    doc.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    doc.setFont('NanumGothic', 'normal');

    // UTF-8 인코딩을 사용하여 텍스트를 렌더링하는 함수
    function drawText(text, x, y, options = {}) {
        const defaultOptions = { align: 'left', baseline: 'top' };
        const mergedOptions = { ...defaultOptions, ...options };
        
        doc.text(text, x, y, mergedOptions);
    }

    // 퍼즐 그리기
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = margin + j * cellSize;
            const y = margin + i * cellSize;
            
            // 셀 그리기
            if (puzzle.some(word => {
                const [dy, dx] = word.direction;
                return (word.row <= i && i < word.row + word.word.length * dy) &&
                       (word.col <= j && j < word.col + word.word.length * dx);
            })) {
                // 단어가 들어갈 셀
                doc.setFillColor(255, 255, 255); // 흰색
            } else {
                // 빈 셀
                doc.setFillColor(0, 0, 0); // 검은색
            }
            doc.rect(x, y, cellSize, cellSize, 'F');
            
            // 테두리 그리기
            doc.setDrawColor(0);
            doc.rect(x, y, cellSize, cellSize, 'S');
            
            // 답 채우기
            const word = puzzle.find(w => {
                const [dy, dx] = w.direction;
                return (w.row <= i && i < w.row + w.word.length * dy) &&
                       (w.col <= j && j < w.col + w.word.length * dx);
            });
            if (word) {
                const [dy, dx] = word.direction;
                const index = dy === 0 ? j - word.col : i - word.row;
                doc.setFontSize(cellSize * 0.6);
                doc.setTextColor(0); // 검은색 텍스트
                drawText(word.word[index], x + cellSize / 2, y + cellSize / 2, { align: 'center', baseline: 'middle' });
            }
        }
    }

    // 단어 목록 추가
    let yOffset = margin + gridSize * cellSize + 10;
    doc.setFontSize(10);
    doc.setTextColor(0); // 검은색 텍스트
    drawText("Words in the Puzzle:", margin, yOffset);
    yOffset += 5;

    puzzle.forEach((word, index) => {
        const direction = word.direction[0] === 0 ? "Across" : 
                          word.direction[1] === 0 ? "Down" : "Diagonal";
        const wordInfo = `${index + 1}. ${word.word} (${direction})`;
        drawText(wordInfo, margin + 5, yOffset);
        yOffset += 5;

        if (yOffset > pageHeight - 10) {
            doc.addPage();
            yOffset = 10;
        }
    });

    doc.save('crossword_puzzle_answer.pdf');
}

// 새로운 기능: 퍼즐 재생성
function regeneratePuzzle() {
    generatePuzzle();
}

// 새로운 기능: 난이도에 따른 힌트 제한
let remainingHints;

function initializeHints() {
    const difficulty = document.getElementById('difficulty').value;
    switch(difficulty) {
        case 'easy':
            remainingHints = 5;
            break;
        case 'medium':
            remainingHints = 3;
            break;
        case 'hard':
            remainingHints = 1;
            break;
        default:
            remainingHints = 3;
    }
    updateHintButton();
}

function updateHintButton() {
    const hintBtn = document.getElementById('hintBtn');
    hintBtn.textContent = `Get Hint (${remainingHints} left)`;
    hintBtn.disabled = remainingHints === 0;
}

// getHint 함수 수정
function getHint() {
    if (remainingHints === 0) {
        alert('No more hints available!');
        return;
    }

    const emptyInputs = Array.from(document.querySelectorAll('.puzzle-input')).filter(input => !input.value);
    if (emptyInputs.length === 0) {
        alert('No empty cells left!');
        return;
    }

    const randomInput = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
    const row = randomInput.parentElement.parentElement.rowIndex;
    const col = randomInput.parentElement.cellIndex;

    const word = puzzle.find(w => 
        (w.row === row && w.col === col) || 
        (w.row === row && w.col <= col && col < w.col + w.word.length) ||
        (w.col === col && w.row <= row && row < w.row + w.word.length) ||
        (Math.abs(w.row - row) === Math.abs(w.col - col) && 
         Math.abs(w.row - row) < w.word.length && 
         Math.abs(w.col - col) < w.word.length)
    );

    if (word) {
        const [dy, dx] = word.direction;
        const index = dy === 0 ? col - word.col : 
                      dx === 0 ? row - word.row :
                      Math.abs(row - word.row);
        randomInput.value = word.word[index];
        randomInput.classList.add('hint');
        randomInput.classList.add('pulse');
        setTimeout(() => randomInput.classList.remove('pulse'), 500);
        hintsUsed++;
        remainingHints--;
        score -= 50; // Penalty for using a hint
        updateScore();
        updateHintButton();
    }
}

function generatePuzzle() {
    selectedWords = [];
    selectedClues = [];
    const checkboxes = document.querySelectorAll('#wordList input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        const index = parseInt(checkbox.value);
        selectedWords.push(words[index]);
        selectedClues.push(clues[index]);
    });

    if (selectedWords.length === 0) {
        alert('Please select at least one word');
        return;
    }

    const difficulty = document.getElementById('difficulty').value;
    const gridSize = getGridSize(difficulty);
    const grid = createGrid(gridSize, gridSize);
    puzzle = placeWords(grid);

    if (puzzle.length === 0) {
        alert('Failed to generate puzzle. Please try again or select different words.');
        return;
    }

    displayPuzzle(grid, puzzle);
    document.getElementById('checkBtn').style.display = 'block';
    document.getElementById('hintBtn').style.display = 'block';
    document.getElementById('downloadPuzzleBtn').style.display = 'block';
    document.getElementById('downloadAnswerBtn').style.display = 'block';
    document.getElementById('regenerateBtn').style.display = 'block';

    startTimer();
    score = 1000;
    hintsUsed = 0;
    updateScore();
    initializeHints();
}

function getGridSize(difficulty) {
    switch(difficulty) {
        case 'easy': return 10;
        case 'medium': return 15;
        case 'hard': return 20;
        default: return 15;
    }
}

function createGrid(rows, cols) {
    return Array(rows).fill().map(() => Array(cols).fill('.'));
}

function placeWords(grid) {
    const usedWords = [];
    const directions = [[0, 1], [1, 0], [1, 1], [-1, 1]]; // Across, Down, Diagonal (down-right), Diagonal (up-right)

    // Sort words by length (longest first)
    selectedWords.sort((a, b) => b.length - a.length);

    for (let i = 0; i < selectedWords.length; i++) {
        const word = selectedWords[i];
        let placed = false;

        for (let attempt = 0; attempt < 100; attempt++) {
            const direction = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * grid.length);
            const col = Math.floor(Math.random() * grid[0].length);

            if (canPlaceWord(grid, word, row, col, direction)) {
                placeWord(grid, word, row, col, direction);
                usedWords.push({word, row, col, direction});
                placed = true;
                break;
            }
        }

        if (!placed) {
            console.log(`Couldn't place word: ${word}`);
        }
    }

    return usedWords;
}

function canPlaceWord(grid, word, row, col, direction) {
    const [dy, dx] = direction;
    if (row + word.length * dy > grid.length || col + word.length * dx > grid[0].length || 
        row + word.length * dy < 0 || col + word.length * dx < 0) {
        return false;
    }

    for (let i = 0; i < word.length; i++) {
        const y = row + i * dy;
        const x = col + i * dx;
        if (grid[y][x] !== '.' && grid[y][x] !== word[i]) {
            return false;
        }
    }

    return true;
}

function placeWord(grid, word, row, col, direction) {
    const [dy, dx] = direction;
    for (let i = 0; i < word.length; i++) {
        grid[row + i * dy][col + i * dx] = word[i];
    }
}

function displayPuzzle(grid, usedWords) {
    const puzzleContainer = document.getElementById('puzzleContainer');
    puzzleContainer.innerHTML = '';

    const table = document.createElement('table');
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', 'Crossword puzzle');

    for (let i = 0; i < grid.length; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < grid[i].length; j++) {
            const cell = document.createElement('td');
            if (grid[i][j] === '.') {
                cell.classList.add('black-cell');
                cell.setAttribute('aria-label', 'Black cell');
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.classList.add('puzzle-input');
                input.setAttribute('aria-label', `Row ${i + 1}, Column ${j + 1}`);
                cell.appendChild(input);
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    puzzleContainer.appendChild(table);

    displayClues(usedWords);
}

function displayClues(usedWords) {
    const cluesContainer = document.getElementById('cluesContainer');
    cluesContainer.innerHTML = '';

    const acrossClues = document.createElement('div');
    acrossClues.classList.add('clue-list');
    acrossClues.innerHTML = '<h3>Across</h3>';

    const downClues = document.createElement('div');
    downClues.classList.add('clue-list');
    downClues.innerHTML = '<h3>Down</h3>';

    const diagonalClues = document.createElement('div');
    diagonalClues.classList.add('clue-list');
    diagonalClues.innerHTML = '<h3>Diagonal</h3>';

    usedWords.forEach((wordObj, index) => {
        const clue = document.createElement('p');
        clue.textContent = `${index + 1}. ${selectedClues[selectedWords.indexOf(wordObj.word)]}`;
        if (wordObj.direction[1] === 1 && wordObj.direction[0] === 0) {
            acrossClues.appendChild(clue);
        } else if (wordObj.direction[0] === 1 && wordObj.direction[1] === 0) {
            downClues.appendChild(clue);
        } else {
            diagonalClues.appendChild(clue);
        }
    });

    cluesContainer.appendChild(acrossClues);
    cluesContainer.appendChild(downClues);
    cluesContainer.appendChild(diagonalClues);
}

function startTimer() {
    startTime = Date.now();
    updateTimer();
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedTime = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    document.getElementById('timer').textContent = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timer = setTimeout(updateTimer, 1000);
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${score}`;
}

function checkAnswers() {
    let correctCount = 0;
    const inputs = document.querySelectorAll('.puzzle-input');
    puzzle.forEach((wordObj) => {
        const word = wordObj.word;
        const [dy, dx] = wordObj.direction;
        for (let i = 0; i < word.length; i++) {
            const y = wordObj.row + i * dy;
            const x = wordObj.col + i * dx;
            const input = inputs[y * puzzle[0].direction[1] + x];
            if (input.value.toUpperCase() === word[i]) {
                input.classList.add('correct');
                input.classList.remove('incorrect');
                correctCount++;
            } else {
                input.classList.add('incorrect');
                input.classList.remove('correct');
            }
        }
    });

    const totalLetters = puzzle.reduce((sum, word) => sum + word.word.length, 0);
    score = Math.round((correctCount / totalLetters) * 1000) - (hintsUsed * 50);
    updateScore();

    if (correctCount === totalLetters) {
        clearTimeout(timer);
        const timeSpent = document.getElementById('timer').textContent.split(': ')[1];
        alert(`Congratulations! You've completed the puzzle!\nYour score: ${score}\nTime: ${timeSpent}`);
    }
}





// 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
    addBackgroundImage();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('csvFile').addEventListener('change', handleFileSelect);
    document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
    document.getElementById('checkBtn').addEventListener('click', checkAnswers);
    document.getElementById('hintBtn').addEventListener('click', getHint);
    document.getElementById('downloadPuzzleBtn').addEventListener('click', downloadPuzzle);
    document.getElementById('downloadAnswerBtn').addEventListener('click', downloadAnswer);
    document.getElementById('selectAllBtn').addEventListener('click', selectAllWords);
    document.getElementById('deselectAllBtn').addEventListener('click', deselectAllWords);
    document.getElementById('regenerateBtn').addEventListener('click', regeneratePuzzle);
}