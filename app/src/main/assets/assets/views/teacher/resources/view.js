
function init(data) {
    currentResourceID = data.iD;
    $('#name').val(data.name)
    $('#description').val(data.description)

    if(data.reload){  loadResource(currentResourceID, true) }else{  loadResource(currentResourceID)}
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

        displayResource(data, forceRefresh);
    });
}

function displayResource(data, forceRefresh=false) {
    const resource = data.records[0];
    const base64Images = resource.images.map(img => ({
        iD: img.iD,
        base64: img.base64
    }));
    loadSlides(base64Images, forceRefresh);
}

$('#refreshResource').on('click', function () {
    refresh();
});


function refresh(){
    const itemID = currentResourceID; // Store this globally when calling init()
    loadResource(itemID, true);
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

function loadSlides(imageList, forceRefresh=false) {
  slides = imageList;
  currentSlide = 0;
  if(forceRefresh){ currentSlide=slides.length-1}
  showSlide(currentSlide);
}

function showSlide(index) {
  if (index < 0 || index >= slides.length) return;

  $('#currentSlideImage').attr('src', slides[index].base64);
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
$('#deleteSlide').on('click', () => {
   console.log('if :' + JSON.stringify(slides));
    show_confirm('Please confirm that you want to remove this slide', function () {

  let ResourceFileId = slides[currentSlide].iD
   $.ajax({
          url: site + '/remove-classresourcefile', // adjust to your server endpoint
          type: 'POST',
          dataType: 'json',
          data: {
              itemiD: ResourceFileId,
              api: true,
              user: user.iD,
              status: 2
          },
          success: function (response) {
              if (response.status === 1) {
                  console.log('✅ :', response.message);
                  $('#form_result').text(response.message);
                  $('#previewContainer').html('');
                refresh()
                  // Optionally display thumbnail or reload list
              } else {
                  console.error('❌ Upload error:', response.message);
                  $('#form_result').text(response.message);
              }
          },
          error: function (xhr) {
              console.error('❌ Server error:', xhr.responseText);
              $('#form_result').text("Server error during upload.");
          }
      });
      });
});

$('#nextSlide').on('click', () => {
  if (currentSlide < slides.length - 1) {
    currentSlide++;
    showSlide(currentSlide);
  }
});