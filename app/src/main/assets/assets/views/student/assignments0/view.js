function init(data) {
    $('#assignmentTitle').text(data.name);
    $('#assignmentDescription').text(data.description);
    $('#assignmentOpen').text(data.open);
    $('#assignmentClose').text(data.close);
    $('#classActivityID').val(data.iD);

    const questionList = $('#questionList').html('');
    data.questions.forEach((q, i) => {
        questionList.append(`
            <div class="card mb-3">
                <div class="card-body">
                    <label class="form-label">Question ${i + 1}: ${q.name}</label>
                    <input type="hidden" name="question_ids[]" value="${q.iD}">
                    <textarea name="responses[]" class="form-control" rows="2" required placeholder="Your answer here..."></textarea>
                </div>
            </div>
        `);
    });
}

$('#assignmentResponseForm').on('submit', function(e) {
    e.preventDefault();

    const formData = $(this).serialize();

    $.post(site + '/submit-assignment-response', formData, function(response) {
        if (response.status === 'success') {
            showAlert('Responses submitted successfully!', 'success');
        } else {
            showAlert('Something went wrong. Please try again.', 'danger');
        }
    });
});