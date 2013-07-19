(function($){
  $.imageMan = {
      defaults: {
          source: null
        , baseSrc: ''
        , limit: false
        , 'delete': null
        , select: null
        , dialog: {
            height: 500
          , width: 700
          , modal: true
          , title: 'Image manager'
          }
        , upload: typeof(qq) !== 'undefined'
        , uploader: {
            action: ''
          , allowedExtensions: ['jpg', 'jpeg', 'gif', 'png']
          }
        , extractor: function(data) {
            if (data && data.success && data.images) {
              return data.images;
            }
            return null;
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
      }
    , dialog: null
    , uploader: null
    , deleteCallback: function(options) {
        var thumb = this, activeThumb = thumb.prev().length ? thumb.prev() : thumb.next();
        // TODO handle last image
        activeThumb.click();
        thumb.addClass('deleting');
        thumb.animate({width:0, marginLeft:0, marginRight:0, paddingLeft:0, paddingRight:0}, 'slow', 'linear', function() {
          $(this).remove();
          $.imageMan.resizeThumbs(options);
        });
      }
    , createThumb: function(options) {
        var image = this
          , thumb = $(options.templateThumb);

        image.src = options.baseSrc + image.filename;
        thumb.find('img')
            .attr('src', image.src)
            .attr('title', image.title || image.filename);

        thumb.data('image', image);

        return thumb;
      }
    , resizeThumbs: function(options, dialog) {
        if (!dialog) dialog = $.imageMan.dialog;
        var thumbsBox = dialog.find('.imageman-thumbs'), thumbs = thumbsBox.children();
        thumbsBox.width(thumbs.first().outerWidth(true) * thumbs.length);

        if (options.limit) thumbs.each( function(i) {
          if (i >= options.limit && !$(this).hasClass('imageman-thumb-upload')) {
            $(this).addClass('overlimit');
          } else {
            $(this).removeClass('overlimit');
          }
        });
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
    , open: function(options) {
        var trigger = $(this);
		trigger.data('options.imageman', options);
        $.getJSON(options.source, function(data) {
          var images = options.extractor(data)
            , body = $(options.templateBody);

          if (!images) {
            return;
          }

          if (!options['delete']) {
            body.find('.imageman-viewer-control.delete').remove();
          }
          if (options.limitText) {
            var limitBox = $('<div class="imageman-viewer-limittext"></div>').text(options.limitText);
            body.find('.imageman-viewer-controls').after(limitBox)
          }

          $.each(images, function() {
            body.find('.imageman-thumbs').append($.imageMan.createThumb.apply(this, [options]));
          });

          if (options.upload) {
            if (typeof(qq) != 'undefined' && qq.FileUploader) {
              body.find('.imageman-thumbs').prepend(options.templateUploadThumb);
            } else {
              alert('qq.FileUploader is not loaded');
            }
          }

          options.dialog.create = function(e, ui) {
            var dialog = $(e.target);

            dialog.delegate('.imageman-thumb', 'click', function() {
              var viewer = dialog.find('.imageman-viewer')
                , thumb = $(this);

              thumb.siblings('.selected').removeClass('selected');
              thumb.addClass('selected');
              viewer.toggleClass('overlimit', thumb.hasClass('overlimit'));
              $.imageMan.centerThumb.apply(thumb);

              if (thumb.hasClass('imageman-thumb-upload')) {
                var upload = viewer.find('.imageman-viewer-upload');

                viewer.addClass('uploading').removeClass('loading');
                viewer.find('.imageman-viewer-title').text('Upload');
                if (!upload.hasClass('loaded')) {
                  var uploaderOpts = $.extend({}, options.uploader);
                  uploaderOpts.element = upload[0];
                  uploaderOpts.onComplete = function(id, filename, json) {
                    if (json.success) {
                      thumb.after($.imageMan.createThumb.apply(json, [options]));
                      $.imageMan.resizeThumbs(options);
                      $.imageMan.centerThumb.apply(thumb);

                    } else if (json.error) {
                      alert('Upload failed: ' + json.error);

                    } else {
                      alert('Upload failed: server error');
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
              if (options.select) {
                options.select.apply(trigger, [viewer.data('image')]);
              }
              trigger.trigger('select.imageman', viewer.data('image'));
              $.imageMan.dialog.dialog('close');
            });
            dialog.delegate('.imageman-viewer-control.delete', 'click', function() {
              var viewer = $(this).parents('.imageman-viewer')
                , thumb = viewer.data('thumb')
                , image = viewer.data('image');

              if (options['delete']) {
                options['delete'].apply(image, [thumb, $.imageMan.deleteCallback, options]);
              }
            });
            dialog.delegate('.imageman-browser-button', 'click', function() {
              var selected = dialog.find('.imageman-thumb.selected');
              if ($(this).hasClass('left'))
                selected.prev().click()
              else
                selected.next().click()
            });
            $.imageMan.resizeThumbs(options, dialog);
            dialog.find('.imageman-thumb').first().click();
          }
          $.imageMan.dialog = body.dialog(options.dialog);
        });

        return false;
      }
  }

  $.fn.imageMan = function(opts) {
	var options = $.extend(true, {}, $.imageMan.defaults, opts);

    if ($(this).length) {
      $(this).click( function() {
	  	$.imageMan.open.apply(this, [options]);
		return false;
	  });
      return this;

    } else {
      return $.imageMan.open.apply(document, [options]);
    }
  }
})(jQuery);
