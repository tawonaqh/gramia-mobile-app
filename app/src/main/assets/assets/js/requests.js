function editProfile() {
    // Header
    if (!localStorage.getItem("user_account")) {
        return
    }
    console.log('ss: ' + localStorage.getItem("user_account"))
    res = JSON.parse(localStorage.getItem("user_account"));


    const profile = res.profile;
    console.log('pf: ' + profile.phone)

    const form = $("#editProfileForm")[0];
    form.reset();

    //   form.name.value = profile.name || "";
    //   form.phone.value = profile.phone || "";
    // form.email.value = profile.email || "";
    // form.address.value = profile.address || "";
    // form.gender.value = profile.genderiD || "";
    //  form.dateofbirth.value = profile.dateofbirth || "";

    new bootstrap.Offcanvas(document.getElementById('profileEditor')).show();

};

$('#pictureInput').on('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        $('#cropPreview').attr('src', e.target.result).show();

        if (cropper) {
            cropper.destroy();
        }

        cropper = new Cropper(document.getElementById('cropPreview'), {
            aspectRatio: 1, // Square crop
            viewMode: 1,
            autoCropArea: 1
        });
    };
    reader.readAsDataURL(file);
});
function findFieldByName(fieldsArray, searchTerm) {
    const lowerTerm = searchTerm.toLowerCase();
    return fieldsArray.find(field =>
        field.name && field.name.toLowerCase().includes(lowerTerm)
    );
}
function getProfileField(searchTerm, flush = false) {
    if (!account || !account.fields) return null;

    const fieldsArray = account.fields;
    const lowerTerm = searchTerm.toLowerCase();

    const match = fieldsArray.find(field =>
        field.name && field.name.toLowerCase().includes(lowerTerm)
    );

    return match ? match.value : null;
}
function _getProfileField(searchTerm, flush=false) {
    return new Promise((resolve, reject) => {
        if (localStorage.getItem("fields") && !flush) {
            const fieldsArray = JSON.parse(localStorage.getItem("fields")).fields;
            resolve(findFieldByName(fieldsArray, searchTerm)).value;
            return;
        }

        const uri = site + "/get-userprofile-record";
        const _form = {
            recordiD: current.profile,
            institution: current.institutioniD,
            user: user.iD,
            api: true,
        };

        $.ajax({
            url: uri,
            type: 'post', dataType: 'application/json', 
            data: _form,
            complete: function (data) {
                console.log('dkc: ' + (data.responseText) + " : ")

                let fields = JSON.parse(data.responseText).fields
                localStorage.setItem("fields", data.responseText);
                //const fields = res.fields;
              //  localStorage.setItem("fields", JSON.stringify(res));
                resolve(findFieldByName(fields, searchTerm)).value;
            },
            error: function (xhr, status, error) {
               // console.error("AJAX error:", error);
               // reject(error);
            }
        });
    });
}

function _getProfileField(searchTerm) {
    if (localStorage.getItem("fields")) {
        fieldsArray = JSON.parse(localStorage.getItem("fields")).fields
        return findFieldByName(fieldsArray, searchTerm)
    }

    var uri = site + "/get-userprofile-record";

    var _form = {
        recordiD: data.profile,
        institution: current.institutioniD,
        user: user.iD,
        api: true,

    }
    $.ajax({
        url: uri, type: 'post', dataType: 'application/json', data: _form,
        complete: function (data) {

            console.log('dkc: ' + (data.responseText) + " : ")
            // $('#view_profile_fields').html( data.responseText)
            let fields = JSON.parse(data.responseText).fields
            localStorage.setItem("fields", data.responseText);
          

            return findFieldByName(fieldsArray, searchTerm)

            //renderProfileForm(fields)

        }, error: function (xhr, status, error) {
            overlay('stop');
            console.log("AJAX error:", error);
            //   msg.html(create_message("danger", "Submission failed."));
        }
    });
    fieldsArray
    const lowerTerm = searchTerm.toLowerCase();
    return fieldsArray.find(field =>
        field.name && field.name.toLowerCase().includes(lowerTerm)
    );
}
function submit_profile_form() {
    const us = JSON.parse(localStorage.getItem("user_account"));
    const profile = us.profile;
    const itemID = profile.iD; // this is used as 'itemiD' in your backend
    console.log('stk: ' + itemID + ' gh: ' + 8)

    const form = $("#editProfileForm")[0];
    const formData = new FormData();
    formData.append("itemiD", itemID);
    formData.append("status", 1);
    formData.append("institution_user", profile.institution_user || "");

    if (cropper) {
        cropper.getCroppedCanvas({
            width: 500,
            height: 500
        }).toBlob((blob) => {
            formData.append("file", blob, "profile.jpg");

            // Submit via AJAX
            $.ajax({
                url: site + "/api/update-profile-picture",
                method: "POST",
                data: formData,
                contentType: false,
                processData: false,
                success: function (imgRes) {
                    const iRes = JSON.parse(imgRes);
                    if (iRes.status == 1) {
                        //$("#editProfileModal").modal("hide");
                    }
                    get_account(true);
                    showAlert(iRes.message);
                },
                error: () => showAlert("Error uploading profile picture", "Upload Error")
            });
        }, 'image/jpeg');
    } else {
        showAlert("Please select and crop an image.", "Missing Image");
    }
}
// Start the timer on first load
function _submit_profile_form() {

    const us = JSON.parse(localStorage.getItem("user_account"));
    const profile = us.profile;
    const itemID = profile.iD; // this is used as 'itemiD' in your backend
    console.log('stk: ' + itemID + ' gh: ' + 8)

    const form = $("#editProfileForm")[0]; // or .get(0)
    //  console.log('gd: ' + form.gender.value + ' gh: ' + 8)

    const formData = new FormData();

    // Append text fields for profile update
    formData.append("itemiD", itemID);
    formData.append("status", 1); // Assuming default 'active' status
    formData.append("institution_user", profile.institution_user || "");
    const file = form.picture.files[0];
    if (file) {
        const imageForm = new FormData();
        imageForm.append("file", file);
        imageForm.append("itemiD", itemID);
    }

    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    console.log('itr: ' + JSON.stringify(formData))
    $.ajax({
        url: site + "/api/update-profile-picture",
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function (imgRes) {
            console.log('goh: ' + imgRes)
            iRes = JSON.parse(imgRes)
            if (iRes.status == 1) {

                //$("#editProfileModal").modal("hide");

            }
            get_account(true);
            showAlert(iRes.message);


            //init()
        },
        error: () => showAlert("Error uploading profile picture", "Upload Error")
    });
    // First send profile text fields
   /* 
   $.ajax({
        url: site + "/api/update-student-profile", // your $table = 'studentprofile'
        method: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function (res) {
            console.log('jd: ' + JSON.stringify(res))
            res = JSON.parse(res)
            console.log('js: ' + res.status)

            if (res.status == 1) {
                get_account()
                // Now check if a file was selected
                const file = form.picture.files[0];
                if (file) {
                    const imageForm = new FormData();
                    imageForm.append("file", file);
                    imageForm.append("itemiD", itemID);

                    

                } else {
                    showAlert("" + res.message, "Success");
                    $("#editProfileModal").modal("hide");
                    //loadView("dashboard/student");
                    init()
                }

            } else {
                showAlert(res.message || "Update failed", "Error");
            }
        },
        error: function () {
            showAlert("Error saving profile", "Server Error");
        }
    });

*/    }