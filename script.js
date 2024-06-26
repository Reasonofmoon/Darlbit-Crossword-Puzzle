let words = [];
let clues = [];
let puzzle = [];
let timer;
let score = 0;
let hintsUsed = 0;
let startTime;

document.getElementById('csvFile').addEventListener('change', handleFileSelect);
document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);
document.getElementById('checkBtn').addEventListener('click', checkAnswers);
document.getElementById('hintBtn').addEventListener('click', getHint);

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
    for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][1]) {
            words.push(data[i][0].toUpperCase());
            clues.push(data[i][1]);
        }
    }
}

function generatePuzzle() {
    if (words.length === 0) {
        alert('Please upload a file first');
        return;
    }

    const difficulty = document.getElementById('difficulty').value;
    const gridSize = getGridSize(difficulty);
    const grid = createGrid(gridSize, gridSize);
    puzzle = placeWords(grid);

    displayPuzzle(grid, puzzle);
    document.getElementById('checkBtn').style.display = 'block';
    document.getElementById('downloadPdfBtn').style.display = 'block';
    document.getElementById('downloadExcelBtn').style.display = 'block';
    document.getElementById('hintBtn').style.display = 'block';

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

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
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
        clue.textContent = `${index + 1}. ${clues[words.indexOf(wordObj.word)]}`;
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

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const puzzleContainer = document.getElementById('puzzleContainer');
    const cluesContainer = document.getElementById('cluesContainer');
    
    doc.text('Crossword Puzzle', 105, 15, null, null, 'center');
    
    html2canvas(puzzleContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 20;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, 'PNG', 10, 20, pdfWidth, pdfHeight);
        
        doc.addPage();
        doc.text('Clues', 105, 15, null, null, 'center');
        
        let yOffset = 25;
        const clues = cluesContainer.querySelectorAll('p');
        clues.forEach((clue, index) => {
            if (yOffset > 280) {
                doc.addPage();
                yOffset = 20;
            }
            doc.text(clue.textContent, 10, yOffset);
            yOffset += 7;
        });
        
        doc.save('crossword_puzzle.pdf');
    });
}

function downloadExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Word', 'Clue'], ...words.map((word, index) => [word, clues[index]])]);
    XLSX.utils.book_append_sheet(wb, ws, 'Crossword');
    XLSX.writeFile(wb, 'crossword_puzzle.xlsx');
}