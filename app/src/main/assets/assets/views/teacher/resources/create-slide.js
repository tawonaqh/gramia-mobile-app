function init(){


}

$('#fileInput').on('change', function (e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        $('#cropImage').attr('src', event.target.result);
        $('#cropContainer').show();

        // Destroy any previous cropper
        if (cropper) cropper.destroy();

        // Initialize new cropper
        cropper = new Cropper(document.getElementById('cropImage'), {
            aspectRatio: 1, // or your preferred aspect ratio
            viewMode: 1,
            autoCropArea: 1,
        });
    };
    reader.readAsDataURL(file);
});

$('#cropAndUploadBtn').on('click', function () {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({ width: 400, height: 400 }); // match size from web app
    const base64 = canvas.toDataURL('image/png'); // PNG recommended for quality

    $('#previewContainer').html(`<img src="${base64}" class="img-fluid mt-2 rounded shadow-sm" />`);

    // TODO: send base64 to server using AJAX
   uploadCroppedSlide(base64, $('#itemiD').val(), 'slide_' + Date.now());
});
function uploadCroppedSlide(base64, classResourceId, imageName) {
    $.ajax({
        url: site + '/create-classresourcefile', // adjust to your server endpoint
        type: 'POST',
        dataType: 'json',
        data: {
            imgData: base64,
            classResource: classResourceId,
            name: imageName,
            api: true,
            user: user.iD
        },
        success: function (response) {
            if (response.status === 1) {
              //  console.log('✅ Image uploaded:', response.filePath);
                $('#form_result').html(create_message('success', response.message));
                    $('#previewContainer').html('');
        $('#cropContainer').hide();
        $('#fileInput').val('');
        let st = getRecord(classResourceId);

        let updated = {
            ...st,
            reload: true
        };
        navigateTo('view-teacher-resource', updated )

                // Optionally display thumbnail or reload list
            } else {
                console.error('❌ Upload error:', response.message);
                                $('#form_result').html(create_message('danger', response.message));

            }
        },
        error: function (xhr) {
            console.error('❌ Server error:', xhr.responseText);
            $('#form_result').text("Server error during upload.");
            $('#form_result').html(create_message('warning', response.message));

        }
    });
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
            console.log('j:'+ JSON.stringify(response));

            if (response && response.length > 0) {
                const select = $('[name=institution_class]');
                select.html('');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ' ;
                    const id =  item.classiD
                    const option = `<option value="${id}" data-description="${text}">${text}</option>`;
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
  $('#btn_submit_item').on('click', function () {
    overlay('start');
     current = JSON.parse(localStorage.getItem("current_account"));

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize()+ "&api=true&institution_user=" + current.iD+ "&user=" + user.iD+ "&institution=" + current.institutioniD;

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri =  site + "/create-class-resource";
    console.log("uri: " + _form);
    $.ajax({
    url:uri, type: 'POST', dataType: 'application/json', data: _form,
    complete: function (data) {
   overlay('stop');


    _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
    var result = JSON.parse(data.responseText.toString());

    _btn.html("Update again");

    //showAlert(rString) //get_pagination();
    if (result.status == 1) {
    loadData()

    msg.html(create_message("success", result.message));

    //	document.location.reload();
    } else { _btn.html("Try again"); msg.html(create_message("danger", result.message)); }
    },
    success: function (response) {
    console.log('res: ' + response)
    const data = JSON.parse(response);

    },
    error: function (error, status, xhr) {
    console.log("Error loading data " + JSON.stringify(error)  + " xhr: " + xhr);
    }
    });

    })
