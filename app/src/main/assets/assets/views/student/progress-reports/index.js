key = 'progress_report_' + current.iD

function init(data) {
    current_page = 1;

    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");

    selectedClass = getSelectedClass();

    if (!selectedClass) {
        showAlert("No class selected.");
        $('.class-id').html("No class selected.");
        $('#results').html('No class selected');
        return; // stop execution if no class
    }

    console.log('stri: ' + JSON.stringify(selectedClass))
    console.log("Selected class name:", selectedClass.institution_class);
    console.log("Selected period:", selectedClass.period);
    $('.class-id').html(selectedClass.institution_class + ' ' + selectedClass.period);

    // Only load data if selectedClass exists
    if (navigator.onLine) {
        loadData(true);
    } else {
        loadData();
    }

    // Fetch periods asynchronously, but don't call loadData inside it
    get_report_periods();
}

function get_report_periods(forceRefresh = false) {
    if (localStorage.getItem(period_key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(period_key));
        list_report_periods(data);
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
            list_report_periods(response, forceRefresh);
        },
        error: function () {
            console.error("Failed to fetch periods");
        }
    });
}
function list_report_periods(response, forceRefresh = false) {
    if (response.records && response.records.length > 0) {
        const select = $('[name=institution_period]');
        select.html('');

        // Always start with All
        select.append(`<option value="" selected>All Periods</option>`);

        response.records.forEach(item => {
            select.append(`<option value="${item.iD}">${item.name}</option>`);
        });

        // 🔥 Load all initially
        loadData(null, true);
    }
}

function loadData(periodId = null, forceRefresh = false) {
    const i_period = periodId || $('[name=institution_period]').val();

    // include period in the key
    const key = `progress_report_${current.iD}_${i_period || 'all'}`;

    // Skip cache if forceRefresh = true
    if (localStorage.getItem(key) && !forceRefresh) {
        const data = JSON.parse(localStorage.getItem(key));
        renderReportCard(data);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return;
    }

    $('#results').html('loading...');
    const _student = $('[name=class]').val();
    const n_institution = current.institutioniD;
    const n_user = user.iD;
    const n_institution_user = current.iD;

    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    $.ajax({
        url: site + "/get-reportcard-records",
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps,
            institution: n_institution,
            user: n_user,
            api: true,
            institution_user: n_institution_user,
            student: _student,
            period: i_period || (selectedClass ? selectedClass.periodiD : ''),
            institution_class: selectedClass ? selectedClass.classiD : ''
        },
        success: function (response) {
            const data = JSON.parse(response);

            // store per period if needed
            localStorage.setItem(key, response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            renderReportCard(data);
        },
        error: function () {
            showAlert('Error loading data');
        }
    });
}

