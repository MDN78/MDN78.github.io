class TerminalSimulator {
    constructor() {
        this.commands = [
            {
                cmd: 'cat README.md',
                output: [
                    'Последователь паттернов <a href="https://habr.com/ru/articles/708932/" class="highlight-link" target="_blank">PageComponent & PageFactory</a>,',
                    'сосредоточен на изучении техник и инструментов с целью повышения качества продуктов с учетом их специфики — постоянно анализирую и совершенствую процессы, изучая наиболее актуальные и подходящие практики тестирования.',
                    'Каждый день познаю что то новое.'

                ],
                instantOutput: true
            },
            {
                cmd: 'pytest . -v -s --alluredir=allure-results',
                output: [
                    '',
                    this.createSeparator('test session starts'),
                    'platform darwin -- Python 3.14, pytest-9.0.1, pluggy-1.6.0',
                    'rootdir: /Users/MDN78/projects/project-tests',
                    'configfile: pyproject.toml',
                    'plugins: allure-pytest-2.15.2, requests-2.32.5, Faker-38.0.0',
                    'collected 4 item',
                    '',
                    'tests/test_requests.py::test_requests_case <span class="passed">PASSED</span>',
                    'tests/test_rest_api.py::test_rest_api_case <span class="passed">PASSED</span>',
                    'tests/test_playwright.py::test_playwright_case <span class="passed">PASSED</span>',
                    'tests/test_SQL.py::test_SQL_case <span class="passed">PASSED</span>',
                    '',
                    this.createSeparator('4 passed in 0.78s'),
                    ''
                ],
                instantOutput: false
            }
        ];

        this.commandIndex = 0;
        this.charIndex = 0;
        this.charWidth = null;
        this.resizeObserver = null;

        this.init();
    }

    init() {
        this.startTyping();
        this.setupResizeObserver();
    }

    createSeparator(text) {
        return `__SEPARATOR_START__${text}__SEPARATOR_END__`;
    }

    getCharWidth() {
        if (this.charWidth) return this.charWidth;

        const testSpan = document.createElement('span');
        testSpan.style.cssText = `
            font-family: monospace;
            font-size: 14px;
            position: absolute;
            visibility: hidden;
        `;
        testSpan.textContent = 'A';
        document.body.appendChild(testSpan);
        this.charWidth = testSpan.getBoundingClientRect().width;
        document.body.removeChild(testSpan);

        return this.charWidth;
    }

    getTerminalWidthInChars() {
        const term = document.getElementById('terminal');
        const style = window.getComputedStyle(term);
        const termWidthPx = term.getBoundingClientRect().width;
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const availableWidth = termWidthPx - paddingLeft - paddingRight;
        const charWidth = this.getCharWidth();

        return Math.max(40, Math.floor(availableWidth / charWidth));
    }

    makeSeparatorLine(text) {
        const totalLength = this.getTerminalWidthInChars();
        const textWithSpaces = ` ${text} `;

        if (textWithSpaces.length >= totalLength) {
            return text;
        }

        const sideLen = Math.floor((totalLength - textWithSpaces.length) / 2);
        const left = '='.repeat(Math.max(0, sideLen));
        const right = '='.repeat(Math.max(0, totalLength - textWithSpaces.length - sideLen));

        return left + textWithSpaces + right;
    }

    createLineElement(content, className = '') {
        const div = document.createElement('div');
        div.className = `line ${className}`.trim();

        if (content.startsWith('__SEPARATOR_START__') && content.endsWith('__SEPARATOR_END__')) {
            const text = content.replace('__SEPARATOR_START__', '').replace('__SEPARATOR_END__', '');
            div.classList.add('separator');
            div.textContent = this.makeSeparatorLine(text);
            div.dataset.originalText = text;
        } else {
            div.innerHTML = content;
        }

        return div;
    }

    scrollToBottom() {
        const term = document.getElementById('terminal');
        if (term) {
            term.scrollTop = term.scrollHeight;
        }
    }

    createInputLine() {
        const div = document.createElement('div');
        div.className = 'line';
        div.innerHTML = '$ <span class="typed"></span><span class="cursor"></span>';
        return div;
    }

    typeCommand() {
        const currentCommand = this.commands[this.commandIndex];
        const currentLineSpan = document.querySelector('#content .line:last-child .typed');
        const currentCursor = document.querySelector('#content .line:last-child .cursor');

        if (!currentLineSpan) {
            return;
        }

        if (this.charIndex < currentCommand.cmd.length) {
            currentLineSpan.textContent += currentCommand.cmd[this.charIndex];
            this.charIndex++;
            setTimeout(() => this.typeCommand(), 40);
            this.scrollToBottom();
        } else {
            if (currentCursor) currentCursor.remove();
            setTimeout(() => {
                if (currentCommand.instantOutput) {
                    this.showOutputInstant(currentCommand.output);
                } else {
                    this.showOutput(currentCommand.output);
                }
            }, 400);
        }
    }

    showOutputInstant(lines) {
        lines.forEach(line => {
            const element = this.createLineElement(line);
            document.getElementById('content').appendChild(element);
        });
        this.scrollToBottom();
        this.nextCommand();
    }

    showOutput(lines) {
        let outputIndex = 0;

        const processNextLine = () => {
            if (outputIndex >= lines.length) {
                this.nextCommand();
                return;
            }

            const line = lines[outputIndex];
            const element = this.createLineElement(line);
            document.getElementById('content').appendChild(element);
            this.scrollToBottom();
            outputIndex++;

            if (outputIndex < lines.length) {
                setTimeout(processNextLine, 80);
            } else {
                this.nextCommand();
            }
        };

        processNextLine();
    }

    nextCommand() {
        if (this.commandIndex < this.commands.length - 1) {
            this.commandIndex++;
            this.charIndex = 0;

            const inputLine = this.createInputLine();
            document.getElementById('content').appendChild(inputLine);

            setTimeout(() => this.typeCommand(), 300);
        }
    }

    updateSeparators() {
        const separators = document.querySelectorAll('.line.separator');
        separators.forEach(div => {
            const originalText = div.dataset.originalText;
            if (originalText) {
                div.textContent = this.makeSeparatorLine(originalText);
            }
        });
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.updateSeparators();
        });

        const terminal = document.getElementById('terminal');
        if (terminal) {
            this.resizeObserver.observe(terminal);
        }
    }

    startTyping() {
        this.typeCommand();
    }

    destroy() {
        this.resizeObserver?.disconnect();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.terminalSimulator = new TerminalSimulator();
});