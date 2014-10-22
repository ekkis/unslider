/**
 *   Unslider by @idiot and @damirfoy
 *   Contributors:
 *   - @ShamoX
 *   - @ekkis
 *
 */

(function ($, f) {
    var Unslider = function () {
        //  Object clone
        var _ = this;

        //  Set some options
        _.o = {
            speed: 500,     // animation speed, false for no transition (integer or boolean)
            delay: 3000,    // delay between slides, false for no autoplay (integer or boolean)
            init: 0,        // init delay, false for no delay (integer or boolean)
            pause: !f,      // pause on hover (boolean)
            loop: !f,       // infinitely looping (boolean)
            keys: f,        // keyboard shortcuts (boolean)
			// display mode: '' = none, 'simple' = dotted, 'page' = pagination
            dots: '',
			// used to customise the dots generated (pagination only)
            dotgen: function(index) {
				return index;
			},
            arrows: f,      // display prev/next arrows (boolean)
            prev: '&larr;', // text or html inside prev button (string)
            next: '&rarr;', // same as for prev option
            fluid: f,       // is it a percentage width? (boolean)
            starting: f,    // invoke before animation (function with argument)
            complete: f,    // invoke after animation (function with argument)
            item: '>li',    // slidable items selector
            easing: 'swing',// easing function to use for animation
            autoplay: true // enable autoplay on initialisation
        };

        _.init = function (ul, o) {
            //  Check whether we're passing any options in to Unslider
            _.o = $.extend(_.o, o);

            _.ul = ul.addClass('root').wrap('<div class="unslider"></div>');;
			_.el = _.ul.parent();
            _.max = [_.el.outerWidth() | 0, _.el.outerHeight() | 0];
            _.li = _.ul.find(_.o.item).each(function (index) {
                var me = $(this),
					width = me.outerWidth(),
					height = me.outerHeight();

                //  Set the max values
                if (width > _.max[0]) _.max[0] = width;
                if (height > _.max[1]) _.max[1] = height;
            });

            //  Cached vars
            var o = _.o
			,	ul = _.ul
			,	li = _.li
			,	len = li.length;

            //  Current indeed
            _.i = 0;

            // create unslider styles

            add_styles();

            //  Autoslide
            o.autoplay && setTimeout(function () {
                if (o.delay | 0) {
                    _.play();

                    if (o.pause) {
                        ul.on('mouseover mouseout', function (e) {
                            _.stop();
                            e.type == 'mouseout' && _.play();
                        });
                    };
                };
            }, o.init | 0);

            //  Keypresses
            if (o.keys) {
                $(document).keydown(function (e) {
                    var key = e.which;
                    if (key == 37) _.prev(); // Left
                    else if (key == 39) _.next(); // Right
                    else if (key == 27) _.stop(); // Esc
                });
            };

            //  Dot pagination
            o.dots && nav_dots();

            //  Arrows support
            o.arrows && nav_arrows();

            //  Patch for fluid-width sliders. Screw those guys.
            if (o.fluid) {
                $(window).resize(function () {
                    _.r && clearTimeout(_.r);

                    _.r = setTimeout(function () {
                        var styl = { height: li.eq(_.i).outerHeight() },
							width = ul.outerWidth();

                        ul.css(styl);
						var wd = 100 * width / ul.parent().width();
                        styl['width'] = Math.min(Math.round(wd), 100) + '%';
                        ul.css(styl);
                        li.css({ width: width + 'px' });
                    }, 50);
                }).resize();
            };

            //  Move support
            if ($.event.special['move'] || $.Event('move')) {
                ul.on('movestart', function (e) {
                    if ((e.distX > e.distY && e.distX < -e.distY) || (e.distX < e.distY && e.distX > -e.distY)) {
                        e.preventDefault();
                    } else {
                        ul.data("left", _.ul.offset().left / ul.width() * 100);
                    }
                }).on('move', function (e) {
                    var left = 100 * e.distX / ul.width();
                    var leftDelta = 100 * e.deltaX / ul.width();
                    _.ul[0].style.left = parseInt(_.ul[0].style.left.replace("%", "")) + leftDelta + "%";

                    _.ul.data("left", left);
                }).on('moveend', function (e) {
                    var left = _.ul.data("left");
                    if (Math.abs(left) > 30) {
                        var i = left > 0 ? _.i - 1 : _.i + 1;
                        if (i < 0 || i >= len) i = _.i;
                        _.to(i);
                    } else {
                        _.to(_.i);
                    }
                });
            };

            return _;
        };

        //  Move Unslider to a slide index
        _.to = function (index, callback) {
            if (_.t) {
                _.stop();
                _.play();
            }

            var o = _.o, ul = _.ul, li = _.li
			,	target = li.eq(index);

            $.isFunction(o.starting)
				&& !callback
				&& o.starting(ul, li.eq(_.i));

            //  To slide or not to slide
            if ((!target.length || index < 0) && o.loop == f) return;

            //  Check if it's out of bounds
            if (!target.length) index = 0;
            if (index < 0) index = li.length - 1;
            target = li.eq(index);

            var speed = callback ? 5 : o.speed | 0,
				easing = o.easing,s
				obj = { height: target.outerHeight() };

            if (!ul.queue('fx').length) {
				nav_refresh(index);
				li.eq(0).animate(
					$.extend({ marginLeft: '-' + index + '00%' }, obj),
					speed, easing,
					function (data) {
                    	_.i = index;
                    	$.isFunction(o.complete)
							&& !callback
							&& o.complete(_.el, target);
                	}
				);
            };
        };

        //  Autoplay functionality
        _.play = function () {
            _.t = setInterval(function () {
                _.to(_.i + 1);
            }, _.o.delay | 0);
        };

        //  Stop autoplay
        _.stop = function () {
            _.t = clearInterval(_.t);
            return _;
        };

        //  Move to previous/next slide
        _.next = function () {
            return _.stop().to(_.i + 1);
        };

        _.prev = function () {
            return _.stop().to(_.i - 1);
        };

        function add_styles() {
			var css = '' +
			'<style id="unslider-styles" type="text/css">' +
			'	.unslider .root {' +
			'		list-style-type: none;' +
			'		margin: 0; padding: 0;' +
			'		overflow: hidden;' +
			'		white-space: nowrap;' +
			'	}' +
			'	.unslider .root' + _.o.item + '{' +
			'		display: inline-block;' +
			'		width: 100%;' +
			'		margin: 0; padding: 0;' +
			'	}' +
			'	.unslider .nav { ' +
			'		position: relative;' +
			'		cursor: pointer;' +
			'	 }' +
			'	.unslider .nav { list-style: none; }' +
			'	.unslider .nav > .dot { float: left; }' +
			'	.unslider .nav > .dot:after { content: "\\25CF"; }' +
			'	.unslider .nav > .dot.active:after { content: "\\25CB"; }' +
			'	.unslider .nav > .arrow {' +
			'		position: absolute;' +
			'		display: inline;' +
			'	}' +
			'	.unslider .nav > .arrow.prev { left: 0; }' +
			'	.unslider .nav > .arrow.next { right: 0; }' +
			'</style>';

            $('head').append(css);
        };

        function nav_arrows() {
            var o = $('<div/>').addClass('nav');

            $('<div/>')
				.addClass('arrow prev')
				.html(_.o.prev)
				.css({ visibility: 'hidden' })
				.appendTo(o);

            $('<div/>')
				.addClass('arrow next')
				.html(_.o.next)
				.css(visible( _.li.length > 0 ))
				.appendTo(o);

            _.el.addClass('has-arrows')
				.append(o)
				.find('.arrow')
				.click(function () {
                	$(this).hasClass('prev') ? _.prev() : _.next();
            	});
        };

        function nav_dots() {
            var ol = $('<ol/>').addClass('nav');

            $.each(_.li, function (index) {
                var li = $('<li/>').addClass('dot');
                if (index == _.i) li.addClass('active');
                if (_.o.dots == 'page') li.html(_.o.dotgen(++index));
                ol.append(li);
            });

            _.el.addClass('has-dots')
				.append(ol)
				.find('.dot')
				.click(function () {
                	_.stop().to($(this).index());
            	});
        };

		function nav_refresh(index) {
		   _.el.find('.dot').eq(index)
				.addClass('active')
				.siblings()
				.removeClass('active');

			_.el.find('.arrow.prev')
				.css(visible(index != 0));

			_.el.find('.arrow.next')
				.css(visible(index < _.li.length - 1));
		};

		function visible(cond) {
			return { visibility: cond ? 'visible' : 'hidden' };
		};
    };

    //  Create a jQuery plugin
    $.fn.unslider = function (o) {
        var len = this.length;

        //  Enable multiple-slider support
        return this.each(function (index) {
            //  Cache a copy of $(this), so it
            var me = $(this),
				key = 'unslider' + (len > 1 ? '-' + ++index : ''),
				instance = (new Unslider).init(me, o);

            //  Invoke an Unslider instance
            me.data(key, instance).data('key', key);
        });
    };

    Unslider.version = "1.0.0";
})(jQuery, false);

