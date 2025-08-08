var us = null
var current = null;
function init() {

   current = JSON.parse(localStorage.getItem("current_account"));
    $('#username').html(current.user + '  <span class="text-muted">  |  Admin </span>' || "Guest");
    $('#institution_name').text(current.institution || "");

  //if (!current) return showAlert("No student account found"); Administration Dashboard

get_admin_account()
}
function get_admin_account(){
 $.ajax({
        url: server_url + "/api/get-institution-admin-account", type: 'POST', dataType: 'application/json', data: { institution_user: current.iD,user: user.iD },

        error: function () {
            alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("user_account", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            displayAdminResults(data.records[0]);
        }
    });
}
function displayAdminResults(res) {
     // Header
     console.log('hgs: ' + JSON.stringify(res) )
console.log('hg: ' + JSON.stringify(current))

     $("#accountName").text(res.user);


     // Cards
     $("#allUsers").text("" + res.allUsers);
     $("#adminUsers").text("" + res.adminUsers);
     $("#staffUsers").text("" + res.staffUsers);
     $("#teacherUsers").text("" + res.teacherUsers);
     $("#studentUsers").text("" + res.studentUsers);



     // Attendance
     let requests = "<thead><tr><th>Date</th><th>Owner</th><th>Name</th><th>ID Number</th><th>Phone</th><th>Role</th><th>Class</th><th>Period</th><th>Status</th></tr></thead><tbody>";
     res.requests.forEach(a => {
       requests += `<tr><td>${a.reg_date}</td><td>${a.user}</td><td>${a.full_name}</td><td>${a.id_number}</td><td>${a.phone}</td><td>${a.institution_role}</td><td>${a.class}</td><td>${a.period}</td><td>${a.status.name}</td>
       <td><div class="@cofirmers">
                   <a class="btn btn-sm  table-button" onclick="confirm_request(@item_id, '2')">
                       <span>Approve</span>
                   </a>
                   <a class="btn btn-sm btn-outline-warning border table-button" onclick="confirm_request(@item_id, '3')">
                       <span>Reject</span>
                   </a>
            </div>

       </td>
     </tr>`;
     });
     requests += "</tbody>";
    // $("#requestsTable").html(requests);

   };
   function confirm_request(record, status) {
       var state = 'approve';
       if(status=='3'){state="reject"; }
       if(!confirm('please confirm that you want to ' + state + ' this record.')){
           return;
       }
       $('#results').html('loading...');
          // Set default or capture from a pagination control
       var uri = site + "/confirm-account-request";
      // console.log('uri:  ' + uri + "; pr: " + search)
       $.ajax({
           url: uri,
           type: "POST",
           data: {
               record: record,
               status: status

           },
           success: function (response) {
              console.log('res: ' + response)
               const data = JSON.parse(response);
               loadData()

           },
           error: function () {
               alert('Error loading data');
           }
       });
   }