function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
loadData()
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
    var uri = site + "/api/get-institution-class-students";
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
            institution_role: n_institution_role,
            institution_user: n_institution_user,

        },
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
                  .replace(/@period_name/g,  item.period)

                 .replace(/@institution_class_name/g, item.institution_class)

                 .replaceAll(/@item_id/g, item.iD);

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

