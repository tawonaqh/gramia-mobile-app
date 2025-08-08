
function init(data) {
    currentResourceID = data.iD;
    loadResource(currentResourceID);
}
function loadResource(itemiD, forceRefresh = false) {
    const cacheKey = `resource_${itemiD}`;

    if (!forceRefresh && resourceCache[cacheKey]) {
        const cached = resourceCache[cacheKey];
        console.log('Loaded from in-memory cache:', cached);
        displayResource(cached);
        return;
    }

    if (!navigator.onLine) {
        showAlert('No internet connection and no cached copy available');
        return;
    }

    $.post(site + "/get-class-resource-record", {
        api: true,
        itemiD: itemiD,
        user: user.iD
    }, function (res) {
        console.log('Fetched from server:', res);
        const data = JSON.parse(res);

        if (!data.records || data.records.length === 0) {
            $('#resourceDetails').html('<p class="text-danger">No resource found.</p>');
            return;
        }

        // Save in in-memory cache only
        resourceCache[cacheKey] = data;

        displayResource(data);
    });
}
function displayResource(data) {
    const resource = data.records[0];
    const base64Images = resource.images.map(img => img.base64);
    loadSlides(base64Images);
}
$('#refreshResource').on('click', function () {
    const itemID = currentResourceID; // Store this globally when calling init()
    loadResource(itemID, true);
});
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