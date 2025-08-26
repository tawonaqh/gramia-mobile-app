function init() {

    nemo = new Captcha(); nemo.Shuffle();
    $("#not_robot_question").html(nemo.Equation())
}


function submit() {

    var lbtn = $('#submit_btn'), msg = $('#msg'), error = false, erromsg = "";
    if ((nemo.Eval() == $("#txt_not_robot_answer").val()) && ($("#txt_not_robot_answer").val() != "")) { }
    else { erromsg = "Invalid captcha question response, please try again "; error = true; }

    if ($('[name=name]').val().indexOf('http') != -1) { erromsg += "<br>Invalid name, http is a bad word to include in your name "; error = true; }
    if (!error) {
        //  $('[name=name]').val('hahaha')
        register(); //$("#form").submit();
    } else {
        msg.html(create_message("danger", erromsg)); lbtn.html("Try again");
    }

}

function register(source = 'internal') {
    //showAlert('data.toString()')
    var msg = $('#msg'), _btn = $("#submit_btn"), _form = $('#_form').serialize();
    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    console.log('_frm : ' + JSON.stringify(_form));
    $.ajax({
        url: server_url + '/api/create-account', type: 'post', dataType: 'json', data: _form,
        complete: function (data) {
            console.log('ata:', data);

            // showAlert(response)
            var rString = JSON.stringify(data);
            console.log(rString);

            _btn.removeAttr("disabled");
            response = JSON.parse(data.responseText)
            _btn.html(''); //showAlert(rString) //get_pagination(); var dk =  $.parseJSON(data.toString())
            if (response.status == 1) {
                localStorage.setItem('user', data.responseText);
                localStorage.setItem('newUser', data.responseText);
                user = $.parseJSON(localStorage.getItem("user"));

                //$('#registerModal').modal('hide')
                //  ps_msg(msg, "success", rString); _btn.html("... ");
                 //    showAlert( result.message)

                                       //  showAlert("Login successful!" );
                    setTimeout(() => navigateTo("dashboard"), 1000);
                    console.log('sy')

            } else {
                _btn.removeAttr("disabled"); _btn.html("Try again"); msg.html(create_message("danger", response.message));
            }
        }
    });

};

function Captcha() { this.num1; this.num2; this.operator; }

Captcha.prototype.Shuffle = function () {
    this.num1 = Math.floor((Math.random() * 9) + 1);
    this.num2 = Math.floor((Math.random() * 9) + 1);
    this.operator = Math.floor((Math.random() * 2) + 1);
    if ((this.num1 - this.num2) < 1) { this.Shuffle(); }
}

Captcha.prototype.Eval = function () {
    var result = "";
    switch (this.operator) {
        case 1: result = this.num1 + this.num2; break;
        case 2: result = this.num1 - this.num2; break;
    }
    return result;
}

Captcha.prototype.Equation = function () {
    switch (this.operator) {
        case 1: result = this.num1 + "+" + this.num2; break;
        case 2: result = this.num1 + "-" + this.num2; break;
    }
    return result + "=";
}
