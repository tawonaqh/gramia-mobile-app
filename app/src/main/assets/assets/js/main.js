
let timeout;
var monthLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
//var server_url = "http://192.168.0.111:80/easiwrap/public"
//var server_url = "http://192.168.0.111:80/gramia/public"
//var server_url = "http://localhost/easiwrap/public"
//var server_url = "http://139.84.233.196:80/easiwrap/public"
//var server_url = "http://192.168.1.37/gramia/public";
var server_url = "http://139.84.233.196:80/gramia/public";
const viewCache = {}; // key: viewName, value: { html, scriptLoaded }
let calendarMonthOffset = 0;
let selectedDate = null;
let latestEvents = [];
let eventMap = {};
var site = server_url;
const viewHistory = [];
var user = null, table = "", current = null, account=null;
let idleTimeout;
const IDLE_LIMIT_MINUTES = 5;
var current_page = 1;
var total_pages = 1;
var totalRecords = 1;
var pageSize = 1;
var selectedClass;
let resourceCache = {};
const viewDataStore = {};
let chatIntervalId; // Define this in a global or higher scope
let notificationIntervalId; // Define this in a global or higher scope
let lastMessageTime = null;
let key, period_key, class_list_key, student_list_key;
var chatiD;
let slides = []; // Filled with base64 URLs
let currentSlide = 0;
let startX = 0;
let cropper;
let loadedMessages = [];
let totalMessages = [];
let messagesPerPage = 10;
let chatLoadIndex = 0;
let attendanceData = []; // store all fetched attendance here
let currentMonthOffset = 0;
let currentResourceID = null;
let attendanceRecordMap = {}; // global object
let classData = []; // store parsed response
let commonVar;
// Set global jQuery AJAX timeout to 10 seconds
$.ajaxSetup({
    timeout: 10000, // in milliseconds
    error: function (xhr, status, error) {
        if (status === "timeout") {
            overlay("fail", "Server is taking too long to respond.");
        } else {
            //overlay("fail", "Network error: " + error);
        }
    }
});
$(document).ajaxSend(function (event, jqxhr, settings) {
    if (settings.url.indexOf('get-directchatmessage-records') == -1 && settings.url.indexOf('notification-count') == -1)
        console.log("AJAX URL:", settings.url);
});

$(document).ready(function () {

    let touchStartX = 0, touchEndX = 0;
    let touchStartY = 0, touchEndY = 0;

    $('.offcanvas-bottom').each(function () {
        const $offcanvas = $(this);

        $offcanvas.on('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
        });

        $offcanvas.on('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;

            const deltaX = touchStartX - touchEndX;
            const deltaY = touchStartY - touchEndY;

            const horizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
            const verticalSwipe = !horizontalSwipe;

            const isStart = $offcanvas.hasClass('offcanvas-start');
            const isEnd = $offcanvas.hasClass('offcanvas-end');
            const isTop = $offcanvas.hasClass('offcanvas-top');
            const isBottom = $offcanvas.hasClass('offcanvas-bottom');

            let shouldClose = false;

            if (isStart && deltaX > 50) shouldClose = true;         // swipe left
            if (isEnd && deltaX < -50) shouldClose = true;          // swipe right
            if (isTop && deltaY > 50) shouldClose = true;           // swipe up
            if (isBottom && deltaY < -50) shouldClose = true;       // swipe down

            if (shouldClose) {
                const instance = bootstrap.Offcanvas.getInstance($offcanvas[0]);
                if (instance) instance.hide();
            }
        });
    });
});

$(document).ready(function () {


    // Nav link click handler
    $('[data-view]').click(function (e) {
        e.preventDefault();
        const view = $(this).data('view');
        loadView(view);
        $('.offcanvas').offcanvas('hide');
    });

    // Logout button
    $('#logoutBtn').click(function () {
        localStorage.removeItem('user');
        localStorage.removeItem('user_accounts')
        localStorage.removeItem('current_account')
        //showAlert("You’ve been logged out.");
        navigateTo('login');
    });

    ["click", "mousemove", "keypress", "scroll", "touchstart"].forEach(event => {
       // console.log('rest')
        document.addEventListener(event, resetIdleTimer, true);
    });
    // Auto-load dashboard if logged in
    if (localStorage.getItem('user')) {
        // loadView('dashboard');
        user = JSON.parse(localStorage.getItem('user'));
        navigateTo('resume');

    } else {
        navigateTo('login');

    }
    $(document).on('focus', 'input[type="number"]', function () {
        $(this).select();
    });
    // On page load or app init



    //resetIdleTimer();
});


function gotoprofile(){
   navigateTo('profile')
    
}

function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        console.log("🔒 Inactivity timeout — locking...");
        //    user = JSON.parse(localStorage.getItem('user'));

        if (user != null && (localStorage.getItem('resumeView').indexOf('auth') == -1)) {
            loadView("auth/resume");
            closeAllOffcanvas()
            if (chatIntervalId) clearInterval(chatIntervalId);
            if (chatIntervalId) clearInterval(notificationIntervalId);
        }
        // or whatever your view name is
    }, IDLE_LIMIT_MINUTES * 60 * 1000);
}

//$(document).ready(function () {
//    // Existing code...
//
//    // Check for stored reference number, poll URL, invoice ID, and amount
//    const referenceNumber = localStorage.getItem('referenceNumber');
//    const pollUrl = localStorage.getItem('pollUrl');
//    const invoiceId = localStorage.getItem('invoiceId');
//    const amount = localStorage.getItem('amount');
//
//    if (referenceNumber && pollUrl && invoiceId && amount) {
//        showAlert('Payment details stored:\nReference Number: ' + referenceNumber + '\nPoll URL: ' + pollUrl);
//
//        // Optionally, clear these values after showing the alert
//        localStorage.removeItem('referenceNumber');
//        localStorage.removeItem('pollUrl');
//        localStorage.removeItem('invoiceId');
//        localStorage.removeItem('amount');
//
//        // Make an API call to validate the payment status
//        $.ajax({
//            url: site + "/api/validate-payment-status", // Adjust the URL to your backend endpoint
//            method: 'POST',
//            contentType: 'application/json',
//            data: JSON.stringify({
//                referenceNumber: referenceNumber,
//                invoiceId: invoiceId,
//                amount: parseFloat(amount), // Ensure amount is a number
//                pollUrl: pollUrl
//            }),
//            dataType: 'json',
//            success: function(response) {
//                if (response.status === 1) {
//                    showAlert('Payment Status: ' + response.message);
//                } else {
//                    showAlert('Payment validation failed: ' + response.message);
//                }
//            },
//            error: function(xhr) {
//                console.error("Error validating payment status:", xhr.responseText);
//                showAlert('Error validating payment status: ' + xhr.statusText);
//            }
//        });
//    }
//
//    // Existing code...
//});

// Listen for activity


