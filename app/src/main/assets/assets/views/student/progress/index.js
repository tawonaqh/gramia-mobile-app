function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
loadProgressData()
}
function loadProgressData() {
    $('#results').html('loading...');
   const _student = $('[name=class]').val();
   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/api/get-student-class-mark-sheet-b";
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
            institution_role: n_institution_role,
            institution_user: n_institution_user,
            student: _student,

        },
        success: function (response) {
           console.log('rest: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));

         //   displayResults(data.records, data.pagination);
          //  $('#total_records_label').html(data.pagination.total_records)
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
      return '<i class="fas fa-check-circle me-2 text-success"></i>';
    case 'absent':
      return '<i class="fas fa-times-circle me-2 text-danger"></i>';
    case 'late':
      return '<i class="fas fa-clock me-2 text-warning"></i>';
    case 'excused':
      return '<i class="fas fa-minus-circle me-2 text-info"></i>';
    default:
      return '<i class="fas fa-question-circle me-2 text-muted"></i>';
  }
}