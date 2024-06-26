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
});

document.getElementById('csvFile').addEventListener('change', handleFileSelect);
document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
document.getElementById('checkBtn').addEventListener('click', checkAnswers);
document.getElementById('hintBtn').addEventListener('click', getHint);
document.getElementById('downloadPuzzleBtn').addEventListener('click', downloadPuzzle);
document.getElementById('downloadAnswerBtn').addEventListener('click', downloadAnswer);
document.getElementById('selectAllBtn').addEventListener('click', selectAllWords);
document.getElementById('deselectAllBtn').addEventListener('click', deselectAllWords);

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
}

function selectAllWords() {
    const checkboxes = document.querySelectorAll('#wordList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = true);
}

function deselectAllWords() {
    const checkboxes = document.querySelectorAll('#wordList input[type="checkbox"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
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

    displayPuzzle(grid, puzzle);
    document.getElementById('checkBtn').style.display = 'block';
    document.getElementById('hintBtn').style.display = 'block';
    document.getElementById('downloadPuzzleBtn').style.display = 'block';
    document.getElementById('downloadAnswerBtn').style.display = 'block';

    startTimer();
    score = 1000;
    hintsUsed = 0;
    updateScore();
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
    const directions = [[0, 1], [1, 0]]; // Across and Down

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
    if (row + word.length * dy > grid.length || col + word.length * dx > grid[0].length) {
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
    for (let i = 0; i < grid.length; i++) {
        const row = document.createElement('tr');
        for (let j = 0; j < grid[i].length; j++) {
            const cell = document.createElement('td');
            if (grid[i][j] === '.') {
                cell.classList.add('black-cell');
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.classList.add('puzzle-input');
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

    usedWords.forEach((wordObj, index) => {
        const clue = document.createElement('p');
        clue.textContent = `${index + 1}. ${selectedClues[selectedWords.indexOf(wordObj.word)]}`;
        if (wordObj.direction[1] === 1) {
            acrossClues.appendChild(clue);
        } else {
            downClues.appendChild(clue);
        }
    });

    cluesContainer.appendChild(acrossClues);
    cluesContainer.appendChild(downClues);
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
    puzzle.forEach((wordObj, index) => {
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

function getHint() {
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
        (w.col === col && w.row <= row && row < w.row + w.word.length)
    );

    if (word) {
        const index = word.direction[0] === 0 ? col - word.col : row - word.row;
        randomInput.value = word.word[index];
        randomInput.classList.add('hint');
        randomInput.classList.add('pulse');
        setTimeout(() => randomInput.classList.remove('pulse'), 500);
        hintsUsed++;
        score -= 50; // Penalty for using a hint
        updateScore();
    }
}

function downloadPuzzle() {
    const { jsPDF } = window.jspdf;
    const cellSize = 20; // 셀 크기 (픽셀)
    const margin = 10; // 여백 (픽셀)
    
    const gridSize = puzzle[0].direction[1]; // 그리드 크기
    const pageWidth = cellSize * gridSize + 2 * margin;
    const pageHeight = cellSize * gridSize + 2 * margin;
    
    const doc = new jsPDF({
        unit: 'px',
        format: [pageWidth, pageHeight],
        compress: true
    });

    // 한글 폰트 추가
    doc.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    doc.addFont('NanumGothic-Bold.ttf', 'NanumGothic', 'bold');
    doc.addFont('NanumGothic-ExtraBold.ttf', 'NanumGothic', 'extrabold');
    doc.addFont('NanumGothic-Light.ttf', 'NanumGothic', 'light');

    doc.setFont('NanumGothic', 'normal');

    // UTF-8 인코딩을 사용하여 텍스트를 렌더링하는 함수
    function drawText(text, x, y, options = {}) {
        const defaultOptions = { align: 'left', baseline: 'top' };
        const mergedOptions = { ...defaultOptions, ...options };
        
        const utf8Text = unescape(encodeURIComponent(text));
        doc.text(utf8Text, x, y, mergedOptions);
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
                doc.setFillColor(200, 200, 200); // 진한 회색
            }
            doc.rect(x, y, cellSize, cellSize, 'F');
            
            // 테두리 그리기
            doc.setDrawColor(0);
            doc.rect(x, y, cellSize, cellSize, 'S');
        }
    }

    // 단서 추가
    doc.addPage();
    doc.setFontSize(12);
    let yOffset = 20;

    drawText("Across:", 10, yOffset);
    yOffset += 15;
    puzzle.filter(word => word.direction[1] === 1).forEach((word, index) => {
        const clueText = `${index + 1}. ${selectedClues[selectedWords.indexOf(word.word)]}`;
        drawText(clueText, 15, yOffset, { maxWidth: pageWidth - 30 });
        yOffset += 15;
        if (yOffset > pageHeight - 20) {
            doc.addPage();
            yOffset = 20;
        }
    });

    yOffset += 10;
    drawText("Down:", 10, yOffset);
    yOffset += 15;
    puzzle.filter(word => word.direction[0] === 1).forEach((word, index) => {
        const clueText = `${index + 1}. ${selectedClues[selectedWords.indexOf(word.word)]}`;
        drawText(clueText, 15, yOffset, { maxWidth: pageWidth - 30 });
        yOffset += 15;
        if (yOffset > pageHeight - 20) {
            doc.addPage();
            yOffset = 20;
        }
    });

    doc.save('crossword_puzzle.pdf');
}

function downloadAnswer() {
    const { jsPDF } = window.jspdf;
    const cellSize = 20; // 셀 크기 (픽셀)
    const margin = 10; // 여백 (픽셀)
    
    const gridSize = puzzle[0].direction[1]; // 그리드 크기
    const pageWidth = cellSize * gridSize + 2 * margin;
    const pageHeight = cellSize * gridSize + 2 * margin;
    
    const doc = new jsPDF({
        unit: 'px',
        format: [pageWidth, pageHeight],
        compress: true
    });

    // 한글 폰트 추가
    doc.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
    doc.addFont('NanumGothic-Bold.ttf', 'NanumGothic', 'bold');
    doc.addFont('NanumGothic-ExtraBold.ttf', 'NanumGothic', 'extrabold');
    doc.addFont('NanumGothic-Light.ttf', 'NanumGothic', 'light');

    doc.setFont('NanumGothic', 'normal');

    // UTF-8 인코딩을 사용하여 텍스트를 렌더링하는 함수
    function drawText(text, x, y, options = {}) {
        const defaultOptions = { align: 'left', baseline: 'top' };
        const mergedOptions = { ...defaultOptions, ...options };
        
        const utf8Text = unescape(encodeURIComponent(text));
        doc.text(utf8Text, x, y, mergedOptions);
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
                doc.setFillColor(200, 200, 200); // 진한 회색
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
                const index = word.direction[0] === 0 ? j - word.col : i - word.row;
                doc.setFontSize(12);
                drawText(word.word[index], x + cellSize / 2, y + cellSize / 2, { align: 'center', baseline: 'middle' });
            }
        }
    }

    doc.save('crossword_puzzle_answer.pdf');
}