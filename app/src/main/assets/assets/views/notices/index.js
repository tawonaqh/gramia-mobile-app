function init(data) {
    current_page = 1;
    console.log('init: ')

    if (!current) return showAlert("No current account found");
                       if (navigator.onLine) {  loadData(true); }else{ loadData(); }

}
function loadData(forceRefresh = false) {
    if (localStorage.getItem("notices") && !forceRefresh) {
        data = JSON.parse(localStorage.getItem("notices"));
        displayResults(data.records, data.pagination);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }

    $('#results').html('loading...');
    // const province = $('.search').find('[name=province]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob =  $('input[name="order_filter"]:checked').val();
    // Set default or capture from a pagination control
    var uri = site + "/get-notice-records";
    console.log('uri:  ' + uri + "; ob: " + ob)
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
            institution_user: n_institution_user,

        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem("notices", response);

            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            showshowAlert('Error loading data');
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
                    .replace("@noticeCategory_name", item.noticeCategory)
                    .replace("@subject_name", item.subject)
                    .replace("@message_name", item.message)
                    .replace("@due_date_name", item.due_date)
                    .replace('@status_name', item.status.name)
                    .replace('@item_id', item.iD)
                    .replace('@creator', item.creator)
                    .replace('@reg_date', item.reg_date);

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

