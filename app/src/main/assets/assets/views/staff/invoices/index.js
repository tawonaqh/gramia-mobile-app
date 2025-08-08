function init(data) {
    current_page = 1;
    console.log('init: ')

    if (!current) return showAlert("No current account found");
    if (navigator.onLine) { loadData(true); } else { loadData(); }

}
function loadData(forceRefresh = false) {
    if (localStorage.getItem("notices") && !forceRefresh) {
        data = JSON.parse(localStorage.getItem("notices"));
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


    
    const _transactionType = $('#transactionType').val();
    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();
    // Set default or capture from a pagination control
    var uri = site + "/get-usertransaction-records";
    console.log('uri:  ' + uri + "; ob: " + ob)
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
            transactionType: _transactionType,
            api: true,

        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem("notices", response);

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
        currentView = 'list';
        const $container = $('<div class="d-flex flex-column gap-3 px-2"></div>');

        records.forEach((item) => {
            const isInvoice = item.transactionType?.toLowerCase() === 'invoice';
            const isReceipt = item.transactionType?.toLowerCase() === 'receipt';
        
            const amountClass = isInvoice ? 'text-success' : 'text-primary';
            let amountValue = '';
            let balanceStatus = '';
            let invoicename = item.name
            if (item.type == "1" && isInvoice) {
                const inv = JSON.parse(item.data || '{}');
                const balance = Number(inv.balance);
                const invoiceAmount = Number(item.dr_amount);
                dt = JSON.parse(item.data)
                 invoicename = item.name + ' | <span class="text-dark">' + dt.invoiceCategory + "</span>"
        
                if (balance > 0 && balance !== invoiceAmount) {
                    amountValue = `$${invoiceAmount.toFixed(2)}`;
                    balanceStatus = `<span class="text-warning fw-semibold">Balance: $${balance.toFixed(2)}</span>`;
                } else if (balance === 0) {
                    amountValue = `$${invoiceAmount.toFixed(2)}`;
                    balanceStatus = `<span class="text-success fw-semibold">Paid</span>`;
                } else {
                    amountValue = `$${invoiceAmount.toFixed(2)}`;
                    balanceStatus = `<span class="text-danger fw-semibold">Unpaid</span>`;
                }
            } else {
                amountValue = `$${(item.cr_amount || 0).toFixed(2)}`;
                balanceStatus = '';
            }
            
        
            const card = $(`
                <div class="bg-light rounded-4 p-3 fade-in">
                    <a href="#" onclick="navigateTo('view-invoice', getRecord(${item.iD}))">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <div class="fw-semibold text-dark">${item.institution_user}</div>
                            <small class="text-muted">${item.reg_date}</small>
                        </div>
                        <div class="text-dark small mb-2">${invoicename} </div>
        
                        <div class="d-flex justify-content-between align-items-center">
                            <h3 class="mb-0 fw-semibold text-green">${amountValue}</h3>
                            ${balanceStatus}
                        </div>
                    </a>
                </div>
            `);
        
            $container.append(card);
        });

        $('#results').append($container);
        renderPaginationDropdown(pagination);
    } else {
        $('#results').html('<div class="text-center text-muted py-5">No records found.</div>');
    }
}
function _displayResults(records, pagination) {

    let table = '<table class="table table-borderless table-hover "><thead class="bg-dark fw-bolder text-primary text-capitalize thead"><tr><th></th><th>user</th><th>dr</th><th>cr</th><th></th></tr></thead><tbody></tbody></table>';
    $('#results').html(table);
    let $tbody = $('#results table tbody');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
        currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {
                const state = '';

                const html = `
                  <tr>

                    <td>${item.reg_date}</td>
                    <td>${item.institution_user}<span class="small d-block">${item.transactionType}</span></td>
                  
                    <td>${item.dr_amount}</td>
                    <td>${item.cr_amount}</td>

                    <td>
                        <a class="btn btn-sm  table-button" href="#"  onclick="navigateTo('view-invoice', getRecord(${item.iD}))">
                            <span>View</span>
                        </a>

                    </td>
                </tr>

                `;
                //console.log('html: ' + html)
                const $template = $(html).addClass('fade-in');

                setTimeout(() => {
                    $tbody.append($template);
                    requestAnimationFrame(() => {
                        $template.addClass('show');
                    });
                }, 200);
            });
        }

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}

