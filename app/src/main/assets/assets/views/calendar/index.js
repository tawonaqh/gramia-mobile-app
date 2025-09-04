key = 'events_' + current.iD;
period_key = 'period_' + current.iD;

function init(data) {
    current_page = 1;
    //clearPeriodCache()
    get_calendar_periods();
}

function get_calendar_periods(forceRefresh = false) {
    if (localStorage.getItem(period_key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(period_key));
        list_periods(data);
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    const uri = site + "/get-institution-periods";
    const _form = {
        user: user.iD,
        api: true,
        institution_user: current.iD,
        institution: current.institutioniD
    };

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        dataType: 'json',
        success: function (response) {
            localStorage.setItem(period_key, JSON.stringify(response));
            list_periods(response, forceRefresh);
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

function list_periods(response, forceRefresh = false) {
    if (response.records && response.records.length > 0) {
        const select = $('[name=institution_period]');
        select.html('');

        // Load last selected
        const lastSelectedPeriod = localStorage.getItem("last_period_" + current.iD);

        response.records.forEach(function (item) {
            const text = item.name;
            const selected = item.iD === lastSelectedPeriod ? "selected" : "";
            const option = `<option value="${item.iD}" ${selected}>${text}</option>`;
            select.append(option);
        });

        loadData(forceRefresh);
    }
}

function loadData(forceRefresh = false) {
    const i_period = $('[name=institution_period]').val();
    if (!i_period) return;

    localStorage.setItem("last_period_" + current.iD, i_period);

    const key = `events_${current.iD}_${i_period}`;
    if (localStorage.getItem(key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(key));
        renderCalendarFromServer(data);
        localStorage.setItem("current_record", JSON.stringify(data.records || []));
        return;
    }

    $('#results').html('loading...');

    $.ajax({
        url: site + "/get-calendar-records-b",
        type: "POST",
        data: {
            search: $('input[name="search"]').val(),
            page: current_page,
            order_by: $('#order_filter').val(),
            page_size: $('#page_size').val() || '10',
            institution: current.institutioniD,
            user: user.iD,
            api: true,
            institution_role: '',
            institution_user: current.iD,
            period: i_period,
        },
        success: function (response) {
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records || []));
            localStorage.setItem(key, response);
            renderCalendarFromServer(data);
        },
        error: function () {
            showAlert('Error loading data');
        }
    });
}

function renderCalendarFromServer(data) {
    latestEvents = data.days;
    selectedDate = null;
    calendarMonthOffset = 0;

    eventMap = {};
    data.days.forEach(e => {
        // Subtract one day
        const originalDate = new Date(e.date);
        originalDate.setDate(originalDate.getDate() - 1);

        // Format back to YYYY-MM-DD
        const adjustedDate = originalDate.toISOString().split('T')[0];

        // Replace date inside event object too (optional but keeps things consistent)
        e.date = adjustedDate;

        if (!eventMap[adjustedDate]) eventMap[adjustedDate] = [];
        eventMap[adjustedDate].push(e);
    });

    renderCalendar();
}

// Month/Year Picker
function toggleMonthYearPicker(selectedYear, selectedMonth) {
    if (document.getElementById('monthYearPicker')) return;

    const currentYear = new Date().getFullYear();
    let html = `
    <div id="monthYearPicker"
         class="position-fixed top-50 start-50 translate-middle p-4 bg-white rounded-4 shadow-lg border border-light"
         style="z-index: 1050; min-width: 280px; max-width: 90vw;">
        <div class="mb-3 text-center">
            <h6 class="fw-semibold mb-2">Select Month & Year</h6>
            <select id="yearSelect" class="form-select form-select-sm w-100 mx-auto mb-3">`;

    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
        html += `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}</option>`;
    }

    html += `</select>
        </div>
        <div class="d-grid gap-2 mb-3" style="grid-template-columns: repeat(4, 1fr);">`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    months.forEach((m, i) => {
        html += `<button type="button"
                         class="btn btn-sm btn-outline-success rounded-pill"
                         onclick="selectMonthYear(${i})">${m}</button>`;
    });

    html += `</div>
        <div class="text-center">
            <button type="button"
                    class="btn btn-sm btn-outline-danger px-4"
                    onclick="document.getElementById('monthYearPicker').remove()">Close</button>
        </div>
    </div>`;

    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div);
}

function selectMonthYear(monthIndex) {
    const year = parseInt(document.getElementById('yearSelect').value);
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const selectedDate = new Date(year, monthIndex, 1);

    const offset = (selectedDate.getFullYear() - baseDate.getFullYear()) * 12 +
                   (selectedDate.getMonth() - baseDate.getMonth());

    calendarMonthOffset = offset;
    renderCalendar();
    document.getElementById('monthYearPicker').remove();
}

