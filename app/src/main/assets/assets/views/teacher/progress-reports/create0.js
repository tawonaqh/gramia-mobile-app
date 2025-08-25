function init() {
    const today = new Date().toISOString().split('T')[0];
    $('#dayLong').val(today);
    get_classes()
    $(document).on('focus', 'input[type="number"]', function () {
        $(this).select();
    });
    $('#create_item_form').find('[name=institution_class]').on('change', function () {
        var uri = site + "/get-class-students";

        $('#create_item_form').find('#studentList').html('');

        if ($('#create_item_form').find('[name=institution_class]').val() != "") {
            var _value = $('#create_item_form').find('[name=institution_class]').val().split('_');
            var _form = {
                period: _value[0],
                institution_class: _value[2],
                teacher: _value[2],
                user: user.iD,
                api: true
            };
            console.log("; frv: " + $('#create_item_form').find('[name=institution_class]').val())

            console.log('gjh: ' + JSON.stringify(_form))

            $.ajax({
                url: uri,
                type: 'post',
                dataType: 'json', // Expect JSON response
                data: _form,
                complete: function (resp) {

                    console.log('ls:' + JSON.stringify(resp));
                    var dt = (JSON.parse(resp.responseText))
                    data = dt.records
                    console.error('Dt:' + JSON.stringify(data));

                    if (Array.isArray(data) && data.length > 0) {
                        // generateStudentListMobile(data);
                        const select = $('[name=students]');
                        select.html('');

                        data.forEach(function (item) {
                            const text = item.institution_user;
                            const id = item.institution_user_id;
                            const option = `<option value="${id}" data-description="${text}">${text}</option>`;
                            select.append(option);
                        });
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
        } else {
            $('#studentList').html('');
        }
        if ($('#create_item_form').find('[name=institution_class]').val() != "") {
            const selectedOption = $('#create_item_form').find('[name=institution_class]').find('option:selected');
            const subjectString = selectedOption.data('subjects');

            if (!subjectString) return;

            const subjects = subjectString.split(';').map(name => name.trim());


             let listHtml = '';

                        subjects.forEach((subjectName, index) => {
                            listHtml += `
                                <div class="bg-light border rounded-3 p-3 mb-3 shadow-sm" data-subject-index="${index}">
                                    <div class="fw-semibold text-primary mb-2">${subjectName}</div>

                                    <div class="row g-2 mb-2">
                                        <div class="col-6">
                                            <label class="small mb-1">Term Mark</label>
                                            <input type="number"  inputmode="numeric" value="0" class="form-control form-control-sm term-mark" placeholder="Term">
                                        </div>
                                        <div class="col-6">
                                            <label class="small mb-1">Exam Mark</label>
                                            <input type="number"  inputmode="numeric" value="0" class="form-control form-control-sm exam-mark" placeholder="Exam">
                                        </div>
                                    </div>

                                    <div class="row g-2">
                                        <div class="col-6">
                                            <label class="small mb-1">Final Mark</label>
                                            <input type="number"  inputmode="numeric" value="0" class="form-control form-control-sm final-mark" placeholder="Final">
                                        </div>
                                        <div class="col-6">
                                            <label class="small mb-1">Grade</label>
                                            <select class="form-select form-select-sm grade">
                                                <option>A</option><option>B</option><option>C</option>
                                                <option>D</option><option>E</option><option>F</option><option selected>U</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        $('#subjectListContainer').html(listHtml); // append to a new div container
        }
    });
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
            console.log('j:' + JSON.stringify(response));

            if (response && response.length > 0) {
                const select = $('[name=institution_class]');
                select.html('<option value="">Select Class</option>');

                response.forEach(function (item) {
                    const text = item.name + ' [' + item.period + '] ';
                    const id = item.periodiD + "_" + item.classiD + "_" + item.iD
                    const subjects = item.subjects;
                    const option = `<option value="${id}" data-subjects="${subjects}">${text}---</option>`;
                    select.append(option);
                });
                //loadData()
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}
$('#create_item_form').find('[name=institution_class]').on('change', function () {
    const classVal = $(this).val();
    const classParts = classVal.split('_');
    const period = classParts[0];
    const institution_class = classParts[2];

    const selectedOption = $(this).find('option:selected');
    const subjectString = selectedOption.data('subjects');

    $('#create_item_form').find('[name=subject]').html('');
    $('#studentList').html('');

    if (!subjectString) return;

    const subjectDropdown = $('#create_item_form').find('[name=subject]');
    const subjects = subjectString.split(';').map(name => name.trim());

    subjectDropdown.append(`<option value="">Select Subject</option>`);
    subjects.forEach(subj => {
        subjectDropdown.append(`<option value="${subj}">${subj}</option>`);
    });

    // Store class context for reuse in subject change
    subjectDropdown.data('period', period);
    subjectDropdown.data('institution_class', institution_class);
});
$('#create_item_form').find('[name=subject]').on('change', function () {
    const subject = $(this).val();
    const period = $(this).data('period');
    const institution_class = $(this).data('institution_class');

    if (!subject || !institution_class) return;

    $('#studentList').html('Loading students...');

    $.ajax({
        url: site + "/get-class-students",
        type: 'post',
        dataType: 'json',
        data: {
            period: period,
            institution_class: institution_class,
            teacher: institution_class,
            user: user.iD,
            api: true
        },
        success: function (resp) {
            const data = resp.records || [];

            if (data.length === 0) {
                $('#studentList').html('<p class="text-muted">No students found.</p>');
                return;
            }

            let html = `<div class="table-responsive"><table class="table table-borderless align-middle">
                <thead>
                    <tr class="bg-light">
                        <th>Name</th>
                        <th style="width: 120px;">Mark</th>
                        <th style="width: 100px;"></th>
                    </tr>
                </thead>
                <tbody>`;

            data.forEach(std => {
                html += `
                    <tr>
                        <td>${std.institution_user}</td>
                        <td>
                            <input type="number" name="mark_${std.institution_user_id}" class="form-control form-control-sm" placeholder="Mark" />
                        </td>
                        <td>
                            <div class="save-msg text-success small" id="msg_${std.institution_user_id}"></div>
                        </td>
                    </tr>`;
            });

            html += `</tbody></table></div>`;
            $('#studentList').html(html);
        },
        error: function (xhr, status, error) {
            console.error('Student load error:', error);
            $('#studentList').html('<p class="text-danger">Error loading students.</p>');
        }
    });
});
$('#btn_submit_item').on('click', function () {
    const studentID = $('[name=students]').val();
    const marks = [];

    // Extract teacher/class ID
    const _value = $('#create_item_form').find('[name=institution_class]').val().split('_');
    const classID = _value[2];

    // Iterate over each subject card
    $('#create_item_form .bg-light[data-subject-index]').each(function () {
        const $card = $(this);
        const subject = $card.find('.fw-semibold').text().trim();

        const termMark = parseFloat($card.find('.term-mark').val()) || 0;
        const examMark = parseFloat($card.find('.exam-mark').val()) || 0;
        const finalMark = parseFloat($card.find('.final-mark').val()) || 0;
        const grade = $card.find('.grade').val();

        marks.push({
            subject: subject,
            term: termMark,
            exam: examMark,
            final: finalMark,
            grade: grade
        });
    });

    console.log('Collected Marks:', JSON.stringify(marks));

    // Disable submit button to prevent multiple submissions
    $('#btn_submit_item').prop('disabled', true).text('Saving...');

    $.ajax({
        url: server_url + "/create-reportcard",
        method: "POST",
        dataType: "json",
        data: {
            institution: current.institutioniD,
            teacher: classID,
            api: true,
            user: user.iD,
            student: studentID,
            marks: JSON.stringify(marks)
        },
        success: function (response) {
            showAlert(JSON.stringify(response));
        },
        error: function (xhr, status, error) {
            console.error('Failed to submit report card:', error);
            showAlert('Error saving data');
        },
        complete: function (response) {
                    console.log('Eno' + JSON.stringify(response));

            $('#btn_submit_item').prop('disabled', false).text('Submit');
        }
    });
});