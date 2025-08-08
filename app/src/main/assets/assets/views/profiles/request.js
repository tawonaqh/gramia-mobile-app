function init() {

    //get_user_balance()
}
$(document).ready(function () {
    table = 'api/create-accountrequest'
    get_institutions(); get_profiles(); get_applications()
    $('#create_item_form').find('[name=profile]').on('change', function () {
        var uri = site + "/api/get-user-profiles";


        var _value = $(this).val(); console.log('dy: ' + _value)
        if (_value != 0) {
            $('#view_profile_fields').html('') 
            var _form = {
                profile: _value
            }
            $.ajax({
                url: uri, type: 'post', dataType: 'application/json', data: _form,
                complete: function (data) {
                    console.log('dk: ' + JSON.stringify(data))
                    var response = JSON.parse(data.responseText).profile
                    console.log('nm: ' + response.name)

                    $('#full_name').val(response.name)
                    $('#id_number').val(response.id_no)
                    $('#phone').val(response.phone)

                }
            });
        } else {
            $('#full_name').val("")
            $('#id_number').val("")
            $('#phone').val("")
        }
    })
    $('#create_item_form').find('[name=institution]').on('change', function () {
        var uri = site + "/api/get-institution-class-list";


        var _value = $(this).val();
        console.log('dy: ' + _value)
        var _form = {
            column: 'institution',
            'institution': _value
        }
        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dk: ' + JSON.stringify(data))
                $('#create_item_form').find('[name=institution_class]').html('<option value="">Select Class</option>' + data.responseText)

            }
        });
        var uri = site + "/api/get-institution-period-list";

        var _form = {
            column: 'institution',
            value: _value
        }
        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dkc: ' + JSON.stringify(data) + " : " + _value)
                $('#create_item_form').find('[name=period]').html('<option value="">Select Period</option>' + data.responseText)

            }
        });
        if ($('[name=institution_role]').val() == 4) {
            var uri = site + "/get-profile-field-records";

            var _form = {
                institution: _value,
                value: _value,
                user: user.iD,
                api: true,
                page_size: 250, // Or capture from a page-size selector if available

            }
            $.ajax({
                url: uri, type: 'post', dataType: 'application/json', data: _form,
                complete: function (data) {

                    console.log('dkc: ' + (data.responseText) + " : " + _value)
                    // $('#view_profile_fields').html( data.responseText)
                    let fields = JSON.parse(data.responseText).records
                    renderProfileForm(fields)

                }
            });
        } else { $('#view_profile_fields').html('') }


    })

    $('#create_item_form').find('[name=institution_role], [name=profile]').on('change', function () {
        var _value = $(this).val();
        var inst = $('[name=institution]').val();

        if ($('[name=institution_role]').val() == 4 && $('[name=profile]').val() == 0) {
            var uri = site + "/get-profile-field-records";

            var _form = {
                institution: inst,
                value: _value,
                user: user.iD,
                api: true,
                page_size: 250, // Or capture from a page-size selector if available

            }
            $.ajax({
                url: uri, type: 'post', dataType: 'application/json', data: _form,
                complete: function (data) {

                    console.log('dkc: ' + (data.responseText) + " : " + _value)
                    // $('#view_profile_fields').html( data.responseText)
                    let fields = JSON.parse(data.responseText).records
                    renderProfileForm(fields)

                }
            });
            $('#view_profile').addClass('d-none')
        } else { $('#view_profile_fields').html('');  $('#view_profile').removeClass('d-none')  }
    });
    $('#create_item_form').find('[name=institution_class]').on('change', function () {
        var uri = site + "/api/get-class-description";

        // console.log('dy: ' )
        var _value = $(this).val()
        var _form = { class: _value }
        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dk: ' + JSON.stringify(data))
                var response = JSON.parse(data.responseText)
                $('#class_description').html(response.record)

            }
        });


    })
    $('#create_item_form').find('[name=user]').val(user.iD)
    //  $('#btn_create_item').on('click', function () { var _form = $('#create_item_form'); submit_form(_form) })

});
function renderProfileForm(fields, containerSelector = "#view_profile_fields") {
    const $form = $('<form class="p-3 bg-light rounded-3"></form>');

    fields.forEach(field => {
        const id = `field_${field.iD}`;
        const name = field.name;
        const type = parseInt(field.fieldType);
        const options = field.options?.split(';') || [];

        let $group = $(' <div class="p-3 px-4 border-bottom"></div>');

        switch (type) {
            case 1: // Text
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<input type="text" class="form-control dynamic-field border-0 px-0 bg-transparent mt-1" id="${id}" name="${id}" />`);
                break;

            case 2: // Select single
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                let $selectSingle = $(`<select class="form-select dynamic-field border-0 px-0 bg-transparent" id="${id}" name="${id}"></select>`);
                options.forEach(opt => {
                    $selectSingle.append(`<option value="${opt}">${opt}</option>`);
                });
                $group.append($selectSingle);
                break;

            case 3: // Select multiple
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                let $selectMultiple = $(`<select multiple class="form-select dynamic-field border-0 px-0 bg-transparent" id="${id}" name="${id}[]"></select>`);
                options.forEach(opt => {
                    $selectMultiple.append(`<option value="${opt}">${opt}</option>`);
                });
                $group.append($selectMultiple);
                break;

            case 4: // Date
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<input type="date" class="form-control dynamic-field border-0 px-0 bg-transparent mt-1" id="${id}" name="${id}" />`);
                break;

            case 5: // PDF upload
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<input type="file" class="form-control dynamic-field border-0 px-0 bg-transparent mt-1" accept=".pdf" id="${id}" name="${id}" />`);
                break;

            case 6: // Image upload
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<input type="file" class="form-control dynamic-field border-0 px-0 bg-transparent mt-1" accept="image/*" id="${id}" name="${id}" />`);
                break;

            case 7: // Info HTML
                $group = $(`<div class="my-3">${name}</div>`); // name contains HTML
                break;

            default:
                $group.append(` <div class="text-green fw-semibold">${name}</div>`);
                $group.append(`<input type="text" class="form-control dynamic-field border-0 px-0 bg-transparent mt-1" id="${id}" name="${id}" />`);
                break;
        }

        $form.append($group);
    });

    $(containerSelector).html($form);
}
function get_applications() {
    console.log("us: " + user.iD)
    $.ajax({
        url: server_url + "/api/get-user-applications", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            //alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            //localStorage.setItem("profiles", data.responseText.toString());


            $('#current_requests').html(data.responseText.toString())
        }
    });
}
function get_profiles() {
    console.log("us: " + user.iD)
    $.ajax({
        url: server_url + "/api/get-user-profile-records", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            //alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("profiles", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            var inst = `<option value="0" selected>New Profile</option>`
            data.records.forEach((item, index) => {
                inst += `<option value="${item.iD}" >${item.name}</option>`
            })
            $('[name=profile]').html(inst)
        }
    });
}
$('#btn_create_item').on('click', function () {
    overlay('start');
    var msg = $('#form_result');
    var _btn = $(this);
    msg.html("");
    _btn.attr("disabled", true).html("Processing...");

    // Start with form serialization
    //  var formData = $('#create_item_form').serializeArray();
    var formData = new FormData(document.getElementById('create_item_form'));
    $('.dynamic-field').each(function () {
        const name = $(this).attr('name');
        if (this.type === 'file' && this.files.length > 0) {
            for (let i = 0; i < this.files.length; i++) {
                formData.append(name, this.files[i]);
            }
        } else {
            formData.append(name, $(this).val());
        }
    });

    // Optional: Log contents for debugging
    for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
    }

    $.ajax({
        url: site + "/api/create-accountrequest",
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        complete: function (data) {
            console.log("AJAX response:", JSON.stringify(data));

            overlay('stop');
            _btn.removeAttr("disabled").html("Insert another");

            try {
                console.log("AJAX response:", data.responseText);

                var result = JSON.parse(data.responseText);
                if (result.status == 1) {
                    msg.html(create_message("success", result.message));
                } else {
                    _btn.removeAttr("disabled").html("Try again");

                    msg.html(create_message("danger", result.message));
                }
            } catch (e) {
                msg.html(create_message("danger", "Invalid response from server."));
            }
        },
        error: function (xhr, status, error) {
            overlay('stop');
            console.log("AJAX error:", error);
            msg.html(create_message("danger", "Submission failed."));
        }
    });
});

function get_roles() {
    console.log("us: " + user.iD);
    // $('#results').html('loading...');


    $.ajax({
        url: server_url + "/api/get-roles", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            // alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("roles", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            var inst = `<option value="" >Select Role</option>`
            data.records.forEach((item, index) => {
                inst += `<option value="${item.iD}" >${item.name}</option>`
            })
            $('[name=role]').html(inst)
        }
    });
}
function get_institutions() {
    console.log("us: " + user.iD);
    // $('#results').html('loading...');


    $.ajax({
        url: server_url + "/api/get-institutions-records", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            // alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("institutions", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            var inst = `<option value="" >Select Institution</option>`
            data.records.forEach((item, index) => {
                inst += `<option value="${item.iD}" >${item.name}</option>`
            })
            $('[name=institution]').html(inst)
        }
    });
}
