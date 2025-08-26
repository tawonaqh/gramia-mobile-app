function init() {
    console.log("user: " + localStorage.getItem('user'));
    console.log("current_account: " + localStorage.getItem('current_account'));
    $('#username').text(user.name || "Guest");

    if (localStorage.getItem('current_account')) {
        accounts = JSON.parse(localStorage.getItem("user_accounts"));
        account = JSON.parse(localStorage.getItem("current_account"));
        current = JSON.parse(localStorage.getItem("current_account"));
        $('#user_name').html(current.user);
        $('#user_role').html(current.institution_role);
        $('#user_institution').text(current.institution || "");
        const current_inst = accounts.institutions.find(inst => inst.iD === current.institutioniD);
        if (current_inst && current_inst.logo) {
            $('#institution_logo').attr('src', current_inst.logo);
        }

        accounts = JSON.parse(localStorage.getItem("user_accounts"));


        $('.dashlinks').hide()
         get_account();
        if (current.role == '1') { $('.admin-links').show() }
        else if (current.role == '2') { $('.staff-links').show() }
        else if (current.role == '3') { $('.teacher-links').show() }
        else if (current.role == '4') {
            $('#studentPhoto').css('border-radius','15px');
            $('#profilewrapper').css('border','none');
            $('#profilewrapper').addClass('shadow-sm');
            $('.student-links').show(); get_classes(); hasClass()
        }
        //localStorage.removeItem('pushed_notifications')
        get_account_notifications();
        if (typeof chatIntervalId !== 'undefined' && chatIntervalId) {
            clearInterval(chatIntervalId);
            chatIntervalId = null;
        }
        clearInterval(notificationIntervalId);
        if (window.AndroidInterface && AndroidInterface.startNotificationPolling) {
            AndroidInterface.startNotificationPolling(current.iD.toString(), user.iD);
        }
        //AndroidInterface.startBackgroundNotificationService(current.iD.toString());
        notificationIntervalId = setInterval(get_account_notifications, 60000);
        // set_account(account.iD)
        //return
        //if (navigator.onLine) {  get_account(true) }

    } else {
        navigateTo('profile')

    }


}
function get_account(forceRefresh = false) {
console.log(localStorage.getItem("user_account"))
    let acc = localStorage.getItem("user_account")
    if (!forceRefresh && acc) {
        data = JSON.parse(localStorage.getItem("user_account"));
        displayResults(data.records[0]);
        return;
    }

    $.ajax({
        url: server_url + "/api-get-institution-account", type: 'POST', dataType: 'application/json', data: { user: current.iD },

        error: function () {
            //  showAlert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("user_account", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            displayResults(data.records[0]);
        }
    });
}

function refresh_acconts() {
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
function populateClassDropdown(classes) {
    const select = $('[name=institution_class]');
    select.html('<option value="">Select Class</option>');

    classes.forEach(function (item) {
        const text = item.institution_class + ' - ' + item.period ;
        const option = `<option value="${item.iD}" data-description="${text}">${text}</option>`;
        select.append(option);
    });

    const selectedId = localStorage.getItem(getSelectedClassKey());
    if (selectedId) {
        select.val(selectedId).trigger('change');
    }else{
     //hasClass()
    }

    select.off('change').on('change', function () {
        const selected = $(this).find('option:selected');
        $('#class_description').text(selected.data('description') || '');
        localStorage.setItem(getSelectedClassKey(), $(this).val());
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

// Handle form submission
function displayResults(res) {
    // Header
    console.log('hgs: ' + JSON.stringify(res))
    console.log('hg: ' + JSON.stringify(current))

    $("#account_no").text(`# ${res.account_no} `);
    $("#studentName").text(current.user);
    $("#accountName").text(res.profile.name);
    $("#studentPhoto").attr("src", res.profile.picture);


    // Cards
    $("#totalInvoices").text("$" + res.financial.invoices);
    $("#totalPayments").text("$" + res.financial.payments);
    $("#balance").text("$" + (res.financial.invoices - res.financial.payments));

    // Profile table
    const profileRows = `
       <tr><th>Name</th><td>${res.profile.name}</td></tr>
       <tr><th>Gender</th><td>${res.profile.gender}</td></tr>
       <tr><th>DOB</th><td>${res.profile.dateofbirth}</td></tr>
       <tr><th>Address</th><td>${res.profile.address}</td></tr>
       <tr><th>Phone</th><td>${res.profile.phone}</td></tr>
       <tr><th>Email</th><td>${res.profile.email}</td></tr>
     `;
    $("#studentProfileText").html(profileRows);







};