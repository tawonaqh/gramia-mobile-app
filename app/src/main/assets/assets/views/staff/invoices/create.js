function init() {
    console.log('init c')

    console.log("current_account:", localStorage.getItem('current_account'));

    get_periods()
    get_class_lits()
    get_invoice_categories()

    // Combined change listener for user and period.
    $('[name=institution_user], [name=period]').on('change', function () {
        select_change();
    });

    // NEW EVENT LISTENER FOR INVOICE CATEGORY
    $('[name=invoiceCategory]').on('change', function() {
        if ($(this).val() == '8') {
            $('#other_category_container').removeClass('d-none');
            $('[name=other_invoice_category]').attr('required', true);
        } else {
            $('#other_category_container').addClass('d-none');
            $('[name=other_invoice_category]').removeAttr('required');
        }
    });
}
function get_class_lits(useCache = true) {

    const cacheKey = 'cached_class_list';

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const select = $('[name=institution_user]');
            select.html(`
                    <option value="all">All Users</option>
                    <option value="specific">Specific User</option>
                    ` + cached);



        }
    }


    const uri = site + "/api/get-institution-class-list";
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
        complete: function (response) {
            console.log('jgf:' + JSON.stringify(response));
        },
        success: function (data) {
            console.log('j:' + JSON.stringify(data));
            response = data
            localStorage.setItem(cacheKey, (response));

            if (response && response.length > 0) {
                const select = $('[name=institution_user]');
                select.html(`

                    <option value="all">All Users</option>
                    <option value="specific">Specific User</option>
                ` + response);


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
    var _class = $('[name=institution_user]').val();
    var _period = $('[name=period]').val();
    console.log('val: ' + val + '; cls: ' + _class );

    if (_class == 'all') {

    } else if (_class == 'specific') {
        $('.specific-user').removeClass('d-none')


    } else if (_class == '') {

    } else {
        $('.class-students').removeClass('d-none')
        $('.class-list').removeClass('d-none')
        var uri = site + "/get-i-class-student-list";

        var _value = current.institutioniD
        var _period = _period
        var _form = {
            column: 'class',
            value: _class,
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
function get_invoice_categories(useCache = true) {
    const cacheKey = 'cached_invoice_categorie';
    const uri = site + "/get-invoice-categories";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { $('[name=invoiceCategory]').html(cached) }
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
            console.log("items: " + response);
            $('[name=invoiceCategory]').html(response)
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
function get_periods(useCache = true) {
    const cacheKey = 'cached_institution_periods';
    const uri = site + "/get-institution-periods-list";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) { $('[name=period]').html(cached) }
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
            $('[name=period]').html( response)
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
function get_classes(useCache = true) {

    const cacheKey = 'cached_classees';

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {

            $('[name=institution_class]').html(cached);

           // return;
        }
    }

    const uri = site + "/api/get-institution-class-list";
    const _form = {
        user: user.iD,
        column: 'institution',
        value: current.institutioniD,
        institution_user: current.iD,
        institution: current.institutioniD
    };
    console.log('gh: ' + JSON.stringify(_form))

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,

        complete: function (response) {
            console.log('jgf:' + JSON.stringify(response));
        },
        success: function (response) {
            console.log('j:' + JSON.stringify(response));
            $('[name=institution_class]').html(response);
            localStorage.setItem(cacheKey, (response));

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
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize()  + "&institution=" + current.institutioniD + "&due_date=" + getTomorrowMidday()+ "&api=true&user=" + user.iD;

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/create-institution-invoice";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Update again");

            //showAlert(rString) //get_pagination();
            if (result.status == 1) {
                loadData()

                msg.html(create_message("success", result.message));

                //  document.location.reload();
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