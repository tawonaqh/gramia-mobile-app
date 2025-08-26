function init(data) {


    console.log('init c')
    console.log('res: ' + JSON.stringify(data))

    console.log("current_account:", localStorage.getItem('current_account'));

    //get_periods()
 //  get_classes()
    get_notice_categories(data.category)
    $('[name=status]').val(data.status.id)

   // $('[name=institution_user], [name=institution_class]').on('change', function () {
   //     select_change($(this).val());

   // });
}
function get_notice_categories(categ, useCache = true) {
    const cacheKey = 'cached_notice_categories';
    const uri = site + "/get-notice-categories";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
         //   const response = JSON.parse(cached);
         $('[name=noticeCategory]').html(cached)
         $('[name=noticeCategory]').val(categ)

           // return;
        }
    }

    const _form = {
        api: true,
        user: user.iD,
        institution_user: current.iD,
        institution: current.institutioniD
    };

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        success: function (response) {
            localStorage.setItem(cacheKey, (response));
            $('[name=noticeCategory]').html(response)
            $('[name=noticeCategory]').val(categ)

        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
$('#btn_submit_item').on('click', function () {
    overlay('start');

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&institution=" + current.institutioniD + "&institution_user=" + current.iD + "&user=" + user.iD+ "&api=true";

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/update-notice";
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
            msg.html(create_message("Error loading data " + JSON.stringify(error) + " xhr: " + xhr));
        }
    });

})