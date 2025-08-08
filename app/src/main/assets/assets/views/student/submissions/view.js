function init(activity) {
    var uri = site + "/api/get-y-class-student-list";
    //$('#create_item_form').find('#studentList').html('<p>Loading students...</p>');

    var _form = {
        activity: activity.iD,
        api: true
    };

    console.log('gjh: ' + JSON.stringify(_form))

    $.ajax({
        url: uri,
        type: 'post',
        dataType: 'json', // Expect JSON response
        data: _form,
        success: function (data) {
            console.error('not e:' + JSON.stringify(data));

            if (Array.isArray(data) && data.length > 0) {
                generateStudentListMobile(data, activity.iD, activity.possible_mark);
            } else {
                $('#studentList').html('<p>No students found for this class.</p>');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error:' + JSON.stringify(xhr) + " xhr: " + xhr);

            console.error('Error fetching students:', error);
            $('#studentList').html('<p>Error loading students.</p>');
        }
    });
    //get_classes()

}

function generateStudentListMobile(students, activityiD, possible_mark) {
    const container = $('<div class="row g-3">');


students.forEach(student => {
        const card = $('<div class="col-12">').appendTo(container);
        const wrapper = $('<div class="border rounded shadow-sm p-3 bg-white">').appendTo(card);

        // Student Info
        $('<div class="mb-2 fw-semibold text-primary">')
            .text(student.name).appendTo(wrapper);
        $('<div class="small text-muted mb-3">')
            .text('Student Number: ' + student.student_number).appendTo(wrapper);

        // Mark Input
        const inputGroup = $('<div class="input-group">').appendTo(wrapper);
        const select = $('<select class="form-select">')
            .attr('data-student-id', student.iD)
            .appendTo(inputGroup);

        // Populate options from 0 to possible_mark
        for (let i = -1; i <= possible_mark; i++) {
            const option = $('<option>').val(i).text(i);
            if (student.submission && parseInt(student.submission.mark_awarded) === i) {
                option.attr('selected', 'selected');
            }
            select.append(option);
        }

        select.on('change', function () {

            const mark = $(this).val();
            const studentId = $(this).data('student-id');
            var uri=site + '/record-acitivity-mark'
            var _form = {
                student: studentId,
                mark_awarded: mark,
                user: user.iD,
                api: true,
                activity: activityiD
            }
                console.log('gh: ' + JSON.stringify(_form))
         $.ajax({
                url: uri,
                type: 'post',
                data: _form,
                dataType: 'json',
                complete: function (response) {
                    console.log('jgf:' + JSON.stringify(response));
                },
                success: function (response) {
                    console.log('j:' + JSON.stringify(response));

                    if (response && response.length > 0) {

                    }
                },
                error: function (xhr, status, error) {
                    console.error('Failed to fetch class list:', error);
                }
            });

        });
    });

    $('#studentList').html(container);
}
