
function init(data) {
    // currentResourceID = data.iD;
    console.log('rString: ' + JSON.stringify(data));
    console.log('id: ' + data.status.iD);
    $('[name=status]').val(data.status.iD)

    //loadResource(currentResourceID);
}


$('#btn_edit_item').on('click', function () {
    overlay('start');
    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#update_item_form').serialize() + "&institution_user=" + current.iD + "&user=" + user.iD;
    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/update-class-resource-b";
    console.log("uri: " + uri);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');

            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Update again");

            //showAlert(rString) //get_pagination();
            if (result.status == 1) {

                msg.html(create_message("success", result.message));
                //	document.location.reload();
            } else { _btn.html("Try again"); msg.html(create_message("danger", result.message)); }
        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);


        },
        error: function (error, status, xhr) {
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
        }
    });

})

