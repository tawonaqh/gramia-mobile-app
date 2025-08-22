if (current != null) {
    key = 'profile_' + current.iD
} else { key = ''; }

function init(data) {
    current_page = 1;
    console.log('init: ' + localStorage.getItem("user_account"))

    current = JSON.parse(localStorage.getItem("current_account"));
    //if (!current) return showAlert("No student account found");
    if (localStorage.getItem("user_account") && localStorage.getItem('current_account')) {
        res = JSON.parse(localStorage.getItem("user_account"));

        console.log('hgs: ' + JSON.stringify(res))

        console.log('hg: ' + JSON.stringify(current))

        $("#user_institution").text(` ${res.institution} `);
        $("#user_role").text(`${current.institution_role} `);
        $("#account_no").text(`# ${res.account_no} `);
        $("#studentName").text(current.user || res.profile.institution_user || user.name);
        $("#accountName").text(res.profile.name);

        $("#user_period").text(getSelectedClass().period);
        $("#user_class").text(getSelectedClass().name);
        //  $("#user_gender").text(res.profile.gender);
        $("#user_dob").text('Dateof Birth: ' + res.profile.dateofbirth);
        $("#user_address").text(res.profile.address);
        $("#user_email").text('Email: ' + res.profile.email);
        $("#user_phone").text('Phone: ' + res.profile.phone);
        $("#studentPhoto").attr("src", res.profile.picture);
        if (current.role == '4') {
            //let stdnm = getProfileField('Student Name') + " " + getProfileField('Student Surname')
             $(".student-section").removeClass('d-none');
            const nameField = getProfileField("Student Name");
            const surnameField = getProfileField("Student Surname");

            const fullName = `${nameField || ""} ${surnameField || ""}`;
            //$("#studentName").text(fullName.trim());
            //$("#user_address").text(getProfileField("Home Address"));
            // displayProfile(current);
            renderGuardiansFromFields(account.fields);
            renderOtherFields(account.fields);
        } else {
            $(".student-section").addClass('d-none');

        }

    } else {
        $('.user-buttons').hide();
    }

    //if (navigator.onLine) { loadData(true); } else { loadData(); }

}
async function showStudentName() {
    try {
        const nameField = await getProfileField("Student Name", true);
        const surnameField = await getProfileField("Student Surname");

        const fullName = `${nameField?.value || ""} ${surnameField?.value || ""}`;
        $("#studentName").text(fullName.trim());
    } catch (error) {
        showAlert("Failed to load student name");
    }
}
function displayProfile(data) {
    commonVar = data
    console.log('dc: ' + JSON.stringify(data) + " : ")

    var uri = site + "/get-userprofile-record";

    var _form = {
        recordiD: data.profile,
        institution: current.institutioniD,
        user: user.iD,
        api: true,

    }
    $.ajax({
        url: uri, type: 'post', dataType: 'application/json', data: _form,
        complete: function (data) {

            console.log('dkc: ' + (data.responseText) + " : ")
            // $('#view_profile_fields').html( data.responseText)
            let fields = JSON.parse(data.responseText).fields
            localStorage.setItem("current_record", data.responseText);
            let stdnm = findFieldByName(fields, 'Student Name').value + " " + findFieldByName(fields, 'Student Surname').value
            $("#studentName").text(stdnm);


            //renderProfileForm(fields)

        }, error: function (xhr, status, error) {
            overlay('stop');
            console.log("AJAX error:", error);
            //   msg.html(create_message("danger", "Submission failed."));
        }
    });


}


