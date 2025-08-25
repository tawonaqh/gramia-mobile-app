function init(data) {
    commonVar = data;
     renderProfileData(data);
    $("#user_institution").text(` ${data.institution} `);
    $("#user_role").text(`${data.institution_role} `);
    $("#account_no").text(`# ${data.account_no} `);
    $("#studentName").text(data.profile.institution_user);
    $("#accountName").text(data.profile.institution_user);
    $("#user_gender").text(data.profile.gender);
    $("#user_dob").text('Dateof Birth: ' + data.profile.dateofbirth);
    $("#user_address").text(data.profile.address);
    $("#useremail").text(data.profile.email);
    $("#user_phone").text('Phone: ' + data.profile.phone);
    $("#id_no").text(data.id_no);
    $("#studentPhoto").attr("src", data.profile.picture);
    $('#edit_other_fields_btn').off('click').on('click', function () {
        $('#editFieldsModal').modal('show');
    });

    if (data.institution_role_id != '4') {
        $('.studentOptions').hide();
        // get_account(data)

    } else {
        var cnt = 0; $('.studentOptions').show();
        // var guardians = JSON.parse(data.guardians)
        var transactions = JSON.parse(data.transactions);
        var fields = (data.fields);

        // $("#guardians_count").text(guardians.length);
        renderGuardiansFromFields(fields);
        renderOtherFields(fields);
        renderTransactions(transactions);
        renderEditableProfileForm(fields);
    }
}

function renderProfileData(data) {
    // Populate simple profile data from the top level
    $("#studentName").text(data.user);
    $("#user_gender").text(data.institution_user);
    $("#user_role").text(data.institution_role);
    $("#account_no").text(`# ${data.account_no}`);
    $("#user_institution").text(data.institution);
    $("#studentPhoto").attr("src", data.profile.picture);

    // Populate data from the 'fields' array
    data.fields.forEach(field => {
        const name = field.name?.toLowerCase();
        const value = field.value;

        if (name && value) {
            if (name.includes("national id") || name.includes("birth certificate")) {
                $("#id_no").text(value);
            }
            if (name.includes("phone")) {
                $("#user_phone").text(`Phone: ${value}`);
            }
            if (name.includes("email address")) {
                $("#useremail").text(value);
            }
            if (name.includes("home address")) {
                $("#user_address").text(value);
            }
            if (name.includes("date of birth")) {
                $("#user_dob").text(`Date of Birth: ${value}`);
            }
        }
    });
}

function renderTransactions(records) {
    let message = '';

    if (records.length > 0) {
        let table = `
        <div class="table-responsive">
            <table class="table table-borderless align-middle mb-0">
                <thead class="text-white bg-dark rounded-top">
                    <tr>
                        <th class="text-capitalize">Details</th>
                        <th class="text-capitalize text-end">Dr</th>
                        <th class="text-capitalize text-end">Cr</th>
                        <th class="text-capitalize text-end">Balance</th>
                    </tr>
                </thead>
                <tbody>
        `;

        records.forEach((item) => {
            table += `
                <tr class="border-bottom">
                    <td class="text-dark fw-semibold small">
                        ${item.transactionType}<br>
                        <small class="text-muted">${item.reg_date}</small>
                    </td>
                    <td class="text-end text-danger fw-medium">${item.dr_amount || '-'}</td>
                    <td class="text-end text-success fw-medium">${item.cr_amount || '-'}</td>
                    <td class="text-end fw-bold text-primary">${item.balance}</td>
                </tr>
            `;
        });

        table += `
                </tbody>
            </table>
        </div>`;

        message = table;
    } else {
        message = '<div class="alert alert-warning">No transaction records</div>';
    }
    $("#transactions_body").html(message);

    $('#toggle_transactions').off('click').on('click', function () {
        const tbody = $("#transactions_body");
        const visible = tbody.is(":visible");
        tbody.slideToggle(200);
        $("#transactions_icon")
            .toggleClass("ph-caret-down", !visible)
            .toggleClass("ph-caret-up", visible);
    });
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
            <div class="d-flex align-items-center bg-light p-2 rounded-3 mt-2 mb-1">
                <i class="ph ph-phone me-2 text-success"></i>
                <span class="me-3">${phone}</span>
            </div>
            <div class="d-flex align-items-center bg-light p-2 rounded-3">
                <i class="ph ph-envelope-simple me-2 text-success"></i>
                <span>${email}</span>
            </div>
        `;
        const imageURL = `https://randomuser.me/api/portraits/${index % 2 === 0 ? "women" : "men"}/${10 + index}.jpg`;
        const icon = `
        <div class="d-flex align-items-center justify-content-center rounded-circle border border-success bg-light"
             style="width:60px; height:60px;">
            <i class="ph ph-user" style="font-size: 28px; color: #198754;"></i>
        </div>
    `;
        const card = `
        <div class="guardian-card  mb-3 bg-white rounded-4 border">
           <div class="d-flex gap-3 align-items-start p-3"> <div>
                ${icon}
            </div>
            <div class="flex-grow-1">
                <div class="fw-semibold fs-5 text-teal">${name}</div>
                <div class="text-muted small">${role}</div>

            </div>
            </div>
            <div class="d-flex align-items-center bg-light p-2 rounded-3 m-2">
                    ${contactRow}
                </div>
        </div>`;
        list.append(card);
    });

    $('#toggle_guardians').off('click').on('click', function () {
        const gbody = $("#guardians_body");
        // gbody.empty();
        const visible = gbody.is(":visible");
        gbody.slideToggle(200);
        $("#guardians_icon")
            .toggleClass("ph-caret-down", !visible)
            .toggleClass("ph-caret-up", visible);
    });
}

