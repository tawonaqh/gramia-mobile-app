function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
  get_classes()

}
function get_classes() {



     const uri = site + "/api/get-teacher-classes";
       const _form = {
           user: user.iD,
           institution_user: current.iD,
           institution: current.institutioniD
       };
    console.log('gh: ' + JSON.stringify(_form))

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        dataType: 'json',
        success: function (response) {
            console.log('j:'+ JSON.stringify(response));

            if (response && response.length > 0) {
                const select = $('[name=institution_class]');
                select.html('');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ';
                    const id = item.periodiD + "_" + item.classiD + "_" + item.iD
                    const option = `<option value="${id}" data-description="${text}">${text}</option>`;
                    select.append(option);
                });
                loadAttendanceData()
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

function loadAttendanceData() {
    $('#results').html('loading...');
    const _class = $('.search').find('[name=institution_class]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-attendance-records";
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
            showAlert('Error loading data');
        }
    });
}

function displayResults(records, pagination) {
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

                   .replace("@institution_class_name", item.institution_class)
                                   .replace("@day_name", item.day)
                                   .replace("@present_name", item.present)
                                   .replace("@absent_name", item.absent)
                                   .replace("@late_name", item.late)
                                   .replace("@excused_name", item.excused)
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

