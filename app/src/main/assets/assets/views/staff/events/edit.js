function init(data) {


    console.log('init c')
    console.log('res: ' + JSON.stringify(data))
    const $start = $('[name="start"]');
    const $end = $('[name="end"]');
    console.log("current_account:", localStorage.getItem('current_account'));

    //get_periods()
 //  get_classes()
    get_event_categories(data.category)
    $('[name=status]').val(data.status.id)
    $start.on('change', function () {
        const startVal = new Date($(this).val());
        if (!isNaN(startVal.getTime())) {
            const newEnd = new Date(startVal.getTime() + 60 * 60 * 1000);
            $end.val(formatDateTimeLocal(newEnd));
        }
    });
   // $('[name=institution_user], [name=institution_class]').on('change', function () {
   //     select_change($(this).val());

   // });
}
function get_event_categories(categ, useCache = true) {
    const cacheKey = 'cached_event_categories';
    const uri = site + "/get-event-categories";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
         //   const response = JSON.parse(cached);
         $('[name=eventCategory]').html(cached)
         $('[name=eventCategory]').val(categ)

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
            $('[name=eventCategory]').html(response)
            $('[name=eventCategory]').val(categ)

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
    var uri = site + "/update-institution-event";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Update Again");

            //alert(rString) //get_pagination();
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