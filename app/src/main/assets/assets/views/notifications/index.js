key = 'notifications_' + current.iD
function init(data) {
    current_page = 1;
    if (navigator.onLine) { loadData(true); } else { loadData(); }

}
function loadData(forceRefresh = false) {

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        displayResults(data.records, data.pagination);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    $('#results').html('loading...');
    const nt = $('[name=notificationType]').val();
    const st = $('[name=status]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();
    // Set default or capture from a pagination control
    var uri = site + "/get-notification-records";
    var _frm = {
        search: search,
        page: current_page,
        order_by: ob,
        page_size: ps, // Or capture from a page-size selector if available
        institution_user: n_institution_user,
        user: n_user,
        status: st,
        api: true,
        clear: true,
        notificationType: nt,

    }
    console.log('uri:  ' + uri + "; pr: " + JSON.stringify(_frm))
    $.ajax({
        url: uri,
        type: "POST",
        data: _frm,
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);

            get_account_notifications()
            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            showAlert('Error loading data', 'Error');
        }
    });
}

function displayResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
        currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {
                state = 'd-flex'
                if (item.status.iD != '1') { state = 'd-none' }
                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                    .replace('@item_name', item.name)
                    .replace("@notificationType_name", item.notificationType)
                    .replace("@reg_date_name", item.reg_date)
                    .replace('@item_id', item.iD)
                    .replace('@type', item.type);

                template.classList.add('fade-in');
                setTimeout(() => {
                    $('#results').append(template);
                    requestAnimationFrame(() => {
                        template.classList.add('show');
                    });
                }, 200);
            });
        }

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
function show_notification(type) {
    switch (type) {
        case "1":
            navigateTo('direct-chat')
            break;
        case "2":
            navigateTo('student-invoices')
            break;
        case "3":
            navigateTo('student-invoices')
            break;
        case "5":
            navigateTo('student-assignments')
            break;
        case "7":
            navigateTo('student-progress-reports')
            break;
        case "8":
            navigateTo('events')
            break;
        case "9":
            navigateTo('notices')
            break;
            case "11":
                navigateTo('student-attendance')
                break;
        default:

            break;
    }
}
