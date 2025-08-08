if (current!=null) {
    key = 'profile_' + current.iD
} else { key = ''; }

function init(data) {
    current_page = 1;
    console.log('init: ' + localStorage.getItem("user_account"))

    //current = JSON.parse(localStorage.getItem("current_account"));
    // if (!current) return showAlert("No student account found");
    if (localStorage.getItem("user_account") && localStorage.getItem('current_account')) {
        res = JSON.parse(localStorage.getItem("user_account"));

        console.log('hgs: ' + JSON.stringify(res))

        console.log('hg: ' + JSON.stringify(current))

        $("#user_institution").text(` ${res.institution} `);
        $("#user_role").text(`${current.institution_role} `);
        $("#account_no").text(`# ${res.account_no} `);
        $("#studentName").text(current.user);
        $("#accountName").text(res.profile.name);
        $("#user_gender").text(res.profile.gender);
        $("#user_dob").text('Dateof Birth: ' + res.profile.dateofbirth);
        $("#user_address").text(res.profile.address);
        $("#user_email").text('Email: ' + res.profile.email);
        $("#user_phone").text('Phone: ' + res.profile.phone);
        $("#studentPhoto").attr("src", res.profile.picture);
        // displayProfile();

    }else{
        $('.user-buttons').hide();
    }

       if (navigator.onLine) {  loadData(true); }else{ loadData(); }

}
function loadData(forceRefresh = false) {
    console.log('hhg: ' + localStorage.getItem(key))
    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        displayAccountResults(data.records);
        // localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    console.log("us: " + user.iD);
    $('#results').html('loading...');

    $.ajax({
        url: server_url + "/api-get-institution-accounts", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            console.log('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rst: " + data.responseText.toString());
            localStorage.setItem("user_accounts", data.responseText.toString());
            localStorage.setItem(key, data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            displayAccountResults(data.records);
        }
    });
}


function displayAccountResults(records) {
    $('#results').html('...');

    if (records.length > 0) {
        let list = `<div class="d-flex flex-column gap-3">`;

        records.forEach(item => {
            list += `
                <a href="#" onclick="set_account('${item.iD}')" class="text-decoration-none">
                    <div class="p-3 bg-success text-white rounded-4 shadow-sm">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="w-100">
                                <div class="fw-bold text-white mb-1" style="font-size: 1rem;">${item.user}</div>

                                <div class="text-light small mb-1">
                                    <span class="fw-semibold">${item.institution}</span><br>
                                    <span class="text-dark">${item.institution_role} Account</span><br>
                                    <span class="text-dark">Account No:</span> <span class="text-white">${item.account_no}</span>
                                </div>

                                <div class="small text-dark mt-2">
                                    Added By: <span class="text-white fw-semibold">${item.added_by || 'System'}</span>
                                </div>
                            </div>

                            <div class="ms-2">
                                <i class="fas fa-chevron-right text-white small"></i>
                            </div>
                        </div>
                    </div>
                </a>`;
        });

        list += `</div>`;
        $('#results').html(list);
    } else {
        $('#results').html(`
            <div class="alert alert-warning text-center rounded-3 mt-3">
                You have no institution profile in this system yet.<br>
                Click on the Request Account button above to request a new institution account.
            </div>`);
    }
}
function set_account(id) {
    // Get the list of user accounts
    const accounts = JSON.parse(localStorage.getItem("user_accounts")) || [];
    console.log('lt: ' + accounts.records.length)
    // Find the account with the matching ID
    accounts.records.forEach((acc, index) => {
        console.log(`Checking account[${index}]:`, acc);
        console.log("acc.iD:", acc.iD, "| typeof:", typeof acc.iD);
        console.log("id:", id, "| typeof:", typeof id);
    });
    //const account = accounts.records.find(acc => acc.iD === id);
    const account = accounts.records.find(acc => String(acc.iD) === String(id));

    if (account) {
        // Store the full account object
        localStorage.setItem("current_account", JSON.stringify(account));
        console.log("Current account set:", account);
        current=account
        if (!navigator.onLine) {
            navigateTo('dashboard')
            return
        }
         $.ajax({
                url: server_url + "/api-get-institution-account",
                type: 'POST',
                dataType: 'application/json',
                data: { user: current.iD },
                error: () => console.error('Account fetch failed'),
                complete: function (resp) {
                    console.error('resp: ' + resp.responseText)
                    localStorage.setItem("user_account", resp.responseText);
                   // account = JSON.parse(resp.responseText);
                    navigateTo('dashboard')
                }
            });


    } else {
        //showAlert("Account ID not found: " + id, "Account Error");
        console.warn("Account ID not found:", id);
    }
}
