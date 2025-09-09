

function init(data) {
    chatId = data.iD;
    $('#mainBottomNav').hide();
    clearLastViewCacheEntry();

    loadedMessages = [];
    chatLoadIndex = 0;

    displayChatMessages(chatId);        // ✅ show offline messages immediately
    fetchNewChatMessages(chatId);       // ✅ fetch from server

    if (chatIntervalId) clearInterval(chatIntervalId);
    chatIntervalId = setInterval(() => fetchNewChatMessages(chatId), 5000);

    $('#chatInput').off('keypress').on('keypress', function (e) {
        if (e.which === 13) sendDirectMessage();
    });

    $('#chatMessages').off('scroll').on('scroll', function () {
        if ($(this).scrollTop() <= 10) {
            const moreAvailable = totalMessages.length > loadedMessages.length;
            if (moreAvailable) {
                const previousHeight = $('#chatMessages')[0].scrollHeight;
                displayChatMessages(chatId, true);
                const newHeight = $('#chatMessages')[0].scrollHeight;
                $('#chatMessages').scrollTop(newHeight - previousHeight);
            }
        }
    });
}
function fetchNewChatMessages(chatId) {
    const localKey = 'chat_' + chatId;
    const stored = localStorage.getItem(localKey);
    let localMessages = stored ? JSON.parse(stored) : [];
    let lastTime = 0;

    if (localMessages.length > 0) {
        const lastMsg = localMessages[localMessages.length - 1];
        lastTime = new Date(lastMsg.reg_date).getTime();
    }

    $.post(site + '/get-directchatmessage-records', {
        directChat: chatId,
        user: user.iD,
        api: true,
        page_size: 100,
        order_by: 'reg_date ASC',
        last_message_time: lastTime
    }, function (res) {
        const data = JSON.parse(res);
        if (!data.records || !data.records.length) return;

        const newMessages = data.records.filter(msg =>
            !localMessages.some(existing => existing.iD === msg.iD)
        );

        const updated = [...localMessages, ...newMessages].sort((a, b) =>
            new Date(a.reg_date) - new Date(b.reg_date)
        );

        localStorage.setItem(localKey, JSON.stringify(updated));

        let lastGroupTime = null;
        let html = '';

        newMessages.forEach(msg => {
            const isYou = msg.institution_user === current.iD;
            const dt = new Date(msg.reg_date);
            const timestamp = dt.getTime();

            const timeText = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateText = dt.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
            const groupLabel = `${dateText} ${timeText}`;

            if (!lastGroupTime || (timestamp - lastGroupTime > 5 * 60 * 1000)) {
                html += `
                    <div class="text-center text-muted small mt-2 mb-1" style="opacity: 0.6;">
                        ${groupLabel}
                    </div>`;
                lastGroupTime = timestamp;
            }

            html += `
                <div class="d-flex ${isYou ? 'justify-content-end' : 'justify-content-start'} mb-1">
                    <div class="chat-bubble py-4 rounded-pill text-center ${isYou ? 'from-me' : 'from-them'}">
                        ${msg.message}
                    </div>
                </div>`;
        });

        $('#chatMessages').append(html);
        $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
    });
}
function _fetchNewChatMessages(chatId) {
    const localKey = 'chat_' + chatId;
    const stored = localStorage.getItem(localKey);
    let localMessages = stored ? JSON.parse(stored) : [];
    let lastTime = 0;

    if (localMessages.length > 0) {
        const lastMsg = localMessages[localMessages.length - 1];
        lastTime = new Date(lastMsg.reg_date).getTime();
    }

    $.post(site + '/get-directchatmessage-records', {
        directChat: chatId,
        user: user.iD,
        api: true,
        page_size: 100,
        order_by: 'reg_date ASC',
        last_message_time: lastTime
    }, function (res) {
        const data = JSON.parse(res);
        if (!data.records || !data.records.length) return;

        const newMessages = data.records.filter(msg =>
            !localMessages.some(existing => existing.iD === msg.iD)
        );

        const updated = [...localMessages, ...newMessages].sort((a, b) =>
            new Date(a.reg_date) - new Date(b.reg_date)
        );

        localStorage.setItem(localKey, JSON.stringify(updated));

        // Append only new messages to bottom
        newMessages.forEach(msg => {
            const isYou = msg.institution_user === current.iD;
            const dt = new Date(msg.reg_date);
            const isToday = new Date().toDateString() === dt.toDateString();
            const timeLabel = isToday ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : dt.toLocaleString();

            const bubble = `
                <div class="d-flex ${isYou ? 'justify-content-end' : 'justify-content-start'} mb-2">
                    <div class="chat-bubble ${isYou ? 'from-me' : 'from-them'}">
                        ${msg.message}
                        <div class="chat-time">${timeLabel}</div>
                    </div>
                </div>`;

            $('#chatMessages').append(bubble);
        });

        $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
    });
}
function displayChatMessages(chatId, append = false) {
    const localKey = 'chat_' + chatId;
    const stored = localStorage.getItem(localKey);
    if (!stored) return;

    totalMessages = JSON.parse(stored).sort((a, b) => new Date(a.reg_date) - new Date(b.reg_date));

    const end = totalMessages.length - chatLoadIndex;
    const start = Math.max(end - messagesPerPage, 0);
    const batch = totalMessages.slice(start, end);
    chatLoadIndex += messagesPerPage;

    loadedMessages = [...batch, ...loadedMessages];

    let html = '';
    let lastGroupTime = null;

    batch.forEach(msg => {
        const isYou = msg.institution_user === current.iD;
        const dt = new Date(msg.reg_date);
        const timestamp = dt.getTime();

        const timeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateLabel = dt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

        // Show time if >5 minutes apart from last label or if no label yet
        if (!lastGroupTime || (timestamp - lastGroupTime > 5 * 60 * 1000)) {
            html += `
                <div class="text-center text-muted small mb-2 mt-4" style="opacity: 0.7;">
                    ${dateLabel} ${timeLabel}
                </div>`;
            lastGroupTime = timestamp;
        }

        html += `
            <div class="d-flex ${isYou ? 'justify-content-end' : 'justify-content-start'} mb-2">
                    <div class="chat-bubble py-0 ${isYou ? 'from-me' : 'from-them'}">
                    ${msg.message}
                </div>
            </div>`;
    });

    if (append) {
        $('#chatMessages').prepend(html);
    } else {
        $('#chatMessages').html(html);
        $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
    }
}
function _displayChatMessages(chatId, append = false) {
    const localKey = 'chat_' + chatId;
    const stored = localStorage.getItem(localKey);
    if (!stored) return;

    totalMessages = JSON.parse(stored).sort((a, b) => new Date(a.reg_date) - new Date(b.reg_date));

    const end = totalMessages.length - chatLoadIndex;
    const start = Math.max(end - messagesPerPage, 0);
    const batch = totalMessages.slice(start, end);
    chatLoadIndex += messagesPerPage;

    loadedMessages = [...batch, ...loadedMessages];

    const html = batch.map(msg => {
        const isYou = msg.institution_user === current.iD;
        const dt = new Date(msg.reg_date);
        const isToday = new Date().toDateString() === dt.toDateString();
        const timeLabel = isToday ? dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : dt.toLocaleString();

        return `
            <div class="d-flex ${isYou ? 'justify-content-end' : 'justify-content-start'} mb-2">
                <div class="chat-bubble ${isYou ? 'from-me' : 'from-them'}">
                    ${msg.message}
                    <div class="chat-time">${timeLabel}</div>
                </div>
            </div>`;
    }).join('');

    if (append) {
        $('#chatMessages').prepend(html);
    } else {
        $('#chatMessages').html(html);
        $('#chatMessages').scrollTop($('#chatMessages')[0].scrollHeight);
    }
}

function sendDirectMessage() {
    const msg = $('#chatInput').val().trim();
    if (!msg || !chatId) return;

    $('#chatInput').val('');

    $.post(site + '/create-directchatmessage', {
        directChat: chatId,
        message: msg,
        api: true,
        messageType: 1,
        user: user.iD,
        institution_user: current.iD
    }, function (response) {
        document.getElementById('sendSound').play();
        fetchNewChatMessages(chatId); // fetch new after send
    });
}