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
                        +   '<div class="imageman-viewer-upload"></div>'
                        +   '<div class="imageman-viewer-loader"></div>'
                        + '</div>'
                        + '<div class="imageman-browser">'
                        +   '<a class="imageman-browser-button left"></a>'
                        +   '<a class="imageman-browser-button right"></a>'
                        +   '<div class="imageman-thumbs-outer">'
                        +     '<div class="imageman-thumbs imageman-clearfix"></div>'
                        +   '</div>'
                        + '</div>'
                        + '</div>'
        , templateThumb: '<div class="imageman-thumb"><img></div>'
        , templateUploadThumb: '<div class="imageman-thumb imageman-thumb-upload"><img title="upload image"></div>'
        , baseSrc: ''
        , source: null
        , delete: null
        , upload: typeof(qq) !== 'undefined'
        , uploader: {
            action: ''
          , allowedExtensions: ['jpg', 'jpeg', 'gif', 'png']
        }
      }
    , dialog: null
    , uploader: null
    , deleteCallback: function(thumb) {
        var activeThumb = thumb.prev().length ? thumb.prev() : thumb.next();
        // TODO handle last image
        activeThumb.click();
        thumb.addClass('deleting');
        thumb.animate({width:0, marginLeft:0, marginRight:0, paddingLeft:0, paddingRight:0}, 'slow', 'linear', function() {
          $(this).remove();
          $.imageMan.resizeThumbs();
        });
        
      }
    , createThumb: function() {
        var image = this
          , thumb = $($.imageMan.opts.templateThumb);

        image.src = $.imageMan.opts.baseSrc + image.filename;
        thumb.find('img')
            .attr('src', image.src)
            .attr('title', image.title || image.filename);

        thumb.data('image', image);

        return thumb;
      }
    , resizeThumbs: function(dialog) {
        if (!dialog) dialog = $.imageMan.dialog;
        var thumbs = dialog.find('.imageman-thumbs');
        thumbs.width(thumbs.children().first().outerWidth(true) * thumbs.children().length);
      }
    , centerThumb: function() {
        var thumb = this
          , tW = thumb.outerWidth(true)
          , before = thumb.prevAll().not('.deleting').length
          , bW = thumb.parents('.imageman-browser').width()
          , thumbs = thumb.parent()
          , leftPos = bW/2 - (before+0.5)*tW
          , leftMin = bW - thumbs.outerWidth(true);

        thumbs.animate({left: Math.min(Math.max(leftMin, leftPos), 0)});
      }
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

        if (!$.imageMan.opts.delete) {
          body.find('.imageman-viewer-control.delete').remove();
        }

        $.each(images, function() {
          body.find('.imageman-thumbs').append($.imageMan.createThumb.apply(this));
        });

        if ($.imageMan.opts.upload) {
          if (typeof(qq) != 'undefined' && qq.FileUploader) {
            body.find('.imageman-thumbs').append($.imageMan.opts.templateUploadThumb);
          } else {
            alert('qq.FileUploader is not loaded');
          }
        }

        $.imageMan.opts.dialog.create = function(e, ui) {
          var dialog = $(e.target);

          dialog.delegate('.imageman-thumb', 'click', function() {
            var viewer = dialog.find('.imageman-viewer')
              , thumb = $(this);

            thumb.siblings('.selected').removeClass('selected');
            thumb.addClass('selected');
            $.imageMan.centerThumb.apply(thumb);

            if (thumb.hasClass('imageman-thumb-upload')) {
              var upload = viewer.find('.imageman-viewer-upload');

              viewer.addClass('uploading');
              if (!upload.hasClass('loaded')) {
                var uploaderOpts = $.extend({}, $.imageMan.opts.uploader);
                uploaderOpts.element = upload[0];
                uploaderOpts.onComplete = function(id, filename, json) {
                  if (json.success) {
                    thumb.before($.imageMan.createThumb.apply(json));
                    $.imageMan.resizeThumbs();
                    $.imageMan.centerThumb.apply(thumb);

                  } else if (json.error) {
                    alert('Upload failed: ' + json.error);

                  } else {
                    alert('Upload failed');
                  }
                };
                $.imageMan.uploader = new qq.FileUploader(uploaderOpts);
                upload.addClass('loaded');
              }

            } else {
              var viewImg = dialog.find('.imageman-viewer-image img')
                , thumbImg = thumb.find('img');

              // TODO fade in&out
              viewer.addClass('loading');
              viewer.removeClass('uploading');
              viewImg.load(function(){viewer.removeClass('loading')});
              viewImg.attr('src', thumbImg.attr('src'));
              viewImg.attr('title', thumbImg.attr('title'));
              viewer.find('.imageman-viewer-title').text(thumbImg.attr('title'));
              viewer.data('image', thumb.data('image'));
              viewer.data('thumb', thumb);
            }
          });
          dialog.delegate('.imageman-viewer-control.select', 'click', function() {
            var viewer = $(this).parents('.imageman-viewer');
            trigger.trigger('select.imageman', viewer.data('image'));
            $.imageMan.dialog.dialog('close');
          });
          dialog.delegate('.imageman-viewer-control.delete', 'click', function() {
            var viewer = $(this).parents('.imageman-viewer')
              , thumb = viewer.data('thumb')
              , image = viewer.data('image');

            if ($.imageMan.opts.delete) {
              $.imageMan.opts.delete.apply(image, [thumb, $.imageMan.deleteCallback]);
            }
          });
          dialog.delegate('.imageman-browser-button', 'click', function() {
            var selected = dialog.find('.imageman-thumb.selected');
            if ($(this).hasClass('left'))
              selected.prev().click()
            else
              selected.next().click()
          });
          $.imageMan.resizeThumbs(dialog);
          dialog.find('.imageman-thumb').first().click();
        }
        $.imageMan.dialog = body.dialog($.imageMan.opts.dialog);
      });

      return false;
    });

    return this;
  }
})(jQuery);
