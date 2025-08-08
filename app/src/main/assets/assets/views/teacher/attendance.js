$(document).ready(function () {

    current_page = 1;

 get_classes()
    $('#attendanceForm').find('[name=student_class], #dayLong').on('change', function () {
            var uri = site + "/api/get-x-class-student-list";
            $('#attendanceForm').find('#studentList').html('<p>Loading students...</p>');
            var _day = $('#attendanceForm').find('[name=day]').val();

            if ($('#create_item_form').find('[name=institution_class]').val() != "") {
            console.log('selected: ' + $('#attendanceForm').find('[name=student_class]').val())
                var _value = $('#attendanceForm').find('[name=student_class]').val().split('_');
                var _form = {
                    period: _value[0],
                    value: _value[1],
                    day: _day
                };
                $.ajax({
                    url: uri,
                    type: 'post',
                    dataType: 'json', // Expect JSON response
                    data: _form,
                    success: function (data) {
                        console.log('xyc:'+JSON.stringify(data));

                        if (Array.isArray(data) && data.length > 0) {
                            generateStudentTable(data);
                        } else {
                            $('#studentList').html('<p>No students found for this class.</p>');
                        }
                    },
                    error: function (xhr, status, error) {
                        console.error('Error:'+JSON.stringify(xhr)  + " xhr: " + xhr);

                        console.error('Error fetching students:', error);
                        $('#studentList').html('<p>Error loading students.</p>');
                    }
                });
            } else {
                $('#studentList').html('');
            }
        });

        function generateStudentTable(students) {
            var table = $('<table class="table table-striped">');
            var thead = $('<thead>').appendTo(table);
            var headerRow = $('<tr>').appendTo(thead);
            headerRow.append('<th>Name</th>');
            headerRow.append('<th>Attendance Status</th>');

            var tbody = $('<tbody>').appendTo(table);

            var statusMap = {
                1: 'Present',
                2: 'Absent',
                3: 'Late',
                4: 'Excused'
            };

            students.forEach(function(student) {
                var row = $('<tr>').appendTo(tbody);

                row.append('<td>[' + student.student_number + '] ' + student.name + '</td>');

                var statusCell = $('<td>').appendTo(row);
                var statuses = ['Present', 'Absent', 'Late', 'Excused'];
                var attendedStatus = student.attended !== 0 && statusMap[student.attended] ? statusMap[student.attended] : null;
                statuses.forEach(function(status) {
                    var label = $('<label class="me-2">').appendTo(statusCell);
                    var radio = $('<input type="radio" name="attendance_' + student.iD + '" value="' + status + '">').appendTo(label);
                    if (attendedStatus === status) {
                        radio.prop('checked', true);
                    }
                    label.append(' ' + status);
                });

                // Add change event listener to radio buttons for this student
                statusCell.find('input[type="radio"]').on('change', function() {
                    var selectedStatus = $(this).val();
                    var studentId = student.iD;
                    var classValue = $('#create_item_form').find('[name=institution_class]').val();
                    var day = $('#create_item_form').find('[name=day]').val();
                    console.log('st: ' + selectedStatus)

                    if (classValue && day) {
                        var classParts = classValue.split('_');
                        var attendanceData = {
                            student_id: studentId,
                            status: selectedStatus,
                            period: classParts[0],
                            institution_class: classParts[2],
                            day: day
                        };

                        $.ajax({
                            url: site + "/save-attendance",
                            type: 'post',
                            dataType: 'json',
                            data: attendanceData,
                            success: function(response) {
                                console.log('Attendance saved for student ' + studentId + ':', response);
                                // Optional: Show a success message
                                $(row).find('td:last').append('<span class="text-success ms-2">Saved</span>');
                                setTimeout(function() {
                                    $(row).find('.text-success').remove();
                                }, 2000);
                            },
                            error: function(xhr, status, error) {
                                console.error('Error saving attendance for student ' + studentId + ':'+JSON.stringify(xhr)  + " xhr: " + xhr);
                                // Optional: Show an error message
                                $(row).find('td:last').append('<span class="text-danger ms-2">Error</span>');
                                setTimeout(function() {
                                    $(row).find('.text-danger').remove();
                                }, 2000);
                            }
                        });
                    }
                });
            });
            $('#attendanceForm').find('#studentList').html(table);
        }

});
function recordAttendance(){
 const today = new Date().toISOString().split('T')[0];
  $('#attendanceForm').find('[name=day]').val(today);
 $('#recordAttendanceModal').modal('show')
}
function get_classes() {
    console.log("us: " + user.iD)
       current = JSON.parse(localStorage.getItem("current_account"));

    $.ajax({
        url: site + "/api/get-teacher-classes", type: 'POST', dataType: 'application/json', data: { user: current.iD },

        error: function () {
            alert('Error loading data');
        },
        complete: function (data) {
            //  $('#loadingOverlay').hide();
            console.log("rs: " + data.responseText.toString());
            localStorage.setItem("classes", data.responseText.toString());

            data = JSON.parse(data.responseText.toString());
            var inst =''
            var _inst =''
            data.forEach((item, index) => {
               inst += `<option value="${item.iD}" >${item.name}</option>`
               _inst += `<option value="${item.periodiD + '_' + item.classiD + '_' + item.iD}" >${item.name}</option>`
            })
            $('[name=institution_class]').html(inst)
            $('[name=student_class]').html(`<option value="" >Select Class</option>` + _inst)
            loadData()
        }
    });
}

