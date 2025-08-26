key = 'studenttimetable_' + current.iD

async function init(data){
    current_page = 1;
    console.log('init: ' + data);

    current = JSON.parse(localStorage.getItem("current_account"));
    if (!current) return showAlert("No student account found");

    try {
        const studentDetails = await fetchStudentTimetableData(current.account_no);
        console.log('Fetched Class ID & Period:', studentDetails.classID, '_', studentDetails.periodID);

        // Store the IDs in localStorage
        localStorage.setItem('studentPeriodID', studentDetails.periodID);
        localStorage.setItem('studentClassID', studentDetails.classID);

        loadData(true);

        $('.class-id').html('Class: ' + studentDetails.classID + ', Period: ' + studentDetails.periodID);

    } catch (error) {
        console.error("Error in init:", error);
        showAlert(error);
        $('.class-id').html("Class details not available.");
        $('#results').html('Class details not available.');
    }
}
function loadData(forceRefresh = false) {
    // Retrieve the IDs from localStorage
    const periodID = localStorage.getItem('studentPeriodID');
    const classID = localStorage.getItem('studentClassID');

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
        renderCompactTimetable(data.weeks);
        localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }

    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return;
    }

    // Check if IDs exist in storage.
    if (!periodID || !classID) {
        showAlert('Your class was not found. Please reload the page.');
        return;
    }

    $('#results').html('loading...');

    var n_institution = current.institutioniD;
    var n_user = user.iD;
    var n_institution_user = current.iD;

    const uri = site + "/get-student-timetable";
    console.log('uri: ' + uri);

    $.ajax({
        url: uri,
        type: "POST",
        data: {
            institution: n_institution,
            user: n_user,
            api: true,
            institution_user: n_institution_user,
            period: periodID,
            institution_class: classID
        },
        success: function(response) {
            console.log('res: ' + response);
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);
            renderCompactTimetable(data.weeks);
        },
        error: function() {
            showAlert('Error loading data');
        }
    });
}
function renderCompactTimetable(weeks) {
    const container = $('#results');
    container.empty();

    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    const dayTabs = $('<div class="d-flex mb-3 overflow-auto gap-2"></div>');
    const slotsWrapper = $('<div id="slotsContainer"></div>');

    weeks.forEach((week, index) => {
        const weekName = week.name.toLowerCase();
        const isToday = weekName === currentDayName;

        const btn = $(`
            <button class="weekday-tab btn rounded-3 px-4 py-2 fw-semibold border-0 ${
                isToday ? 'bg-success text-dark' : 'bg-light-subtle text-success'
            }">
                ${week.name}
            </button>
        `);

        btn.on('click', function () {
            $('#slotsContainer').html(renderDaySlots(week));

            $(this).siblings().removeClass('bg-success text-dark')
                              .addClass('bg-light-subtle text-success');
            $(this).removeClass('bg-light-subtle text-success')
                   .addClass('bg-success text-dark');
        });

        dayTabs.append(btn);

        if (isToday) {
            slotsWrapper.append(renderDaySlots(week));
        }
    });

    container.append(dayTabs).append(slotsWrapper);

    // If today not found (rare), fallback to Monday
    if ($('#slotsContainer').is(':empty') && weeks.length > 0) {
        $('#slotsContainer').html(renderDaySlots(weeks[1]));
        dayTabs.children().eq(1).removeClass('bg-light-subtle text-success')
                             .addClass('bg-success text-dark');
    }
}
function renderDaySlots(week) {
    const slotGrid = $('<div class="row g-2"></div>');

    for (let i = 0; i < week.slots.length; i += 2) {
        const left = week.slots[i];
        const right = week.slots[i + 1];

        const leftCol = renderSlotCard(left);
        const rightCol = right ? renderSlotCard(right) : $('<div class="col-6"></div>');

        const row = $('<div class="d-flex gap-2"></div>');
        row.append(leftCol).append(rightCol);
        slotGrid.append(row);
    }

    return slotGrid;
}
function renderSlotCard(slot) {
    return $(`
        <div class="col-6">
            <div class="bg-light rounded-3 p-3 text-center" style="min-height: 80px;">
                <div class="fw-semibold text-dark mb-1 text-capitalize">${slot.activity}</div>
                <div class="text-muted small">${slot.start}–${slot.end}</div>
            </div>
        </div>
    `);
}

