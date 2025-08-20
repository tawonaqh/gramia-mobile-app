key = 'teacher_attendance_' + current.iD

function init(data) {
    current_page = 1;
    console.log('init: ' + localStorage.getItem("current_account"))
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      document.getElementById('calendarDate').innerText = today;
    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");
    const storageKey = getClassStorageKey();
    
    updateCalendarTime()
    let classes = current.classes;
    const select = $('[name=institution_class]');
    select.html('');

    classes.forEach(function (item) {
        const text = item.name + ' (' + item.period + ') ';
        const option = `<option value="${item.iD}" data-description="${text}">${text}</option>`;
        select.append(option);
    });

    const selectedId = localStorage.getItem(getSelectedClassKey());
    if (selectedId) {
        select.val(selectedId).trigger('change');
    }

    select.off('change').on('change', function () {
        const selected = $(this).find('option:selected');
        localStorage.setItem(getSelectedClassKey(), $(this).val());
    });

    if (navigator.onLine) {  loadData(true); }else{ loadData(); }


}
function updateCalendarTime() {
    const timeElem = document.getElementById("calendarTime");
    if (!timeElem) return;

    setInterval(() => {
        const now = new Date();
        timeElem.textContent = now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }, 1000);
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
    var _class = $('[name=institution_class]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    var _form = {
        search: search,
        page: current_page,
        order_by: ob,
        page_size: ps, // Or capture from a page-size selector if available
        institution: n_institution,
        user: n_user,
        teacher: _class,
        api: true

    }
    // Set default or capture from a pagination control
    var uri = site + "/get-teacher-attendance-records";
    console.log('uri:  ' + uri + "; pr: " + n_institution)
    console.log('gh: ' + JSON.stringify(_form))

    $.ajax({
        url: uri,
        type: "POST",
        data: _form,
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

function displayResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
        currentView = 'list';

        if (currentView === 'list') {
            records.forEach((item, index) => {
                attendanceRecordMap[item.iD] = item; // store full record

                let state = 'd-flex';
                if (item.status.iD !== '1') {
                    state = 'd-none';
                }

                let presentPercent = 0, absentPercent = 0, latePercent = 0, excusedPercent = 0;
                const total = item.total_students || 1;

                if (total > 0) {
                    presentPercent = ((item.present || 0) / total * 100).toFixed(1);
                    absentPercent = ((item.absent || 0) / total * 100).toFixed(1);
                    latePercent = ((item.late || 0) / total * 100).toFixed(1);
                    excusedPercent = ((item.excused || 0) / total * 100).toFixed(1);
                }

                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');

                template.innerHTML = template.innerHTML
                    .replace('@item_name', item.name)
                    .replace('@institution_class_name', item.institution_class)
                    .replace('@day_name', item.day)
                    .replace('@present_name', item.present)
                    .replace('@absent_name', item.absent)
                    .replace('@late_name', item.late)
                    .replace('@excused_name', item.excused)
                    .replace('@present_percent', presentPercent)
                    .replace('@absent_percent', absentPercent)
                    .replace('@late_percent', latePercent)
                    .replace('@excused_percent', excusedPercent)
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

        renderPaginationDropdown(pagination);
    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
function viewStudents(id) {
    const record = attendanceRecordMap[id];
    const container = $('#studentListDetails');
    container.html('');
    $('#studentListCanvasLabel').html(record.day);

    if (!record || !record.students) {
        container.html('<p class="text-muted">No student data available.</p>');
        return;
    }

    record.students.forEach(s => {
        const colorMap = {
            'Present': '#00f19f',
            'Absent': '#ff2c2c',
            'Late': '#ffa500',
            'Excused': '#00e6ff'
        };

        const statusColor = colorMap[s.st] || '#ccc';
        const tickVisible = s.st ? 'd-inline-block' : 'd-none';

        const item = `
            <div class="rounded-4 bg-light p-3 mb-8 d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-3">
                    <div style="width: 32px; height: 32px; border-radius: 8px; background-color: ${statusColor};"></div>
                    <div>
                        <div class="fw-semibold text-success">${s.nm}</div>
                        <div class="small text-muted">${s.st ? `Marked: ${s.st}` : 'Not marked'}</div>
                    </div>
                </div>
                <div style="width: 24px; height: 24px; border: 2px solid #005757; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-check small text-success ${tickVisible}"></i>
                </div>
            </div>
        `;
        container.append(item);
    });
}