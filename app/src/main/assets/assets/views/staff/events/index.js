function init(data) {
    current_page = 1;
    console.log('init: ')

    if (!current) return showAlert("No current account found");
    if (navigator.onLine) {  loadData(true); }else{ loadData(); }

    get_event_periods();
}
// === Period Handling ===
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

        // 🔥 Only now load data
        loadData(forceRefresh);
    }
}
// === Load Events with Period ===
function loadData(forceRefresh = false) {
    const i_period = $('[name=institution_period]').val() || "";

    if (i_period) {
        localStorage.setItem("last_period_" + current.iD, i_period);
    } else {
        localStorage.removeItem("last_period_" + current.iD);
    }

    const storageKey = `events_${current.iD}_${i_period}`;

    if (localStorage.getItem(storageKey) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(storageKey));
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
            period: i_period,  // ✅ send selected period
        },
        success: function (response) {
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(storageKey, response);
            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records);
        },
        error: function () {
            showAlert('Error loading data');
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
                const state =  '';
            
                const html = `
                        <a href="#" onclick="navigateTo('edit-event', getRecord(${item.iD}))" class="text-decoration-none text-dark">
                            <div class="bg-success text-white rounded-4 shadow-sm p-3 mb-3">
                                <div class="fw-bold fs-5 mb-1 dark-text">${item.periodDay}</div>
                                <div class="fw-bold fs-6 mb-1"> ${item.start} - ${item.end}</div>
                                <div class="fw-semibold fs-5">${item.name}</div>
                                <div class="text-light small fst-italic mb-2 text-black-50">${item.description}</div>

                                <div class="text-light small">
                                    <span class="fw-light text-black-50">Recorded By:</span> <span class="fw-semibold">${item.creator}</span><br>
                                </div>
                            </div>
                        </a>
                  
                `;
            console.log('html: ' + html)
                const $template = $(html).addClass('fade-in');
            
                setTimeout(() => {
                    $('#results').append($template);
                    requestAnimationFrame(() => {
                        $template.addClass('show');
                    });
                }, 200);
            });
        }

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}

