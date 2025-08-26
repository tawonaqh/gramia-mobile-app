function init() {
    console.log('gd: ' + localStorage.getItem("user_guardians"))

    current_page = 1;
    loadGuardianData()


}
function viewGuardian(id) {
    console.log('gd: ' + localStorage.getItem("user_guardians"))

    const guardians = JSON.parse(localStorage.getItem("user_guardians")).records;

    console.log('gdl: ' + guardians.length)
    const guardian = guardians.find(g => g.iD === id); // assume data is cached or re-request if needed

    if (!guardian) return showAlert("Guardian not found");

    $("#guardianId").val(guardian.iD);
    $("#guardianName").val(guardian.name);
    $("#guardianPhone").val(guardian.phone);
    $("#guardianEmail").val(guardian.email);
    $("#guardianOccupation").val(guardian.occupation);
    $("#type").val(guardian.guardianType);


    $("#guardianModal").modal("show");
}

$("#guardianForm").submit(function (e) {
    e.preventDefault();
    const formData = $(this).serialize();

    $.ajax({
        url: site + "/api/update-guardian",
        method: "POST",
        data: formData,
        dataType: "json", // ✅ auto-parses JSON response
        success: function (res) {
            console.log("Parsed JSON:", res);
  $("#guardianModal").modal("hide");
            if (res.status === 1) {
                showAlert(res.message, "Success");

                loadData(); // refresh list
            } else {
                showAlert(res.message || "Failed to update guardian", "Error");
            }
        },
        error: function (xhr) {
            console.error("Server error:", xhr.responseText);
            showAlert("Error updating guardian", "Server Error");
        }
    });
});
$("#addGuardianForm").submit(function (e) {
    e.preventDefault();

    const us = JSON.parse(localStorage.getItem("user_account"));
    const institution_user = us.records[0].iD;

    const formData = $(this).serialize() + "&institution_user=" + institution_user;

    $.ajax({
        url: site + "/api/create-guardian",
        method: "POST",
        data: formData,
        dataType: "json",
        success: function (res) {
            if (res.status === 1) {
                showAlert(res.message, "Success");
                $("#addGuardianModal").modal("hide");
                loadData(); // reload guardian list
            } else {
                showAlert(res.message || "Failed to add guardian", "Error");
            }
        },
        error: function (error, status, xhr) {
            showAlert("Error loading data ");
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
        }
    });
});
function openAddGuardianModal() {
    const us = JSON.parse(localStorage.getItem("user_account"));

    $("#addGuardianForm")[0].reset();
    $("#addGuardianModal").modal("show");
    $("#institution_user").val(us.records[0].iD);
    $("#user").val(user.iD);

}
function loadGuardianData() {
    $('#results').html('loading...');
    const us = JSON.parse(localStorage.getItem("user_account"));
    var n_institution_user = us.records[0].iD;

    // Set default or capture from a pagination control
    var uri = site + "/api/get-student-guardian-records";
    // console.log('uri:  ' + uri + "; pr: " + search)
    $.ajax({
        url: uri,
        type: "POST",
        data: {

            institution_user: n_institution_user,
        },
        success: function (response) {
            console.log('rest: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("user_guardians", response);

            displayGuardianResults(data.records);
        },
        error: function () {
            showshowAlert('Error loading data');
        }
    });
}

function displayGuardianResults(records) {
    $('#results').html('');

    if (records.length > 0) {
        const start = 1;

        // List View
        records.forEach((item, index) => {

            let template = document.getElementById('list_template').cloneNode(true);
            template.style.display = 'block';
            template.removeAttribute('id');
            template.innerHTML = template.innerHTML
                .replace('@item_name', index + start + ". " + item.name)

                .replace("@institution_user_name", item.institution_user)
                .replace("@name_name", item.name)
                .replace("@phone_name", item.phone)
                .replace("@email_name", item.email)
                .replace("@occupation_name", item.occupation)
                .replace("@guardianType_name", item.guardianType)
                .replace('@status_name', item.status.name)
                .replace('@item_id', item.iD);

            template.classList.add('fade-in');
            setTimeout(() => {
                $('#results').append(template);
                requestAnimationFrame(() => {
                    template.classList.add('show');
                });
            }, index * 200);
        });


    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
