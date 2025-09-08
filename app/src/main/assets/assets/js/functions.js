
$(document).on("click", "a.load-view", function (e) {
    e.preventDefault(); // prevent default navigation
    const view = $(this).attr("href");
    loadView(view.replace(".html", "").replace("assets/views/", ""));
});
function openFileExternally(url) {
    if (typeof AndroidInterface !== "undefined" && AndroidInterface.openUrlExternally) {
        AndroidInterface.openUrlExternally(url);
    } else {
        window.open(url, '_blank');
    }
}
function submit_form(form) {

    //  $('#loadingOverlay').show();
    console.log('submitting...')
    var msg = form.find('#form_result'), _btn = form.find('#btn_create_item'), _form = form.serialize();
    msg.html(""); _btn.attr("disabled", "true"); _btn.html("Processing...");
    var uri = site + "/" + table;
    console.log("uri: " + uri);
    $.ajax({
        url: uri, type: 'POST', dataType: 'application/json', data: _form,
        complete: function (data) {
            //  $('#loadingOverlay').hide();

            _btn.removeAttr("disabled"); console.log("rs: " + data.responseText.toString());
            var result = JSON.parse(data.responseText.toString());

            _btn.html("Add another");

            //showAlert(rString) //get_pagination();
            if (result.status == 1) {

                msg.html(create_message("success", result.message));

                //	document.location.reload();
            } else { _btn.html("Try again"); msg.html(create_message("danger", result.message)); }
        },
        success: function (response) {
            console.log('res: ' + response)
            const data = JSON.parse(response);
            //console.log(('ka: ' + JSON.stringify(data.pagination)))
            //  localStorage.setItem('current_page', page);


        },
        error: function (error, status, xhr) {
            console.log("Error loading data " + JSON.stringify(error) + " xhr: " + xhr);
        }
    });
}
function overlay(action, message = "Loading...") {
    const $overlay = $("#appOverlay");
    const $message = $("#overlayMessage");
    const $spinner = $(".spinner-border");

    switch (action) {
        case "start":
            $message.text(message || "Loading...");
            $overlay.removeClass("d-none");
            break;

        case "stop":
            $overlay.addClass("d-none");
            break;

        case "fail":
            $spinner.removeClass("text-primary").addClass("text-danger");
            $message.text(message || "Something went wrong");
            $overlay.removeClass("d-none");

            // Auto-close after 5 seconds
            setTimeout(() => {
                $overlay.addClass("d-none");
                $spinner.removeClass("text-danger").addClass("text-primary");
            }, 5000);
            break;

        case "change_message":
            $message.text(message);
            break;

        default:
            console.warn("overlay(): unknown action", action);
    }
}
function showAlert(message, title = "Notice") {
    $('#alertTitle').text(title);
    $('#alertMessage').text(message);
    const modal = new bootstrap.Modal(document.getElementById('alertModal'));
    modal.show();
}
function goToPage(page) {

    current_page = page;
    console.log('next page ' + current_page)

    loadData();
}
function changePage(direction) {
    console.log('current page ' + current_page)

    const nextPage = current_page + direction;
    console.log('next page ' + nextPage + 'total_pages  ' + total_pages)

    if (nextPage < 1 || nextPage > total_pages) return;
    current_page = nextPage;
    console.log('next page ' + current_page)

    loadData(true);
}
function updatePageSize(size) {
    localStorage.setItem('page_size', size);
    current_page = 1;
    loadData();
}
function dashboard() {
    // localStorage.removeItem('current_account')
    // user = JSON.parse(localStorage.getItem('user'));
    loadView('dashboard/dashboard')
}
function clearLastViewCacheEntry() {
    const keys = Object.keys(viewCache);
    if (keys.length > 0) {
        const lastKey = keys[keys.length - 1];
        delete viewCache[lastKey];
        console.log(`Cleared viewCache for: ${lastKey}`);
    }
}
function hasNotificationBeenPushed(id) {
    const pushed = JSON.parse(localStorage.getItem('pushed_notifications') || '[]');
    return pushed.includes(id);
}

