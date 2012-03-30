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
            height: 500
          , width: 700
          , modal: true
          , title: 'Image manager'
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
                        +   '<a class="imageman-browser-button left"></a>'
                        +   '<a class="imageman-browser-button right"></a>'
                        +   '<div class="imageman-thumbs imageman-clearfix"></div>'
                        + '</div>'
                        + '</div>'
        , templateThumb: '<div class="imageman-thumb"><img></div>'
        , baseSrc: ''
        , source: null
      }
    , dialog: null
    , opts: {}
  }

  $.fn.imageMan = function(opts) {
    $.extend(true, $.imageMan.opts, $.imageMan.defaults, opts);

    $(this).click( function() {
      var trigger = $(this);
      $.getJSON($.imageMan.opts.source || trigger.attr('href'), function(data) {
        var images = $.imageMan.opts.extractor.apply(trigger, [data])
          , body = $($.imageMan.opts.templateBody);

        if (!images) {
          console.log('no image data', data);
          return;
        }

        $.each(images, function() {
          var image = this
            , thumb = $($.imageMan.opts.templateThumb);

          thumb.find('img')
              .attr('src', $.imageMan.opts.baseSrc + image.name)
              .attr('title', image.title || image.src);

          thumb.data('src', image.name);
          body.find('.imageman-thumbs').append(thumb);
        });

        $.imageMan.opts.dialog.create = function(e, ui) {
          var dialog = $(e.target);

          dialog.delegate('.imageman-thumb', 'click', function() {
            var viewer = dialog.find('.imageman-viewer')
              , viewImg = dialog.find('.imageman-viewer-image img')
              , thumbImg = $(this).find('img');

            viewer.addClass('loading');
            viewImg.load(function(){viewer.removeClass('loading')});
            viewImg.attr('src', thumbImg.attr('src'));
          });
        }
        $.imageMan.dialog = body.dialog($.imageMan.opts.dialog);
      });

      return false;
    });
  }
})(jQuery);
