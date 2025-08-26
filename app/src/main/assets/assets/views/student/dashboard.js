var us = null
var current = null;
function init() {
 current = JSON.parse(localStorage.getItem("current_account"));
    $('#username').html(current.user + '  <span class="text-muted">  |  Student </span>' || "Guest");
    $('#institution_name').text(current.institution || "");
  if (!current) return showAlert("No student account found");


get_account()
get_classes()
}


function populateClassDropdown(classes) {
    const select = $('[name=institution_class]');
    select.html('<option value="">Select Class</option>');

    classes.forEach(function (item) {
        const text = item.institution_class + ' - ' + item.period + ' (' + item.institution + ')';
        const option = `<option value="${item.iD}" data-description="${text}">${text}</option>`;
        select.append(option);
    });

    const selectedId = localStorage.getItem(getSelectedClassKey());
    if (selectedId) {
        select.val(selectedId).trigger('change');
    }

    select.off('change').on('change', function () {
        const selected = $(this).find('option:selected');
        $('#class_description').text(selected.data('description') || '');
        localStorage.setItem(getSelectedClassKey(), $(this).val());
    });
}

function get_classes(forceRefresh = false) {
    const storageKey = getClassStorageKey();

    if (!forceRefresh) {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
            const classList = JSON.parse(cached);
            console.log('Loaded classes from localStorage for user ' + current.iD);
            populateClassDropdown(classList);
            return;
        }
    }

    const uri = site + "/api/get-student-classes-b";
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

            if (response.records && response.records.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(response.records));
                populateClassDropdown(response.records);
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
function get_account(){
 $.ajax({
        url: server_url + "/api-get-institution-account", type: 'POST', dataType: 'application/json', data: { user: current.iD },

        error: function () {
            showAlert('Error loading data', 'Error');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("user_account", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            displayResults(data.records[0]);
        }
    });
}
function openEditProfileModal() {
console.log('st: ' + localStorage.getItem("user_account"))
  const us = JSON.parse(localStorage.getItem("user_account"));
  console.log('stk: ' + us.records.length + ' gh: ' + 8)

  const profile = us.records[0].profile;

  const form = $("#editProfileForm")[0];

  form.name.value = profile.name || "";
  form.phone.value = profile.phone || "";
  form.email.value = profile.email || "";
  form.address.value = profile.address || "";
  form.gender.value = profile.genderiD || "";
  form.dateofbirth.value = profile.dateofbirth || "";
  $("#editProfileModal").modal("show");
}

// Handle form submission
function submit_profile_form() {

  const us = JSON.parse(localStorage.getItem("user_account"));
  const profile = us.records[0].profile;
  const itemID = profile.iD; // this is used as 'itemiD' in your backend
  console.log('stk: ' +itemID + ' gh: ' + 8)

const form = $("#editProfileForm")[0]; // or .get(0)
  console.log('gd: ' +form.gender.value + ' gh: ' + 8)

  const formData = new FormData();

  // Append text fields for profile update
  formData.append("itemiD", itemID);
  formData.append("status", 1); // Assuming default 'active' status
  formData.append("institution_user", profile.institution_user || "");
  formData.append("name", form.name.value);
  formData.append("gender", form.gender.value || "3"); // adjust if editable
  formData.append("dateofbirth", form.dateofbirth.value || "");
  formData.append("address", form.address.value);
  formData.append("phone", form.phone.value);
  formData.append("email", form.email.value);

  console.log('itr: ' + JSON.stringify(formData))

  // First send profile text fields
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

          $.ajax({
            url: site + "/api/update-profile-picture",
            method: "POST",
            data: imageForm,
            contentType: false,
            processData: false,
            success: function (imgRes) {
              if (imgRes.status == 1) {
                showAlert("Profile and picture updated successfully!", "Success");
              } else {
                showAlert("Profile updated but picture failed: " + imgRes.message, "Partial Success");
              }
              $("#editProfileModal").modal("hide");
              init()
            },
            error: () => showAlert("Error uploading profile picture", "Upload Error")
          });

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
}
function displayResults(res) {
     // Header
     console.log('hgs: ' + JSON.stringify(res) )
console.log('hg: ' + JSON.stringify(current))

     $("#studentName").text(current.user);
     $("#accountName").text(res.profile.name);
     $("#studentPhoto").attr("src", res.profile.picture);


     // Cards
     $("#totalInvoices").text("$" + res.financial.invoices);
     $("#totalPayments").text("$" + res.financial.payments);
     $("#balance").text("$" + (res.financial.invoices - res.financial.payments));

     // Profile table
     const profileRows = `
       <tr><th>Name</th><td>${res.profile.name}</td></tr>
       <tr><th>Gender</th><td>${res.profile.gender}</td></tr>
       <tr><th>DOB</th><td>${res.profile.dateofbirth}</td></tr>
       <tr><th>Address</th><td>${res.profile.address}</td></tr>
       <tr><th>Phone</th><td>${res.profile.phone}</td></tr>
       <tr><th>Email</th><td>${res.profile.email}</td></tr>
     `;
     $("#studentProfile").html(profileRows);

     // Guardians
     let guardians = "<thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Occupation</th><th>Type</th></tr></thead><tbody>";
     res.guardians.forEach(g => {
       guardians += `<tr><td>${g.name}</td><td>${g.phone}</td><td>${g.email}</td><td>${g.occupation}</td><td>${g.guardianType}</td></tr>`;
     });
     guardians += "</tbody>";
     $("#guardianTable").html(guardians);

     // Events
     let events = "<thead><tr><th>Date</th><th>Event</th><th>RSVP</th></tr></thead><tbody>";
     res.events.forEach(e => {
       events += `<tr><td>${e.date}</td><td>${e.name}</td><td>${e.rsvp ? '<i class="fa fa-check-square"></i>' : '<i class="fa fa-square"></i>'}</td></tr>`;
     });
     events += "</tbody>";
     $("#eventTable").html(events);

     // Attendance
     let attendance = "<thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>";
    // res.attendance.forEach(a => {
     //  attendance += `<tr><td>${a.date}</td><td>${a.status}</td></tr>`;
     //});
     attendance += "</tbody>";
     $("#attendanceTable").html(attendance);

     // Invoices
     let invoices = "<thead><tr><th>Expense</th><th>Amount</th><th>Balance</th><th>Due</th></tr></thead><tbody>";
    // res.invoices.forEach(i => {
    //   invoices += `<tr><td>${i.category}</td><td>${i.amount}</td><td>${i.balance}</td><td>${i.due}</td></tr>`;
   //  });
     invoices += "</tbody>";
     $("#invoiceTable").html(invoices);

     // Progress
     let progress = "<thead><tr><th>Class</th><th>Subjects</th></tr></thead><tbody>";
     //res.progress.forEach(p => {
     //  let subjects = p.subjects.map(s => `<div>${s.name}: ${s.progress}%</div>`).join("");
     //  progress += `<tr><td>${p.class}</td><td>${subjects}</td></tr>`;
     //});
     progress += "</tbody>";
     $("#progressTable").html(progress);
   };