/*
 *  jQuery esthetic plugin - v0.0.1
 *  Make your <select> look much more esthetic.
 *  https://github.com/johannestroeger/esthetic
 *
 *  Made by Johannes Troeger
 *  Under WTFPL License
 */
(function ($, window, undefined){
  'use strict';

  // stack for all Esthetic instances
  var stack  = [];

  // unique identifier start with 0
  var unique = 0;

  var defaults = {
    'cssClasses': {
      'btn':      'esthetic-trigger',
      'item':     'esthetic-item',
      'selected': 'esthetic-item-selected',
      'list':     'esthetic-list',
      'input':    'esthetic-input'
    },
    'events': ['touchstart', 'mousedown', 'focusin'/*, 'keydown'*/],
    'hidden': 'hidden'
  };

  // Esthetic constructor
  function Esthetic (elm, settings){
    $.extend(this, {
      options: defaults,
      isVisible: false,
      $elm: $(elm),
      id: unique++, // increase and set Instance ID
      onCreate: function () {},
      onChange: function () {},
      onUpdate: function () {}
    }, settings);

    // initiate parser
    this.select = this.$elm.find('select').detach().get(0);
    this.List   = new EstheticList(this.select, this.options);

    elm.innerHTML += ''+
      '<button class="' + this.options.cssClasses.btn + '">' +
      '  <span>' + this.List.selected.text + '</span>' +
      '</button>' +
      '<div class="' + this.options.cssClasses.list + '"></div>' +
      '<input type="hidden" class="' + this.options.cssClasses.input + '" name="'+ this.select.name + '" value="' +  this.select.value + '">';

    this.$trigger = this.$elm.find('.' + this.options.cssClasses.btn);
    this.$input   = this.$elm.find('.' + this.options.cssClasses.input);
    this.$list    = this.$elm.find('.' + this.options.cssClasses.list);

    this.eventStream();
    this.onCreate();
    stack.push(this);
  }

  Esthetic.prototype.eventStream = function () {
    var _this = this;

    var triggers = objToArr(_this.options.cssClasses, '.');
    var events   = this.options.events;

    this.$elm.on(events.join(' '), triggers.join(', '), function(e) {

      e.preventDefault();
      e.stopPropagation();

      var $this = $(this);
      //var type = e.type;
      //var keyCode = e.keyCode;

      // keycodes used
      // 9:  tab
      // 40: down
      // 39: right
      // 38: up
      // 37: left
      //var keys = [9,40,39,38,37];

      if(!_this.isVisible) {
        _this.$list.html(_this.List.toHtml());
        _this.toggle(_this.id);
      } else {
        _this.toggle();
      }

      if($this.hasClass(_this.options.cssClasses.item)) {
        _this.$trigger.text($this.text());
        _this.$input.attr('value', $this.find('button').attr('value'));
        _this.List.updateSelected($this.find('button').attr('value'));
      }

    });
  };

  Esthetic.prototype.toggle = function(id) {
    var itemId = (typeof(id) === undefined) ? null : id;
    $.map(stack, function(item){
      item[(item.id === itemId) ? 'show': 'hide']();
    });
  };

  Esthetic.prototype.hide = function() {
    this.isVisible = false;
    this.$elm.find('ul').eq(0).attr('hidden', true);
  };

  Esthetic.prototype.show = function() {
    this.isVisible = true;
    this.$elm.find('ul').eq(0).attr('hidden', false);
  };

  function EstheticList (select, options) {
    this.options  = options;
    this.select   = select;
    this.selected = null;
    this.grpIdx   = 0;
    this.parsed   = this.parse();

    return this;
  }

  EstheticList.prototype.updateSelected = function(value) {
    for(var i=0;i<this.parsed.length;i++) {
      this.parsed[i].selected = (this.parsed[i].value === value);
    }
  };

  EstheticList.prototype.toHtml = function () {
    var html = '', list = this.parsed, cssClasses = this.options.cssClasses;

    var chunk = function(item) {
      return '' +
        '<li class="' + cssClasses.item + ' ' + ((item.selected) ? cssClasses.selected : '') + '">' +
        ' <button value="' + item.value + '">' + item.text + '</button>' +
        '</li>';
    };

    for(var i=0; i<list.length; i++) {
      if(list[i].group) {
        var grpIdx = list[i].grpIdx;
        html += '<li><span>' + list[i].label + '</span><ul>';
        while(list[i] && grpIdx === list[i].grpIdx) {
          html += chunk(list[i]);
          i++;
        }
        html += '</ul></li>';
      } else {
        html += chunk(list[i]);
      }
    }
    return '<ul hidden>' + html + '</ul>';
  };

  EstheticList.prototype.parse = function() {
    this.parsed = [];
    for(var i = 0; i < this.select.childNodes.length; i++) {
      var node = this.select.childNodes[i];
      if (node.nodeName.toUpperCase() === 'OPTGROUP') {
        this.addGroup(node);
      } else if(node.nodeName.toUpperCase() === 'OPTION') {
        this.addOption(node, {group: false, label: false});
      }
    }
    return this.parsed;
  };

  EstheticList.prototype.addOption = function (node, options) {
    this.parsed.push({
      text:     node.text,
      value:    node.value,
      selected: node.selected,
      group:    options.group,
      label:    options.label,
      grpIdx:   (options.group) ? this.grpIdx : -1,
      disabled: node.disabled
    });
    if(node.selected) {
      this.selected = node;
    }
  };

  EstheticList.prototype.addGroup = function (group) {
    this.grpIdx++;
    for(var i = 0; i < group.children.length; i++) {
      this.addOption(group.children[i], {group: true, label: group.label});
    }
  };

  // Helper Functions
  // ================================================================================
  var objToArr = function(obj, pad) {
    var arr = [];
    for (var key in obj) {
      arr.push(pad + obj[key]);
    }
    return arr;
  };

  // jQUERY BRIDGE
  $.fn.esthetic = function (options) {
    return this.each(function (){
      return new Esthetic(this, options);
    });
  };

  // expose to global object window
  window.Esthetic = Esthetic;

}(jQuery, window));
