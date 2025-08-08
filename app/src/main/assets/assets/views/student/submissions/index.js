key = 'studentsubmisssions_' + current.iD

function init(data) {
    current_page = 1;
    console.log('init: ' + localStorage.getItem("current_account"))

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
           get_subjects()

        }
         function get_subjects(useCache = true) {
             const cacheKey = 'cached_student_subjects';
             const uri = site + "/get-class-submission-subjects";
        
             if (useCache) {
                 const cached = localStorage.getItem(cacheKey);
                 if (cached) {
                     const response = JSON.parse(cached);
                     renderOptions(response);
                     //return;
                 }
             }
        
             const _form = {
                 user: user.iD,
                 api: true,
                 institution_user: current.iD,
                 institution: current.institutioniD,
                 institution_class: selectedClass.classiD,
                 student: selectedClass.iD
             };
        
             $.ajax({
                 url: uri,
                 type: 'post',
                 data: _form,
                 dataType: 'json',
                 success: function (response) {
                            console.log('ts: ' + response)
                     localStorage.setItem(cacheKey, JSON.stringify(response));
                     renderOptions(response, useCache);
                 },
                 complete: function (response) {
                    console.log('ts: ' + JSON.stringify(response));
                 },
                 error: function (xhr, status, error) {
                     console.error('Failed to fetch class list:', error);
                 }
             });
         }
        
        function renderOptions(response, useCache = true) {
            if (response && response.subjects.length > 0) {
                const container = $('#subjectSelector');
                const hiddenInput = $('#selectedSubject');
                container.html('');
        
                response.subjects.forEach((item, index) => {
                    const btn = $(`
                        <button class="btn btn-sm px-3 py-2 fw-light rounded-3 border-0 subject-pill ${
                            index === 0 ? 'active' : ''
                        }" style="
                            background-color: ${'#ebebfa'};
                            color: ${'#01e888'};"
                            data-id="${item.iD}">
                            ${item.name} <span>${item.submissions}</span>
                        </button>
                    `);
        
                    btn.on('click', function () {
                        $('.subject-pill').removeClass('active').css({
                            backgroundColor: '#ebebfa',
                            color: '#01e888'
                        });
        
                        $(this).addClass('active').css({
                            backgroundColor: '#01e888',
                            color: '#3a5d6c'
                        });
        
                        hiddenInput.val(item.iD);
                        loadData(true);
                    });
        
                    container.append(btn);
        
                    if (index === 0) {
                        hiddenInput.val('');
                    }
                });
        
                if (!useCache) {
                    loadData(true);
                } else {
                    navigator.onLine ? loadData(true) : loadData();
                }
            }
        }


function loadData(forceRefresh = false) {

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
           // displayResults(data.records, data.pagination);
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
    var n_institution_user = selectedClass.iD;
    const select = $('[name=class_subjects]').val();



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-student-activity-records";
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
            period:selectedClass.periodiD,
             institution_class: selectedClass.classiD,
             subject: select


        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);

            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.records.length)
        },
        error: function () {
            //alert('Error loading data');
        }
    });
}
function displayResults(records, pagination) {
    const container = $('#results');
    container.empty();

    if (!records || records.length === 0) {
        container.html('<div class="alert alert-warning text-center">No submissions found.</div>');
        return;
    }

    records.forEach(record => {
        const percent = record.status && record.possible_mark
            ? ((record.status.mark_awarded / record.possible_mark) * 100).toFixed(1) + '%'
            : 'N/A';

        const mark = record.status?.mark_awarded ?? '-';
        const weight = record.status?.weight ?? (record.weight) ?? '-';

        const card = $(`
            <div class="rounded-3 p-3 mb-3 bg-light ">
                <div class="fw-semibold text-dark fs-5 mb-1">${record.name}</div>
                <div class="small text-green mb-2">${record.subject} • ${record.activityType}</div>

                <div class="d-flex flex-wrap small text-black-50 mt-3">
                    <div class="me-auto">
                        <strong>Mark:</strong> ${mark} / ${record.possible_mark}
                    </div>
                    <div class="mx-auto">
                        <strong>Score:</strong> ${percent}
                    </div>
                    <div class="ms-auto">
                        <strong>Weight:</strong> ${weight.toFixed(1)}
                    </div>
                </div>
            </div>
        `);

        container.append(card);
    });
    pagination.total_records = records.length
    renderPaginationDropdown(pagination)

    // Optional: handle pagination UI here
}


