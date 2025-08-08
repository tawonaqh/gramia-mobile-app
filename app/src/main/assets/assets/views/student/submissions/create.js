function init() {


    console.log('init c')


    const now = new Date();
    const future = new Date(now);
    future.setDate(now.getDate() + 5);

    $('[name="start"]').val(formatDateTimeLocal(now));
    $('[name="end"]').val(formatDateTimeLocal(future));

    // When the user selects a new start date
    $('[name="start"]').on('change', function () {
        const startDate = new Date($(this).val());
        if (isNaN(startDate.getTime())) return;

        const newEndDate = new Date(startDate);
        newEndDate.setDate(startDate.getDate() + 5);
        $('[name="end"]').val(formatDateTimeLocal(newEndDate));
    });

    // When the user selects an end date manually
    $('[name="end"]').on('change', function () {
        const startDate = new Date($('[name="start"]').val());
        const endDate = new Date($(this).val());

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

        if (endDate < startDate) {
            showAlert("Closing date cannot be before opening date. It will be set 2 days after the current date.");
            const fallbackDate = new Date();
            fallbackDate.setDate(startDate.getDate() + 2);
            $(this).val(formatDateTimeLocal(fallbackDate));
        }
    });

    get_classes()

}
function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function get_classes() {



    const uri = site + "/api/get-teacher-class-with-subjects";
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
        complete: function (response) {
            console.log('jgf:' + JSON.stringify(response));
        },
        success: function (response) {
            console.log('j:' + JSON.stringify(response));

            if (response && response.length > 0) {
                const select = $('[name=_class]');
                select.html('<option value="">Select Class</option>');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ';
                    const id = item.periodiD + "_" + item.classiD + "_" + item.iD
                    const option = `<option value="${id}" data-subjects="${item.subjects}">${text}</option>`;
                    select.append(option);
                });
                select.off('change').on('change', function () {
                    const selected = $(this).find('option:selected');
                    $('#class_lessons').html(selected.data('subjects') || '');
                });
                loadData()
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

$('#btn_submit_item').on('click', function () {
    overlay('start');
    current = JSON.parse(localStorage.getItem("current_account"));

    console.log('submitting...')
    const classValue = $('[name=_class]').val();
    const classParts = classValue.split('_');

    var msg = $('#form_result'), _btn = $(this),
    _form = $('#_form').serialize() + "&api=true&institution_user=" + current.iD
     + "&user=" + user.iD + "&institution=" + current.institutioniD + "&period=" + classParts[0] + "&institution_class=" + classParts[1];

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/create-activity";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

             if (result.status == 1) {
                msg.html(create_message("success", result.message));
                _btn.html("Add another");
             } else {
                _btn.html("Try again");
                msg.html(create_message("danger", result.message));
             }
            //alert(rString) //get_pagination();

        },
        success: function (response) {
            console.log('res: ' + response)


        },
        error: function (error, status, xhr) {
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
        }
    });

})