function renderOtherFields(fields) {
    const knownLabels = ["guardian", "keen", "contact", "full name", "occupation", "cell number", "relationship", "email", "last name", "residential address"];
    const otherFields = fields.filter(field =>
        field.name && !knownLabels.some(k => field.name.toLowerCase().includes(k)) && field.fieldType !== 7
    );

    const body = $("#other_fields_body");
    body.empty();

    otherFields.forEach(field => {
        let html = ``;
        if (field.type != 7) {
            html = `
        <div class="bg-white rounded-4 border p-3 mb-2">
            <div class="fw-semibold text-teal mb-1">${field.name}</div>
            <div class="text-muted">${field.value || '<span class="text-danger">N/A</span>'}</div>
        </div>`;
        } else {
            html = `
        <div class="bg-white rounded-4 border p-3 mb-2">
           ${field.name}
        </div>`;
        }
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

function get_account(data) {
    if (data.institution_role_id == '4') {
        var uri = site + "/get-accountrequest-record";

        var _form = {
            recordiD: data.iD,
            user: user.iD,
            api: true,

        };
        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {

                console.log('dkc: ' + (data.responseText) + " : ");
                // $('#view_profile_fields').html( data.responseText)
                let fields = JSON.parse(data.responseText).fields;
                renderProfileForm(fields);

            }, error: function (xhr, status, error) {
                overlay('stop');
                console.log("AJAX error:", error);
                //   msg.html(create_message("danger", "Submission failed."));
            }
        });
    }
}

function renderEditableProfileForm(fields, formSelector = "#edit_other_fields_form") {
    const $form = $('<div class="p-3  "></div>');

    fields.forEach(field => {
        console.log('fieldig:' + JSON.stringify(field));
        const id = `field_${field.iD}`;
        const name = field.name;
        const type = parseInt(field.type);
        const value = field.value || "";
        const options = field.options?.split(';') || [];

        let $group = $('<div class="border mb-3 pt-4 rounded-3 p-3"></div>');

        switch (type) {
            case 1: // Text
                $group.append(`<label for="${id}" class="text-green fw-semibold">${name}</label>`);
                $group.append(`<input type="text" class="form-control rounded-3 form-control-lg bg-transparent border-0 border-bottom mt-1" id="${id}" name="${field.iD}" value="${value}">`);
                break;

            case 2: // Select
                $group.append(`<label for="${id}" class="text-green fw-semibold">${name}</label>`);
                const $select = $(`<select class="form-select  rounded-3 form-select-lg bg-transparent  border-0 border-bottom mt-1" id="${id}" name="${field.iD}"></select>`);
                options.forEach(opt => {
                    const selected = (opt === value) ? "selected" : "";
                    $select.append(`<option ${selected}>${opt}</option>`);
                });
                $group.append($select);
                break;

            case 3: // Multi-select (for now: text input with comma-separated values)
                $group.append(`<label for="${id}" class="text-green fw-semibold">${name}</label>`);
                $group.append(`<input type="text" class="form-control  rounded-3 form-control-lg  border-0 border-bottom bg-transparent mt-1" id="${id}" name="${field.iD}" value="${value}">`);
                break;

            case 4: // Date
                $group.append(`<label for="${id}" class="text-green fw-semibold">${name}</label>`);
                $group.append(`<input type="date" class="form-control  rounded-3 form-control-lg border-0 border-bottom bg-transparent mt-1" id="${id}" name="${field.iD}" value="${value}">`);
                break;

            case 7: // Info only
                $group = $(`<div class="my-3">${name}</div>`);
                break;

            default:
                $group.append(`<label for="${id}" class="text-green fw-semibold">${name}</label>`);
                $group.append(`<input type="text" class="form-control form-control-lg  bg-transparent mt-1" id="${id}" name="${field.iD}" value="..${value}">`);
                break;
        }

        $form.append($group);
    });

    $(formSelector).html($form);
}

$('#edit_other_fields_form').off('submit').on('submit', function (e) {
    e.preventDefault();

    const formData = {};
    $(this).serializeArray().forEach(item => {
        if (item.value.trim() !== "") {
            formData[item.name] = item.value.trim();
        }
    });
    // console.log(localStorage.getItem('current_account') + " : " + current.profile)
    // formData['profile'] = current.profile;
    let _values = JSON.stringify(formData);
    console.log('vs: ' + _values);

    $.ajax({
        url: site + "/bulk-update-userprofilefield",
        type: "POST",
        data: {
            user: user.iD,
            profile: commonVar.profileiD,
            institution: current.institutioniD,
            api: true,
            values: _values
        },
        complete: function (data) {
            console.log('dk: ' + JSON.stringify(data));
        },
        success: function (res) {
            console.log('res: ' + res);

            const data = JSON.parse(res);
            if (data.status == 1) {
                showAlert("Fields updated successfully!", "Success");
                $('#editFieldsModal').modal('hide');
                loadData(true);
                get_account(true);
            } else {
                showAlert(data.message || "Update failed", "Error");
            }
        },
        error: function (xhr, status, error) {
            console.log("AJAX error:", error);
        }
    });
});

function renderProfileForm(fields, containerSelector = "#view_profile_fields") {
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

function show_transactions() {
    let records = JSON.parse(commonVar.transactions);
    let message = '';

    if (records.length > 0) {
        let table = `
        <div class="table-responsive">
            <table class="table table-borderless align-middle mb-0">
                <thead class="text-white bg-dark rounded-top">
                    <tr>
                        <th class="text-capitalize">Details</th>
                        <th class="text-capitalize text-end">Dr</th>
                        <th class="text-capitalize text-end">Cr</th>
                        <th class="text-capitalize text-end">Balance</th>
                    </tr>
                </thead>
                <tbody>
        `;

        records.forEach((item) => {
            table += `
                <tr class="border-bottom">
                    <td class="text-dark fw-semibold small">
                        ${item.transactionType}<br>
                        <small class="text-muted">${item.reg_date}</small>
                    </td>
                    <td class="text-end text-danger fw-medium">${item.dr_amount || '-'}</td>
                    <td class="text-end text-success fw-medium">${item.cr_amount || '-'}</td>
                    <td class="text-end fw-bold text-primary">${item.balance}</td>
                </tr>
            `;
        });

        table += `
                </tbody>
            </table>
        </div>`;

        message = table;
    } else {
        message = '<div class="alert alert-warning">No transaction records</div>';
    }

    show_offcanvas_message(message, 'success', 'Student Transactions');
}

function show_guardians() {
    let records = JSON.parse(commonVar.guardians);
    let message = '';
    if (records.length > 0) {
        records.forEach((item, index) => {
            message = `<a href="#" onclick="" class="text-decoration-none">
                <div class="card shadow-sm border-0 rounded-4 mb-3 px-3 py-3">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <div class="fw-semibold fs-6 text-dark">${item.name}</div>
                            <div class="small text-muted">${item.guardianType} (<span class="text-capitalize">${item.occupation}</span>)</div>
                        </div>
                    </div>
                    <div class="bg-light rounded-3 p-2 px-3">
                        <div class="d-flex align-items-center small text-muted">
                            <i class="fas fa-phone-alt me-2 text-success"></i>
                            <span class="text-dark">${item.phone}</span>
                        </div>
                        <div class="d-flex align-items-center small text-muted">
                            <i class="fas fa-at me-2 text-success"></i>
                            <span class="text-dark">${item.email}</span>
                        </div>
                    </div>
                </div>`;
        });
    } else {
        message = 'No guardian records';
    }

    show_offcanvas_message(message, 'success', 'student guardians');
}