// Key for localStorage to store invoice data
key = 'invoices_' + current.iD

/**
 * Initializes the application.
 * @param {object} data - Initial data, if any.
 */
function init(data) {
    current_page = 1;
    if (navigator.onLine) {
        loadData(true);
    } else {
        loadData();
    }
}

/**
 * Loads student transaction records from the server or local storage.
 * @param {boolean} forceRefresh - Forces data to be reloaded from the server, ignoring local storage.
 */
function loadData(forceRefresh = false) {
    // Try to load data from localStorage if available and not forcing a refresh
    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        displayResults(data.records, data.pagination);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    // Show an alert if there is no internet connection
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }

    $('#results').html('No invoices available');

    // Get filter and pagination values
    var n_institution = current.institutioniD;
    var n_institution_role = '';
    var n_user = user.iD;
    var n_institution_user = current.iD;
    const search = $('input[name="search"]').val();
    const ps = $('#page_size').val() || '10';
    const ob = $('input[name="order_filter"]:checked').val();

    var uri = site + "/get-student-transaction-records";
    console.log('uri:  ' + uri + "; pr: " + n_institution)

    // Make an AJAX request to fetch data from the server
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: 'reg_date DESC',
            page_size: ps,
            institution: n_institution,
            user: n_user,
            institution_role: n_institution_role,
            institution_user: n_institution_user,
            period: '',
            api: '',
            invoiceCategory: ''
        },
        success: function(response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);
            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function() {
            // Show a custom alert on error
            showshowAlert('Error loading data');
        }
    });
}

/**
 * Finds a specific record from the current records stored in localStorage.
 * @param {string} invoiceId - The ID of the invoice to find.
 * @returns {object|undefined} The invoice record, or undefined if not found.
 */
function getRecord(invoiceId) {
    const records = JSON.parse(localStorage.getItem("current_record"));
    return records.find(record => record.iD == invoiceId);
}

/**
 * Opens a payment offcanvas for a specific invoice and populates the form.
 * @param {string} invoiceId - The ID of the invoice to pay.
 */
function makePayment(invoiceId) {
    const invoice = getRecord(invoiceId);
    if (!invoice) {
        showAlert('Invoice details not found.');
        return;
    }

    // Check if the balance is greater than 0 before showing payment modal
    const balance = parseFloat(invoice.balance) || 0;
    if (balance <= 0) {
        showAlert('This invoice has a zero balance and cannot be paid.');
        return;
    }

    // Populate the payment offcanvas with invoice details
    $('#paymentOffcanvasInvoiceName').text(invoice.name);
    $('#paymentOffcanvasInvoiceBalance').text(`$${balance.toFixed(2)}`);
    $('#paymentOffcanvasAmountInput').val(balance.toFixed(2)).attr('max', balance.toFixed(2));

    // Attach the invoice ID to the offcanvas's pay button
    $('#confirmPaymentBtn').attr('data-invoice-id', invoiceId);

    // Show the offcanvas
    const paymentOffcanvas = new bootstrap.Offcanvas(document.getElementById('paymentEditor'));
    paymentOffcanvas.show();
}


/**
 * Processes the payment after the user confirms in the offcanvas.
 * This function sends a request to the payment API.
 */
//function handlePaymentMethodChange() {
//    const method = document.getElementById("paymentMethod").value;
//
//    // Hide all method-specific fields first
//    document.getElementById("cardDetails").classList.add("d-none");
//    document.getElementById("phoneNumberField").classList.add("d-none");
//    document.getElementById("instructions").classList.add("d-none");
//
//    if (method === "PZW204") {
//        document.getElementById("cardDetails").classList.remove("d-none");
//    } else if (method === "PZW211" || method === "PZW212") {
//        document.getElementById("phoneNumberField").classList.remove("d-none");
//    } else if (method === "PZW215") {
//        document.getElementById("instructions").classList.remove("d-none");
//    }
//}

function processPayment() {
    const amount = $('#paymentOffcanvasAmountInput').val();
    //const method = $('#paymentMethod').val();
    const invoiceId = $('#confirmPaymentBtn').attr('data-invoice-id');

    if (!amount) {
        showAlert("Please enter amount.", 'Error');
        return;
    }

    let data = {
        transactionId: invoiceId,
        amount: parseFloat(amount),
        //method: method,
        user: user.iD, // your user object, make sure it exists globally
        api: true
    };

//    if (method === "PZW204") {
//        data.card_number = $('#cardNumber').val();
//        data.expiry = $('#cardExpiry').val();
//        data.cvv = $('#cardCvv').val();
//        if (!data.card_number || !data.expiry || !data.cvv) {
//            showAlert("Please fill all card details.");
//            return;
//        }
//    } else if (method === "PZW211" || method === "PZW212") {
//        data.mobile_number = $('#mobileNumber').val();
//        if (!data.mobile_number) {
//            showAlert("Please enter a mobile number.");
//            return;
//        }
//    }

    $.ajax({
        url: site + "/api/make-mobile-payment",
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        success: function(res) {
            if (res.status === 1) {
                localStorage.setItem('referenceNumber', res.referenceNumber);
                localStorage.setItem('pollUrl', res.pollUrl);
                localStorage.setItem('invoiceId', res.invoiceId);
                localStorage.setItem('amount', res.amount);

                if (res.redirectUrl) {
                    window.location.href = res.redirectUrl;
                } else {
                    showAlert('Payment successful: ' + res.message, 'Success');
                    const offcanvasEl = document.getElementById('paymentEditor');
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
                    if (offcanvas) offcanvas.hide();
                    loadData(true);
                }
            } else {
                showAlert('Payment failed: ' + res.message, 'Error');
            }
        },
        error: function(xhr) {
            console.error("Error response:", xhr.responseText);
            showAlert('Payment request error: ' + xhr.statusText, 'Error');
        }
    });
}

