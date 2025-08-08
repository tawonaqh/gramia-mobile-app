window.routeMap = {
    ...(window.commonRoutes || {}),
    ...(window.studentRoutes || {}),
    ...(window.teacherRoutes || {}),
    ...(window.staffRoutes || {}),
    ...(window.adminRoutes || {})
};
/*
const routeMap = {
    'dashboard': 'dashboard/dashboard',
    'admin-dashboard': 'admin/dashboard',
    'student-dashboard': 'student/dashboard',
    'teacher-dashboard': 'teacher/dashboard',
    'profile': 'common/profile',

    'users': 'admin/users/index',
    'add-user': 'admin/users/create',
    'edit-user': 'admin/users/edit',
    'view-user': 'admin/users/view',

    'student-classes': 'student/classes/index',
    'view-class': 'student/classes/view',

    'requests': 'admin/requests/index',
    'add-request': 'admin/requests/create',
    'edit-request': 'admin/requests/edit',
    'view-request': 'admin/requests/view',

    'guardians': 'student/guardians/index',
    'add-guardian': 'student/guardians/create',
    'edit-guardian': 'student/guardians/edit',
    'view-guardian': 'student/guardians/view',

    'events': 'student/events/index',
    'add-event': 'student/events/create',
    'view-event': 'student/events/view',
    'edit-event': 'student/events/edit',

    'group-chats': 'student/group-chats/index',
    'add-group-chat': 'student/group-chats/create',
    'view-group-chat': 'student/group-chats/view',
    'edit-group-chat': 'student/group-chats/edit',

    'messages': 'student/messages/index',
    'add-message': 'student/messages/create',
    'view-message': 'student/messages/view',
    'edit-message': 'student/messages/edit',

    'assignments': 'student/assignments/index',
    'add-assignment': 'student/assignments/create',
    'view-assignment': 'student/assignments/view',
    'edit-assignment': 'student/assignments/edit',

    'submissions': 'student/submissions/index',
    'add-submission': 'student/submissions/create',
    'view-submission': 'student/submissions/view',
    'edit-submission': 'student/submissions/edit',

    'timetable': 'student/timetable/index',
    'add-timetable': 'student/timetable/create',
    'view-timetable': 'student/timetable/view',
    'edit-timetable': 'student/timetable/edit',

    'student-attendance': 'student/attendance/index',
    'add-attendance': 'student/attendance/create',
    'view-attendance': 'student/attendance/view',
    'edit-attendance': 'student/attendance/edit',

    'invoices': 'student/invoices/index',
    'add-invoice': 'student/invoices/create',
    'view-invoice': 'student/invoices/view',
    'edit-invoice': 'student/invoices/edit',

    'student-progress': 'student/progress/index',
    'add-progress': 'student/progress/create',
    'view-progress': 'student/progress/view',
    'edit-progress': 'student/progress/edit',

     'direct-chat': 'direct-chat/index',
     'add-chat': 'direct-chat/create/index',
     'start-chat': 'direct-chat/create/view',
     'view-chat': 'direct-chat/view',

    'account-requests': 'dashboard/account-requests',
    'notices': 'notices/index',
    'messages': 'messages/index',
    'events': 'events/index',
    'view-event': 'events/index',
    'assignments': 'dashboard/assignments',
    'submissions': 'dashboard/submissions',
    'timetable': 'dashboard/timetable',
    // Add more routes as needed
};
*/