function renderMobileTimetable(weeks) {
    const container = $('#results');
    container.empty();

    weeks.forEach(week => {
        const daySection = $(`
            <div class="card mb-3 shadow-sm">
                <div class="card-header bg-primary-subtle fw-bold text-primary">
                    ${week.name}
                </div>
                <ul class="list-group list-group-flush" id="day-${week.iD}"></ul>
            </div>
        `);

        const list = daySection.find(`#day-${week.iD}`);

        week.slots.forEach(slot => {
            const slotRow = $(`
                <li class="list-group-item d-flex justify-content-between align-items-start py-2">
                    <div>
                        <div class="fw-medium">${slot.name}</div>
                        <small class="text-muted">${slot.start} – ${slot.end}</small>
                    </div>
                    <button class="btn btn-sm btn-outline-secondary text-nowrap activity-button"
                            data-week="${week.iD}"
                            data-slot="${slot.iD}"
                            data-activity="${slot.activity}">
                        ${slot.activity}
                    </button>
                </li>
            `);

            list.append(slotRow);
        });

        container.append(daySection);
    });
}
function renderTimetable(weeks) {
    $('#results').html('loading...');

  timetableData = weeks; // cache it
  const days = weeks.map(w => w.name);
  const periods = weeks[0].slots.map((slot, idx) => ({
    index: idx,
    name: slot.name,
    time: `${slot.start} - ${slot.end}`
  }));

  let table = `<table class="table table-bordered text-center align-middle">
    <thead class="bg-dark"><tr><th>Period</th>`;

  days.forEach(day => {
    table += `<th>${day}</th>`;
  });
  table += `</tr></thead><tbody>`;

  periods.forEach((period, slotIdx) => {
    table += `<tr><td><strong>${period.name}</strong><br><small>${period.time}</small></td>`;
    weeks.forEach((week, weekIdx) => {
      const slot = week.slots[slotIdx];
      const cellId = `cell-${weekIdx}-${slotIdx}`;
      table += `<td id="${cellId}" class="activity-cell text-primary fw-semibold" style="cursor:pointer;"
                data-week="${weekIdx}" data-slot="${slotIdx}">
                ${slot.activity}
              </td>`;
    });
    table += `</tr>`;
  });

  table += `</tbody></table>`;
  $('#results').html(table);
}
function displayResults(records, pagination) {
    $('#results').html('');

    if (records.length > 0) {
        const start = (pagination.current_page - 1) * $('[name="page_size"]').val() + 1;
currentView = 'list'
        if (currentView === 'list') {
            // List View
            records.forEach((item, index) => {
                state='d-flex'
                if(item.status.iD!='1'){ state='d-none'}
                let template = document.getElementById('list_template').cloneNode(true);
                template.style.display = 'block';
                template.removeAttribute('id');
                template.innerHTML = template.innerHTML
                  .replace('@item_name',  item.name)

                  .replace("@institution_user_name", item.institution_user)
                 .replace("@name_name", item.name)
                 .replace("@phone_name", item.phone)
                 .replace("@email_name", item.email)
                 .replace("@occupation_name", item.occupation)
                 .replace("@guardianType_name", item.guardianType)
                 .replace('@status_name', item.status.name)
                 .replace('@item_id', item.iD);

                template.classList.add('fade-in');
                setTimeout(() => {
                    $('#results').append(template);
                    requestAnimationFrame(() => {
                        template.classList.add('show');
                    });
                },  200);
            });
        }

        renderPaginationDropdown(pagination)

    } else {
        $('#results').html('<p>No records found.</p>');
    }
}
function fetchStudentTimetableData(accountID) {
    return new Promise((resolve, reject) => {
        if (!navigator.onLine) {
            reject('No Internet Connection');
            return;
        }

        const uri = site + "/api/get-student-class-details";
        var n_user = user.iD;

        console.log("accountID: " + accountID);

        $.ajax({
            url: uri,
            type: "POST",
            data: {
                user: n_user,
                accountID: accountID,
                api: true
            },
            success: function(response) {
                try {
                    const data = JSON.parse(response);
                    if (data && data.periodID && data.classID) {
                        resolve({
                            periodID: data.periodID,
                            classID: data.classID
                        });
                    } else {
                        reject('Invalid response from server.');
                    }
                } catch (e) {
                    reject('Failed to parse server response.');
                }
            },
            error: function(xhr, status, error) {
                reject('Error fetching student data: ' + status);
            }
        });
    });
}

