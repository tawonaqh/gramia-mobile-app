function init() {


    console.log('init c')

    console.log("current_account:", localStorage.getItem('current_account'));
    const $start = $('[name="start"]');
    const $end = $('[name="end"]');

    // Get tomorrow at 12:00


    function formatDateTimeLocal(dt) {
        const pad = n => n.toString().padStart(2, '0');
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }

    const tomorrowMidday = getTomorrowMidday();
    $start.val(formatDateTimeLocal(tomorrowMidday));

    const endDate = new Date(tomorrowMidday.getTime() + 60 * 60 * 1000); // +1 hour
    $end.val(formatDateTimeLocal(endDate));

    $start.on('change', function () {
        const startVal = new Date($(this).val());
        if (!isNaN(startVal.getTime())) {
            const newEnd = new Date(startVal.getTime() + 60 * 60 * 1000);
            $end.val(formatDateTimeLocal(newEnd));
        }
    });
    get_event_categories()

   // new working
   load_periods();
   populateStartTimes();
   populateDurations();
}

function get_event_categories(useCache = true) {
    const cacheKey = 'cached_event_categories';
    const uri = site + "/get-event-categories";

    if (useCache) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
         //   const response = JSON.parse(cached);
            $('[name=eventCategory]').html(data.responseText)

           // return;
        }
    }

    const _form = {
        api: true,
        user: user.iD,
        institution_user: current.iD,
        institution: current.institutioniD
    };

    $.ajax({
        url: uri,
        type: 'post',
        data: _form,
        success: function (response) {
            localStorage.setItem(cacheKey, (response));
            $('[name=eventCategory]').html(response)

        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

$('#btn_submit_item').on('click', function () {
    overlay('start');
    current = JSON.parse(localStorage.getItem("current_account"));

    console.log('submitting...')
    var msg = $('#form_result'), _btn = $(this), _form = $('#_form').serialize() + "&institution=" + current.institutioniD + "&institution_user=" + current.iD + "&user=" + user.iD+ "&api=true";

    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/api/create-event";
    console.log("uri: " + _form);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            overlay('stop');


            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Add Another");

            //showAlert(rString) //get_pagination();
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
            msg.html(create_message("Error loading data " + JSON.stringify(error) + " xhr: " + xhr));
        }
    });

})

function load_periods() {
    current = JSON.parse(localStorage.getItem("current_account"));
    user = JSON.parse(localStorage.getItem("user"));

    const uri = site + "/api/get-periods";
    const _form = {
        api: true,
        user: user.iD,
        institutioniD: current.institutioniD
    };

    $.ajax({
        url: uri,
        type: "POST",
        data: _form,
        dataType: "json",
        success: function (data) {
            console.log("📌 Periods response:", data);

            const $periodSelect = $("[name=period]");
            $periodSelect.html('<option value="">Select Period</option>');

            if (data.records && data.records.length > 0) {
                data.records.forEach(p => {
                    console.log(`➡️ ID: ${p.iD}, Name: ${p.name}`);
                    $periodSelect.append(
                        `<option value="${p.iD}">${p.name}</option>`
                    );
                });

                // 🔹 HOOK GOES HERE
                $periodSelect.off("change").on("change", function () {
                    const selectedPeriod = $(this).val();
                    localStorage.setItem("selected_period", selectedPeriod);
                    console.log("✅ Selected period:", selectedPeriod);

                    // fetch and fill days
                    load_period_days(selectedPeriod);
                });
            }
        },
        error: function (xhr, status, error) {
            console.error("❌ Failed to fetch periods:", error, xhr.responseText);
        }
    });
}

function load_period_days(periodID) {
    if (!periodID) {
        $("[name=periodDay]").html('<option value="">Select Day</option>');
        return;
    }

    const uri = site + "/api/get-period-days";
    const _form = { api: true, periodiD: periodID };

    $.ajax({
        url: uri,
        type: "POST",
        data: _form,
        dataType: "json",
        success: function (data) {
            console.log("📌 Days response:", data);

            const $daySelect = $("[name=periodDay]");
            $daySelect.html('<option value="">Select Day</option>');

            if (data.records && data.records.length > 0) {
                data.records.forEach(d => {
                    console.log(`➡️ Day ID: ${d.iD}, Date: ${d.date}, Name: ${d.name}`);
                    $daySelect.append(
                        `<option value="${d.iD}">${d.date}</option>`
                    );
                });

                // Auto-store when user selects
                $daySelect.off("change").on("change", function () {
                    const selectedDay = $(this).val();
                    localStorage.setItem("selected_periodDay", selectedDay);
                    console.log("✅ Selected periodDay:", selectedDay);
                });
            }
        },
        error: function (xhr, status, error) {
            console.error("❌ Failed to fetch days:", error, xhr.responseText);
        }
    });
}

function populateStartTimes() {
    const $startSelect = $('#_form').find('[name=start]');
    $startSelect.html('<option value="">Select Start Time</option>');

    const intervals = [];
    for (let h = 0; h < 24; h++) {   // 00 → 23 hours
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            intervals.push(`${hour}:${minute}`);
        }
    }

    intervals.forEach(time => {
        $startSelect.append(`<option value="${time}">${time}</option>`);
    });
}

// Function to populate the duration dropdown
function populateDurations() {
    // Select the duration dropdown within the form by its name attribute.
    const $durationSelect = $('#_form').find('[name=duration]');

    // Clear any existing options and add a default placeholder.
    $durationSelect.html('<option value="">Select Duration</option>');

    // Loop to generate options in 15-minute increments.
    for (let h = 0; h <= 4; h++) { // hours from 0 to 4
        for (let m = (h === 0 ? 15 : 0); m < 60; m += 15) { // minutes in 15-minute steps
            // Break out of the inner loop if we're at the 4-hour mark (h=4) and minutes aren't 0.
            if (h === 4 && m > 0) break;

            // Calculate the total duration in minutes.
            const totalMinutes = (h * 60) + m;
            let text = '';

            // Format the text for display (e.g., "15 minutes", "1 hour", "1 hour 30 minutes").
            if (h > 0) {
                text += `${h} hour${h > 1 ? 's' : ''}`;
                if (m > 0) {
                    text += ` ${m} minute${m > 1 ? 's' : ''}`;
                }
            } else {
                text = `${m} minute${m > 1 ? 's' : ''}`;
            }

            // Append the new option to the select element.
            $durationSelect.append(
                `<option value="${totalMinutes}">${text}</option>`
            );
        }
    }
}