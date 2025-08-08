function init() {
    const today = new Date().toISOString().split('T')[0];
    $('#dayLong').val(today);
    get_classes();

    $('#create_item_form').find('[name=institution_class], #dayLong').on('change', function () {
        get_class_list();
    });

    // Enable Save button only if class is selected
    $('#institution_class').on('change', function () {
        const selectedClass = $(this).val();
        $('#saveAttendanceBtn').prop('disabled', selectedClass === "");
    });

    function checkSaveButtonState() {
        const classSelected = $('#institution_class').val() !== '';
        const anyAttendanceChecked = $('[name^="attendance_"]:checked').length > 0;

        $('#saveAttendanceBtn')
            .prop('disabled', !(classSelected && anyAttendanceChecked))
            .toggleClass('opacity-50', !(classSelected && anyAttendanceChecked));
    }

    // Trigger check when class is selected
    $('#institution_class').on('change', checkSaveButtonState);

    // Trigger check when any attendance checkbox is clicked
    $(document).on('change', '[name^="attendance_"]', checkSaveButtonState);
}

 function get_classes(useCache = true) {
     const cacheKey = 'cached_teacher_classes';
     const uri = site + "/api/get-teacher-classes";

     if (useCache) {
         const cached = localStorage.getItem(cacheKey);
         if (cached) {
             const response = JSON.parse(cached);
             renderClassOptions(response);
             return;
         }
     }

     const _form = {
         user: user.iD,
         institution_user: current.iD,
         institution: current.institutioniD
     };

     $.ajax({
         url: uri,
         type: 'post',
         data: _form,
         dataType: 'json',
         success: function (response) {
             localStorage.setItem(cacheKey, JSON.stringify(response));
             renderClassOptions(response);
         },
         error: function (xhr, status, error) {
             console.error('Failed to fetch class list:', error);
         }
     });
 }

 function renderClassOptions(response) {
     if (response && response.length > 0) {
         const select = $('[name=institution_class]');
         select.html('<option value="">Select Class</option>');

         response.forEach(function (item) {
             const text = item.name + ' [' + item.period + '] ' + item.iD;
             const id = item.periodiD + "_" + item.classiD + "_" + item.iD
             const option = `<option value="${id}" data-description="${text}">${text}</option>`;
             select.append(option);
         });
         get_class_list()
        // loadData(); // If needed
     }
 }

   function get_class_list(useCache = true) {
       const uri = site + "/api/get-x-class-student-list";
       const _day = $('#create_item_form').find('[name=day]').val();
       const classVal = $('#create_item_form').find('[name=institution_class]').val();

       $('#create_item_form').find('#studentList').html('<p>Loading students...</p>');

       if (classVal !== "") {
           const parts = classVal.split('_');
           const _form = {
               period: parts[0],
               value: parts[1],
               teacher: parts[2],
               day: _day,
               api: true
           };

           const cacheKey = `cached_class_list_${_form.period}_${_form.value}_${_form.day}`;

           if (useCache) {
               const cached = localStorage.getItem(cacheKey);
               if (cached) {
                   generateStudentListMobile(JSON.parse(cached));
             //      return;
               }
           }

           $.ajax({
               url: uri,
               type: 'post',
               dataType: 'json',
               data: _form,
               success: function (data) {
                   localStorage.setItem(cacheKey, JSON.stringify(data));
                   if (Array.isArray(data) && data.length > 0) {
                       generateStudentListMobile(data);
                   } else {
                       $('#studentList').html('<p>No students found for this class.</p>');
                   }
               },
               error: function (xhr, status, error) {
                   console.error('Error fetching students:', error);
                   $('#studentList').html('<p>Error loading students.</p>');
               }
           });
       } else {
           $('#studentList').html('');
       }
   }
   function refreshCachedData() {
    if (!navigator.onLine) {
           showAlert('No Internet Connection');
           return
       }
       console.log('Refreshing data cache...');
       // Clear related caches
       localStorage.removeItem('cached_teacher_classes');

       const selectedClass = $('#create_item_form').find('[name=institution_class]').val();
       const selectedDay = $('#create_item_form').find('[name=day]').val();
       if (selectedClass && selectedDay) {
           const parts = selectedClass.split('_');
           const cacheKey = `cached_class_list_${parts[0]}_${parts[1]}_${selectedDay}`;
           localStorage.removeItem(cacheKey);
       }

       // Re-fetch with cache bypassed
       get_classes(false);
       get_class_list(false);
   }

