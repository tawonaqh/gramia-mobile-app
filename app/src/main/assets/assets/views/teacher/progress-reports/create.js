function init() {
    const today = new Date().toISOString().split('T')[0];
    $('#dayLong').val(today);
    get_classes()

    // Grade logic based on final mark
    function calculateGrade(mark) {
        if (mark >= 80) return 'A';
        if (mark >= 70) return 'B';
        if (mark >= 60) return 'C';
        if (mark >= 50) return 'D';
        if (mark >= 40) return 'E';
        if (mark >= 30) return 'F';
        return 'U';
    }
    // Live calculation for each subject card
    $('#subjectListContainer').on('keyup change', '.exam-mark, .term-mark', function () {
        const $card = $(this).closest('[data-subject-index]');
        const termMark = parseFloat($card.find('.term-mark').val()) || 0;
        const examMark = parseFloat($card.find('.exam-mark').val()) || 0;

        const final = Math.round((termMark + examMark) / 2);
        const grade = calculateGrade(final);

        $card.find('.final-mark').val(final);
        $card.find('.grade').val(grade);
    });



}

function get_classes() {



    const uri = site + "/api/get-teacher-class-with-subjects";
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
            console.log('j:' + JSON.stringify(response));

            if (response && response.length > 0) {
                const select = $('[name=institution_class]');
                select.html('<option value="">Select Class</option>');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ';
                    const id = item.periodiD + "_" + item.classiD + "_" + item.iD
                    const subjects = item.subjects;
                    const period = item.periodiD;
                    const classiD = item.classiD;
                    const teacher = item.iD;
                    const option = `<option value="${id}" data-subjects="${subjects}" data-period="${period}" data-institutionclass="${classiD}" data-teacher="${teacher}">${text}</option>`;
                    select.append(option);
                });
                //loadData()
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        },
        complete: function (response) {
            console.log('Server response:', JSON.stringify(response));
        }
    });
}
$('#create_item_form').find('[name=institution_class]').on('change', function () {
    const classVal = $(this).val();
    const classParts = classVal.split('_');
    const period = classParts[0];
    const institution_class = classParts[2];

    const selectedOption = $(this).find('option:selected');
    const rawSubjectArray = selectedOption.data('subjects'); // This should be a JSON string
    console.log('g: ' + rawSubjectArray)
    $('#create_item_form').find('[name=subject]').html('');
    $('#studentList').html('');


    // Populate the subject dropdown
    const subjectDropdown = $('#create_item_form').find('[name=subject]');
    subjectDropdown.append(`<option value="">Select Subject</option>` + rawSubjectArray);

    // Store class context for reuse in subject change
    subjectDropdown.data('period', period);
    subjectDropdown.data('institution_class', institution_class);
});
$('#create_item_form').find('[name=subject]').on('change', function () {
    const subject = $(this).val();
    // const period = $(this).data('period');
    // const institution_class = $('[name=institution_class]').data('institutionclass');
    const institution_class = $('#create_item_form').find('[name=institution_class] option:selected').data('institutionclass');
    const teacher = $('#create_item_form').find('[name=institution_class] option:selected').data('teacher');
    const period = $('#create_item_form').find('[name=institution_class] option:selected').data('period');
    if (!subject || !institution_class) return;

    $('#studentList').html('Loading students...');

    $.ajax({
        url: site + "/api/get-class-student-with-marks",
        type: 'post',
        dataType: 'json',
        data: {
            period: period,
            institution_class: institution_class,
            subject: subject,
            teacher: teacher,
            user: user.iD,
            api: true
        },
        success: function (resp) {
            const data = resp || [];

            if (data.length === 0) {
                $('#studentList').html('<p class="text-muted">No students found.</p>');
                return;
            }

            let html = '';

            data.forEach(std => {
                html += `
              <div class="p-3 bg-light rounded-3 mb-3 shadow-sm">
                  <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                      <span class="fw-semibold text-primary">${std.institution_user}</span>
                      <div id="msg_${std.institution_user_id}" class="save-msg small text-muted"></div>
                  </div>
                  <div class="row text-muted small">
                      <div class="col-4">
                          <label class="fw-light">Mark</label>
                          <input type="number" name="mark_${std.institution_user_id}"
                                 value="${std.mark}"
                                 class="form-control form-control-sm mark-input text-dark fw-semibold"
                                 data-student="${std.institution_user_id}"
                                 placeholder="Mark" />
                      </div>
                      <div class="col-4">
                          <label class="fw-light">%</label>
                          <div class="text-dark fw-semibold percent-label" id="percent_${std.institution_user_id}">-</div>
                      </div>
                      <div class="col-4">
                          <label class="fw-light">Grade</label>
                          <div class="text-dark fw-semibold grade-label" id="grade_${std.institution_user_id}">-</div>
                      </div>
                  </div>
              </div>`;
            });

            $('#studentList').html(html);

            attachMarkInputHandlers(); // activate calculator logic
        },
        error: function (xhr, status, error) {
            console.error('Student load error:', error);
            $('#studentList').html('<p class="text-danger">Error loading students.</p>');
        },
        complete: function (response) {
            console.log('Server response:', JSON.stringify(response));

        }
    });
});
function attachMarkInputHandlers() {
    $('.mark-input').on('input', function () {
        updateStudentMarkDisplay($(this));
    });

    // Trigger once initially for prefilled values
    $('.mark-input').each(function () {
        updateStudentMarkDisplay($(this));
    });
}
$('#possible_mark, #grades').on('input change', function () {
    $('.mark-input').each(function () {
        updateStudentMarkDisplay($(this));
    });
});
function updateStudentMarkDisplay($input) {
    const studentId = $input.data('student');
    const mark = parseFloat($input.val());
    const possible = parseFloat($('#possible_mark').val()) || 100;
    const gradesRaw = $('#grades').val();

    let percent = '-';
    let grade = '-';

    if (!isNaN(mark) && possible > 0) {
        percent = Math.round((mark / possible) * 100);
        grade = computeGrade(percent, gradesRaw);
    }

    $('#percent_' + studentId).text(percent + (percent !== '-' ? '%' : ''));
    $('#grade_' + studentId).text(grade);
}
function computeGrade(percent, gradeStr) {
    const gradeMap = {};

    gradeStr.split(';').forEach(pair => {
        const [g, min] = pair.split(':');
        if (g && min) gradeMap[g.trim()] = parseFloat(min);
    });

    // Sort grades descending by min percentage
    const sortedGrades = Object.entries(gradeMap).sort((a, b) => b[1] - a[1]);

    for (const [grade, minPercent] of sortedGrades) {
        if (percent >= minPercent) return grade;
    }

    return 'U';
}
$('#btn_submit_item').on('click', function () {
    const subject = $('#subject').val();
    const possibleMark = parseFloat($('#possible_mark').val()) || 100;
    const gradesRaw = $('#grades').val();

    if (!subject) {
        showAlert('Please select a subject');
        return;
    }

    const _value = $('#create_item_form').find('[name=institution_class]').val().split('_');
    const classID = _value[2];

    const marks = [];

    $('#studentList .mark-input').each(function () {
       const input = $(this);
       const mark = parseFloat(input.val()) || 0;
       const studentID = input.data('student');

        const percent = Math.round((mark / possibleMark) * 100);
        const grade = computeGrade(percent, gradesRaw);

        console.log(`Student ${studentID} | Mark: ${mark}`);
        marks.push({
            student: studentID,
            subject: subject,
            possible_mark: possibleMark,
            exam: mark,
            final: percent,
            grade: grade
        });
    });

    console.log('Collected Marks:', JSON.stringify(marks));

    $('#btn_submit_item').prop('disabled', true).text('Saving...');

    $.ajax({
        url: server_url + "/m-create-reportcard",
        method: "POST",
        dataType: "json",
        data: {
            institution: current.institutioniD,
            teacher: classID,
            api: true,
            user: user.iD,

            subject: subject,
            possible_mark: possibleMark,
            grades: gradesRaw,
            marks: JSON.stringify(marks)
        },
        success: function (response) {
            // showAlert('Saved successfully!');
            console.log('Server response:', response);

            // Show feedback in rows

            marks.forEach(m => {
                const $msg = $(`#msg_${m.student}`);
                $msg.html('<span class="text-success">Saved</span>');

                setTimeout(() => {
                    $msg.fadeOut(300, () => $msg.empty().show());
                }, 1000); // 1 second
            });
        },
        error: function (xhr, status, error) {
            console.error('Error saving:', error);
            showAlert('Error saving data');

            marks.forEach(m => {
                const $msg = $(`#msg_${m.student}`);
                $msg.html('<span class="textdanger">Error</span>');

                setTimeout(() => {
                    $msg.fadeOut(300, () => $msg.empty().show());
                }, 1000); // 1 second
            });
        },
        complete: function (response) {
            console.log('Server response:', JSON.stringify(response));

            $('#btn_submit_item').prop('disabled', false).text('Submit');
        }
    });
});