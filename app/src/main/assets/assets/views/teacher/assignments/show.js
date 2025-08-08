function init(activity) {
    const cacheKey = `activity_table_${activity.iD}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached && (!navigator.onLine)) {
        console.log('Loaded student table from cache.');
        const data = JSON.parse(cached);
        generateStudentListSummary(data, activity);
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
                generateStudentListSummary(data, activity);
            } else {
                $('#studentList').html('<p class="text-muted">No students found for this class.</p>');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading students:', error);
            $('#studentList').html('<p class="text-danger">Error loading students.</p>');
        }
    });
}
function generateStudentListSummary(students, activity) {
    const possible_mark = activity.possible_mark;
    const container = $('<div class="row g-3">');

    students.forEach(student => {
        const markAwarded = parseFloat(student.submission?.mark_awarded || 0);
        const percent = possible_mark > 0 ? ((markAwarded / possible_mark) * 100).toFixed(1) : 0;
        const grade = getGradeFromPercent(percent);

        const card = $('<div class="col-12">').appendTo(container);
        const wrapper = $(`
            <div class=" rounded p-3 bg-light ">
                <div class="fw-semibold text-dark mb-2" style="color: #004d4d;">
                    ${student.name}
                </div>
                <div class="row small text-dark mb-1">
                    <div class="col-6">Mark Obtained:</div>
                    <div class="col-6 text-end fw-bold" style="color: #00c48c;">${markAwarded} / ${possible_mark}</div>
                </div>
                <div class="row small text-dark mb-1">
                    <div class="col-6">Percent:</div>
                    <div class="col-6 text-end fw-bold" style="color: #00c48c;">${percent}%</div>
                </div>
                <div class="row small text-dark">
                    <div class="col-6">Grade:</div>
                    <div class="col-6 text-end fw-bold" style="color: #00c48c;">${grade}</div>
                </div>
            </div>
        `);
        card.append(wrapper);
    });

    $('#studentList').html(container);
}
function generateStudentTable(students, activity) {
    const possible_mark = activity.possible_mark;

    const table = $(`
        <div class="table-responsive">
            <table class="table mb-0" style="
                border-collapse: separate;
                border-spacing: 0;
                width: 100%;
                border: 2px solid #00c48c;
                border-radius: 8px;
                overflow: hidden;
            ">
                <thead style="background-color: #004d4d; color: white;">
                    <tr>
                        <th style="padding: 12px;">Student</th>
                        <th style="padding: 12px;">Mark Obtained</th>

                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `);

    const $tbody = table.find('tbody');

    students.forEach(student => {
        const markAwarded = parseFloat(student.submission?.mark_awarded || 0);
        const percent = possible_mark > 0 ? ((markAwarded / possible_mark) * 100).toFixed(1) : 0;
        const grade = getGradeFromPercent(percent);

        const $tr = $(`
            <tr style="border-top: 1px solid #00c48c; color: #00c48c;">
                <td style="padding: 12px; color: #000; font-weight: 600;">${student.name}</td>
                <td style="padding: 12px;">${markAwarded} / ${possible_mark}</td>

            </tr>
        `);

        $tbody.append($tr);
    });

    $('#studentList').html(table);
}
function getGradeFromPercent(percent) {
    const p = parseFloat(percent);
    if (p >= 75) return 'A';
    if (p >= 65) return 'B';
    if (p >= 50) return 'C';
    if (p >= 40) return 'D';
    return 'F';
}