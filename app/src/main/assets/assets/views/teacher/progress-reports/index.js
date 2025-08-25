key = 'teacherprogress_' + current.iD

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
            const text = item.name + ' [' + item.period + '] ';
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
    // $('#results').html('loading...');
    // const province = $('.search').find('[name=province]').val();
    var n_institution = current.institutioniD;
    var n_institution_user = '';

    const classValue = $('[name=institution_class]').val();

    const classParts = classValue.split('_');
    var n_period = classParts[0];
    var n_institution_class = classParts[1];

    const search = $('input[name="search"]').val();

    const ps = localStorage.getItem('page_size') || '10';;
    const ob = $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-reportcard-records";
    // console.log('uri:  ' + uri + "; pr: " + search)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps, // Or capture from a page-size selector if available
            institution: n_institution,
            institution_user: n_institution_user,
            period: n_period,
            user: user.iD,
            api: true,
            institution_class: n_institution_class
        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem(key, response);

            renderReportCard(data)
            //displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
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
        const summary = record.marks
            .map(mark => `<span class="text-green">${mark.subject}</span> : <b class="dark-text">${mark.final_mark}%</b>`)
            .join(' | ');

        const card = $(`
            <div class=" rounded-3 bg-light p-3 mb-3" style="cursor: pointer;">
                <div class="fw-semibold text-success fs-6 mb-2">${record.institution_user}</div>
                <div class="text-muted small">
                    
                    ${summary}
                </div>
            </div>
        `);

        // Click to open bottom sheet
        card.on('click', function () {
            showReportCardDetails(record);
        });

        container.append(card);
    });
}
function showReportCardDetails(record) {
    $('#reportCardTitle').text(record.institution_user + ' - ' + record.institution_class);

    const container = $('#reportCardDetails');
    container.empty();

    record.marks.forEach(mark => {
        const subjectBlock = $(`
            <div class="p-3 bg-light rounded-3 mb-3">
                <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                    <span class="fw-semibold text-success">${mark.subject}</span>
                    <span class="badge rounded-pill bg-success-subtle text-success">${mark.symbol}</span>
                </div>
                <div class="row text-muted small">
                    <div class="col-4">
                        <div class="fw-light">Term</div>
                        <div class="text-dark fw-semibold">${mark.class_mark}</div>
                    </div>
                    <div class="col-4">
                        <div class="fw-light">Exam</div>
                        <div class="text-dark fw-semibold">${mark.exam_mark}</div>
                    </div>
                    <div class="col-4">
                        <div class="fw-light">Final</div>
                        <div class="text-dark fw-semibold">${mark.final_mark}</div>
                    </div>
                </div>
            </div>
        `);
        container.append(subjectBlock);
    });

    // Show offcanvas
    const offcanvas = new bootstrap.Offcanvas(document.getElementById('reportCardCanvas'));
    offcanvas.show();
}

