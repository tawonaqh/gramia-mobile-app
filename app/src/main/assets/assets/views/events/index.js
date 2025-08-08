 key = 'events_' + current.iD
function init(data) {
    current_page = 1;
    loadData()
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
    // const province = $('.search').find('[name=province]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob =  $('input[name="order_filter"]:checked').val();
    // Set default or capture from a pagination control
    var uri = site + "/get-institution-event-records";
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
            institution_user: n_institution_user,

        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);

            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            alert('Error loading data');
        }
    });
}
function showevent(iD) {
    var item = getRecord(iD);

    var message = `
        <div class="p-2">
            <!-- Time -->
            <div class="fw-bold text-success mb-2" style="font-size: 1rem;">
                <i class="fas fa-clock me-1"></i>${item.start} - ${item.end}
            </div>

            <!-- Title -->
            <div class="fw-semibold mb-2" style="font-size: 1.05rem;">
                ${item.name}
            </div>

            <!-- Description -->
            <div class="text-muted small fst-italic mb-3">
                ${item.description || 'No description provided.'}
            </div>

            <!-- Added By -->
            <div class="small border-top pt-2">
                <span class="fw-light text-secondary">Added By:</span>
                <span class="fw-semibold">${item.creator}</span>
            </div>
        </div>
    `;

    show_offcanvas_message(message, 'success', 'Event Details', 'bottom');
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

                    .replace("@name_name", item.name)
                    .replace("@description_name", item.description)
                    .replace("@institution_name", item.institution)
                    .replace("@eventCategory_name", item.eventCategory)
                    .replace("@period_name", item.period)
                    .replace("@periodDay_name", item.periodDay)
                    .replace("@start_name", item.start)
                    .replace("@end_name", item.end)
                    .replace("@creator", item.creator)
                    .replace('@item_id', item.iD);

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

