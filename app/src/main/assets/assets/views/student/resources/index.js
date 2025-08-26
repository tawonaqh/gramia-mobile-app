key = 'class_resource_' + current.iD

function init(data) {
    current_page = 1;
    console.log('init: ')

    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");

    selectedClass = getSelectedClass();
    console.log('stri: ' + JSON.stringify(selectedClass))
    console.log("Selected class name:", selectedClass.institution_class);
    console.log("Selected period:", selectedClass.period);
    $('.class-id').html(selectedClass.institution_class + ' ' + selectedClass.period)
   // if (navigator.onLine) { loadData(true); } else { loadData(); }


 get_subjects()

}
 function get_subjects(useCache = true) {
     const cacheKey = 'cached_student_subjects';
     const uri = site + "/get-class-subjects";

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
         institution_class: selectedClass.classiD
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
                    ${item.name} <span>${item.resources}</span>
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
         const select = $('[name=class_subjects]').val();



    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
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
            institution_class: selectedClass.classiD,
            subject: select

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
            //   showAlert('Error loading data');
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
      if (imageCount === 1) {  lb = '1 image'; } else if (imageCount > 1) { lb= imageCount +' images'; }
          html += `
          <div  onclick="navigateTo('view-resource', getRecord(${record.iD}))" class="d-flex justify-content-between align-items-center  rounded-3 px-3 py-3 mb-2 bg-light ">
              <div class="d-flex align-items-center">
                  <img src='${record.file}' class="me-3 rounded-2" style="width: 40px; height: 40px; background: #00e29f;"/>
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

    $('#results').html(html);
            renderPaginationDropdown(pagination)

}
function _displayResults(records, pagination) {
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

                    .replace("@description_name", item.description)
                    .replace('@images', item.images)
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

