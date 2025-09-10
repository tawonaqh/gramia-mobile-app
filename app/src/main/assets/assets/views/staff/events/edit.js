function init(data) {
        console.log('init edit', data);

        // Populate the form fields with existing data
        $('[name="itemiD"]').val(data.iD);
        $('[name="name"]').val(data.name);
        $('[name="description"]').val(data.description);
        $('[name="status"]').val(data.status.id);
        $('[name="allowRSVP"]').val(data.allowRSVP == 'True' ? 1 : 0 );

        // Load dropdowns and pre-select values
        get_event_categories(data.eventCategory);
        const dbDay = parseDisplayDateToDB(data.periodDay);
        load_periods(data.period, dbDay);
        populateStartTimes(data.start);
        populateDurations(data.duration);
    }

    function get_event_categories(categ, useCache = true) {
        const cacheKey = 'cached_event_categories';
        const uri = site + "/get-event-categories";

        if (useCache) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                $('[name=eventCategory]').html(cached);

                // Logic to find and select the option by text
                $('[name="eventCategory"] option').each(function() {
                    if ($(this).text() === categ) {
                        $(this).prop('selected', true);
                        return false; // Break the loop
                    }
                });
                return;
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
                localStorage.setItem(cacheKey, response);
                $('[name=eventCategory]').html(response);

                // Logic to find and select the option by text
                $('[name="eventCategory"] option').each(function() {
                    if ($(this).text() === categ) {
                        $(this).prop('selected', true);
                        return false; // Break the loop
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error('Failed to fetch class list:', error);
            }
        });
    }

    function load_periods(selectedPeriod, selectedDay) {
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
                const $periodSelect = $("[name=period]");
                $periodSelect.html('<option value="">Select Period</option>');

                if (data.records && data.records.length > 0) {
                    let selectedPeriodId = null;

                    data.records.forEach(p => {
                        $periodSelect.append(`<option value="${p.iD}">${p.name}</option>`);
                        // Find the ID that matches the name
                        if (p.name === selectedPeriod) {
                            selectedPeriodId = p.iD;
                        }
                    });

                    // Pre-select the correct period using the found ID
                    if (selectedPeriodId) {
                        $periodSelect.val(selectedPeriodId);
                        // Then, fetch and fill days for the selected period
                        // and pass the day's name to the next function
                        load_period_days(selectedPeriodId, selectedDay);
                    }

                    $periodSelect.off("change").on("change", function () {
                        const newSelectedPeriod = $(this).val();
                        load_period_days(newSelectedPeriod);
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error("❌ Failed to fetch periods:", error, xhr.responseText);
            }
        });
    }

    function load_period_days(periodID, selectedDayName) {
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
                const $daySelect = $("[name=periodDay]");
                $daySelect.html('<option value="">Select Day</option>');

                if (data.records && data.records.length > 0) {
                    let selectedDayId = null;

                    data.records.forEach(d => {
                        // Create the full text as it appears in the dropdown
                        const optionText = `${d.date}`;
                        $daySelect.append(`<option value="${d.iD}">${optionText}</option>`);

                        // Find the ID that matches the full name
                        if (optionText === selectedDayName) {
                            selectedDayId = d.iD;
                        }
                    });

                    // Pre-select the correct day using the found ID
                    if (selectedDayId) {
                        $daySelect.val(selectedDayId);
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error("❌ Failed to fetch days:", error, xhr.responseText);
            }
        });
    }

    function populateStartTimes(selectedTime) {
        const $startSelect = $('#_form').find('[name=start]');
        $startSelect.html('<option value="">Select Start Time</option>');

        const intervals = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hour = h.toString().padStart(2, '0');
                const minute = m.toString().padStart(2, '0');
                intervals.push(`${hour}:${minute}`);
            }
        }

        intervals.forEach(time => {
            $startSelect.append(`<option value="${time}">${time}</option>`);
        });

        // Pre-select the correct start time
        if (selectedTime) {
            $startSelect.val(selectedTime);
        }
    }

    function populateDurations(selectedDuration) {
        const $durationSelect = $('#_form').find('[name=duration]');
        $durationSelect.html('<option value="">Select Duration</option>');

        for (let h = 0; h <= 4; h++) {
            for (let m = (h === 0 ? 15 : 0); m < 60; m += 15) {
                if (h === 4 && m > 0) break;
                const totalMinutes = (h * 60) + m;
                let text = '';
                if (h > 0) {
                    text += `${h} hour${h > 1 ? 's' : ''}`;
                    if (m > 0) {
                        text += ` ${m} minute${m > 1 ? 's' : ''}`;
                    }
                } else {
                    text = `${m} minute${m > 1 ? 's' : ''}`;
                }
                $durationSelect.append(
                    `<option value="${totalMinutes}">${text}</option>`
                );
            }
        }

        // Pre-select the correct duration
        if (selectedDuration) {
            $durationSelect.val(selectedDuration);
        }
    }

    $('#btn_submit_item').on('click', function () {
        overlay('start');
        current = JSON.parse(localStorage.getItem("current_account"));
        user = JSON.parse(localStorage.getItem("user"));

        console.log('submitting update...');
        const msg = $('#form_result'),
              _btn = $(this),
              _form = $('#_form').serialize() + "&institution=" + current.institutioniD + "&institution_user=" + current.iD + "&user=" + user.iD + "&api=true";

        msg.html("");
        _btn.attr("disabled", "true");
        _btn.html("Processing...");

        const uri = site + "/api/update-event";

        $.ajax({
            url: uri,
            type: 'POST',
            dataType: 'json', // Corrected dataType
            data: _form,
            complete: function (data) {
                overlay('stop');
                _btn.removeAttr("disabled");
                console.log("rs: ", data.responseText);

                try {
                    const result = JSON.parse(data.responseText);
                    if (result.status === 1) {
                        msg.html(create_message("success", result.message));
                        _btn.html("Update Again");
                    } else {
                        _btn.html("Try again");
                        msg.html(create_message("danger", result.message));
                    }
                } catch (e) {
                    console.error("JSON parsing error:", e);
                    _btn.html("Try again");
                    msg.html(create_message("danger", "An unexpected error occurred."));
                }
            },
            error: function (xhr, status, error) {
                console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
                msg.html(create_message("Error loading data " + JSON.stringify(error) + " xhr: " + xhr));
            }
        });
    });

    function parseDisplayDateToDB(dateStr) {
        const parts = dateStr.split(' '); // ["01", "Apr", "2025"]
        if (parts.length !== 3) return null;
        const day = parts[0].padStart(2, '0');
        const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const monthIndex = monthNames.indexOf(parts[1]);
        if (monthIndex === -1) return null;
        const month = String(monthIndex + 1).padStart(2, '0');
        const year = parts[2];
        return `${year}-${month}-${day}`;
    }

