// Consolidated and improved dashboard initialization
// dashboard/init.js
function init() {
    console.log("user:", localStorage.getItem('user'));
    console.log("current_account:", localStorage.getItem('current_account'));
    console.log("user_account:", localStorage.getItem('user_account'));

   // $('#user_name').text(user.name || "Guest");

    const currentAccountRaw = localStorage.getItem('current_account');
    const accountsRaw = localStorage.getItem('user_accounts');

    if (!currentAccountRaw || !accountsRaw) return navigateTo('select-profile');
    $('.dashlinks').hide();
    current = JSON.parse(currentAccountRaw);
    accounts = JSON.parse(accountsRaw);
    account = JSON.parse(localStorage.getItem('user_account'));

    updateUserDetails();
    handleRoleSpecificUI();
    get_account();
    setupNotifications();
}

$(document).ready(function () {
    // Check for stored reference number, poll URL, invoice ID, and amount
    const referenceNumber = localStorage.getItem('referenceNumber');
    const pollUrl = localStorage.getItem('pollUrl');
    const invoiceId = localStorage.getItem('invoiceId');
    const amount = localStorage.getItem('amount');

    if (referenceNumber && pollUrl && invoiceId && amount) {
        // Show notification with payment details
        //toastr.info('Payment details stored:<br>Reference Number: ' + referenceNumber + '<br>Poll URL: ' + pollUrl);

        // Optionally, clear these values after showing the notification
        localStorage.removeItem('referenceNumber');
        localStorage.removeItem('pollUrl');
        localStorage.removeItem('invoiceId');
        localStorage.removeItem('amount');

        // Make an API call to validate the payment status
        $.ajax({
            url: site + "/api/validate-payment-status", // Adjust the URL to your backend endpoint
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                referenceNumber: referenceNumber,
                invoiceId: invoiceId,
                amount: parseFloat(amount), // Ensure amount is a number
                pollUrl: pollUrl
            }),
            dataType: 'json',
            success: function(response) {
                if (response.status === 1) {
                    toastr.success('Payment Status: ' + response.message);
                } else {
                    toastr.error('Payment failed: ' + response.message);
                }
            },
            error: function(xhr) {
                console.error("Error validating payment status:", xhr.responseText);
                toastr.error('Error validating payment status: ' + xhr.statusText);
            }
        });
    }
});

function get_account(forceRefresh = false) {
    const cached = localStorage.getItem("user_account");
    if (!forceRefresh && cached) {
        const data = JSON.parse(cached);
        displayResults(data);
    }
    if (!navigator.onLine) { return }

    $.ajax({
        url: server_url + "/api-get-institution-account",
        type: 'POST',
        dataType: 'application/json',
        data: { user: current.iD },
        error: () => console.error('Account fetch failed'),
        complete: function (resp) {
            localStorage.setItem("user_account", resp.responseText);
            account = JSON.parse(localStorage.getItem('user_account'));

            displayResults(account);
        }
    });
}

// dashboard/user.js
function updateUserDetails() {
    console.log('account.profile.name: ' + account.profile.name )
    $('#user_name').html(account.profile.name);
    $('#user_role').html(current.institution_role);
    $('#user_institution').text(current.institution || "");
    if (current.role == '4') {
        const nameField =  getProfileField("Student Name");
        const surnameField =  getProfileField("Student Surname");

        const fullName = `${nameField || ""} ${surnameField || ""}`;
        if(fullName.trim()!=""){ $("#user_name").text(fullName.trim()); }
        
    }

    const inst = accounts.institutions.find(i => i.iD === current.institutioniD);
    if (inst?.logo) $('#institution_logo').attr('src', inst.logo);
}

// dashboard/roles.js
function handleRoleSpecificUI() {

    const role = current.role;
    console.log('rl: ' + role)
    $('.dashlinks').hide();
    if (role == '1') $('.admin-links').show();
    else if (role == '2') $('.staff-links').show();
    else if (role == '3') $('.teacher-links').show();
    else if (role == '4') {
        $('#studentPhoto').css('border-radius', '15px');
        $('#profilewrapper').css('border', 'none').addClass('shadow-sm');
        $('.student-links').show();
      //  get_classes();
        populateClassDropdown(account.classes)

    }
}


// dashboard/notifications.js
function setupNotifications() {
    get_account_notifications();

    if (typeof chatIntervalId !== 'undefined') clearInterval(chatIntervalId);

    clearInterval(notificationIntervalId);

    if (window.AndroidInterface?.startNotificationPolling) {
        AndroidInterface.startNotificationPolling(current.iD.toString(), user.iD);
    }

    notificationIntervalId = setInterval(get_account_notifications, 60000);
}


// dashboard/account.js



// dashboard/results.js
function displayResults(res) {
    $("#account_no").text(`# ${res.account_no}`);
    $("#studentName").text(current.user);
    $("#accountName").text(res.profile.name);
    $("#studentPhoto").attr("src", res.profile.picture);
    console.log('rsc: ' + res.profile.picture)


    if (current.role == '4') {
        $("#totalInvoices").text("$" + res.financial.invoices);
        $("#totalPayments").text("$" + res.financial.payments);
        $("#balance").text("$" + (res.financial.invoices - res.financial.payments));
       
    }


}

function populateClassDropdown(classes) {
    const select = $('[name=institution_class]');
    select.html('<option value="">Select Class</option>');

    classes.forEach(item => {
        const text = `${item.name} - ${item.period}`;
        select.append(`<option value="${item.iD}" data-description="${text}">${text}</option>`);
    });

    const selectedKey = getSelectedClassKey();
    let selectedId = localStorage.getItem(selectedKey);

    // If nothing is selected yet, set the first class as selected
    if (!selectedId && classes.length > 0) {
        selectedId = String(classes[0].iD);
        localStorage.setItem(selectedKey, selectedId);
    }

    // If still nothing selected, show canvas (empty list edge case)
    if (!selectedId) {
        bootstrap.Offcanvas.getOrCreateInstance('#selectClassCanvas').show();
    }

    // Update dropdown value
    select.val(selectedId).trigger('change');

    // Display selected class name in UI
    const selectedClass = classes.find(c => String(c.iD) === String(selectedId));
    if (selectedClass) {
        $('#current_class_name').html(`${selectedClass.name} - ${selectedClass.period}`);
    } else {
        $('#current_class_name').html('No class selected');
    }

    // Save new selection on change
    select.off('change').on('change', function () {
        const newVal = $(this).val();
        localStorage.setItem(selectedKey, newVal);
    });
}

function get_classes(forceRefresh = false) {
    const storageKey = getClassStorageKey();

    if (!forceRefresh) {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            const classList = JSON.parse(cached);
            console.log('Loaded classes from localStorage for user ' + current.iD);
            populateClassDropdown(classList);
            return;
        }
    }

    const uri = site + "/api/get-student-classes-b";
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
            console.log('j:' + JSON.stringify(response));

            if (response.records && response.records.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(response.records));
                populateClassDropdown(response.records);
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

function hasClass() {
    let selectedClass = getSelectedClass()
    console.log('frc: ' + JSON.stringify(selectedClass))
    if (!selectedClass) {
        bootstrap.Offcanvas.getOrCreateInstance('#selectClassCanvas').show();
        // return false
    } else {
        $('#current_class_name').html(selectedClass.institution_class + ' - ' + selectedClass.period)
    }
    //return true
}

function refresh_accounts() {
    get_accounts()
    get_applications()
}

function show_dashboard(user) {
    $('.dash-links').hide()
    $('.' + user).show()
}
function switch_view(view) {
    $('.view').hide()
    $('#' + view).show()
}

