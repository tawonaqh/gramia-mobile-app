function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
   selectedClass = getSelectedClass();
      if (selectedClass) {
      console.log('stri: ' + JSON.stringify(selectedClass))
          console.log("Selected class name:", selectedClass.institution_class);
          console.log("Selected period:", selectedClass.period);
           $('.class-id').html(selectedClass.institution_class + ' ' + selectedClass.period)
           loadData()
      } else {
          showAlert("No class selected.");
           $('.class-id').html("No class selected.")
               $('#results').html('No class selected');

      }

}
function loadData() {
    $('#results').html('loading...');
   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-class-activity-records";
    var _form = {
                            search: search,
                            page: current_page,
                            order_by: ob,
                            page_size: ps, // Or capture from a page-size selector if available
                            institution: n_institution,
                            user: n_user,
                            api: n_user,
                            student: selectedClass.iD,

                            institution_role: n_institution_role,
                            institution_user: n_institution_user,

                        }
    console.log('uri:  ' + uri + "; pr: " + n_institution + ' frm: ' + JSON.stringify(_form))
    $.ajax({
        url: uri,
        type: "POST",
        data: _form,
        success: function (response) {
           console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));

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

            // List View
            records.forEach((item, index) => {

                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                    .replace('@item_name',  item.name)

                    .replace("@institution_name", item.institution)
                    .replace("@name_name", item.name)
                    .replace("@description_name", item.description)
                    .replace("@period_name", item.period)
                    .replace("@question", item.questions.length)
                    .replace("@open_name", item.open)
                    .replace("@close_name", item.close)
                    .replace('@status_name', item.status.name)
                    .replace('@item_id', item.iD);

                template.classList.add('fade-in');
                setTimeout(() => {
                    $('#results').append(template);
                    requestAnimationFrame(() => {
                        template.classList.add('show');
                    });
                }, index * 200);
            });

               renderPaginationDropdown(pagination)


    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
function _displayResults(records, pagination) {
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

                  .replace("@institution_user_name", item.institution_user)
                 .replace("@name_name", item.name)
                 .replace("@phone_name", item.phone)
                 .replace("@email_name", item.email)
                 .replace("@occupation_name", item.occupation)
                 .replace("@guardianType_name", item.guardianType)
                 .replace('@status_name', item.status.name)
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