/**
 * Renders the transaction history records.
 * @param {array} records - The array of transaction records.
 * @param {object} pagination - Pagination details.
 */
function displayResults(records, pagination) {
    let html = '';
    if (records.length > 0) {
        html += `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="mb-0 fw-bold">History</h5>
            </div>
        `;

        records.forEach(item => {
            const date = item.date || item.record?.[0]?.reg_date?.split(' ')[0] || '-';
            const name = item.name?.trim() || '';
            const category = item.record?.[0]?.invoiceCategory || '';
            const type = item.transactionType || '';
            const amount = item.cr_amount || item.dr_amount || 0;
            const balance = item.balance || 0;
            const id = item.iD;

            // Determine the color based on transaction type
            const amountColor = (type === 'Receipt' || type === 'Credit') ? 'text-success' : 'text-danger';
            //const transactionSign = (type === 'Receipt' || type === 'Credit') ? '+' : '-';

            // Conditional rendering for the "Pay" button and balance
            const isInvoice = (type === 'Invoice');
            const balanceSection = isInvoice ?
                `<div class="text-muted fw-bold" style="font-size: 0.9rem;">Bal: $${balance}</div>` : '<div></div>';

            const payButton = isInvoice ?
                `<a href="#" onclick="makePayment(${id})" class="btn btn-success btn-sm">
                    <i class="fas fa-credit-card me-1"></i> Pay
                </a>` : '';

            const paymentLabel = isInvoice ?
                '' : `<div class="fw-semibold text-success" style="font-size: 0.9rem;">Payment</div>`;

            const downloadButton = `<a href="#" onclick="downloadPDF(${id})" class="btn btn-secondary btn-sm">
                <i class="fas fa-download me-1"></i> Download
            </a>`;

            html += `
                <div class="bg-light rounded p-2 mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-semibold text-success" style="font-size: 0.9rem;">${category}</div>
                            ${paymentLabel}
                            <div class="text-muted" style="font-size: 0.8rem;">${name}</div>
                            <small class="text-muted" style="font-size: 0.7rem;">${date}</small>
                        </div>
                        <div class="text-end">
                            <div class="fw-semibold ${amountColor}" style="font-size: 0.9rem;">$${amount}</div>
                            <small class="text-muted" style="font-size: 0.7rem;">${type}</small>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                        ${balanceSection}
                        <div class="d-flex gap-2">
                            ${downloadButton}
                            ${payButton}
                        </div>
                    </div>
                </div>
            `;
        });

        $('#results').html(html);
        renderPaginationDropdown(pagination);
    } else {
        $('#results').html('<div class="alert alert-info">No records found.</div>');
    }
}

/**
 * Downloads a PDF invoice for a given ID.
 * @param {string} id - The ID of the invoice to download.
 */
function downloadPDF(id) {
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    var uri = site + "/api/download-invoice";
    $.ajax({
        url: uri,
        type: "POST",
        data: { id: id, api: true, user: user.iD },
        success: function (resp) {


            console.log("rss: " + (resp))
            console.log("rss: " + JSON.stringify(resp))
            const res = JSON.parse(resp);
            if (res.status == 1) {
                // Send data to Android app
                if (window.AndroidInterface && AndroidInterface.saveBase64PDF) {
                    AndroidInterface.saveBase64PDF(res.data, res.filename || 'Invoice.pdf');
                } else {
                    showAlert('Android interface not available.', 'Error');
                }
            } else {
                showAlert('Download failed.', 'Error');
            }
        },
        error: function (xhr, status, err) {
            showAlert('Error: ' + err, 'Error');
        }
    });
}

/**
 * Displays a loading overlay with a message.
 * @param {string} message - The message to display.
 */
function showLoadingOverlay(message) {
    $('#loadingOverlay').show();
    $('#loadingOverlay').find('span:last').text(message);
}

/**
 * Hides the loading overlay.
 */
function hideLoadingOverlay() {
    $('#loadingOverlay').hide();
}

/**
 * Shows a custom alert modal.
 * @param {string} message - The message to display in the alert.
 */
function showAlert(message) {
    $('#alertMessage').text(message);
    var alertModal = new bootstrap.Modal(document.getElementById('alertModal'));
    alertModal.show();
}