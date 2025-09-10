function init() {


    console.log('init c')

    console.log("current_account:", localStorage.getItem('current_account'));

    //get_periods()
    //get_classes()
    get_notice_categories()
   // $('[name=institution_user], [name=institution_class]').on('change', function () {
   //     select_change($(this).val());

   // });
}
function get_periods(useCache = true) {

    const cacheKey = 'cached_periods';

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const response = JSON.parse(cached);
            const select = $('[name=institution_user]');
            select.html(`
                <option value="">Select User</option>
                <option value="all">All Users</option>
                <option value="specific">Specific User</option>
            `);

            response.forEach(function (item) {
                const text = item.name;
                const id = item.iD
                const option = `<option value="${id}" >Students from ${text}</option>`;
                select.append(option);
            });

            return;
        }
    }


    const uri = site + "/get-institution-periods";
    const _form = {
        api: true,
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
        success: function (data) {
            console.log('j:' + JSON.stringify(data));
            response = data.records
            localStorage.setItem(cacheKey, (response));

            if (response && response.length > 0) {
                const select = $('[name=institution_user]');
                select.html(`
                    <option value="">Select User</option>
                    <option value="all">All Users</option>
                    <option value="specific">Specific User</option>
                `);

                response.forEach(function (item) {
                    const text = item.name;
                    const id = item.iD
                    const option = `<option value="${id}" >Students from ${text}</option>`;
                    select.append(option);
                });

                loadData()
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
function get_class_periods(val) {
    $('.class-students').addClass('d-none')
    $('.specific-user').addClass('d-none')

    if (val == 'all') {

    } else if (val == 'specific') {
        $('.specific-user').removeClass('d-none')


    } else if (val == '') {

    } else {
        $('.class-students').removeClass('d-none')
        var uri = site + "/get-i-class-student-list";

        console.log('dy: ' + val)
        var _value = current.institutioniD
        var _period = val
        var _form = {
            column: 'class',
            value: val,
            api: true,
            user: user.iD,
            period: _period
        }          
          console.log('j:' + JSON.stringify(_form));

        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dkc: ' + JSON.stringify(data))
                $('[name=institution_class]').html(data.responseText)

            }
        });
    }
}
function select_change(val) {
    $('.class-students').addClass('d-none')
    $('.specific-user').addClass('d-none')
    var _class = $('[name=institution_class]').val();
    console.log('val: ' + val + '; cls: ' + _class );

    if (val == 'all') {

    } else if (val == 'specific') {
        $('.specific-user').removeClass('d-none')


    } else if (val == '') {

    } else {
        $('.class-students').removeClass('d-none')
        $('.class-list').removeClass('d-none')
        var uri = site + "/get-i-class-student-list";

        console.log('dy: ' + val)
        var _value = current.institutioniD
        var _period = val
        var _form = {
            column: 'class',
            value: _class,
            api: true,
            user: user.iD,
            period: val
        }
          console.log('j:' + JSON.stringify(_form));

        $.ajax({
            url: uri, type: 'post', dataType: 'application/json', data: _form,
            complete: function (data) {
                console.log('dkc: ' + JSON.stringify(data))
                $('[name=class_student]').html(data.responseText)

            }
        });
    }
}
function get_notice_categories(useCache = true) {
    const cacheKey = 'cached_notice_categories';
    const uri = site + "/get-notice-categories";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
         //   const response = JSON.parse(cached);
            $('[name=noticeCategory]').html(data.responseText)

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

        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

// A more robust get_classes() function
function get_classes() {
    const uri = site + "/api/get-institution-class-list";
    const _form = {
        user: user.iD,
        column: 'institution',
        value: current.institutioniD,
        institution_user: current.iD,
        institution: current.institutioniD
    };

    console.log("AJAX request started for classes...");

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        // The 'complete' callback runs when the request is done, regardless of success or failure.
        complete: function (data) {
            console.log('AJAX request completed:', data);

            // Check for a successful HTTP status code
            if (data.status === 200) {
                console.log('AJAX successful. Populating dropdown...');

                // Set the HTML of the dropdown directly
                $('[name="institution_class[]"]').html(data.responseText);
            } else {
                console.error('Failed to fetch class list. Status:', data.status);
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
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&institution=" + current.institutioniD + "&institution_user=" + current.iD + "&user=" + user.iD+ "&api=true";

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/add-notice";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Add Another");

            //showAlert(rString) //get_pagination();
            if (result.status == 1) {
                loadData()

                msg.html(create_message("success", result.message));

                $('#_form')[0].reset();
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