function renderReportCard(data) {
    const container = $('#results');
    container.empty();

    if (!data.records || data.records.length === 0) {
        container.html('<div class="alert alert-warning">No report card records found.</div>');
        return;
    }

data.records.forEach(record => {
    let card = $(`
        <div class="p-3 mb-4 rounded-4 bg-light py-4">
            <div class="my-2">
                <div class="fw-semibold text-success small">${record.period}</div>
                <div class="fw-bold text-dark fs-6">${record.institution_user}</div>
                <div class="text-muted small mb-2">${record.institution_class} Report</div>
            </div>
            <div class="d-flex flex-column gap-3" id="subjectList_${record.iD}"></div>
            <div class="text-end my-3">
                <button class="btn btn-sm btn-outline-success" onclick="downloadReportPDF(${record.iD})">
                    <i class="fas fa-file-pdf"></i> Download Report
                </button>
            </div>
        </div>
    `);

    const subjectList = card.find(`#subjectList_${record.iD}`);

    record.marks.forEach(mark => {
        const subjectBlock = $(`
            <div class="p-3 bg-light rounded-3">
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <span class="fw-semibold text-success">${mark.subject}</span>
                    <span class="badge rounded-pill bg-success-subtle text-success">${mark.symbol}</span>
                </div>
                <div class="row text-muted small">
                    <div class="col-4">
                        <div class="fw-light">Possible Mark</div>
                        <div class="text-dark fw-semibold">${mark.class_mark}</div>
                    </div>
                    <div class="col-4">
                        <div class="fw-light">Mark Awarded</div>
                        <div class="text-dark fw-semibold">${mark.exam_mark}</div>
                    </div>
                    <div class="col-4">
                        <div class="fw-light">Percentage</div>
                        <div class="text-dark fw-semibold">${mark.final_mark}</div>
                    </div>
                </div>
            </div>
        `);
        subjectList.append(subjectBlock);
    });

    container.append(card);
});
}
function downloadReportPDF(id) {
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    var uri = site + "/api/download-student-report";
    $.ajax({
        url: uri,
        type: "POST",
        data: { id: id, api: true, user: user.iD },
        success: function (resp) {


            console.log("rss: " + (resp))
            console.log("rss: " + JSON.stringify(resp))
            const res = JSON.parse(resp);
            if (res.status == 1) {
                // Send data to Android app
                if (window.AndroidInterface && AndroidInterface.saveBase64PDF) {
                    AndroidInterface.saveBase64PDF(res.data, res.filename || 'Progress_report.pdf');
                } else {
                    showAlert('Android interface not available.');
                }
            } else {
                showAlert('Download failed.');
            }
        },
        error: function (xhr, status, err) {
            showAlert('Error: ' + err);
        }
    });
}


function getGradeColor(symbol) {
    switch (symbol.toUpperCase()) {
        case 'A': return '#00b36b';
        case 'B': return '#00cc99';
        case 'C': return '#ffaa00';
        case 'D': return '#ff6600';
        case 'U':
        case 'F': return '#ff3333';
        default: return '#666';
    }
}
// Grade color helper
function getGradeColor(symbol) {
    switch (symbol.toUpperCase()) {
        case 'A': return '#007f00';
        case 'B': return '#00aa00';
        case 'C': return '#ffaa00';
        case 'D': return '#ff6600';
        case 'U':
        case 'F': return '#ff0000';
        default: return '#555';
    }
}
// Grade color helper
function getGradeColor(grade) {
    switch (grade.toUpperCase()) {
        case 'A': return '#00aa00';     // Green
        case 'B': return '#ffaa00';     // Amber
        case 'C':
        case 'D':
        case 'F': return '#ff0000';     // Red
        default: return '#555';
    }
}
function _renderReportCard(data) {
    const container = $('#results');
    container.empty(); // clear any existing content

    if (!data.records || data.records.length === 0) {
        container.html('<div class="alert alert-warning">No report card records found.</div>');
        return;
    }

    data.records.forEach(record => {
        let card = $(`
            <div class="card mb-4 shadow-sm border-0">
                <div class="card-header bg-primary-subtle text-primary fw-semibold">
                    ${record.institution_user}
                </div>
                <div class="card-body">
                    <p class="mb-2"><strong>Class:</strong> ${record.institution_class}</p>
                    <p class="mb-3"><strong>Period:</strong> ${record.period}</p>

                    <div class="table-responsive">
                        <table class="table table-sm table-bordered align-middle mb-0">
                            <thead class="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Subject ID</th>
                                    <th>Term Mark</th>
                                    <th>Exam Mark</th>
                                    <th>Final Mark</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `);

        const tbody = card.find('tbody');
        record.marks.forEach((mark, index) => {
            tbody.append(`
                <tr>
                    <td>${index + 1}</td>
                    <td>${mark.subject}</td>
                    <td>${mark.class_mark}</td>
                    <td>${mark.exam_mark}</td>
                    <td>${mark.final_mark}</td>
                    <td><span class="badge bg-secondary">${mark.symbol}</span></td>
                </tr>
            `);
        });

        container.append(card);
    });
}
function loadDataByPeriod(periodId) {
    // Pass selected period to loadData
    loadData(periodId, true);
}
function reloadCurrentPeriod() {
    const currentPeriod = $('[name=institution_period]').val() || ''; // "" means All
    loadData(currentPeriod, true);
}

