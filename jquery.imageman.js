(function($){
  $.imageMan = {
      defaults: {
          extractor: function(data) {
            if (data && data.success && data.images) {
              return data.images;
            }
            return null;
          }
        , dialog: {
            minHeight: 300
          , minWidth: 300
          , maxHeight: 500
          , maxWidth: 700
          , modal: true
        }
        , templateBody: '<div class="imageman-body">'
                        + '<div class="imageman-viewer loading">'
                        +   '<div class="imageman-viewer-title"></div>'
                        +   '<div class="imageman-viewer-image"><img></div>'
                        +   '<div class="imageman-viewer-controls">'
                        +     '<a class="imageman-viewer-control select">select image</a>'
                        +     '<a class="imageman-viewer-control delete">delete image</a>'
                        +   '</div>'
                        +   '<div class="imageman-viewer-loader"></div>'
                        + '</div>'
                        + '<div class="imageman-browser">'
                        +   '<a class="imageman-browser-button prev"></div>'
                        +   '<a class="imageman-browser-button next"></div>'
                        +   '<div class="imageman-thumbs"></div>'
                        + '</div>'
                        + '</div>'
        , templateThumb: '<div class="imageman-thumb"><img></div>'
        , baseSrc: ''
      }
    , dialog: null
    , opts: null
  }

  $.fn.imageMan = function(opts) {
    $.extend(true, $.imageMan.opts, opts, $.imageMan.defaults);

    $(this).each( function() {
      var trigger = $(this);
      $.getJSON($.imageMan.opts.source, function(data) {
        var images = $.imageMan.opts.extractor.apply(trigger, [data])
          , body = $($.imageMan.opts.templateBody);

        $.each(images, function() {
          var image = this
            , thumb = $($.imageMan.opts.templateThumb);

          thumb.find('img')
              .attr('src', $.imageMan.opts.baseSrc + image.src)
              .attr('title', image.title || image.src);

          thumb.data('src', image.src)
              .appendTo(body.find('.imageman-thumbs'));
        });

        $.imageMan.opts.dialog.create = function(e, ui) {
        }
        $.imageMan.dialog = body.dialog($.imageMan.opts.dialog);
      });
    });
  }
})(jQuery);
