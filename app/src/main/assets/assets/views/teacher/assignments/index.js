key = 'teacher_activity_resource_' + current.iD

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
             const text = item.name + ' - ' + item.period ;
             const id = item.periodiD + "_" + item.classiD + "_" + item.iD
             const option = `<option value="${id}" data-description="${text}">${text}</option>`;
             select.append(option);
         });
                    if (navigator.onLine) {  loadData(true); }else{ loadData(); }

        // loadData(); // If needed
     }
 }

async function loadData(forceRefresh = false) {
    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        displayResults(data.records, data.pagination);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return;
    }

    $('#results').html('loading...');

    const classValue = $('[name=institution_class]').val();
    const classParts = classValue.split('_');

    const period = classParts[0];
    const classIds = classParts.slice(1); // all classes after period

    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    let allRecords = [];

    // fetch each class separately
    for (const classId of classIds) {
        try {
            const response = await $.ajax({
                url: site + "/get-activity-records",
                type: "POST",
                data: {
                    search: search,
                    page: current_page,
                    order_by: ob,
                    page_size: ps,
                    institution: current.institutioniD,
                    user: user.iD,
                    api: true,
                    institution_role: '',
                    institution_user: current.iD,
                    period: period,
                    institution_class: classId,
                }
            });

            const data = JSON.parse(response);
            allRecords = allRecords.concat(data.records);

        } catch (error) {
            console.error("Error fetching class " + classId, error);
        }
    }

    // fake pagination since you’re merging results
    const pagination = {
        total_records: allRecords.length,
        current_page: 1
    };

    localStorage.setItem("current_record", JSON.stringify(allRecords));
    localStorage.setItem(key, JSON.stringify({ records: allRecords, pagination }));

    displayResults(allRecords, pagination);
    $('#total_records_label').html(allRecords.length);
}

function displayResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
        currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {
                state = 'd-flex'
                if (item.status.iD != '1') { state = 'd-none' }
                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                    .replace('@item_name', item.name)

                    .replace("@institution_user_name", item.institution_user)
                    .replace("@name_name", item.name)
                    .replace("@subject_name", item.subject)
                    .replace("@period_name", item.period)
                  //  .replace('@description_name', item.description || 'no description')
                    .replace("@activityType_name", item.activityType)
                    .replace("@submissions", item.submissions)
                    .replace("@end_name", item.end)
                    .replace("@weight_name", item.weight)
                    .replace("@possible_mark_name", item.possible_mark)
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

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}

