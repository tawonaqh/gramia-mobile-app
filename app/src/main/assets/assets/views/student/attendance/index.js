 key = 'student_attendance_' + current.iD
function init(data) {
    current_page = 1;

   selectedClass = getSelectedClass();
           if (selectedClass) {
           console.log('stri: ' + JSON.stringify(selectedClass))
               console.log("Selected class name:", selectedClass.institution_class);
               console.log("Selected period:", selectedClass.period);
                $('.class-id').html(selectedClass.institution_class + ' ' + selectedClass.period)
                   if (navigator.onLine) {  loadData(true); }else{ loadData(); }

           } else {
               showAlert("No class selected.");
                $('.class-id').html("No class selected.")
                    $('#results').html('No class selected');

           }

  if (!current) return showAlert("No student account found");

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
   const _student = localStorage.getItem('selected_class_id_' + current.iD)// $('[name=class]').val();
   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/api/get-attendancestudent-records";
    console.log('uri:  ' + uri + "; st: " + _student)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: '',
            page_size: ps, // Or capture from a page-size selector if available
            institution: n_institution,
            user: n_user,
            api: true,
            institution_role: n_institution_role,
            institution_user: n_institution_user,
            student: _student,

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
            showAlert('Error loading data', 'Error');
        }
    });
}


function displayResults(records, pagination) {
    $('#results').html('');
    if (!records || records.length === 0) {
        $('#results').html('<p>No records found.</p>');
        return;
    }

    attendanceData = records; // cache all records
    renderCalendar(currentMonthOffset);
    renderPaginationDropdown(pagination);
}

function toggleMonthYearPicker(selectedYear, selectedMonth) {
    // Prevent multiple pickers
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

    // Calculate the new offset
    const offset = (selectedDate.getFullYear() - baseDate.getFullYear()) * 12 +
                   (selectedDate.getMonth() - baseDate.getMonth());

    currentMonthOffset = offset;
    renderCalendar(currentMonthOffset);
    document.getElementById('monthYearPicker').remove();
}

function renderCalendar(monthOffset = 0) {
    $('#results').html('');

    const today = new Date();
    const base = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const monthName = base.toLocaleString('default', { month: 'long', year: 'numeric' });

    const attendanceMap = {};
    attendanceData.forEach(item => {
        const d = new Date(item.attendance);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        attendanceMap[key] = item.attendanceStatus;
    });

    // Get today's status
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayStatus = attendanceMap[todayKey] || 'N/A';

    const showTodayStatus = (
        today.getFullYear() === year &&
        today.getMonth() === month
    );

    let todayStatusHTML = '';
    if (showTodayStatus) {
        todayStatusHTML = `
            <div class="bg-light rounded-pill text-center py-3 mt-4 d-flex justify-content-center align-items-center gap-2" style="font-weight: 500;">
                <span class="text-success">Today Attendance</span>
                <span class="vr mx-2" style="opacity: 0.2;"></span>
                <i class="fas fa-star text-success"></i>
                <span class="text-success">${capitalizeFirstLetter(todayStatus)}</span>
            </div>
        `;
    }


    const monthlyCounts = { present: 0, absent: 0, late: 0, excused: 0 };

    let calendar = `
            <div class="position-relative p-3 rounded text-white mb-4" style="background:#00e29f;">
                <div class="d-flex justify-content-between align-items-center px-2 mb-3">
                    <i class="fas fa-chevron-left" onclick="changeMonth(-1)" style="cursor:pointer;"></i>
                    <h5 class="mb-0" style="cursor:pointer;" onclick="toggleMonthYearPicker(${year}, ${month})">${monthName}</h5>
                    <i class="fas fa-chevron-right" onclick="changeMonth(1)" style="cursor:pointer;"></i>
                </div>
                <div class="d-grid text-center fw-bold mb-2" style="grid-template-columns: repeat(7, 1fr); font-size:14px;">
                    ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => `<div class="text-white">${d}</div>`).join('')}
                </div>
                <div class="d-grid text-center" style="grid-template-columns: repeat(7, 1fr); font-size:14px;">
    `;

    // Blank days before the first day
    for (let i = 0; i < firstDayIndex; i++) {
        calendar += `<div></div>`;
    }

    // Fill in days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const status = attendanceMap[dateStr];
        const color = getDotColor(status);

        if (status && monthlyCounts[status.toLowerCase()] !== undefined) {
            monthlyCounts[status.toLowerCase()]++;
        }

        calendar += `
            <div class="p-1">
                <div class="rounded-circle mx-auto d-flex justify-content-center align-items-center"
                    style="width:30px; height:30px; background-color:${color}; color:#fff; font-weight:bold;">
                    ${day}
                </div>
            </div>`;
    }

    calendar += `</div></div>`; // close calendar

    $('#results').append(calendar);
    $('#results').append(`
        <div class="px-3">
            ${renderLegend(monthlyCounts)}
            ${todayStatusHTML}
        </div>
    `);
}

