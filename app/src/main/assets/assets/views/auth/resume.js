$(document).ready(function () {

    resetIdleTimer(); // restart timer on unlock screen
    $('#username').text(user?.name || "Guest");
    $("#unlockPassword").val(user.password)
    window.validateUnlock = function () {
        const inputPass = $("#unlockPassword").val().trim();
        // const user = JSON.parse(localStorage.getItem("current_account"));

        if (!user || !user.password) {
            showAlert("No user session found", "Error");
            return;
        }

        if (inputPass === user.password) {
            const resumeData = localStorage.getItem('resumeView');
            console.log('rsm: ' + resumeData)
            if (resumeData) {
                try {
                    const view = JSON.parse(resumeData);
                    if (view && view.view) {
                        loadView(view.view, 'fade', view.data);
                        localStorage.removeItem('resumeView'); // Clear after use
                        return;
                    }
                } catch (e) {
                    console.error("Resume data invalid:", e);
                }
            }

            // fallback
            navigateTo("dashboard");
        } else {
            $('#msg').html(create_message('warning', "Incorrect password Try again"));
        }
    };
});