function loadData() {
    $('#results').html('loading...');
    // const province = $('.search').find('[name=province]').val();
    var n_institution_class =  $('.search').find('[name=institution_class]').val();

overlay('start')
    const search =  $('input[name="search"]').val();
    const ps = $('#page_size_select').val();
    const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/api/get-student-attendance-records";
    // console.log('uri:  ' + uri + "; pr: " + search)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps, // Or capture from a page-size selector if available
            institution_class: n_institution_class,

        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
overlay('stop')

            displayResults(data.records, data.pagination);
            $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
        overlay('fail', 'Error loading data')


        }
    });
}

$('#classSelect').on('change', function () {
  const classId = $(this).val();
  if (!classId) return;

  overlay('start', 'Loading students...');
  $.post(site + '/api/get-class-students', { class_id: classId }, function (res) {
    const data = typeof res === 'string' ? JSON.parse(res) : res;

    if (data.records && data.records.length > 0) {
      const list = data.records.map((student, index) => {
        const sid = student.iD;
        return `
          <div class="card mb-3 p-3">
            <h6>${index + 1}. ${student.name}</h6>
            <div class="form-check form-check-inline">
              <input type="radio" name="status[${sid}]" value="present" class="form-check-input" required>
              <label class="form-check-label">Present</label>
            </div>
            <div class="form-check form-check-inline">
              <input type="radio" name="status[${sid}]" value="absent" class="form-check-input">
              <label class="form-check-label">Absent</label>
            </div>
            <div class="form-check form-check-inline">
              <input type="radio" name="status[${sid}]" value="late" class="form-check-input">
              <label class="form-check-label">Late</label>
            </div>
            <div class="form-check form-check-inline">
              <input type="radio" name="status[${sid}]" value="excused" class="form-check-input">
              <label class="form-check-label">Excused</label>
            </div>
          </div>
        `;
      }).join('');

      $('#studentList').html(list);
    } else {
      $('#studentList').html('<p class="text-muted">No students found in selected class.</p>');
    }

    overlay('stop');
  }).fail(() => {
    showAlert("Failed to load students", "Error");
    overlay('fail', 'Error fetching students');
  });
});
$('#attendanceForm').on('submit', function (e) {
  e.preventDefault();

  overlay('start', 'Submitting attendance...');
  const formData = $(this).serialize();

  $.post(site + '/api/record-attendance', formData, function (res) {
    const data = typeof res === 'string' ? JSON.parse(res) : res;

    if (data.status === 1) {
      showAlert("Attendance recorded", "Success");
      $('#recordAttendanceModal').modal('hide');
      loadData(); // reload the attendance list
    } else {
      showAlert("Failed to record attendance", "Error");
    }

    overlay('stop');
  }).fail(() => {
    overlay('fail', 'Failed to submit attendance');
  });
});
function displayResults(records, pagination) {
  $('#results').html('');

  if (records.length === 0) {
    $('#results').html('<p class="text-muted text-center">No attendance records found.</p>');
    return;
  }

  records.forEach(item => {
   const template = `
     <div class="card mb-3 shadow-sm border-0 rounded-4">
       <div class="card-body py-3 px-4">
         <div class="d-flex justify-content-between align-items-center mb-2">
           <h6 class="mb-0 fw-semibold text-primary">${item.day}</h6>
           <span class="small text-muted">Attendance: <strong>${item.rate}%</strong></span>
         </div>

         <div class="row text-center gx-2 gy-3">
           <div class="col-6">
             <div class="bg-light rounded-3 py-2">
               <div class="fw-bold text-success fs-5">${item.present}</div>
               <div class="small text-muted">Present</div>
             </div>
           </div>
           <div class="col-6">
             <div class="bg-light rounded-3 py-2">
               <div class="fw-bold text-danger fs-5">${item.absent}</div>
               <div class="small text-muted">Absent</div>
             </div>
           </div>
           <div class="col-6">
             <div class="bg-light rounded-3 py-2">
               <div class="fw-bold text-warning fs-5">${item.late}</div>
               <div class="small text-muted">Late</div>
             </div>
           </div>
           <div class="col-6">
             <div class="bg-light rounded-3 py-2">
               <div class="fw-bold text-info fs-5">${item.excused}</div>
               <div class="small text-muted">Excused</div>
             </div>
           </div>
         </div>

         <div class="text-center mt-3">
           <button class="btn btn-outline btn-sm" onclick="viewAttendanceDetails(${item.iD}, '${item.day}')">
             View Details
           </button>
         </div>
       </div>
     </div>
   `;
    $('#results').append(template);
  });

  current_page = parseInt(pagination.current_page);
  total_pages = parseInt(pagination.total_pages);
  current_page = parseInt(pagination.current_page);
    total_pages = parseInt(pagination.total_pages);
    const page_size = parseInt(pagination.rows_per_page);
    const total_records = parseInt(pagination.total_records);

    // Build dropdown options
    let optionsHtml = '';
    for (let i = 0; i < total_pages; i++) {
      const from = i * page_size + 1;
      let to = from + page_size - 1;
      if (to > total_records) to = total_records;

      const selected = (i + 1 === current_page) ? 'selected' : '';
      optionsHtml += `<option value="${i + 1}" ${selected}>${from} - ${to} of ${total_records}</option>`;
    }

    $('#page_selector').html(optionsHtml);
}
function viewAttendanceDetails(attendanceId, dayLabel) {
  $("#attendanceDateLabel").text(`Date: ${dayLabel}`);
  $("#studentAttendanceList").html('<div class="text-center py-3">Loading...</div>');

  $.ajax({
    url: site + "/api/get-student-attendance",
    method: "POST",
    data: { item: attendanceId },
    success: function (res) {
                console.log('res: ' + res)

      const data = JSON.parse(res);
      if (!data.records || data.records.length === 0) {
        $("#studentAttendanceList").html('<p class="text-muted text-center">No students found for this day.</p>');
        return;
      }

      const listHtml = data.records.map(r => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <span>${r.student}</span>
          <span class="">${r.attendanceStatus}</span>
        </div>
      `).join("");

      $("#studentAttendanceList").html(listHtml);
    },
    error: function () {
      $("#studentAttendanceList").html('<p class="text-danger text-center">Error loading student list.</p>');
    }
  });

  $("#attendanceDetailsModal").modal('show');
}