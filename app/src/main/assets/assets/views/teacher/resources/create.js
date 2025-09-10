function init() {
    const today = new Date().toISOString().split('T')[0];
    $('#dayLong').val(today);
    get_classes()

}

function get_classes() {



    const uri = site + "/api/get-teacher-classes";
    const _form = {
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
        success: function (response) {
            console.log('jj:' + JSON.stringify(response));
    classData = response; // save for later

            if (response && response.length > 0) {
                const select = $('[name=institution_class]');
                select.html('<option value="">Select Class</option>');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ';
                    const id = item.classiD
                    const option = `<option value="${id}" data-description="${text}">${text}</option>`;
                    select.append(option);
                });
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
$('[name=institution_class]').on('change', function () {
    const selectedId = $(this).val();
    const selectedClass = classData.find(c => c.classiD == selectedId);
    console.log('jc:' + JSON.stringify(classData) + ' lc:' + selectedId);

    if (selectedClass) {
        const subjectSelect = $('#subject');
        subjectSelect.html('<option value="">Select Subject</option>');

        let subjectArray = [];
        try {
            subjectArray = JSON.parse(selectedClass.subjectArray);
        } catch (e) {
            console.error("Invalid subjectArray", e);
        }

        subjectArray.forEach(subj => {
            subjectSelect.append(`<option value="${subj.iD}">${subj.name}</option>`);
        });
    }
});
$('#btn_submit_item').on('click', function () {
    overlay('start');
    current = JSON.parse(localStorage.getItem("current_account"));

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&api=true&institution_user=" + current.iD + "&user=" + user.iD + "&institution=" + current.institutioniD;

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/create-class-resource";
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
                loadData(result.id)
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
        }
    });

})
function loadData(id) {


   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;
    const _class = $('[name=institution_class]').val();



     const search = '';
        const ps =  '10';
        const ob =  'reg_date DESC';

    // Set default or capture from a pagination control
    var uri = site + "/get-class-resource-records";
    console.log('uri:  ' + uri + "; pr: " + n_institution)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps, // Or capture from a page-size selector if available
            institution: n_institution,
            user: n_user,
            api: true,
            institution_role: n_institution_role,
            institution_user: n_institution_user,
             institution_class: _class

        },
        success: function (response) {
           console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
               navigateTo('add-teacher-resource-slide', {iD: id})

        },
        error: function () {
            showAlert('Error loading data');
        }
    });
}
