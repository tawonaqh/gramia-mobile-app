function init(data) {


    console.log('init c')
    console.log('res: ' + JSON.stringify(data))

    $('[name=invoice]').val(data.data.iD)

    //  \"period\":\"1st term 2025\",\"invoiceCategory\":\"Other\",\"name\":\"000000012\",\"description\":\"FUNDRAISING FOR SCHOOL BUS\",\"amount\":2,\"balance\":2
    if (data.type == "1") {
        var inv = JSON.parse(data.data);

        $('.invoice').removeClass('d-none');
        $('#balance').html(inv.balance)
        $('#name').html(inv.name)
        $('#category').html(inv.invoiceCategory)
        $('#period').html(inv.period)
        $('#description').html(inv.invoiceCategory)

        if (inv.balance > 0) { 
            $('#_form').removeClass('d-none');
            $('[name=amount').val(inv.balance)
            $('[name=invoice').val(inv.iD)
            $('[name=institution_user').val(inv.institution_user_id)
        }
        

    } else { $('#_form').addClass('d-none') }
    // $('[name=institution_user], [name=institution_class]').on('change', function () {
    // _form    select_change($(this).val());

    // });
}

$('#btn_submit_item').on('click', function () {
    overlay('start');

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&institution=" + current.institutioniD + "&user=" + user.iD + "&api=true";

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/create-invoicepayment";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Update Again");

            //showAlert(rString) //get_pagination();
            if (result.status == 1) {

               
                showAlert(result.message);
                goBackView()


                //	document.location.reload();
            } else { _btn.html("Try again"); msg.html(create_message("danger", result.message)); }
        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
           

        },
        error: function (error, status, xhr) {
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
            msg.html(create_message("Error loading data " + JSON.stringify(error) + " xhr: " + xhr));
        }
    });

})