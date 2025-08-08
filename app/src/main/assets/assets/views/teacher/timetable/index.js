key = 'teachertimetable_' + current.iD

function init(data) {
    current_page = 1;
    console.log('init: ')

    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");
    get_classes()
}
function get_classes(useCache = true) {
    const cacheKey = 'cached_teacher_classes';
    const uri = site + "/api/get-teacher-classes";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const response = JSON.parse(cached);
            renderClassOptions(response);
            return;
        }
    }

    const _form = {
        user: user.iD,
        institution_user: current.iD,
        institution: current.institutioniD
    };

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        dataType: 'json',
        success: function (response) {
            localStorage.setItem(cacheKey, JSON.stringify(response));
            renderClassOptions(response);
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

function renderClassOptions(response) {
    if (response && response.length > 0) {
        const select = $('[name=institution_class]');
        select.html('');

        response.forEach(function (item) {
            const text = item.name + ' [' + item.period + '] ' + item.iD;
            const id = item.periodiD + "_" + item.classiD + "_" + item.iD
            const option = `<option value="${id}" data-description="${text}">${text}</option>`;
            select.append(option);
        });
        if (navigator.onLine) { loadData(true); } else { loadData(); }

        // loadData(); // If needed
    }
}

function loadData(forceRefresh = false) {

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
       renderCompactTimetable(data.weeks)
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    $('#results').html('loading...');
    const n_class = $('[name=institution_class]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;
    const classValue = $('[name=institution_class]').val();

    const classParts = classValue.split('_');


    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-student-timetable";
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
            period: classParts[0],
            institution_class: classParts[1]
        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
  localStorage.setItem(key, response);

            //displayResults(data.records, data.pagination);
             renderCompactTimetable(data.weeks)
            // $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            alert('Error loading data');
        }
    });
}
function renderCompactTimetable(weeks) {
    const container = $('#results');
    container.empty();

    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const dayTabs = $('<div class="d-flex mb-3 overflow-auto gap-2"></div>');
    const slotsWrapper = $('<div id="slotsContainer"></div>');

    weeks.forEach((week, index) => {
        const weekName = week.name.toLowerCase();
        const isToday = weekName === currentDayName;

        const btn = $(`
            <button class="weekday-tab btn rounded-3 px-4 py-2 fw-semibold border-0 ${
                isToday ? 'bg-success text-dark' : 'bg-light-subtle text-success'
            }">
                ${week.name}
            </button>
        `);

        btn.on('click', function () {
            $('#slotsContainer').html(renderDaySlots(week));

            $(this).siblings().removeClass('bg-success text-dark')
                              .addClass('bg-light-subtle text-success');
            $(this).removeClass('bg-light-subtle text-success')
                   .addClass('bg-success text-dark');
        });

        dayTabs.append(btn);

        if (isToday) {
            slotsWrapper.append(renderDaySlots(week));
        }
    });

    container.append(dayTabs).append(slotsWrapper);

    // If today not found (rare), fallback to Monday
    if ($('#slotsContainer').is(':empty') && weeks.length > 0) {
        $('#slotsContainer').html(renderDaySlots(weeks[1]));
        dayTabs.children().eq(1).removeClass('bg-light-subtle text-success')
                             .addClass('bg-success text-dark');
    }
}
function renderDaySlots(week) {
    const slotGrid = $('<div class="row g-2"></div>');

    for (let i = 0; i < week.slots.length; i += 2) {
        const left = week.slots[i];
        const right = week.slots[i + 1];

        const leftCol = renderSlotCard(left);
        const rightCol = right ? renderSlotCard(right) : $('<div class="col-6"></div>');

        const row = $('<div class="d-flex gap-2"></div>');
        row.append(leftCol).append(rightCol);
        slotGrid.append(row);
    }

    return slotGrid;
}
function renderSlotCard(slot) {
    return $(`
        <div class="col-6">
            <div class="bg-light rounded-3 p-3 text-center" style="min-height: 80px;">
                <div class="fw-semibold text-dark mb-1 text-capitalize">${slot.activity}</div>
                <div class="text-muted small">${slot.start}–${slot.end}</div>
            </div>
        </div>
    `);
}

