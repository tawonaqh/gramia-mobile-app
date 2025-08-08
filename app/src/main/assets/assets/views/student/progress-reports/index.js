key = 'progress_report_' + current.iD

function init(data) {
    current_page = 1;
    console.log('curent: ' + localStorage.getItem("current_account"))

    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");
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
}
function loadData(forceRefresh = false) {

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        renderReportCard(data);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    $('#results').html('loading...');
    const _student = $('[name=class]').val();
    // const province = $('.search').find('[name=province]').val();
    var n_institution = current.institutioniD;
    var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
    var n_user = user.iD;
    var n_institution_user = current.iD;



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-reportcard-records";
    console.log('uri:  ' + uri + "; st: " + _student)
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
            student: _student,
            period: selectedClass.periodiD,
            institution_class: selectedClass.classiD

        },
        success: function (response) {
            console.log('rest: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);

            //   displayResults(data.records, data.pagination);
            renderReportCard(data)
            //  $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            alert('Error loading data');
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
                    AndroidInterface.saveBase64PDF(res.data, res.filename || 'Invoice.pdf');
                } else {
                    alert('Android interface not available.');
                }
            } else {
                alert('Download failed.');
            }
        },
        error: function (xhr, status, err) {
            alert('Error: ' + err);
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
