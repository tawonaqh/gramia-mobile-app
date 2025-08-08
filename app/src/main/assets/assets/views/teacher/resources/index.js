key = 'teacher_class_resource_' + current.iD

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
            //return;
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
            console.log('ts: ' + response)
            localStorage.setItem(cacheKey, JSON.stringify(response));
            renderClassOptions(response);
        },
        complete: function (response) {
            console.log('ts: ' + JSON.stringify(response));
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
            const text = item.name + ' - ' + item.period;
            const id = item.classiD
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
    const _class = $('[name=institution_class]').val();



    const search = $('input[name="search"]').val();
    const ps = '10';
    const ob = $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-class-resource-records";
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
            institution_class: _class

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
function displayResults(records, pagination) {
    let html = '';

    if (!records || records.length === 0) {
        $('#results').html('<div class="text-center text-muted py-4">No records found.</div>');
        return;
    }

    records.forEach(record => {
        let lb = 'no images', imageCount = record.images;
        if (imageCount === 1) { lb = '1 image'; } else if (imageCount > 1) { lb = imageCount + ' images'; }
        html += `
        <div  onclick="navigateTo('view-teacher-resource', getRecord(${record.iD}))" class="d-flex justify-content-between align-items-center  rounded-3 px-3 py-3 mb-2 bg-light ">
            <div class="d-flex align-items-center">
                <img src='${record.file}' alt="thumb" class="me-3 rounded-2" style="width: 40px; height: 40px; background: #00e29f;"/>
                <div>
                    <div class="fw-semibold text-success" style="font-size: 16px;">${record.name} </div>
                    <div class="fw-normal dark-text" style="font-size: 11px;">${record.subject} </div>
                    <div class="text-muted" style="font-size: 14px;">${record.description || ''}</div>
                </div>
            </div>
            <div>
                ${lb}
            </div>
        </div>`;
    });
    renderPaginationDropdown(pagination)

    $('#results').html(html);
}


