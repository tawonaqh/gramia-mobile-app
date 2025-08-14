function init(activity) {
    const cacheKey = `activity_students_${activity.iD}`;
    const cached = sessionStorage.getItem(cacheKey);

    // Set initial toggle state from session storage, default to 'input' (unchecked)
    const toggleState = sessionStorage.getItem('markInputMode') === 'dropdown';
    $('#markToggle').prop('checked', toggleState);

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
    // Determine which element to create based on the toggle state
    const useDropdown = $('#markToggle').is(':checked');

    // Function to check the save button state for both input and select
    function checkDummySaveButtonState() {
        let anyMarkEntered = false;

        if (useDropdown) {
            $('#studentList select').each(function () {
                const val = parseInt($(this).val());
                if (!isNaN(val) && val !== -1) {
                    anyMarkEntered = true;
                    return false;
                }
            });
        } else {
            $('#studentList input[type="number"]').each(function () {
                const val = parseInt($(this).val());
                if (!isNaN(val) && val >= 0) {
                    anyMarkEntered = true;
                    return false;
                }
            });
        }

        const btn = $('#saveEditActivityBtn');
        btn.prop('disabled', !anyMarkEntered).toggleClass('opacity-50', !anyMarkEntered);
    }

    const container = $('<div class="row g-3">');

    students.forEach(student => {
        const card = $('<div class="col-12">').appendTo(container);
        const wrapper = $('<div class="bg-light rounded-4 p-3">').appendTo(card);

        $('<div class="fw-bold text-success mb-1">').text(student.name).appendTo(wrapper);
        $('<div class="small text-muted mb-3">').text('Student Number: ' + student.student_number).appendTo(wrapper);

        const row = $('<div class="d-flex justify-content-between align-items-center">').appendTo(wrapper);
        $('<div class="fw-medium text-dark">Mark</div>').appendTo(row);

        const markFieldContainer = $('<div style="width: 100px;" class="mark-field-container">').appendTo(row);

        // Dynamically create either a select or an input field
        const markElement = createMarkElement(student, activityiD, possible_mark, useDropdown);
        markFieldContainer.append(markElement);
    });

    $('#studentList').html(container);
    checkDummySaveButtonState();

    // Event listener for the toggle switch
    $('#markToggle').off('change').on('change', function () {
        sessionStorage.setItem('markInputMode', $(this).is(':checked') ? 'dropdown' : 'input');
        const newUseDropdown = $(this).is(':checked');

        // Loop through each student's mark field and replace it
        $('#studentList .mark-field-container').each(function (index) {
            const student = students[index];
            $(this).empty().append(createMarkElement(student, activityiD, possible_mark, newUseDropdown));
        });
        checkDummySaveButtonState();
    });
}

function createMarkElement(student, activityiD, possible_mark, useDropdown) {
    let element;

    if (useDropdown) {
        element = $('<select class="form-select form-select-sm border-0 shadow-sm bg-white rounded-2">')
            .attr('data-student-id', student.iD);

        for (let i = -1; i <= possible_mark; i++) {
            const option = $('<option>').val(i).text(i < 0 ? '--' : i);
            if (student.submission && parseInt(student.submission.mark_awarded) === i) {
                option.prop('selected', true);
            }
            element.append(option);
        }
        element.on('change', function () {
            saveMark($(this).val(), $(this).data('student-id'), activityiD);
        });
    } else {
        element = $('<input type="number" class="form-control form-control-sm border-0 shadow-sm bg-white rounded-2">')
            .attr('data-student-id', student.iD)
            .attr('min', 0)
            .attr('max', possible_mark)
            .val(student.submission && student.submission.mark_awarded ? student.submission.mark_awarded : '');

        element.on('input', function () {
            saveMark($(this).val(), $(this).data('student-id'), activityiD);
        });
    }

    return element;
}

// Separate function for saving the mark to avoid code duplication
function saveMark(mark, studentId, activityiD) {
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
            // After saving, you might want to re-check the button state
            // to ensure it's not disabled if a mark was just entered.
            checkDummySaveButtonState();
        },
        error: function (xhr, status, error) {
            console.error('Error saving mark:', error);
        }
    });
}

// To use this code, you'll need to define a `checkDummySaveButtonState` function
// in the global scope or pass it as a parameter to the `saveMark` function.
// For simplicity, let's just make it a global function.
function checkDummySaveButtonState() {
    let anyMarkEntered = false;
    const useDropdown = $('#markToggle').is(':checked');

    if (useDropdown) {
        $('#studentList select').each(function () {
            const val = parseInt($(this).val());
            if (!isNaN(val) && val !== -1) {
                anyMarkEntered = true;
                return false;
            }
        });
    } else {
        $('#studentList input[type="number"]').each(function () {
            const val = parseInt($(this).val());
            if (!isNaN(val) && val >= 0) {
                anyMarkEntered = true;
                return false;
            }
        });
    }

    const btn = $('#saveEditActivityBtn');
    btn.prop('disabled', !anyMarkEntered).toggleClass('opacity-50', !anyMarkEntered);
}