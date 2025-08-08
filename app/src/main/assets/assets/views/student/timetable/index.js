key = 'studenttimetable_' + current.iD

function init(data){
    current_page = 1;
               console.log('init: ' )

  current = JSON.parse(localStorage.getItem("current_account"));
  if (!current) return showAlert("No student account found");
    selectedClass = getSelectedClass();
            if (selectedClass) {
            console.log('stri: ' + JSON.stringify(selectedClass))
                console.log("Selected class name:", selectedClass.institution_class);
                console.log("Selected period:", selectedClass.period);
                 $('.class-id').html(selectedClass.institution_class + ' ' + selectedClass.period)
                    if (navigator.onLine) {  loadData(true); }else{ loadData(); }

            } else {
                showAlert("No class selected.");
                 $('.class-id').html("No class selected.")
                     $('#results').html('No class selected');

            }
}
function loadData(forceRefresh = false) {

    if (localStorage.getItem(key) && !forceRefresh) {
        data = JSON.parse(localStorage.getItem(key));
           // displayResults(data.records, data.pagination);
            renderCompactTimetable(data.weeks)

            localStorage.setItem("current_record", JSON.stringify(data.records));
        return;
    }
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    $('#results').html('loading...');
   // const province = $('.search').find('[name=province]').val();
       var n_institution = current.institutioniD;
                var n_institution_role = '';// $('.search').find('[name=institution_role]').val();
             var n_user = user.iD;
    var n_institution_user = current.iD;



     const search =  $('input[name="search"]').val();
        const ps = $('#page_size').val() || '10';
        const ob =  $('input[name="order_filter"]:checked').val();

    // Set default or capture from a pagination control
    var uri = site + "/get-student-timetable";
    console.log('uri:  ' + uri + "; pr: " + n_institution)
    $.ajax({
        url: uri,
        type: "POST",
        data: {
            search: search,
            page: current_page,
            order_by: ob,
            page_size: ps, // Or capture from a page-size selector if available
            institution: n_institution,
            user: n_user,
            api: true,
            institution_role: n_institution_role,
            institution_user: n_institution_user,
 period: selectedClass.periodiD,
             institution_class: selectedClass.classiD
        },
        success: function (response) {
           console.log('res: ' + response)
            const data = JSON.parse(response);
            localStorage.setItem("current_record", JSON.stringify(data.records));
            localStorage.setItem(key, response);

            //displayResults(data.records, data.pagination);
             renderCompactTimetable(data.weeks)
           // $('#total_records_label').html(data.pagination.total_records)
        },
        error: function () {
            alert('Error loading data');
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