// Helper function to color status
function getDotColor(status) {
    switch ((status || '').toLowerCase()) {
        case 'present': return '#004d4d';
        case 'absent': return '#ff0000';
        case 'late': return '#ffaa00';
        case 'excused': return '#00ffff';
        default: return '#d9d9d9';
    }
}

// Helper to capitalize first letter
function capitalizeFirstLetter(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Legend with totals
function renderLegend(counts = { present: 0, absent: 0, late: 0, excused: 0 }) {
    return `
        <div class="d-flex flex-column gap-2 mt-2">
            ${legendRow('Present', '#004d4d', counts.present)}
            ${legendRow('Absent', '#ff0000', counts.absent)}
            ${legendRow('Late', '#ffaa00', counts.late)}
            ${legendRow('Excused', '#00ffff', counts.excused)}
        </div>
    `;
}

function legendRow(label, color, count = 0) {
    return `
        <div class="d-flex align-items-center justify-content-between px-3 pt-1 rounded-pill" style="background:#00e29f;">
            <span>${label}</span>
            <div class="d-flex justify-content-center align-items-center rounded-circle"
                 style="width:36px; height:36px; background:${color}; color:white; font-size:14px;">
                 ${count}
            </div>
        </div>
    `;
}
function changeMonth(offset) {
    currentMonthOffset += offset;
    renderCalendar(currentMonthOffset);
}

function getDotColor(status) {
    switch (status?.toLowerCase()) {
        case 'present': return '#004d4d';
        case 'absent': return '#ff0000';
        case 'late': return '#ffaa00';
        case 'excused': return '#00ffff';
        default: return 'transparent';
    }
}
function renderLegend(counts = {}) {
    return `
        <div class="d-flex flex-column gap-3 mt-3">
            ${legendRow('Present', '#004d4d', counts.present || 0)}
            ${legendRow('Absent', '#ff0000', counts.absent || 0)}
            ${legendRow('Late', '#ffaa00', counts.late || 0)}
            ${legendRow('Excused', '#00ffff', counts.excused || 0)}
        </div>
    `;
}

function legendRow(label, color, count) {
    return `
        <div class="d-flex align-items-center justify-content-between px-4 py-2 mb-2 mx-4 rounded-pill"
             style="background:#00e29f; height: 40px;">
            <span class="fw-semibold" style="font-size: 16px;">${label}</span>
            <div class="d-flex justify-content-center align-items-center text-white fw-bold"
                 style="width: 46px; height: 46px; border-radius: 50%; background:${color}; font-size: 14px;">
                ${count}
            </div>
        </div>
    `;
}


function m_displayResults(records, pagination) {
    $('#results').html('');

    if (records.length === 0) {
        $('#results').html('<p>No records found.</p>');
        return;
    }

    // Step 1: Group by month
    const groupedByMonth = {};
    records.forEach(item => {
        const date = new Date(item.attendance);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
        groupedByMonth[monthKey].push(item);
    });

    // Step 2: Render each month as a table
    Object.keys(groupedByMonth).forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        const totalDays = lastDayOfMonth.getDate();
        const startDayIndex = firstDayOfMonth.getDay();

        const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const attendanceMap = {};
       // groupedByMonth[monthKey].forEach(item => {
        //    attendanceMap[item.attendance] = item.attendanceStatus;
       // });
        // Fix: convert attendance string (e.g., "11 Jun 2025") to YYYY-MM-DD
        groupedByMonth[monthKey].forEach(item => {
            const parsed = new Date(item.attendance);
            const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
            attendanceMap[key] = item.attendanceStatus;
        });

        let calendarHTML = `<div class="mb-4">
            <h5 class="text-primary mb-3">${monthName}</h5>
            <table class="table table-borderless text-center rounded bg-transparent calendar-table">
                <thead class="bg-light">
                    <tr>
                        <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                    </tr>
                </thead>
                <tbody><tr>`;

        // Empty cells before first day
        for (let i = 0; i < startDayIndex; i++) {
            calendarHTML += `<td></td>`;
        }

        // Days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const status = attendanceMap[dateStr];
            let bgClass = '', icon = '';

            if (status) {
                icon = getAttendanceIcon(status);
                bgClass = getBgClassFromStatus(status);
            }

            calendarHTML += `<td class="p-1 ${bgClass}">
                <div class="small fw-bold">${day}</div>

            </td>`;

            if ((startDayIndex + day) % 7 === 0 && day !== totalDays) {
                calendarHTML += `</tr><tr>`;
            }
        }

        // Fill remaining cells
        const totalCells = startDayIndex + totalDays;
        const remaining = 7 - (totalCells % 7);
        if (remaining < 7) {
            for (let i = 0; i < remaining; i++) {
                calendarHTML += `<td></td>`;
            }
        }

        calendarHTML += `</tr></tbody></table></div>`;
        $('#results').append(calendarHTML);
    });

    renderPaginationDropdown(pagination);
}
function getBgClassFromStatus(status) {
  switch (status.toLowerCase()) {
    case 'present': return 'bg-success text-white';
    case 'absent': return 'bg-danger text-white';
    case 'late': return 'bg-warning text-dark';
    case 'excused': return 'bg-info text-white';
    default: return 'bg-transparent text-dark';
  }
}
function __displayResults(records, pagination) {
    $('#results').html('');

    if (records.length === 0) {
        $('#results').html('<p>No records found.</p>');
        return;
    }

    // Helper: Group by month
    const groupedByMonth = {};
    records.forEach(item => {
        const date = new Date(item.attendance);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!groupedByMonth[monthKey]) groupedByMonth[monthKey] = [];
        groupedByMonth[monthKey].push(item);
    });

    // Helper: Build full calendar month
    Object.keys(groupedByMonth).forEach(monthKey => {
        const [year, month] = monthKey.split('-').map(Number);
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        const totalDays = lastDayOfMonth.getDate();
        const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sunday

        const monthName = firstDayOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        const attendanceMap = {};
        groupedByMonth[monthKey].forEach(item => {
            attendanceMap[item.attendance] = item.attendanceStatus;
        });

        let calendarHTML = `<div class="mb-4">
            <h5 class="text-primary mb-3">${monthName}</h5>
            <table class="table table-bordered text-center calendar-table">
                <thead class="bg-light">
                    <tr>
                        <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
                    </tr>
                </thead>
                <tbody><tr>`;

        // Empty cells before month start
        for (let i = 0; i < startDayIndex; i++) {
            calendarHTML += `<td></td>`;
        }

        // Day cells with attendance
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const icon = attendanceMap[dateStr] ? getAttendanceIcon(attendanceMap[dateStr]) : '';
            calendarHTML += `<td class="p-1">
                <div class="small fw-bold">${day}</div>
                    <div class="fs-6">${icon}</div>

            </td>`;

            // Start new row every 7 cells
            if ((startDayIndex + day) % 7 === 0 && day !== totalDays) {
                calendarHTML += `</tr><tr>`;
            }
        }

        // Empty cells after month end
        const totalCells = startDayIndex + totalDays;
        const remaining = 7 - (totalCells % 7);
        if (remaining < 7) {
            for (let i = 0; i < remaining; i++) {
                calendarHTML += `<td></td>`;
            }
        }

        calendarHTML += `</tr></tbody></table></div>`;
        $('#results').append(calendarHTML);
    });

    renderPaginationDropdown(pagination);
}
function _displayResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {

                state='d-flex'
                if(item.status.iD!='1'){ state='d-none'}
                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                  .replace('@item_name',  item.name)

                  .replace("@attendance_name", item.attendance)
                  .replace('@attendance_icon', getAttendanceIcon(item.attendanceStatus))
                  .replace(/@attendanceStatus_name/g, item.attendanceStatus)

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

// Choose icon and color based on attendanceStatus
function getAttendanceIcon(status) {
  switch (status.toLowerCase()) {
    case 'present':
      return '<i class="fas fa-check-circle me-2 text-white"></i>';
    case 'absent':
      return '<i class="fas fa-times-circle me-2 text-white"></i>';
    case 'late':
      return '<i class="fas fa-clock me-2 text-white"></i>';
    case 'excused':
      return '<i class="fas fa-minus-circle me-2 text-white"></i>';
    default:
      return '<i class="fas fa-question-circle me-2 text-muted"></i>';
  }
}