function markNotificationAsPushed(id) {
    let pushed = JSON.parse(localStorage.getItem('pushed_notifications') || '[]');
    if (!pushed.includes(id)) {
        pushed.push(id);
        localStorage.setItem('pushed_notifications', JSON.stringify(pushed));
    }
}
function showPushNotification(title, body) {

    if (window.AndroidInterface && AndroidInterface.showNativeNotification) {
        console.log("Notification." + title);
        AndroidInterface.showNativeNotification(title, body);
    } else {
        console.warn("AndroidInterface not available.");
    }
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function get_account_notifications() {
    if (!navigator.onLine) { return }
    $.ajax({
        url: server_url + "/notification-count",
        type: 'POST', // Keep POST since you're using $_POST
        dataType: 'json',
        data: {
            api: true,
            user: user.iD,
            institution_user: current.iD
        },
        complete: function (response) {
            //console.log('pt: ' + JSON.stringify(response))
            data = JSON.parse(response.responseText.toString());

            const count = parseInt(data.count);
            //console.log('pt: ' + JSON.stringify(data) + ' ; ' + data.count)

            if (count > 0) {
                $('#alerts-icon')
                    .removeClass('ph-bell')
                    .addClass('ph-bell-ringing')
                    .addClass('text-warning');

                data.records.forEach(n => {
                    if (!hasNotificationBeenPushed(n.iD)) {
                        // showPushNotification(n.title, n.message);
                        markNotificationAsPushed(n.iD);
                    }
                });
            } else {
                if ($('#alerts-icon').hasClass('ph-bell-ringing')) {
                    $('#alerts-icon')
                        .removeClass('ph-bell-ringing')
                        .addClass('ph-bell')
                        .removeClass('text-warning');

                }
            }
        },
        error: function (xhr, status, error) {
            console.error('Failed to fetch class list:', error);
        }
    });
}

function loadView(viewName, transitionType = 'fade', data = null) {
    overlay('stop');
    console.log('v:' + viewName)
    localStorage.setItem('resumeView', JSON.stringify(viewName));
    // ✅ Push view to history (if not duplicate)
    if (viewHistory.length === 0 || viewHistory[viewHistory.length - 1] !== viewName) {
        viewHistory.push(viewName);
        //    console.log('🧭 viewHistory updated:', JSON.stringify(viewHistory));
    }
    const skipViewCache = ['direct-chat', 'attendance-calendar', 'live-feed']; // Add your view names here
    if (typeof chatIntervalId !== 'undefined' && chatIntervalId) {
        clearInterval(chatIntervalId);
        chatIntervalId = null;
    }
    $('.index-nav').hide();
    if (!viewName) return;

    if (viewName.indexOf('auth') == -1) {
        $('.index-nav').show();
    }
    const scriptUrl = `file:///android_asset/assets/views/${viewName}.js`;
    const viewKey = viewName;

    if (data !== null) viewDataStore[viewName] = data;

    const mainContent = $("#mainContent");
    const hideNavFor = ['login', 'register', 'resume'];
    const passedData = viewDataStore[viewName] || null;

    mainContent.removeClass('fade-in fade-out slide-left-in slide-left-out slide-right-in slide-right-out');
    switch (transitionType) {
        case 'slide-left': mainContent.addClass('slide-left-out'); break;
        case 'slide-right': mainContent.addClass('slide-right-out'); break;
        default: mainContent.addClass('fade-out');
    }

    setTimeout(() => {
        const shouldSkipCache = skipViewCache.includes(viewName);

        if (!shouldSkipCache && viewCache[viewKey]) {
            renderViewContent(viewCache[viewKey].html, passedData, mainContent);
            // console.log('viewCache[viewKey].scriptLoaded: ' + viewCache[viewKey].scriptLoaded)

            $.ajax({
                url: scriptUrl,
                dataType: "script",
                cache: true, // keep this true unless you want to force reloads
                success: function () {
                    if (typeof init === 'function') { init(passedData); }//injectTemplates();
                    viewCache[viewKey].scriptLoaded = true;
                },
                error: function () {
                    console.warn(`No script found for view: ${viewName}`);
                    // Silently fail — no alert or error thrown
                }
            });
            /*  if (!viewCache[viewKey].scriptLoaded) {
                  $.getScript(scriptUrl, () => {
                      if (typeof init === 'function') init(passedData);
                      viewCache[viewKey].scriptLoaded = true;
                  });
              } else {
                  if (typeof init === 'function') init(passedData);
              }
              */
        } else {
            $.get(`file:///android_asset/assets/views/${viewName}.html`, function (data) {
                viewCache[viewKey] = { html: data, scriptLoaded: false };
                renderViewContent(data, passedData, mainContent);

                $.ajax({
                    url: scriptUrl,
                    dataType: "script",
                    cache: true,
                    timeout: 5000,
                    success: function () {
                        if (typeof init === 'function') { init(passedData); }//injectTemplates();
                        viewCache[viewKey].scriptLoaded = true;
                    },
                    error: function () {
                        console.warn(`No script found for view: ${viewName}`);
                    }
                });
            }).fail(() => {
                // Optional: showAlert(`Failed to load view: ${viewName}`, "Load Error");
            });
        }




    }, 200);



    function animateIn() {
        mainContent.removeClass('fade-out slide-left-out slide-right-out');
        switch (transitionType) {
            case 'slide-left': mainContent.addClass('slide-left-in'); break;
            case 'slide-right': mainContent.addClass('slide-right-in'); break;
            default: mainContent.addClass('fade-in');
        }
    }

    function injectTemplates(context = document) {
        const placeholders = context.querySelectorAll("*");

        placeholders.forEach(el => {
            if (el.children.length === 0 && el.textContent.includes("{{")) {
                el.innerHTML = el.innerHTML.replace(/\{\{(.+?)\}\}/g, function (_, key) {
                    const template = document.getElementById(`template_${key.trim()}`);
                    return template ? template.innerHTML : `<!-- missing: ${key} -->`;
                });
            }
        });
    }

    function renderViewContent(rawHtml, data, target) {
        let viewHtml = rawHtml;

        // Named loops
        if (data && typeof data === 'object') {
            viewHtml = renderViewWithNamedLoops(viewHtml, data);
        }

        // If-Else Conditionals
        if (data && typeof data === 'object') {
            viewHtml = viewHtml.replace(/{{if (\w+)\s*==\s*["']?([^"'}]+)["']?}}([\s\S]*?)({{else}}([\s\S]*?))?{{endif}}/g, function (_, key, expectedValue, trueContent, __, falseContent) {
                return data[key] == expectedValue ? trueContent : (falseContent || '');
            });
        }

        // Inject HTML into target
        target.html(viewHtml);

        // Basic replacements
        if (data && typeof data === 'object') {
            for (const [key, value] of Object.entries(data)) {
                if (typeof value !== 'object') {
                    target.html(function (_, html) {
                        return html.replaceAll(`{{${key}}}`, value);
                    });
                }
            }
        }

        animateIn();
    }
}
function renderViewWithNamedLoops(html, passedData) {
    // Match all loop blocks: {{loop:name}}...{{endloop}}
    const loopRegex = /{{loop:([\w]+)}}([\s\S]*?){{endloop}}/g;

    return html.replace(loopRegex, (_, loopName, loopTemplate) => {
        const dataArray = passedData[loopName];
        if (!Array.isArray(dataArray)) return '';

        return dataArray.map(item => {
            let block = loopTemplate;
            for (const [key, value] of Object.entries(item)) {
                block = block.replaceAll(`{{${key}}}`, value);
            }
            return block;
        }).join('');
    });
}
function getClassStorageKey() {
    return 'class_list_' + current.iD;
}

function getSelectedClassKey() {
    return 'selected_class_id_' + current.iD;
}
function getSelectedClass() {
    const classListKey = getClassStorageKey(); // Assumes this function exists
    const selectedClassId = localStorage.getItem(getSelectedClassKey());
    const classList = account.classes || [];

    // Try to find the selected class
    const selected = classList.find(c => String(c.iD) === String(selectedClassId));

    // Return selected class or the first one (if available)
    return selected || classList[0] || null;
}
function generateRandomPassword(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function navigateTo(routeKey, data = null, transition = 'fade') {
    const viewPath = window.routeMap[routeKey];
    // console.log(`new route  : ${viewPath}` + viewPath.indexOf('auth'));

    if (!viewPath) {
        console.error(`No route found for: ${routeKey}`);

        console.warn(`Route not found: ${routeKey}, redirecting to 404.`);
        loadView('errors/404', 'fade');

        // showAlert(`Page "${routeKey}" not found`, 'Routing Error');
        return;
    }//
    if ((!localStorage.getItem('current_account'))) {
        if ((viewPath.indexOf('profiles') == -1) && (viewPath.indexOf('auth') == -1)) {

            console.error(`No route found for: ${routeKey}`);
            // showAlert('Select a valid profile first')
            console.warn(`Route not found: ${routeKey}, redirecting to 404.`);
            loadView('profiles/select', 'fade');

            // showAlert(`Page "${routeKey}" not found`, 'Routing Error');
            return;
        }

    }

    // Push to history in a consistent format
    //viewHistory.push({ view: viewPath, data });
    console.log('histor S:', JSON.stringify(viewHistory));

    loadView(viewPath, transition, data);
}
function toggleFilterMenu() {
    showAlert("Show filter options"); // implement as needed
}

function updateActiveSort() {
    $('.sort-label').removeClass('active');
    $('input[name="order_filter"]:checked').closest('.sort-label').addClass('active');
    console.log('srt S:', $('input[name="order_filter"]:checked').val())
    loadData(true)
}
window.goBackView = function () {
    // console.log('🔙 goBackView CALLED');
    //console.log('📜 Current viewHistory:', JSON.stringify(viewHistory));

    // Check for any open Bootstrap modal
    const openModal = document.querySelector('.modal.show');

    if (openModal) {
        const modalInstance = bootstrap.Modal.getInstance(openModal);
        if (modalInstance) {
            console.log('🧩 Closing modal:', openModal.id);
            modalInstance.hide();
            return;
        }
    }

    if (viewHistory.length > 1) {
        
        viewHistory.pop(); // Remove current view
        const previousView = viewHistory[viewHistory.length - 1]; // Peek previous view
        if (previousView) {
            loadView(previousView);
        }
        console.log('👣 Navigating back to:', previousView, '(removed:', currentView, ')');

       // loadView(previousView);
        closeAllOffcanvas();
    } else {
        console.log('🚪 No more views in history. Prompting exit...');
        if (show_confirm("Exit the app?")) {
            window.location.href = "exit://app";
        }
    }
};

function _goBackView(transitionType = 'slide-right') {
    if (viewHistory.length > 1) {
        viewHistory.pop(); // Remove current view
        const previous = viewHistory[viewHistory.length - 1];

        if (previous && typeof previous === 'object' && previous.view) {
            const isAuthView = previous.view.startsWith('auth-') || previous.view.includes('/auth/');

            if (isAuthView) {
                // Already at dashboard? Then exit prompt
                const lastView = viewHistory[viewHistory.length - 1];
                if (lastView && lastView.view === 'dashboard') {
                    if (show_confirm("Exit the app?")) {
                        window.location.href = "exit://app";
                    }
                } else {
                    loadView('dashboard', transitionType);
                }
            } else {
                loadView(previous.view, transitionType, previous.data);
            }
        } else {
            console.error('Invalid view history entry:', previous);
        }
    } else {
        // No history, already at dashboard
        if (show_confirm("Exit the app?")) {
            window.location.href = "exit://app";
        }
    }
}
function logout() {
    show_confirm('Please confirm that you want to logout', function () {
        localStorage.clear();

        if (chatIntervalId) clearInterval(chatIntervalId);
        if (notificationIntervalId) clearInterval(notificationIntervalId);

        // showAlert("You’ve been logged out.");
        loadView('auth/login');
    })
}
function formatDateTimeLocal(date) {
    return date.toISOString().slice(0, 16);
}

function renderPaginationDropdown(pagination, dropdownId = 'page_selector') {
    if (!pagination || !pagination.current_page || !pagination.total_pages) return;
    console.log('render pagination: ' + JSON.stringify(pagination))
    current_page = parseInt(pagination.current_page);
    total_pages = parseInt(pagination.total_pages);
    pageSize = parseInt(pagination.rows_per_page);
    totalRecords = parseInt(pagination.total_records);

    let optionsHtml = '';

    for (let i = 0; i < total_pages; i++) {
        const from = i * pageSize + 1;
        let to = from + pageSize - 1;
        if (to > totalRecords) to = totalRecords;

        const selected = (i + 1 === current_page) ? 'selected' : '';
        optionsHtml += `<option value="${i + 1}" ${selected}>${from} - ${to} of ${totalRecords}</option>`;
    }

    $(`#${dropdownId}`).html(optionsHtml);
}
function getRecord(recordID) {
    const data = JSON.parse(localStorage.getItem("current_record"));

    if (!data || !Array.isArray(data)) {
        console.warn("No records found or data is not an array.");
        return null;
    }

    const found = data.find(item => item.iD == recordID); // using loose comparison to allow numeric/string match
    console.log('fyi: ' + JSON.stringify(found))
    return found || null;
}

function show_message(message, type) {
    // Set modal content and type based on parameters
    $('#message-text').text(message);
    $('#messageModal').find('.modal-content').removeClass().addClass('modal-content').addClass('text-' + type);

    // Show the modal
    $('#messageModal').modal('show');
}
function show_offcanvas_message(message, type, title = '', direction = 'start') {
    // Set modal content and type based on parameters
    $('#offcanvasMessagesTitle').html(title);
    $('#offcanvasMessagesDetails').html(message);
    $('#offcanvasMessagesDirection').html(direction); //offcanvas-start offcanvas
    $('#offcanvasMessages').removeClass().addClass('offcanvas-' + direction).addClass('offcanvas');
    $('#offcanvasMessagesDetails').removeClass('text-primary').addClass('text-' + type);
    // Show the modal
    new bootstrap.Offcanvas(document.getElementById('offcanvasMessages')).show();

}
function closeAllOffcanvas() {
    $('.offcanvas.show').each(function () {
        const offcanvasInstance = bootstrap.Offcanvas.getInstance(this);
        if (offcanvasInstance) {
            offcanvasInstance.hide();
        }
    });
}
function show_confirm(message, callback, yesButtonText = 'Yes') {
    // Set modal content
    $('#confirm-message').text(message);

    // Set text for the "Yes" button
    $('#confirm-action-btn-yes').text(yesButtonText);

    // Set callback for the "Yes" button click
    $('#confirm-action-btn-yes').off('click').on('click', function () {
        // Close the modal
        $('#confirmModal').modal('hide');

        // Execute the callback function
        if (typeof callback === 'function') {
            callback();
        }
    });

    // Show the modal
    $('#confirmModal').modal('show');
}
function date_time_format(dy) {
    if (dy.length > 4) {
        var rd = dy.split(' ')[0].split('-')
        return rd[2] + ' ' + get_month_long(rd[1]) + ' ' + rd[0] + "&nbsp;&nbsp;" + get_time_am(dy.split(' ')[1].substr(0, 5))
    } else { return ""; }
}

function get_time_am(time) {
    var tm = time.trim().split(":");
    let hours = Number(tm[0]);
    let minutes = Number(tm[1]);
    const ampm = hours >= 12 ? 'pm' : 'am';

    hours %= 12;
    hours = hours || 12;
    minutes = minutes < 10 ? `0${minutes}` : minutes;

    const strTime = `${hours}:${minutes} ${ampm}`;

    return strTime;
}

function get_month_long(m) {
    return monthLong[(m - 1)];
}
function get_month_short(m) {
    return monthShort[(m - 1)];
}
function alert_msg(label, type, message) {
    console.log('lb: ')
    const alertPlaceholder = document.getElementById(label)
    //console.log('ap: ' + alertPlaceholder.text)

    const wrapper = document.createElement('div')
    wrapper.innerHTML = [
        `<div class="alert alert-${type} alert-dismissible" role="alert">`,
        `   <div>${message}</div>`,
        '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
        '</div>'
    ].join('')

    alertPlaceholder.append(wrapper)

}


function date_format(dy) {
    if (dy.length > 4) {
        var rd = dy.split(' ')[0].split('-')
        return rd[2] + ' ' + get_month_long(rd[1]) + ' ' + rd[0]
    } else { return ""; }
}
function create_message(state, message) {
    return `<div class="alert alert-${state} alert-dismissible fade show" role="alert">
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>`
}
function getTomorrowMidday() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
}
function downloadPDF(id) {
    if (!navigator.onLine) {
        showAlert('No Internet Connection');
        return
    }
    var uri = site + "/api/download-invoice";
    $.ajax({
        url: uri,
        type: "POST",
        data: { id: id },
        success: function (resp) {
            const res = JSON.parse(resp);

            //   console.log("rss: " + (res))
            //  console.log("rss: " + JSON.stringify(res))

            if (res.status == 1) {
                // Send data to Android app
                if (window.AndroidInterface && AndroidInterface.saveBase64PDF) {
                    AndroidInterface.saveBase64PDF(res.data, res.filename || 'Invoice.pdf');
                } else {
                    showAlert('Android interface not available.');
                }
            } else {
                showAlert('Download failed.');
            }
        },
        complete: function (resp) {
            console.log("rss: " + (resp))

        },
        error: function (xhr, status, err) {
            console.log("rss: " + JSON.stringify(res))
            showAlert('Error: ' + err);
        }
    });
}
// Function to reset the timeout
function resetTimeout() {
    //console.log('timer set: ' + localStorage.getItem("returnTo"))
    clearTimeout(timeout);
    timeout = setTimeout(function () {
        // Redirect to a different page
        loadView('account-resume');
        closeOpenModals();
    }, 6 * 60 * 1000); // 60 seconds in milliseconds
}
