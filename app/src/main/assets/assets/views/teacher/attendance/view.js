function init(data){
    getAttendance(data.iD)
}

function getAttendance(itemiD) {
    $.post(site + "/api/get-attendancestudent-records", {
        api: true,
        attendance: itemiD,
        user: user.iD,
        api: true
    }, function (res) {
               console.log('resp: ' + res)

        const data = JSON.parse(res);
        if (!data.records || data.records.length === 0) {
            $('#results').html('<p class="text-danger">No resource found.</p>');
            return;
        }
        const list = $('#results').empty();

            let table = `
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead class="bg-dark text-primary text-capitalize">
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            </div>`;
            $('#results').append(table);

            let $tbody = $('#results table tbody');

            data.records.forEach((item) => {
              let row = `
                <tr>
                  <td class="text-nowrap">${item.student}</td>
                  <td class="text-nowrap">${item.attendanceStatus}</td>
                </tr>`;
              $tbody.append(row);
            });
    });
}


$('#currentSlideImage')
  .on('touchstart', function (e) {
    startX = e.originalEvent.touches[0].clientX;
  })
  .on('touchend', function (e) {
    let endX = e.originalEvent.changedTouches[0].clientX;
    if (endX - startX > 50) {
      $('#prevSlide').click(); // Swipe Right
    } else if (startX - endX > 50) {
      $('#nextSlide').click(); // Swipe Left
    }
  });
function loadSlides(imageList) {
  slides = imageList;
  currentSlide = 0;
  showSlide(currentSlide);
}

function showSlide(index) {
  if (index < 0 || index >= slides.length) return;

  $('#currentSlideImage').attr('src', slides[index]);
  $('#slideCounter').text(`${index + 1} / ${slides.length}`);

  $('#prevSlide').prop('disabled', index === 0);
  $('#nextSlide').prop('disabled', index === slides.length - 1);
}

$('#prevSlide').on('click', () => {
  if (currentSlide > 0) {
    currentSlide--;
    showSlide(currentSlide);
  }
});

$('#nextSlide').on('click', () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  }
});