function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
loadMessageData()
}
function loadMessageData() {
    $('#results').html('loading...');
   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-communication-records";
    console.log('uri:  ' + uri + "; pr: " + n_institution)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps, // Or capture from a page-size selector if available
            institution: n_institution,
            user: n_user,
            api: true,
            institution_role: n_institution_role,
            institution_user: n_institution_user,

        },
        success: function (response) {
           console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));

            displayMessageResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            showAlert('Error loading data');
        }
    });
}

function displayMessageResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {
              let members = "";
              item.members.forEach((rec, index) => { if(rec.isyou==false){ members += ", " + rec.user} })

                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                  .replace('@item_name',  item.name)

                 .replace("@members_name", members)
                 .replace('@status_name', item.messages)
                 .replace('@item_id', item.iD);

                template.classList.add('fade-in');
                setTimeout(() => {
                    $('#results').append(template);
                    requestAnimationFrame(() => {
                        template.classList.add('show');
                    });
                },  200);
            });
        }

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
function closeChat(){
$('#chatModal').hide();
    $('#communicationsPage').show();
}
var currentChatId
$('#chatMessages').on('scroll', function () {
    const scrollTop = $(this).scrollTop();
    if (scrollTop < 50) {
        const firstMsg = $(this).find('div').first();
        const oldestTime = firstMsg.data('timestamp'); // assume you've added a `data-timestamp` attribute
        loadChatMessages(currentChatId, null, oldestTime, false);
    }
});
function loadChatMessages(chatId, after = null, before = null, append = true) {
currentChatId = chatId
    let _form = {
        communication: chatId,
        page_size: 20,
        user: user.iD,
        api: true,
        institution_user: current.iD,
        order_by: 'reg_date ASC',
    };

    if (after) _form.after = after;
    if (before) _form.before = before;
  console.log('_form: ' + JSON.stringify(_form))
    $.post(site + '/get-communicationmessage-records', _form, function (res) {
               console.log('res: ' + res)

        const data = JSON.parse(res);
        let container = $('#chatMessages');

        const messages = data.records.map(msg => `
            <div class="mb-2 ${msg.isyou ? 'text-end' : 'text-start'}">
                <div class="d-inline-block bg-${msg.isyou ? 'primary text-white' : 'light'} rounded p-2">
                    ${msg.message}
                </div>
                <div class="text-muted small">${msg.reg_date}</div>
                <div data-timestamp="${msg.reg_date}"> ... </div>
            </div>
        `).join('');

        if (append) {
            container.append(messages);
        } else {
            container.prepend(messages);
        }

        // Scroll to bottom after initial load
        if (after == null && before == null) {
            container.scrollTop(container[0].scrollHeight);
        }
    });
}
function openChatModal(record) {
    $('#chatTitle').text(record.name);
    $('#chatMessages').html('<p class="text-center">Loading messages...</p>');
   // $('#communicationsPage').hide();
    $('#chatModal').modal('show');
    currentChatId = record.iD
    loadChatMessages(currentChatId, after = null, before = null, append = true)

}
function sendMessage() {
    const message = $('#chatInput').val().trim();
    const chatId = currentChatId;// $('#chatModal').data('chat-id');
    if (!message || !chatId) return;
    const _form = {
                          communication: chatId,
                          message: message,
                          user: user.iD,
                          api: true,
                          institution_user: current.iD
                      }
    console.log('_frm: ' + JSON.stringify(_form))

    $.post(site + '/create-communicationmessage', _form, function (response) {
               console.log('res: ' + response)

        $('#chatInput').val('');
        openChatModal({ iD: chatId, name: $('#chatTitle').text() }); // reload
    });
}