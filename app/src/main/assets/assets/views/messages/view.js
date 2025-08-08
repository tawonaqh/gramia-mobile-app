var selectedChatID = null;

function loadCommunications() {
    $.post(site + "/get-communication-records", {}, function (res) {
        const data = typeof res === 'string' ? JSON.parse(res) : res;
        const list = $('#chatList').empty();

        data.records.forEach(chat => {
            const members = chat.members.map(m => m.name).join(', ');
            const item = $(`
                <div class="card mb-2">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${chat.name}</strong><br>
                            <small class="text-muted">${members}</small>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="openChat(${chat.iD}, '${chat.name}')">
                            Open
                        </button>
                    </div>
                </div>
            `);
            list.append(item);
        });
    });
}

function openChat(chatID, chatName) {
    selectedChatID = chatID;
    $('#chatMessages').removeClass('d-none');
    $('#chatTitle').text(chatName);
    $('#messageBody').empty();
    loadMessages(chatID);
}

function loadMessages(chatID) {
    $.post(site + "/get-communication-message-records", { communication: chatID }, function (res) {
        const data = typeof res === 'string' ? JSON.parse(res) : res;
        const body = $('#messageBody').empty();

        data.records.forEach(msg => {
            const alignment = msg.isyou ? 'text-end' : 'text-start';
            const bubbleColor = msg.isyou ? 'bg-primary text-white' : 'bg-white border';
            const message = $(`
                <div class="${alignment} mb-2">
                    <span class="d-inline-block p-2 rounded-3 ${bubbleColor}" style="max-width: 75%;">
                        ${msg.message}
                    </span>
                    <div><small class="text-muted">${msg.reg_date}</small></div>
                </div>
            `);
            body.append(message);
        });

        body.scrollTop(body.prop("scrollHeight"));
    });
}

$('#sendMessageForm').on('submit', function (e) {
    e.preventDefault();
    const message = $('#messageInput').val().trim();
    if (!message || !selectedChatID) return;

    $.post(site + "/create-communication-message", {
        communication: selectedChatID,
        message: message
    }, function () {
        $('#messageInput').val('');
        loadMessages(selectedChatID);
    });
});

// Call this when loading the page
loadCommunications();