function renderCalendar() {
    const today = new Date();
    const baseDate = new Date(today.getFullYear(), today.getMonth() + calendarMonthOffset, 1);
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const calendarContainer = $('#results');
    calendarContainer.html('');

    let calendarHTML = `
    <div class="p-3 rounded text-white mb-4" style="background:#00e29f;">
        <div class="d-flex justify-content-between align-items-center px-2 mb-3">
            <i class="fas fa-chevron-left" style="cursor:pointer;" onclick="changeCalendarMonth(-1)"></i>
            <h5 class="mb-0" style="cursor:pointer;" onclick="toggleMonthYearPicker(${year}, ${month})">
                ${baseDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h5>
            <i class="fas fa-chevron-right" style="cursor:pointer;" onclick="changeCalendarMonth(1)"></i>
        </div>
        <div class="d-grid text-center fw-bold mb-2" style="grid-template-columns: repeat(7, 1fr); font-size:14px;">
            ${['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => `<div>${d}</div>`).join('')}
        </div>
        <div class="d-grid text-center" style="grid-template-columns: repeat(7, 1fr); font-size:14px;">`;

    const offsetDay = (firstDay + 6) % 7;
    for (let i = 0; i < offsetDay; i++) {
        calendarHTML += `<div></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const key = dateObj.toISOString().split('T')[0];
        const hasEvent = !!eventMap[key];
        const isSelected = selectedDate === key;

        calendarHTML += `
            <div class="p-1">
                <div onclick="selectCalendarDay('${key}')" class="rounded-circle mx-auto d-flex justify-content-center align-items-center ${isSelected ? 'bg-white text-success' : hasEvent ? 'bg-dark text-white' : ''}"
                     style="width:32px; height:32px; font-weight:bold; cursor:pointer;">
                    ${d}
                </div>
            </div>`;
    }

    calendarHTML += `</div></div><div id="eventDetails" class="px-2 mt-3"></div>`;
    calendarContainer.html(calendarHTML);

    if (selectedDate && eventMap[selectedDate]) {
        showEventPills(eventMap[selectedDate]);
    }
}

function selectCalendarDay(dateStr) {
    selectedDate = dateStr;
    renderCalendar();
}

function changeCalendarMonth(offset) {
    calendarMonthOffset += offset;
    selectedDate = null;
    renderCalendar();
}

function showEventPills(events) {
    const container = $('#eventDetails');
    container.html('');
    const row = $(`<div class="overflow-auto px-0" style="white-space: nowrap;"></div>`);

    events.forEach(ev => {
        const dateObj = new Date(ev.date);
        // Add one day
        dateObj.setDate(dateObj.getDate() + 1);

        const dateFormatted = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
        const subEvents = ev.events.split(';').map(e => e.trim()).filter(e => e.length);

        subEvents.forEach(eventTitle => {
            const pill = $(`
                <div class="d-inline-block me-2 bg-success text-white rounded-4 shadow-sm px-4 py-5" style="width: 75%;">
                    <div class="fw-bold dark-text">${dateFormatted}</div>
                    <div class="fw-light text-wrap">${eventTitle}</div>
                </div>
            `);
            row.append(pill);
        });
    });

    container.append(row);
}

function _showEventPills(events) {
    const container = $('#eventDetails');
    container.html('');

    const row = $('<div class="d-flex flex-wrap justify-content-start gap-3 px-2"></div>');

    events.forEach(ev => {
        const dateObj = new Date(ev.date);
        const dateFormatted = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'long', year: 'numeric' })}`;

        const subEvents = ev.events.split(';').map(e => e.trim()).filter(e => e.length);

        subEvents.forEach(eventTitle => {
            const pill = $(`
                <div class="bg-success text-white rounded-4 shadow-sm d-flex flex-column justify-content-center px-3 py-2"
                     style="width: calc(50% - 1rem); min-height: 100px;">
                    <div class="fw-bold small">${dateFormatted}</div>
                    <div class="fw-light small">${eventTitle}</div>
                </div>
            `);
            row.append(pill);
        });
    });

    container.append(row);
}
function changeCalendarMonth(offset) {
    calendarMonthOffset += offset;
    selectedDate = null;
    renderCalendar();
}

function selectCalendarDay(dateStr) {
    selectedDate = dateStr;
    renderCalendar(latestEvents, calendarMonthOffset);
}

function changeCalendarMonth(offset) {
    calendarMonthOffset += offset;
    selectedDate = null;
    renderCalendar(latestEvents, calendarMonthOffset);
}

// Keep latestEvents globally

// Call this once with event data
function loadCalendarEvents(eventsData) {
    latestEvents = eventsData;
    calendarMonthOffset = 0;
    selectedDate = null;
    renderCalendar(eventsData, 0);
}
function __renderMobileEventTimeline(data) {
    const days = data.days;
    const container = $('#results');
    container.empty();

    // Group events by month
    const grouped = {};
    days.forEach(day => {
        const dateObj = new Date(day.date);
        const month = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!grouped[month]) grouped[month] = [];
        grouped[month].push({
            date: dateObj.toDateString(),
            range: day.date_range || formatRange(day.date),
            event: day.events
        });
    });

    // Build modern card layout
    for (const [month, events] of Object.entries(grouped)) {
        const monthBlock = $(`
            <div class="mt-4 mb-5">
                <div class="fs-3 fw-semibold text-green mb-3 ps-1">${month}</div>
                <div class="d-flex flex-column gap-3"></div>
            </div>
        `);
        const list = monthBlock.find('.d-flex');

        events.forEach(evt => {
            list.append(`
                <div class="p-3 bg-success text-white rounded-4 shadow-sm" style="min-height: 80px;">
                    <div class="fw-bold fs-6">${evt.range}</div>
                    <div class="fw-light fs-6">${evt.event}</div>
                </div>
            `);
        });

        container.append(monthBlock);
    }
}
function formatRange(dateStr) {
    const dateObj = new Date(dateStr);
    const day = dateObj.getDate();
    const month = dateObj.toLocaleString('default', { month: 'long' });
    const year = dateObj.getFullYear();
    return `${day} ${month} ${year}`;
}
function clearPeriodCache() {
    const i_period = $('[name=institution_period]').val();
    const key = `events_${current.iD}_${i_period}`;
    localStorage.removeItem(key);
    showAlert('Cache cleared for this period');
}