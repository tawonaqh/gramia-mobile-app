function init(){

//get_user_balance()
}
$(document).ready(function () {
table = 'api/create-accountrequest'
get_institutions(); get_profiles(); get_applications()
 $('#create_item_form').find('[name=profile]').on('change', function () {
        var uri = site + "/api/get-user-profiles";


        var _value = $(this).val() ;   console.log('dy: ' + _value)
        if(_value!=0){
            var _form = {
                profile: _value
            }
            $.ajax({
                url: uri, type: 'post', dataType: 'application/json', data: _form,
                complete: function (data) {
                    console.log('dk: ' + JSON.stringify(data))
                    var response = JSON.parse( data.responseText)
                    $('#create_item_form').find('[name=full_name]').val(response.name)
                    $('#create_item_form').find('[name=id_number]').val(response.id_no)
                    $('#create_item_form').find('[name=phone]').val(response.phone)

                }
            });
        }else{
            $('#create_item_form').find('[name=full_name]').val("")
            $('#create_item_form').find('[name=id_number]').val("")
            $('#create_item_form').find('[name=phone]').val("")
        }
    })
    $('#create_item_form').find('[name=institution]').on('change', function () {
        var uri = site + "/api/get-institution-class-list";


        var _value = $(this).val() ;
         console.log('dy: ' + _value )
        var _form = {
            column: 'institution',
            value: _value
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


    })
    $('#create_item_form').find('[name=institution_class]').on('change', function () {
        var uri = site + "/api/get-class-description";

        // console.log('dy: ' )
        var _value = $(this).val()
        var _form = { class: _value}
        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dk: ' + JSON.stringify(data))
                var response = JSON.parse( data.responseText)
                $('#class_description').html( response.record)

            }
        });


    })
    $('#create_item_form').find('[name=user]').val(user.iD)
    $('#btn_create_item').on('click', function () { var _form = $('#create_item_form'); submit_form(_form) })

});

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


            $('#current_requests').html(data.responseText.toString())
        }
    });
}
function get_profiles() {
    console.log("us: " + user.iD)
    $.ajax({
        url: server_url + "/api/get-user-profile-records", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("profiles", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            var inst = `<option value="" >Select profiles</option>`
             inst += `<option value="0" >New Profile</option>`
            data.records.forEach((item, index) => {
               inst += `<option value="${item.iD}" >${item.name}</option>`
            })
            $('[name=profile]').html(inst)
        }
    });
}

function get_roles() {
    console.log("us: " + user.iD);
   // $('#results').html('loading...');


    $.ajax({
        url: server_url + "/api/get-roles", type: 'POST', dataType: 'application/json', data: { user: user.iD },

        error: function () {
            alert('Error loading data');
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
            alert('Error loading data');
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
