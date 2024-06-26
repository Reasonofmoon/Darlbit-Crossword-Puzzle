let words = [];
let clues = [];

document.getElementById('csvFile').addEventListener('change', handleFileSelect);
document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
document.getElementById('downloadPdfBtn').addEventListener('click', downloadPDF);
document.getElementById('downloadExcelBtn').addEventListener('click', downloadExcel);

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

    const grid = createGrid(20, 20);
    const usedWords = placeWords(grid);

    displayPuzzle(grid, usedWords);
    document.getElementById('downloadPdfBtn').style.display = 'block';
    document.getElementById('downloadExcelBtn').style.display = 'block';
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
                cell.textContent = grid[i][j];
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    puzzleContainer.appendChild(table);

    const clueList = document.createElement('div');
    clueList.innerHTML = '<h2>Clues</h2>';
    const acrossClues = document.createElement('div');
    acrossClues.innerHTML = '<h3>Across</h3>';
    const downClues = document.createElement('div');
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

    clueList.appendChild(acrossClues);
    clueList.appendChild(downClues);
    puzzleContainer.appendChild(clueList);
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const puzzleContainer = document.getElementById('puzzleContainer');
    
    doc.html(puzzleContainer, {
        callback: function (doc) {
            doc.save('crossword_puzzle.pdf');
        },
        x: 10,
        y: 10
    });
}

function downloadExcel() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Word', 'Clue'], ...words.map((word, index) => [word, clues[index]])]);
    XLSX.utils.book_append_sheet(wb, ws, 'Crossword');
    XLSX.writeFile(wb, 'crossword_puzzle.xlsx');
}