function extractGuardianBlocks(fields) {
    const guardians = [];
    let _current = null;

    fields.forEach(field => {
        const name = field.name?.trim().toLowerCase();

        if (name.includes("primary guardian")) {
            if (_current) guardians.push(_current);
            _current = { type: "Primary", fields: {} };
        }

        if (name.includes("secondary guardian") || name.includes("next of keen") || name.includes("emergency contact")) {
            if (_current) guardians.push(_current);
            _current = { type: "Secondary", fields: {} };
        }

        // If there's no _current guardian block yet, skip field assignment
        if (!_current || !_current.fields) return;

        if (field.name?.includes("Full Name")) _current.fields.name = field.value;
        if (field.name?.includes("Last Name")) _current.fields.surname = field.value;
        if (field.name?.includes("Occupation")) _current.fields.occupation = field.value;
        if (field.name?.toLowerCase().includes("cell number")) _current.fields.phone = field.value;
        if (field.name?.includes("Relationship with Learner")) _current.fields.relation = field.value;
        if (field.name?.toLowerCase().includes("email")) _current.fields.email = field.value;
    });

    if (_current) guardians.push(_current);

    return guardians;
}
function renderOtherFields(fields) {
    const knownLabels = ["guardian", "keen", "contact", "full name", "occupation", "cell number", "relationship", "email", "last name", "residential address"];
    const otherFields = fields.filter(field =>
        field.name && !knownLabels.some(k => field.name.toLowerCase().includes(k)) && field.fieldType !== 7
    );

    const body = $("#other_fields_body");
    body.empty();

    otherFields.forEach(field => {
        const html = `
        <div class="bg-white rounded-4 border p-3 mb-2">
            <div class="fw-semibold text-teal mb-1">${field.name}</div>
            <div class="text-muted">${field.value || '<span class="text-danger">N/A</span>'}</div>
        </div>`;
        body.append(html);
    });

    // Toggle behavior
    $('#toggle_other_fields').off('click').on('click', function () {
        const visible = body.is(":visible");
        body.slideToggle(200);
        $("#other_fields_icon")
            .toggleClass("ph-caret-down", !visible)
            .toggleClass("ph-caret-up", visible);
    });
}
function renderGuardiansFromFields(fields) {
    const list = $("#guardian_list");
    list.empty();

    const guardians = extractGuardianBlocks(fields);

    guardians.forEach((g, index) => {
        const name = `${g.fields.name || ""} ${g.fields.surname || ""}`.trim();
        const role = `${capitalize(g.fields.relation || g.type)}${g.fields.occupation ? " (" + g.fields.occupation + ")" : ""}`;
        const phone = g.fields.phone || "N/A";
        const email = g.fields.email || "No email provided";

        const contactRow = `
            <div class="d-flex align-items-center bg-light px-2 py-1 rounded-3 mt-1 mb-1">
                <i class="ph ph-phone me-2 green-text"></i>
                <span class="me-3">${phone}</span>
            </div>
            <div class="d-flex align-items-center bg-light px-2 py-1 rounded-3">
                <i class="ph ph-envelope-simple me-2 green-text"></i>
                <span>${email}</span>
            </div>
        `;
        const imageURL = `https://randomuser.me/api/portraits/${index % 2 === 0 ? "women" : "men"}/${10 + index}.jpg`;
        const icon = `
        <div class="d-flex align-items-center justify-content-center rounded-circle border border-success bg-light" 
             style="width:45px; height:45px;">
            <i class="ph ph-user" style="font-size: 28px; color: #198754;"></i>
        </div>
    `;
        const card = `
        <div class="guardian-card mb-3 bg-white rounded-4 border">
           <div class="d-flex gap-3 align-items-start p-3"> <div>
                ${icon}            
            </div>
            <div class="flex-grow-1">
                <div class="fw-semibold fs-5 text-teal">${name}</div>
                <div class="text-muted small">${role}</div>
                
            </div>
            </div>
            <div class="d-flex align-items-center justify-content-center bg-light rounded-3 p-1 m-2">
                    ${contactRow}
                </div>
        </div>`;
        list.append(card);
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
function renderProfileForm(fields, containerSelector = "#results") {
    const $form = $('<div class="p-3 bg-light rounded-3"></div>');

    fields.forEach(field => {
        const id = `field_${field.iD}`;
        const name = field.name;
        const type = parseInt(field.fieldType);
        const value = field.value || "";
        const options = field.options?.split(';') || [];

        let $group = $('<div class="p-3 px-4 border-bottom"></div>');

        switch (type) {
            case 1: // Text
            case 4: // Date
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<div class="text-dark mt-1">${value}</div>`);
                break;

            case 2: // Select single
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<div class="text-dark mt-1">${value}</div>`);
                break;

            case 3: // Select multiple
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                const multi = value.split(';').join(', ');
                $group.append(`<div class="text-dark mt-1">${multi}</div>`);
                break;

            case 5: // PDF
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                if (value) {
                    $group.append(`<a  href="javascript:void(0);" onclick="openFileExternally('${site}/${value}')"  target="_blank" class="d-block text-decoration-underline mt-1"><i class="fa fa-file-pdf"></i> View PDF</a>`);
                } else {
                    $group.append(`<div class="text-muted mt-1">No file uploaded</div>`);
                }
                break;

            case 6: // Image
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                if (value) {
                    $group.append(`<img src="${site}/${value}" href="javascript:void(0);" onclick="openFileExternally('${site}/${value}')"  alt="${name}" class="img-thumbnail mt-2" style="max-height:120px;" />`);
                } else {
                    $group.append(`<div class="text-muted mt-1">No image uploaded</div>`);
                }
                break;

            case 7: // Info HTML
                $group = $(`<div class="my-3">${name}</div>`);
                break;

            default:
                $group.append(`<div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<div class="text-dark mt-1">${value}</div>`);
                break;
        }

        $form.append($group);
    });

    $(containerSelector).html($form);
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

function get_applications() {
    console.log("us: " + user.iD)
    $.ajax({
        url: server_url + "/api/get-user-applications", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            //localStorage.setItem("profiles", data.responseText.toString());

            if (data.responseText.indexOf('You have no pending applications') == -1) {
                $('#current_requests').html(data.responseText.toString())
            } else {
                $('#current_requests').html('')
            }

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
        current = account
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
                const data = JSON.parse(resp.responseText);
                navigateTo('dashboard')
            }
        });


    } else {
        //showAlert("Account ID not found: " + id, "Account Error");
        console.warn("Account ID not found:", id);
    }
}
