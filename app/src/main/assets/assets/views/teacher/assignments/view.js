function init(activity) {
    const cacheKey = `activity_students_${activity.iD}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached && (!navigator.onLine)) {
        const students = JSON.parse(cached);
        console.log('Loaded from cache');
        generateStudentListMobile(students, activity.iD, activity.possible_mark);
        return;
    }

    const uri = site + "/api/get-y-class-student-list";
    const _form = {
        activity: activity.iD,
        api: true
    };

    console.log('Request:', JSON.stringify(_form));

    $.ajax({
        url: uri,
        type: 'POST',
        dataType: 'json',
        data: _form,
        success: function (data) {
            if (Array.isArray(data) && data.length > 0) {
                sessionStorage.setItem(cacheKey, JSON.stringify(data));
                generateStudentListMobile(data, activity.iD, activity.possible_mark);
            } else {
                $('#studentList').html('<p class="text-muted">No students found for this class.</p>');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error:', error);
            $('#studentList').html('<p class="text-danger">Error loading students.</p>');
        }
    });
}

function generateStudentListMobile(students, activityiD, possible_mark) {

    function checkDummySaveButtonState() {
        let anyMarkSelected = false;

        $('#studentList select').each(function () {
            const val = parseInt($(this).val());
            if (!isNaN(val) && val !== -1) {
                anyMarkSelected = true;
                return false; // Exit loop early
            }
        });

        const btn = $('#saveEditActivityBtn');
        btn.prop('disabled', !anyMarkSelected)
           .toggleClass('opacity-50', !anyMarkSelected);
    }

    const container = $('<div class="row g-3">');

    students.forEach(student => {
        const card = $('<div class="col-12">').appendTo(container);
        const wrapper = $('<div class="bg-light rounded-4 p-3">').appendTo(card);

        // Student name
        $('<div class="fw-bold text-success mb-1">')
            .text(student.name).appendTo(wrapper);

        // Student number
        $('<div class="small text-muted mb-3">')
            .text('Student Number: ' + student.student_number).appendTo(wrapper);

        // Mark input row
        const row = $('<div class="d-flex justify-content-between align-items-center">').appendTo(wrapper);
        $('<div class="fw-medium text-dark">Mark</div>').appendTo(row);

        const selectWrapper = $('<div style="width: 100px;">').appendTo(row);
        const select = $('<select class="form-select form-select-sm border-0 shadow-sm bg-white rounded-2">')
            .attr('data-student-id', student.iD)
            .appendTo(selectWrapper);

        // Populate options from 0 to possible_mark
        for (let i = -1; i <= possible_mark; i++) {
            const option = $('<option>').val(i).text(i < 0 ? '--' : i);
            if (student.submission && parseInt(student.submission.mark_awarded) === i) {
                option.prop('selected', true);
            }
            select.append(option);
        }

        // On select change → save
        select.on('change', function () {
            checkDummySaveButtonState();

            const mark = $(this).val();
            const studentId = $(this).data('student-id');

            const _form = {
                student: studentId,
                mark_awarded: mark,
                user: user.iD,
                api: true,
                activity: activityiD
            };

            $.ajax({
                url: site + '/record-acitivity-mark',
                type: 'POST',
                dataType: 'json',
                data: _form,
                complete: function (response) {
                    console.log('Saved mark for student ' + studentId);
                },
                error: function (xhr, status, error) {
                    console.error('Error saving mark:', error);
                }
            });
        });
    });

    $('#studentList').html(container);

    checkDummySaveButtonState();
}