function generateStudentListMobile(students) {
   // console.log(students)
                    console.log('std: ' + JSON.stringify(students));

    const container = $('<div class="attendance-wrapper table-responsive">');
    const table = $(`
        <table class="attendance-table">
            <thead>
                <tr>
                    <th></th>
                    <th><div style="width: 20px; height: 20px; background-color: #00f19f; border-radius: 6px; margin: auto;" onclick="markAllAttendance('Present')"></div></th>
                    <th><div style="width: 20px; height: 20px; background-color: #ff2c2c; border-radius: 6px; margin: auto;" onclick="markAllAttendance('Absent')"></div></th>
                    <th><div style="width: 20px; height: 20px; background-color: #ffa500; border-radius: 6px; margin: auto;" onclick="markAllAttendance('Late')"></div></th>
                    <th><div style="width: 20px; height: 20px; background-color: #00e6ff; border-radius: 6px; margin: auto;" onclick="markAllAttendance('Excused')"></div></th>
                    <th></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `).appendTo(container);

    const statusKeys = ['Present', 'Absent', 'Late', 'Excused'];
    const statusClasses = {
        Present: 'present',
        Absent: 'absent',
        Late: 'late',
        Excused: 'excused'
    };

        const statusMap = {
            1: 'Present',
            2: 'Absent',
            3: 'Late',
            4: 'Excused'
        };

    students.forEach(student => {
        const row = $('<tr class="align-middle">');
        const msgCell = $('<td class="save-msg text-start text-success"></td>');

        // Student name
        $('<td class="name-cell text-small">')
            .text(student.name)
            .appendTo(row);

       // const attendedStatus = student.attended || null;
          const attendedStatus = student.attended !== 0 && statusMap[student.attended] ? statusMap[student.attended] : null;

        statusKeys.forEach(status => {
            const className = statusClasses[status];
            const checkbox = $(`<input type="checkbox" class="${className}" name="attendance_${student.iD}" value="${status}" />`)
                .prop('checked', attendedStatus === status);

            checkbox.on('change', function () {
                $(`input[name="attendance_${student.iD}"]`).not(this).prop('checked', false);

                const selectedStatus = $(this).is(':checked') ? $(this).val() : null;
                const classValue = $('#create_item_form').find('[name=institution_class]').val();
                const day = $('#create_item_form').find('[name=day]').val();

                if (selectedStatus && classValue && day) {
                    const classParts = classValue.split('_');
                    const attendanceData = {
                        user: user.iD,
                        student_id: student.iD,
                        status: selectedStatus,
                        period: classParts[0],
                        institution_class: classParts[2],
                        teacher: classParts[2],
                        day: day,
                        api: true
                    };

                    $.ajax({
                        url: site + "/save-attendance",
                        type: 'post',
                        dataType: 'json',
                        data: attendanceData,
                        success: function (response) {
                            console.log('res: ' + response)
                           console.log('Eno' + JSON.stringify(response));

                           // localStorage.removeItem(cacheKey)
                            msgCell.removeClass('text-danger').addClass('text-success').text('Saved').show();
                            setTimeout(() => msgCell.fadeOut(), 2000);
                        },
                        error: function (xhr, status, error) {

                            console.error('Failed to fetch class list:', error);

                            msgCell.removeClass('text-success').addClass('text-danger').text('Error').show();
                            setTimeout(() => msgCell.fadeOut(), 2000);
                        }
                    });
                }
            });

            row.append($('<td>').append(checkbox));
        });

        row.append(msgCell);
        table.find('tbody').append(row);
    });

    $('#studentList').html(container);
}

    function _generateStudentListMobile(students) {
    console.log('std: ' + students)
        const container = $('<div class="row g-3">');

        const statusMap = {
            1: 'Present',
            2: 'Absent',
            3: 'Late',
            4: 'Excused'
        };
        const statuses = ['Present', 'Absent', 'Late', 'Excused'];

        const statusColor = {
            Present: 'success',
            Absent: 'danger',
            Late: 'warning',
            Excused: 'info'
        };

        students.forEach(student => {
            const card = $('<div class="col-12">').appendTo(container);
            const wrapper = $('<div class="bg-white rounded-4 p-4 shadow-sm">').appendTo(card);

            // Student Name
            $('<div class="fw-bold text-green mb-3" style="font-size: 1.1rem;">')
                .text(student.name).appendTo(wrapper);

            const attendedStatus = student.attended !== 0 && statusMap[student.attended] ? statusMap[student.attended] : null;

            // Attendance Options
            const radioGroup = $('<div class="d-grid gap-3">').appendTo(wrapper);

            statuses.forEach(status => {
                const colorClass = {
                    Present: 'bg-success',
                    Absent: 'bg-danger',
                    Late: 'bg-warning',
                    Excused: 'bg-info'
                }[status];

                const label = $(`
                  <label class="status-option d-flex justify-content-between align-items-center">
                      <span class="status-label">${status}</span>
                      <input type="radio" name="attendance_${student.iD}" value="${status}" class="d-none" />
                      <span class="status-box rounded-3"></span>
                  </label>
              `);

                if (attendedStatus === status) {
                    // label.addClass(colorClass + ' text-white');
                    label.find('.status-box').addClass(colorClass);

                }

                // When selected
                label.find('input').on('change', function () {
                    // Clear all previous
                    radioGroup.find('.status-box')
                        .removeClass('bg-success bg-danger bg-warning bg-info');

                    // Add the matching color to only the selected box
                    label.find('.status-box').addClass(colorClass);
                });

                radioGroup.append(label);
            });

            // Save on change
            radioGroup.find('input[type="radio"]').on('change', function () {
                const selectedStatus = $(this).val();
                const studentId = student.iD;
                const classValue = $('#create_item_form').find('[name=institution_class]').val();
                const day = $('#create_item_form').find('[name=day]').val();

                if (classValue && day) {
                    const classParts = classValue.split('_');
                    const attendanceData = {
                        user: user.iD,
                        student_id: studentId,
                        status: selectedStatus,
                        period: classParts[0],
                        institution_class: classParts[2],
                        teacher: classParts[2],
                        day: day,
                        api: true
                    };

                    $.ajax({
                        url: site + "/save-attendance",
                        type: 'post',
                        dataType: 'json',
                        data: attendanceData,
                        success: function () {
                            wrapper.find('.save-msg').remove();
                            wrapper.append('<div class="save-msg text-success small mt-2">Saved</div>');
                            setTimeout(() => wrapper.find('.save-msg').fadeOut(), 2000);
                        },
                        error: function (xhr, status, error) {
                            wrapper.find('.save-msg').remove();
                            wrapper.append('<div class="save-msg text-danger small mt-2">Error</div>');
                            setTimeout(() => wrapper.find('.save-msg').fadeOut(), 2000);
                        }
                    });
                }
            });
        });

        $('#studentList').html(container);
    }

    function generateStudentTable(students) {
        var table = $('<table class="table table-striped">');
        var thead = $('<thead>').appendTo(table);
        var headerRow = $('<tr>').appendTo(thead);
        headerRow.append('<th>Student Number</th>');
        headerRow.append('<th>Name</th>');
        headerRow.append('<th>Attendance Status</th>');

        var tbody = $('<tbody>').appendTo(table);

        var statusMap = {
            1: 'Present',
            2: 'Absent',
            3: 'Late',
            4: 'Excused'
        };

        students.forEach(function (student) {
            var row = $('<tr>').appendTo(tbody);
            row.append('<td>' + student.student_number + '</td>');
            row.append('<td>' + student.name + '</td>');

            var statusCell = $('<td>').appendTo(row);
            var statuses = ['Present', 'Absent', 'Late', 'Excused'];
            var attendedStatus = student.attended !== 0 && statusMap[student.attended] ? statusMap[student.attended] : null;
            statuses.forEach(function (status) {
                var label = $('<label class="me-2">').appendTo(statusCell);
                var radio = $('<input type="radio" name="attendance_' + student.iD + '" value="' + status + '">').appendTo(label);
                if (attendedStatus === status) {
                    radio.prop('checked', true);
                }
                label.append(' ' + status);
            });

            // Add change event listener to radio buttons for this student
            statusCell.find('input[type="radio"]').on('change', function () {
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
                        success: function (response) {
                            console.log('Attendance saved for student ' + studentId + ':', response);
                            // Optional: Show a success message
                            $(row).find('td:last').append('<span class="text-success">Saved</span>');
                            setTimeout(function () {
                                $(row).find('.text-success').remove();
                            }, 2000);
                        },
                        error: function (xhr, status, error) {
                            console.error('Error saving attendance for student ' + studentId + ':' + JSON.stringify(xhr) + " xhr: " + xhr);
                            // Optional: Show an error message
                            $(row).find('td:last').append('<span class="text-danger">Error</span>');
                            setTimeout(function () {
                                $(row).find('.text-danger').remove();
                            }, 2000);
                        }
                    });
                }
            });
        });

        $('#studentList').html(table);
    }
function markAllAttendance(status) {
    const radios = $('[name^="attendance_"]').filter(function () {
        return $(this).val() === status;
    });

    radios.each(function (index) {
        const radio = $(this);
        setTimeout(() => {
            radio.prop('checked', true).trigger('change');
        }, index * 200); // 200ms delay between each trigger
    });
}

$('#btn_submit_item').on('click', function () {
    overlay('start');
    current = JSON.parse(localStorage.getItem("current_account"));

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&institution_user=" + current.iD + "&user=" + user.iD;

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/api/create-guardian";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Update again");

            //alert(rString) //get_pagination();
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
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
        }
    });

})