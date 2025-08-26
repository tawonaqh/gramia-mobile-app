function init(){

//get_user_balance()
}
$('#loginForm').submit(function (e) {
    e.preventDefault();
    const name = $('#loginUsername').val().trim();
    var msg =  $("#msg"), _btn = $("#btn_login")

    if (name) {
        uri = server_url + '/api-reset-account'
        var _form = $('#loginForm').serialize();
        $("#msg").html("");  _btn.attr("disabled", "true"); _btn.html("Processing...");

                            console.log('uri:', uri);


        // Make a POST request to the API endpoint
        $.ajax({
            url: uri,
            method: 'POST',
            dataType: 'json',
            data: _form,
            success: function (response) {
                            console.log('ata:', response);

                // showAlert(response)
                  console.log(JSON.stringify(response));
                var rString = JSON.stringify(response);
                _btn.removeAttr("disabled");
                //  showAlert(response.status) //get_pagination();
                var result = response;// $.parseJSON(response);
                if (result.status == '1') {
                    _btn.html(result.status);

                    localStorage.setItem("user", JSON.stringify(response));
                    user = $.parseJSON(localStorage.getItem("user"));
                  // alert_msg(msg, "success", result.message);
                    msg.html(create_message("success", result.message));

                   //  showAlert("Login successful!" );
                  //   setTimeout(() => loadView('dashboard/dashboard'), 800);

                    //	document.location.reload();
                } else {
                    // showAlert("rsp: " + response.error_msg)

                    _btn.html("Try again");
                    msg.html(create_message("danger", result.message));
                }
            },
            error: function (xhr, status, error) {
                console.log('LocationWorker: Error fetching data:', xhr.responseText);
                _btn.removeAttr("disabled");
                _btn.html("Try again");
               msg.html(create_message("danger", 'Error fetching data: ' + error));

              //  alert_msg(msg, "danger", 'Error fetching data: ' + error)
                console.log('LocationWorker: Error fetching :', error);
            }
        });

    } else {
        var message = ""
        if (!name) {
            message = "Username is required; <br>"
        }


        msg.html(create_message("danger", message));

       // showAlert("Both fields are required.", "Login Error");
    }
});