function init(){

//get_user_balance()
}
$('#loginForm').submit(function (e) {
    e.preventDefault();
    const name = $('#loginUsername').val().trim();
    const id = $('#loginPassword').val().trim();

    if (name && id) {
        uri = server_url + '/sign-in'
        var msg = 'msg', _btn = $("#btn_login"), _form = $('#loginForm').serialize();
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
                var rString = response.toString();
                _btn.removeAttr("disabled");
                //  showAlert(response.status) //get_pagination();
                var result = response;// $.parseJSON(response);
                if (result.status == '1') {
                    _btn.html(result.status);

                    localStorage.setItem("user", JSON.stringify(response));
                    user = $.parseJSON(localStorage.getItem("user"));
                     showAlert("Login successful!");
                     setTimeout(() => loadView('dashboard'), 800);

                    //	document.location.reload();
                } else {
                    // showAlert("rsp: " + response.error_msg)

                    _btn.html("Try again");
                    alert_msg(msg, "danger", result.message);
                }
            },
            error: function (xhr, status, error) {
                console.log('LocationWorker: Error fetching data:', xhr.responseText);
                _btn.removeAttr("disabled");
                _btn.html("Try again");
                alert_msg(msg, "danger", 'LocationWorker: Error fetching data: ' + error)
                console.log('LocationWorker: Error fetching :', error);
            }
        });

    } else {
        showAlert("Both fields are required.", "Login Error");
    }
});