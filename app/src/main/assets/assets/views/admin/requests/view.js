function init(data) {
    commonVar = data
    console.log('dc: ' + JSON.stringify(data) + " : " )

    if (data.institution_role_id == '4') {
            var uri = site + "/get-accountrequest-record";
    
            var _form = {
                recordiD: data.iD,
                user: user.iD,
                api: true,
    
            }
            $.ajax({
                url: uri, type: 'post', dataType: 'application/json', data: _form,
                complete: function (data) {
                 
                    console.log('dkc: ' + (data.responseText) + " : " )
                   // $('#view_profile_fields').html( data.responseText)
                   let fields = JSON.parse(data.responseText).fields
                   renderProfileForm(fields)
    
                }, error: function (xhr, status, error) {
                    overlay('stop');
                    console.log("AJAX error:", error);
                 //   msg.html(create_message("danger", "Submission failed."));
                }
            });

    } 
}

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
function confirm_request(record, status) {
    var state = 'approve';
    if(status=='3'){state="reject"; }
    var message = 'please confirm that you want to ' + state  + " " + record + ' this record.'

     show_confirm(message, function() {
      $('#results').html('loading...');
           // Set default or capture from a pagination control
        var uri = site + "/api/confirm-account-request";
       // console.log('uri:  ' + uri + "; pr: " + search)
        $.ajax({
            url: uri,
            type: "POST",
            data: {
                record: record,
                status: status,
                user: user.iD,
                api:true

            },
            success: function (response) {
               console.log('res: ' + response)

                const data = JSON.parse(response);
                 showAlert( data.message)
                loadData(true)
                navigateTo('requests')

            },
            error: function () {
                showAlert('Error loading data');
            }
        });

    }, yesButtonText = 'Yes')


}
