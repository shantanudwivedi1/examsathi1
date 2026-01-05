// ===============================
// Load study materials for selected unit
// ===============================
document.addEventListener('DOMContentLoaded', () => {
    const selectedCourse = sessionStorage.getItem('selectedCourse');
    const selectedSubject = sessionStorage.getItem('selectedSubject');
    const selectedUnit = sessionStorage.getItem('selectedUnit');

    if (!selectedCourse || !selectedSubject || !selectedUnit) {
        window.location.href = 'course.html';
        return;
    }

    const unit =
        courseData[selectedCourse]
            .subjects[selectedSubject]
            .units[selectedUnit];

    // Update page title
    const materialTitle = document.getElementById('materialTitle');
    const materialSubtitle = document.getElementById('materialSubtitle');
    const backLink = document.getElementById('backLink');

    materialTitle.textContent = `${selectedSubject} - ${selectedUnit}`;
    materialSubtitle.textContent = unit.name;
    backLink.href = 'unit.html';

    // Load content
    loadNotesPdf(unit.notesPdf);
    loadVideos(unit.videos);
    loadBooks(unit.books);

    // Init chatbot
    initializeChatbot();
});

// ===============================
// PDF
// ===============================
function loadNotesPdf(pdfPath) {
    const notesContent = document.getElementById('notesContent');

    if (!pdfPath) {
        notesContent.innerHTML =
            '<p style="text-align:center;color:#6b7280;">No PDF notes available.</p>';
        return;
    }

    notesContent.innerHTML = `
        <iframe
            src="${pdfPath}"
            width="100%"
            height="600px"
            style="border:none;border-radius:8px;"
            title="PDF Notes Viewer">
        </iframe>
    `;
}

// ===============================
// Videos
// ===============================
function loadVideos(videos) {
    const videosContainer = document.getElementById('videosContainer');

    if (!videos || videos.length === 0) {
        videosContainer.innerHTML = '<p>No video lectures available.</p>';
        return;
    }

    videos.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.className = 'video-card';

        videoCard.innerHTML = `
            <div class="video-embed">
                <iframe
                    src="https://www.youtube.com/embed/${video.videoId}"
                    allowfullscreen>
                </iframe>
            </div>
            <div class="video-title">${video.title}</div>
        `;

        videosContainer.appendChild(videoCard);
    });
}

// ===============================
// Books
// ===============================
function loadBooks(books) {
    const booksContainer = document.getElementById('booksContainer');

    if (!books || books.length === 0) {
        booksContainer.innerHTML = '<p>No book references available.</p>';
        return;
    }

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-card';

        bookCard.innerHTML = `
            <div class="book-title">${book.title}</div>
            <div class="book-author">by ${book.author}</div>
        `;

        booksContainer.appendChild(bookCard);
    });
}

// ===============================
// Chatbot UI
// ===============================
function initializeChatbot() {
    const chatbotToggle = document.getElementById('chatbotToggle');
    const chatbotBody = document.getElementById('chatbotBody');
    const chatbotSend = document.getElementById('chatbotSend');
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotHeader = document.getElementById('chatbotHeader');

    chatbotToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        chatbotBody.classList.toggle('hidden');
        chatbotToggle.textContent =
            chatbotBody.classList.contains('hidden') ? '+' : '−';
    });

    chatbotHeader.addEventListener('click', () => {
        chatbotBody.classList.toggle('hidden');
        chatbotToggle.textContent =
            chatbotBody.classList.contains('hidden') ? '+' : '−';
    });

    chatbotSend.addEventListener('click', sendMessage);

    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// ===============================
// Send message
// ===============================
async function sendMessage() {
    const chatbotInput = document.getElementById('chatbotInput');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const message = chatbotInput.value.trim();

    if (!message) return;

    // User message
    const userDiv = document.createElement('div');
    userDiv.className = 'user-message';
    userDiv.textContent = message;
    chatbotMessages.appendChild(userDiv);

    chatbotInput.value = '';
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;

    // Typing indicator
    const typing = document.createElement('div');
    typing.className = 'bot-message';
    typing.textContent = 'ExamSathi is typing...';
    chatbotMessages.appendChild(typing);

    const reply = await callGemini(message);

    chatbotMessages.removeChild(typing);
    addBotMessage(reply);
}

// ===============================
// Bot message
// ===============================
function addBotMessage(message) {
    const chatbotMessages = document.getElementById('chatbotMessages');
    const botDiv = document.createElement('div');
    botDiv.className = 'bot-message';
    botDiv.textContent = message;
    chatbotMessages.appendChild(botDiv);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

// ===============================
// Gemini backend call (FINAL FIX)
// ===============================
async function callGemini(message) {
    const selectedCourse = sessionStorage.getItem('selectedCourse');
    const selectedSubject = sessionStorage.getItem('selectedSubject');
    const selectedUnit = sessionStorage.getItem('selectedUnit');

    try {
        const response = await fetch('http://localhost:3001/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                course: selectedCourse,
                subject: selectedSubject,
                unit: selectedUnit
            })
        });

        // IMPORTANT: status check
        if (!response.ok) {
            console.error('Backend error:', response.status);
            return 'AI server error.';
        }

        const data = await response.json();

        // DEBUG (see this in browser console)
        console.log('CHATBOT RAW RESPONSE:', data);

        return data.reply ?? 'No response from AI.';

    } catch (error) {
        console.error('Fetch failed:', error);
        return 'Server error. Please try again.';
    }
}