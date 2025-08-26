key = 'requests_' + current.iD
function init(data) {
    current_page = 1;
    loadData()
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
             var n_user = '';



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/api/get-institution-account-request-records";
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
                    .replace('@item_name', index + start + ". " + item.name)

                                      .replace("@institution_name", item.institution)
                                      .replace("@user_name", item.user)
                                      .replace("@full_name_name", item.full_name)
                                      .replace("@id_number_name", item.id_number)
                                      .replace("@phone_name", item.phone)
                                      .replace("@institution_role_name", item.institution_role)
                                      .replace('@status_name', item.status.name)
                                      .replace('@item_id', item.iD)
                                      .replace('@item_id', item.iD)

                                      .replace('@cofirmers', state);


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

 /* <div id="list_template" style="display: none;">
        <div class="mb-3 p-2 py-3 text-muted ps-5 ">
            <h5>@item_name</h5>
            <p class="fw-light">
                <span class="fw-normal text-black">Account No:</span> @account_no_name
                &nbsp;|&nbsp; <span class="fw-normal text-black">Identity / Birth Number:</span> @id_no_name
                &nbsp;|&nbsp; <span class="fw-normal text-black">Phone:</span> @phone_name
                &nbsp;|&nbsp; <span class="fw-normal text-black">Role:</span> @institution_role_name

            </p>
            <a class="btn btn-sm  table-button" href="<?= $siteConfig->siteUrl; ?>/view-<?= $table ?>/@item_id">
                <span>View Details</span>
            </a>

        </div>
        <hr>
    </div>
    */