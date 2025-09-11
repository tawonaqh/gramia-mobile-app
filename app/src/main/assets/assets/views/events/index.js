 key = 'events_' + current.iD
function init(data) {
    current_page = 1;
    get_event_periods();
    loadData()

}
function get_event_periods(forceRefresh = false) {
    if (localStorage.getItem(period_key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(period_key));
        list_event_periods(data);
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return;
    }

    $.ajax({
        url: site + "/get-institution-periods",
        type: 'POST',
        data: {
            user: user.iD,
            api: true,
            institution_user: current.iD,
            institution: current.institutioniD
        },
        dataType: 'json',
        success: function (response) {
            localStorage.setItem(period_key, JSON.stringify(response));
            list_event_periods(response, forceRefresh);
        },
        error: function () {
            console.error("Failed to fetch periods");
        }
    });
}
function list_event_periods(response, forceRefresh = false) {
    if (response.records && response.records.length > 0) {
        const select = $('[name=institution_period]');
        select.html('');

        // Add "All" option at the top
        select.append(`<option value="">All Periods</option>`);

        // Load last selected
        const lastSelectedPeriod = localStorage.getItem("last_period_" + current.iD);

        response.records.forEach(item => {
            const selected = item.iD === lastSelectedPeriod ? "selected" : "";
            select.append(`<option value="${item.iD}" ${selected}>${item.name}</option>`);
        });

        // If no lastSelectedPeriod, default to "All"
        if (!lastSelectedPeriod) {
            select.val("");
        }

        // 🔥 Only call loadData AFTER periods are drawn
        loadData(forceRefresh);
    }
}
// === Load Events with Period ===
function loadData(forceRefresh = false) {
    const i_period = $('[name=institution_period]').val();
    // Save only if not "All"
    if (i_period) {
        localStorage.setItem("last_period_" + current.iD, i_period);
    } else {
        localStorage.removeItem("last_period_" + current.iD);
    }

    localStorage.setItem("last_period_" + current.iD, i_period);

    const key = `events_${current.iD}_${i_period}`;

    if (localStorage.getItem(key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(key));
        displayResults(data.records, data.pagination);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        $('#total_records_label').html(data.pagination.total_records);
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return;
    }

    $('#results').html('loading...');

    $.ajax({
        url: site + "/get-event-records",
        type: "POST",
        data: {
            search: $('input[name="search"]').val(),
            page: current_page,
            order_by: $('input[name="order_filter"]:checked').val(),
            page_size: $('#page_size').val() || '10',
            institution: current.institutioniD,
            user: user.iD,
            api: true,
            institution_user: current.iD,
            period: i_period,   // ✅ send selected period
        },
        success: function (response) {
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);
            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records);
        },
        error: function () {
            showAlert('Error loading data');
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

